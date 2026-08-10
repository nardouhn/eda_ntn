from __future__ import annotations

from collections import defaultdict
from datetime import date
from fastapi import APIRouter, HTTPException
from statistics import fmean

from app.db import get_pool
from app.services.demand_pattern_episode import MART_TABLE


router = APIRouter(prefix="/eda/region", tags=["EDA Region"])

REGION_SQL = "COALESCE(NULLIF(BTRIM(region), ''), 'Chưa xác định')"
SKU_ACTIVE_SQL = "LOWER(BTRIM(COALESCE(sku_status, ''))) = 'hoạt động'"
BRANCH_ACTIVE_SQL = "LOWER(BTRIM(COALESCE(branch_status, ''))) = 'hoạt động'"
ITEM_ACTIVE_SQL = f"({SKU_ACTIVE_SQL} AND {BRANCH_ACTIVE_SQL})"


def _add_months(value: date, offset: int) -> date:
    month_index = value.year * 12 + value.month - 1 + offset
    return date(month_index // 12, month_index % 12 + 1, 1)


def _selected_regions(value: str | None) -> list[str]:
    if not value:
        return []
    return list(dict.fromkeys(item.strip() for item in value.split(",") if item.strip()))


def _month_series(start: date, end: date) -> list[date]:
    months: list[date] = []
    current = start
    while current <= end:
        months.append(current)
        current = _add_months(current, 1)
    return months


def _growth(current: float | None, previous: float | None) -> float | None:
    if current is None or previous is None or previous == 0:
        return None
    return current / previous - 1


def _seasonality(region: str, values: dict[date, float], start: date, end: date) -> dict:
    months = _month_series(min(values) if values else start, end)
    actuals = [float(values.get(month, 0)) for month in months]
    points: list[dict] = []
    factors: dict[int, list[float]] = defaultdict(list)

    for index, month in enumerate(months):
        window = actuals[max(0, index - 1):min(len(actuals), index + 2)]
        trend = fmean(window) if window else 0.0
        seasonal = actuals[index] - trend
        if trend:
            factors[month.month].append(actuals[index] / trend)
        if start <= month <= end:
            points.append(
                {
                    "month": month,
                    "actual": actuals[index],
                    "trend": trend,
                    "seasonal": seasonal,
                }
            )

    return {
        "region": region,
        "points": points,
        "monthly_index": [
            {"month_number": month, "value": fmean(factors[month]) if factors[month] else None}
            for month in range(1, 13)
        ],
    }


@router.get("/overview")
async def get_region_overview(
    regions: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict:
    selected_regions = _selected_regions(regions)

    async with get_pool().connection() as conn:
        bounds = await (
            await conn.execute(
                "SELECT MIN(month) AS min_month, MAX(month) AS max_month FROM source.mart_sku_branch_month"
            )
        ).fetchone()
        region_rows = await (
            await conn.execute(
                f"""
                SELECT DISTINCT {REGION_SQL} AS region
                FROM source.mart_sku_branch_month
                ORDER BY region
                """
            )
        ).fetchall()

        if not bounds or not bounds["max_month"]:
            raise HTTPException(503, "No region data available")

        source_min: date = bounds["min_month"]
        source_max: date = bounds["max_month"]
        effective_to = min(date_to or source_max, source_max)
        effective_from = max(date_from or _add_months(effective_to, -23), source_min)
        if effective_from > effective_to:
            raise HTTPException(400, "date_from must be before date_to")

        available_regions = [row["region"] for row in region_rows]
        unknown = sorted(set(selected_regions) - set(available_regions))
        if unknown:
            raise HTTPException(400, f"Unknown regions: {', '.join(unknown)}")
        effective_regions = selected_regions or available_regions
        region_filter = f"AND {REGION_SQL} = ANY(%s)"

        history_from = max(source_min, min(effective_from, _add_months(effective_to, -35)))
        monthly_rows = await (
            await conn.execute(
                f"""
                SELECT {REGION_SQL} AS region,
                       month,
                       COALESCE(SUM(GREATEST(quantity, 0)), 0) AS gross_quantity
                FROM source.mart_sku_branch_month
                WHERE month BETWEEN %s AND %s
                  {region_filter}
                GROUP BY 1, month
                ORDER BY month, region
                """,
                [history_from, effective_to, effective_regions],
            )
        ).fetchall()

        summary_rows = await (
            await conn.execute(
                f"""
                WITH scoped AS (
                    SELECT {REGION_SQL} AS normalized_region, *
                    FROM source.mart_sku_branch_month
                    WHERE month BETWEEN %s AND %s
                      {region_filter}
                ), pair_status AS (
                    SELECT normalized_region, base_sku, branch,
                           BOOL_OR({ITEM_ACTIVE_SQL}) AS is_active
                    FROM scoped
                    GROUP BY normalized_region, base_sku, branch
                ), region_summary AS (
                    SELECT CASE WHEN GROUPING(normalized_region) = 1 THEN '__TOTAL__' ELSE normalized_region END AS region,
                           COALESCE(SUM(GREATEST(quantity, 0)), 0) AS gross_quantity,
                           COUNT(DISTINCT branch) FILTER (WHERE {BRANCH_ACTIVE_SQL}) AS branch_count,
                           COUNT(DISTINCT base_sku) FILTER (WHERE {ITEM_ACTIVE_SQL}) AS active_sku_count
                    FROM scoped
                    GROUP BY GROUPING SETS ((normalized_region), ())
                ), pair_rollup AS (
                    SELECT CASE WHEN GROUPING(normalized_region) = 1 THEN '__TOTAL__' ELSE normalized_region END AS region,
                           COUNT(*) AS sku_branch_count,
                           COUNT(*) FILTER (WHERE is_active IS NOT TRUE) AS inactive_sku_branch_count
                    FROM pair_status
                    GROUP BY GROUPING SETS ((normalized_region), ())
                )
                SELECT summary.*,
                       COALESCE(pairs.sku_branch_count, 0) AS sku_branch_count,
                       COALESCE(pairs.inactive_sku_branch_count, 0) AS inactive_sku_branch_count
                FROM region_summary summary
                LEFT JOIN pair_rollup pairs USING (region)
                """,
                [effective_from, effective_to, effective_regions],
            )
        ).fetchall()

        demand_rows = await (
            await conn.execute(
                f"""
                WITH pair_facts AS (
                    SELECT {REGION_SQL} AS region, base_sku, branch,
                           MAX(sku_name) AS sku_name,
                           GREATEST(SUM(quantity), 0)::double precision AS gross_quantity
                    FROM source.mart_sku_branch_month
                    WHERE month BETWEEN %s AND %s
                      {region_filter}
                    GROUP BY 1, base_sku, branch
                ), latest AS (
                    SELECT * FROM {MART_TABLE} WHERE is_latest_episode
                ), rolled AS (
                    SELECT latest.region, latest.base_sku, latest.branch,
                           COALESCE(facts.sku_name, latest.sku_name) AS sku_name,
                           COALESCE(facts.gross_quantity, 0)::double precision AS gross_quantity,
                           latest.history_months, latest.positive_months,
                           latest.adi, latest.cv2,
                           CASE WHEN latest.cv2 IS NULL THEN NULL ELSE SQRT(latest.cv2) END AS cv,
                           latest.demand_pattern, latest.series_weight,
                           latest.status, latest.is_excluded
                    FROM latest
                    LEFT JOIN pair_facts facts USING (region, base_sku, branch)
                    WHERE latest.region = ANY(%s)
                ), scored AS (
                    SELECT *,
                           SUM(gross_quantity) OVER (PARTITION BY region) AS region_quantity,
                           COALESCE(
                               SUM(gross_quantity) OVER (
                                   PARTITION BY region
                                   ORDER BY gross_quantity DESC, base_sku
                                   ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
                               ), 0
                           ) AS quantity_before
                    FROM rolled
                ), classified AS (
                    SELECT *,
                           CASE
                             WHEN region_quantity <= 0 THEN 'C'
                             WHEN quantity_before / region_quantity < 0.80 THEN 'A'
                             WHEN quantity_before / region_quantity < 0.95 THEN 'B'
                             ELSE 'C'
                           END AS abc_class
                    FROM scored
                )
                SELECT region, base_sku, branch, sku_name, gross_quantity,
                       1 AS selling_branch_count, history_months, positive_months,
                       adi, cv, cv2, demand_pattern, abc_class,
                       series_weight, status, is_excluded
                FROM classified
                ORDER BY region, gross_quantity DESC, base_sku, branch
                """,
                [
                    effective_from,
                    effective_to,
                    effective_regions,
                    effective_regions,
                ],
            )
        ).fetchall()

        branch_rows = await (
            await conn.execute(
                f"""
                SELECT {REGION_SQL} AS region,
                       branch AS branch_code,
                       MAX(branch_name) AS branch_name,
                       COALESCE(SUM(GREATEST(quantity, 0)), 0) AS gross_quantity,
                       COUNT(DISTINCT base_sku) FILTER (WHERE {ITEM_ACTIVE_SQL}) AS active_sku_count
                FROM source.mart_sku_branch_month
                WHERE month BETWEEN %s AND %s
                  {region_filter}
                GROUP BY 1, branch
                ORDER BY region, gross_quantity DESC
                """,
                [effective_from, effective_to, effective_regions],
            )
        ).fetchall()

    monthly = [dict(row) for row in monthly_rows]
    quantity_by_region: dict[str, dict[date, float]] = defaultdict(dict)
    for row in monthly:
        quantity_by_region[row["region"]][row["month"]] = float(row["gross_quantity"] or 0)

    summaries = {row["region"]: dict(row) for row in summary_rows}
    total_summary = summaries.pop("__TOTAL__", {})
    total_quantity = float(total_summary.get("gross_quantity") or 0)
    pattern_names = ("Smooth", "Erratic", "Intermittent", "Lumpy")
    abc_names = ("A", "B", "C")
    demand_by_region: dict[str, list[dict]] = defaultdict(list)
    for source_row in demand_rows:
        row = dict(source_row)
        row["gross_quantity"] = float(row.get("gross_quantity") or 0)
        row["adi"] = float(row["adi"]) if row.get("adi") is not None else None
        row["cv"] = float(row["cv"]) if row.get("cv") is not None else None
        row["cv2"] = float(row["cv2"]) if row.get("cv2") is not None else None
        row["series_weight"] = float(row.get("series_weight") or 0)
        row["selling_branch_count"] = int(row.get("selling_branch_count") or 0)
        demand_by_region[row["region"]].append(row)

    latest_month = effective_to
    previous_month = _add_months(latest_month, -1)
    previous_year = _add_months(latest_month, -12)
    latest_quantity = sum(quantity_by_region[region].get(latest_month, 0) for region in effective_regions)
    previous_quantity = sum(quantity_by_region[region].get(previous_month, 0) for region in effective_regions)
    previous_year_quantity = sum(quantity_by_region[region].get(previous_year, 0) for region in effective_regions)

    details = []
    for region in effective_regions:
        summary = summaries.get(region, {})
        region_demand = demand_by_region.get(region, [])
        pattern_counts = {
            name: sum(row["demand_pattern"] == name for row in region_demand)
            for name in pattern_names
        }
        pattern_weights = {
            name: sum(
                row["series_weight"]
                for row in region_demand
                if row["demand_pattern"] == name and not row["is_excluded"]
            )
            for name in pattern_names
        }
        classified_count = sum(pattern_counts.values())
        classified_weight = sum(pattern_weights.values())
        pattern_shares = {
            name: pattern_weights[name] / classified_weight if classified_weight else 0.0
            for name in pattern_names
        }
        abc_counts = {
            name: sum(row["abc_class"] == name for row in region_demand)
            for name in abc_names
        }
        abc_total = sum(abc_counts.values())
        abc_shares = {
            name: abc_counts[name] / abc_total if abc_total else 0.0
            for name in abc_names
        }
        valid_adi = [(row["adi"], row["series_weight"]) for row in region_demand if row["adi"] is not None and row["series_weight"] > 0 and not row["is_excluded"]]
        valid_cv = [(row["cv"], row["series_weight"]) for row in region_demand if row["cv"] is not None and row["series_weight"] > 0 and not row["is_excluded"]]
        valid_cv2 = [(row["cv2"], row["series_weight"]) for row in region_demand if row["cv2"] is not None and row["series_weight"] > 0 and not row["is_excluded"]]
        weighted = lambda values: (sum(value * weight for value, weight in values) / sum(weight for _, weight in values)) if values else None
        dominant_demand = (
            max(pattern_names, key=lambda name: pattern_weights[name])
            if classified_weight
            else "Insufficient"
        )
        region_latest = quantity_by_region[region].get(latest_month)
        region_previous = quantity_by_region[region].get(previous_month)
        pair_count = int(summary.get("sku_branch_count") or 0)
        inactive_pair_count = int(summary.get("inactive_sku_branch_count") or 0)
        details.append(
            {
                "region": region,
                "gross_quantity": float(summary.get("gross_quantity") or 0),
                "growth": _growth(region_latest, region_previous),
                "branch_count": int(summary.get("branch_count") or 0),
                "active_sku_count": int(summary.get("active_sku_count") or 0),
                "avg_adi": weighted(valid_adi),
                "avg_cv": weighted(valid_cv),
                "avg_cv2": weighted(valid_cv2),
                "dominant_demand": dominant_demand,
                "pattern_counts": pattern_counts,
                "pattern_shares": pattern_shares,
                "pattern_weighting": "history_months_sqrt_capped_36",
                "abc_counts": abc_counts,
                "abc_shares": abc_shares,
                "sku_branch_count": pair_count,
                "inactive_sku_branch_count": inactive_pair_count,
                "inactive_rate": inactive_pair_count / pair_count if pair_count else None,
                "contribution_pct": float(summary.get("gross_quantity") or 0) / total_quantity if total_quantity else None,
            }
        )

    visible_monthly = [
        {
            "region": row["region"],
            "month": row["month"],
            "gross_quantity": float(row["gross_quantity"] or 0),
        }
        for row in monthly
        if effective_from <= row["month"] <= effective_to
    ]
    region_skus: list[dict] = []
    for region in effective_regions:
        grouped_skus: dict[str, list[dict]] = defaultdict(list)
        for item in demand_by_region.get(region, []):
            if item["demand_pattern"] == "Lumpy" and not item["is_excluded"]:
                grouped_skus[item["base_sku"]].append(item)
        rolled_skus = []
        for base_sku, pairs in grouped_skus.items():
            weight_total = sum(pair["series_weight"] for pair in pairs)
            def pair_weighted(field: str):
                values = [(pair[field], pair["series_weight"]) for pair in pairs if pair.get(field) is not None and pair["series_weight"] > 0]
                return sum(value * weight for value, weight in values) / sum(weight for _, weight in values) if values else None
            rolled_skus.append({
                "region": region, "base_sku": base_sku, "sku_name": pairs[0]["sku_name"],
                "gross_quantity": sum(pair["gross_quantity"] for pair in pairs),
                "selling_branch_count": len({pair["branch"] for pair in pairs}),
                "history_months": round(pair_weighted("history_months") or 0),
                "positive_months": round(pair_weighted("positive_months") or 0),
                "adi": pair_weighted("adi"), "cv": pair_weighted("cv"),
                "demand_pattern": "Lumpy",
                "abc_class": max(pairs, key=lambda pair: pair["gross_quantity"])["abc_class"],
                "series_weight": weight_total,
            })
        region_skus.extend(sorted(rolled_skus, key=lambda item: (-item["gross_quantity"], item["base_sku"]))[:50])

    return {
        "available_regions": available_regions,
        "filters": {"regions": effective_regions, "date_from": effective_from, "date_to": effective_to},
        "kpis": {
            "gross_quantity": float(total_summary.get("gross_quantity") or 0),
            "mom_growth": _growth(latest_quantity, previous_quantity),
            "yoy_growth": _growth(latest_quantity, previous_year_quantity),
            "branch_count": int(total_summary.get("branch_count") or 0),
            "active_sku_count": int(total_summary.get("active_sku_count") or 0),
            "inactive_rate": (
                int(total_summary.get("inactive_sku_branch_count") or 0)
                / int(total_summary.get("sku_branch_count") or 1)
                if int(total_summary.get("sku_branch_count") or 0)
                else None
            ),
        },
        "monthly": visible_monthly,
        "regions": details,
        "seasonality": [
            _seasonality(region, quantity_by_region[region], effective_from, effective_to)
            for region in effective_regions
        ],
        "branches": [
            {
                **dict(row),
                "gross_quantity": float(row["gross_quantity"] or 0),
                "active_sku_count": int(row["active_sku_count"] or 0),
            }
            for row in branch_rows
        ],
        "region_skus": region_skus,
        "methodology": "Lựa chọn A: pattern được roll-up từ latest episode Base SKU × Branch; tỷ lệ và ADI/CV² trung bình dùng series_weight theo độ dài lịch sử.",
        "pattern_source": "analytics.mart_demand_pattern_episode",
        "data_as_of_month": source_max,
    }
