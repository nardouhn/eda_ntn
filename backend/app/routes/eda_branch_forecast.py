from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date
from math import sqrt
from statistics import fmean, median
from typing import Any

from fastapi import APIRouter, HTTPException

from app.db import get_pool


router = APIRouter(prefix="/eda/branch-forecast", tags=["EDA Branch Forecast"])

SOURCE_TABLE = "source.mart_sku_branch_month"
REGION_SQL = "COALESCE(NULLIF(BTRIM(region), ''), 'Chưa xác định')"
ACTIVE_SQL = "LOWER(BTRIM(COALESCE(branch_status, ''))) = 'hoạt động'"


def _add_months(value: date, offset: int) -> date:
    index = value.year * 12 + value.month - 1 + offset
    return date(index // 12, index % 12 + 1, 1)


def _month_distance(start: date, end: date) -> int:
    return (end.year - start.year) * 12 + end.month - start.month


def _correlation(pairs: list[tuple[float, float]]) -> float | None:
    if len(pairs) < 3:
        return None
    left = [pair[0] for pair in pairs]
    right = [pair[1] for pair in pairs]
    left_mean, right_mean = fmean(left), fmean(right)
    numerator = sum((a - left_mean) * (b - right_mean) for a, b in pairs)
    denominator = sqrt(
        sum((a - left_mean) ** 2 for a in left)
        * sum((b - right_mean) ** 2 for b in right)
    )
    return numerator / denominator if denominator else None


def _wape(pairs: list[tuple[float, float]]) -> float | None:
    denominator = sum(abs(actual) for forecast, actual in pairs)
    return sum(abs(forecast - actual) for forecast, actual in pairs) / denominator if denominator else None


def _rolling_mean(values: dict[date, float], target: date, months: int) -> float | None:
    observed = [values.get(_add_months(target, -offset)) for offset in range(months)]
    available = [value for value in observed if value is not None]
    return fmean(available) if available else None


def _branch_metrics(rows: list[dict[str, Any]], global_min: date, global_max: date) -> dict[str, Any]:
    ordered = sorted(rows, key=lambda row: row["month"])
    values = {row["month"]: float(row["quantity"]) for row in ordered}
    quantities = list(values.values())
    observed_months = len(ordered)
    calendar_months = _month_distance(global_min, global_max) + 1
    mean_quantity = fmean(quantities) if quantities else 0.0
    variance = fmean([(value - mean_quantity) ** 2 for value in quantities]) if quantities else 0.0
    cv = sqrt(variance) / mean_quantity if mean_quantity > 0 else None

    naive_pairs: list[tuple[float, float]] = []
    seasonal_pairs: list[tuple[float, float]] = []
    lag1_pairs: list[tuple[float, float]] = []
    lag12_pairs: list[tuple[float, float]] = []
    for month, actual in values.items():
        previous = values.get(_add_months(month, -1))
        year_ago = values.get(_add_months(month, -12))
        if previous is not None:
            naive_pairs.append((previous, actual))
            lag1_pairs.append((previous, actual))
        if year_ago is not None:
            seasonal_pairs.append((year_ago, actual))
            lag12_pairs.append((year_ago, actual))

    naive_wape = _wape(naive_pairs)
    seasonal_wape = _wape(seasonal_pairs)
    seasonal_gain = (
        (naive_wape - seasonal_wape) / naive_wape
        if naive_wape and seasonal_wape is not None
        else None
    )
    recent3 = sum(values.get(_add_months(global_max, -offset), 0.0) for offset in range(3))
    previous3 = sum(values.get(_add_months(global_max, -offset), 0.0) for offset in range(3, 6))
    recent_growth = recent3 / previous3 - 1 if previous3 > 0 else None
    last6 = [values.get(_add_months(global_max, -offset)) for offset in reversed(range(6))]
    trend_values = [value for value in last6 if value is not None]
    if len(trend_values) >= 3:
        x_mean = (len(trend_values) - 1) / 2
        slope_denominator = sum((index - x_mean) ** 2 for index in range(len(trend_values)))
        slope = sum(
            (index - x_mean) * (value - fmean(trend_values))
            for index, value in enumerate(trend_values)
        ) / slope_denominator
        trend_rate = slope / fmean(trend_values) if fmean(trend_values) > 0 else None
    else:
        trend_rate = None

    is_active = bool(ordered[-1]["is_active"]) if ordered else False
    coverage = observed_months / calendar_months if calendar_months else 0.0
    if not is_active:
        segment, strategy = "INACTIVE", "Không phát forecast vận hành"
    elif observed_months < 12 or coverage < 0.8:
        segment, strategy = "LOW_COVERAGE", "Global model + shrinkage theo vùng"
    elif seasonal_gain is not None and len(seasonal_pairs) >= 6 and seasonal_gain >= 0.1:
        segment, strategy = "SEASONAL", "Seasonal baseline + calendar/global model"
    elif cv is not None and cv >= 0.4:
        segment, strategy = "VOLATILE", "Global robust model / ensemble"
    elif trend_rate is not None and abs(trend_rate) >= 0.05:
        segment, strategy = "TRENDING", "Trend-aware global model"
    else:
        segment, strategy = "STABLE", "Naive/ETS/global baseline"

    history = []
    for row in ordered:
        month = row["month"]
        history.append(
            {
                "month": month,
                "quantity": float(row["quantity"]),
                "active_skus": int(row["active_skus"]),
                "line_count": int(row["line_count"]),
                "moving_average_3": _rolling_mean(values, month, 3),
                "moving_average_6": _rolling_mean(values, month, 6),
                "same_month_last_year": values.get(_add_months(month, -12)),
            }
        )

    profile: list[dict[str, Any]] = []
    for month_number in range(1, 13):
        month_values = [value for month, value in values.items() if month.month == month_number]
        month_mean = fmean(month_values) if month_values else None
        profile.append(
            {
                "month_number": month_number,
                "mean_quantity": month_mean,
                "seasonal_index": month_mean / mean_quantity if month_mean is not None and mean_quantity > 0 else None,
                "observations": len(month_values),
            }
        )

    return {
        "branch": ordered[-1]["branch"],
        "branch_name": ordered[-1]["branch_name"],
        "region": ordered[-1]["region"],
        "status": "Hoạt động" if is_active else "Vô hiệu hóa",
        "history_months": observed_months,
        "coverage": coverage,
        "mean_monthly_quantity": mean_quantity,
        "cv": cv,
        "lag1_correlation": _correlation(lag1_pairs),
        "lag12_correlation": _correlation(lag12_pairs),
        "naive_wape": naive_wape,
        "seasonal_naive_wape": seasonal_wape,
        "seasonal_gain": seasonal_gain,
        "seasonal_origins": len(seasonal_pairs),
        "recent_3m_quantity": recent3,
        "previous_3m_quantity": previous3,
        "recent_growth": recent_growth,
        "trend_rate_6m": trend_rate,
        "latest_active_skus": int(ordered[-1]["active_skus"]),
        "forecastability_segment": segment,
        "recommended_strategy": strategy,
        "history": history,
        "monthly_profile": profile,
    }


@router.get("/overview")
async def get_branch_forecast_overview(
    region: str | None = None,
    branch: str | None = None,
) -> dict:
    async with get_pool().connection() as conn:
        monthly_rows = await (
            await conn.execute(
                f"""
                WITH sku_month AS (
                    SELECT branch, base_sku, month::date AS month,
                           MAX(branch_name) AS branch_name,
                           MAX({REGION_SQL}) AS region,
                           BOOL_OR({ACTIVE_SQL}) AS branch_is_active,
                           GREATEST(SUM(quantity),0)::double precision AS demand,
                           SUM(line_count)::bigint AS line_count
                    FROM {SOURCE_TABLE}
                    WHERE branch IS NOT NULL AND base_sku IS NOT NULL AND month IS NOT NULL
                    GROUP BY branch,base_sku,month
                )
                SELECT branch,month,MAX(branch_name) AS branch_name,MAX(region) AS region,
                       BOOL_OR(branch_is_active) AS is_active,
                       SUM(demand)::double precision AS quantity,
                       COUNT(*) FILTER (WHERE demand>0)::integer AS active_skus,
                       SUM(line_count)::bigint AS line_count
                FROM sku_month
                GROUP BY branch,month
                ORDER BY branch,month
                """
            )
        ).fetchall()
        sku_rows = await (
            await conn.execute(
                f"""
                WITH bounds AS (SELECT MAX(month)::date AS max_month FROM {SOURCE_TABLE}),
                sku AS (
                    SELECT branch,base_sku,MAX(sku_name) AS sku_name,
                           SUM(GREATEST(monthly_net,0))::double precision AS quantity
                    FROM (
                        SELECT branch,base_sku,month,MAX(sku_name) AS sku_name,
                               SUM(quantity)::double precision AS monthly_net
                        FROM {SOURCE_TABLE}, bounds
                        WHERE month > bounds.max_month-INTERVAL '12 months'
                        GROUP BY branch,base_sku,month
                    ) monthly
                    GROUP BY branch,base_sku
                )
                SELECT *,SUM(quantity) OVER (PARTITION BY branch)::double precision AS branch_quantity,
                       ROW_NUMBER() OVER (PARTITION BY branch ORDER BY quantity DESC,base_sku) AS rank
                FROM sku
                ORDER BY branch,rank
                """
            )
        ).fetchall()

    if not monthly_rows:
        raise HTTPException(503, "No branch monthly demand data")
    global_min = min(row["month"] for row in monthly_rows)
    global_max = max(row["month"] for row in monthly_rows)
    by_branch: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for source in monthly_rows:
        by_branch[source["branch"]].append(dict(source))
    metrics = [_branch_metrics(rows, global_min, global_max) for rows in by_branch.values()]
    if region:
        metrics = [row for row in metrics if row["region"] == region]
    metrics.sort(key=lambda row: row["mean_monthly_quantity"], reverse=True)
    if not metrics:
        raise HTTPException(404, "No branches for selected region")

    sku_by_branch: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for source in sku_rows:
        if source["rank"] <= 20:
            row = dict(source)
            row["share"] = float(row["quantity"]) / float(row["branch_quantity"]) if row["branch_quantity"] else 0.0
            sku_by_branch[row["branch"]].append(row)
    for row in metrics:
        top = sku_by_branch.get(row["branch"], [])
        row["top1_sku_share"] = sum(float(item["share"]) for item in top if item["rank"] <= 1)
        row["top5_sku_share"] = sum(float(item["share"]) for item in top if item["rank"] <= 5)
        row["portfolio_hhi_top20"] = sum(float(item["share"]) ** 2 for item in top)

    selected_code = branch if branch and any(row["branch"] == branch for row in metrics) else metrics[0]["branch"]
    selected = next(row for row in metrics if row["branch"] == selected_code)
    selected_detail = {
        **selected,
        "top_skus": sku_by_branch.get(selected_code, []),
    }
    table_rows = [{key: value for key, value in row.items() if key not in {"history", "monthly_profile"}} for row in metrics]
    segment_counts = Counter(row["forecastability_segment"] for row in metrics)
    active_metrics = [row for row in metrics if row["status"] == "Hoạt động"]
    return {
        "data_from": global_min,
        "data_as_of_month": global_max,
        "filters": {"region": region or "", "branch": selected_code},
        "options": {
            "regions": sorted({row["region"] for row in [_branch_metrics(rows, global_min, global_max) for rows in by_branch.values()]}),
            "branches": [
                {"branch": row["branch"], "branch_name": row["branch_name"], "region": row["region"]}
                for row in metrics
            ],
        },
        "kpis": {
            "branch_count": len(metrics),
            "active_branch_count": len(active_metrics),
            "median_naive_wape": median([row["naive_wape"] for row in active_metrics if row["naive_wape"] is not None]) if active_metrics else None,
            "seasonal_candidate_count": segment_counts["SEASONAL"],
            "volatile_count": segment_counts["VOLATILE"],
            "low_coverage_count": segment_counts["LOW_COVERAGE"],
        },
        "segment_distribution": [
            {"segment": segment, "count": count}
            for segment, count in segment_counts.most_common()
        ],
        "branches": table_rows,
        "selected": selected_detail,
        "methodology": {
            "target": "Tổng theo tháng của max(net quantity từng Base SKU tại chi nhánh, 0).",
            "seasonal": "Seasonal candidate khi có ít nhất 6 origin lag-12 và Seasonal Naive cải thiện WAPE >=10% so với Naive.",
            "coverage": "LOW_COVERAGE khi dưới 12 tháng quan sát hoặc coverage lịch dưới 80%.",
            "concentration": "Top-1/Top-5 share và HHI đo mức tổng chi nhánh phụ thuộc vào vài SKU.",
        },
    }
