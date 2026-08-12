from __future__ import annotations

from collections import Counter
from datetime import date
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.db import get_pool
from app.services.demand_pattern_episode import MART_TABLE


router = APIRouter(prefix="/eda/forecast-segments", tags=["EDA Forecast Segments"])

SOURCE_TABLE = "source.mart_sku_branch_month"
REGION_SQL = "COALESCE(NULLIF(BTRIM(region), ''), 'Chưa xác định')"
ACTIVE_SQL = """(
    LOWER(BTRIM(COALESCE(sku_status, ''))) = 'hoạt động'
    AND LOWER(BTRIM(COALESCE(branch_status, ''))) = 'hoạt động'
)"""

LIFECYCLE_LABELS = {
    "DORMANT_CONFIRMED": "Dormant xác nhận",
    "NEW_AT_BRANCH": "Mới tại chi nhánh",
    "SHORT_RECENT": "Lịch sử rất ngắn",
    "SHORT_BUILDING": "Đang xây lịch sử",
    "ACTIVE_RECENT": "Có bán gần đây",
    "SEASONAL_RETURN_EXPECTED": "Sắp quay lại mùa bán",
    "OFF_SEASON": "Đang ngoài mùa",
    "DORMANT_SUSPECTED": "Nghi ngờ dormant",
    "LOW_RECENT": "Demand gần đây thấp",
}

EVIDENCE_LABELS = {
    "NO_EVIDENCE": "Không có demand dương",
    "VERY_LOW": "Rất ít bằng chứng",
    "PROVISIONAL": "Tạm thời",
    "STANDARD": "Tiêu chuẩn",
    "HIGH": "Tin cậy cao",
}

STRATEGY_LABELS = {
    "SUPPRESS": "Không phát forecast",
    "BORROW_CROSS_BRANCH": "Mượn tín hiệu chi nhánh khác",
    "GLOBAL_POOLED": "Global model / cấp cha",
    "SEASONAL_HURDLE": "Xác suất bán × lượng khi bán",
    "OCCURRENCE_REVIEW": "Occurrence model + review",
    "DIRECT_BASELINE": "Baseline trực tiếp",
    "ROBUST_GLOBAL": "Global model robust",
    "INTERMITTENT": "Croston/TSB khi zero hợp lệ",
    "PARENT_ALLOCATION": "Forecast cấp cha rồi phân bổ",
}


def _add_months(value: date, offset: int) -> date:
    index = value.year * 12 + value.month - 1 + offset
    return date(index // 12, index % 12 + 1, 1)


def _month_distance(start: date | None, end: date) -> int | None:
    if start is None:
        return None
    return (end.year - start.year) * 12 + end.month - start.month


def _classify_series(row: dict[str, Any], data_as_of: date, horizon: int) -> dict[str, Any]:
    first_positive: date | None = row.get("first_positive_month")
    last_positive: date | None = row.get("last_positive_month")
    base_first: date | None = row.get("base_first_positive_month")
    positive_months = int(row.get("positive_months") or 0)
    history_months = (_month_distance(first_positive, data_as_of) or 0) + (1 if first_positive else 0)
    months_since_positive = _month_distance(last_positive, data_as_of)
    pair_age_at_launch = _month_distance(base_first, first_positive) if first_positive else None
    seasonal_months = {int(value) for value in row.get("seasonal_months") or []}
    future_months = {_add_months(data_as_of, step).month for step in range(1, horizon + 1)}
    positive_rate = positive_months / history_months if history_months else 0.0
    has_seasonal_signal = (
        bool(seasonal_months) and history_months >= 12 and positive_rate < 0.75
    )
    season_ahead = bool(seasonal_months & future_months)
    is_inactive = row.get("status") == "Vô hiệu hóa"
    is_relaunched = int(row.get("episode_id") or 0) > 1

    if positive_months == 0:
        evidence = "NO_EVIDENCE"
    elif history_months < 6 or positive_months == 1:
        evidence = "VERY_LOW"
    elif history_months < 12 or positive_months < 3:
        evidence = "PROVISIONAL"
    elif history_months < 18 or positive_months < 6:
        evidence = "STANDARD"
    else:
        evidence = "HIGH"

    if is_inactive:
        lifecycle = "DORMANT_CONFIRMED"
    elif history_months <= 5 and pair_age_at_launch is not None and pair_age_at_launch >= 6:
        lifecycle = "NEW_AT_BRANCH"
    elif history_months <= 5:
        lifecycle = "SHORT_RECENT"
    elif history_months < 12 and 2 <= positive_months <= 5:
        lifecycle = "SHORT_BUILDING"
    elif months_since_positive is not None and months_since_positive <= 3:
        lifecycle = "ACTIVE_RECENT"
    elif has_seasonal_signal and season_ahead:
        lifecycle = "SEASONAL_RETURN_EXPECTED"
    elif has_seasonal_signal:
        lifecycle = "OFF_SEASON"
    elif months_since_positive is None or months_since_positive >= 6:
        lifecycle = "DORMANT_SUSPECTED"
    else:
        lifecycle = "LOW_RECENT"

    pattern = row.get("demand_pattern") or "Unknown"
    if lifecycle == "DORMANT_CONFIRMED":
        strategy = "SUPPRESS"
    elif lifecycle == "NEW_AT_BRANCH":
        strategy = "BORROW_CROSS_BRANCH"
    elif lifecycle in {"SHORT_RECENT", "SHORT_BUILDING"} or evidence in {"NO_EVIDENCE", "VERY_LOW"}:
        strategy = "GLOBAL_POOLED"
    elif lifecycle in {"SEASONAL_RETURN_EXPECTED", "OFF_SEASON"}:
        strategy = "SEASONAL_HURDLE"
    elif lifecycle == "DORMANT_SUSPECTED":
        strategy = "OCCURRENCE_REVIEW"
    elif pattern == "Smooth":
        strategy = "DIRECT_BASELINE"
    elif pattern == "Erratic":
        strategy = "ROBUST_GLOBAL"
    elif pattern == "Intermittent":
        strategy = "INTERMITTENT"
    elif pattern == "Lumpy":
        strategy = "PARENT_ALLOCATION"
    else:
        strategy = "GLOBAL_POOLED"

    return {
        **row,
        "history_months": history_months,
        "positive_rate": positive_rate,
        "months_since_positive": months_since_positive,
        "lifecycle": lifecycle,
        "evidence_level": evidence,
        "has_seasonal_signal": has_seasonal_signal,
        "season_ahead": season_ahead,
        "is_relaunched": is_relaunched,
        "recommended_strategy": strategy,
    }


def _distribution(counter: Counter[str], labels: dict[str, str], total: int) -> list[dict[str, Any]]:
    return [
        {
            "key": key,
            "label": labels.get(key, key.replace("_", " ").title()),
            "count": count,
            "share": count / total if total else 0.0,
        }
        for key, count in counter.most_common()
    ]


@router.get("/overview")
async def get_forecast_segmentation(
    region: str | None = None,
    branch: str | None = None,
    horizon: int = Query(3, ge=1, le=6),
    sample_size: int = Query(40, ge=10, le=100),
) -> dict:
    filters: list[str] = []
    params: list[object] = []
    if region:
        filters.append("pair.region = %s")
        params.append(region)
    if branch:
        filters.append("pair.branch = %s")
        params.append(branch)
    where = "WHERE " + " AND ".join(filters) if filters else ""

    async with get_pool().connection() as conn:
        relation = await (
            await conn.execute("SELECT to_regclass(%s) AS relation_name", [MART_TABLE])
        ).fetchone()
        if not relation or relation["relation_name"] is None:
            raise HTTPException(503, "Demand Pattern mart is unavailable")

        rows = await (
            await conn.execute(
                f"""
                WITH monthly AS (
                    SELECT base_sku, branch, month::date AS month,
                           MAX({REGION_SQL}) AS region,
                           MAX(branch_name) AS branch_name,
                           MAX(sku_name) AS sku_name,
                           SUM(quantity)::double precision AS net_quantity,
                           BOOL_OR({ACTIVE_SQL}) AS has_active_variant
                    FROM {SOURCE_TABLE}
                    WHERE base_sku IS NOT NULL AND branch IS NOT NULL AND month IS NOT NULL
                    GROUP BY base_sku, branch, month
                ), bounds AS (
                    SELECT MAX(month)::date AS data_as_of FROM monthly
                ), month_profile AS (
                    SELECT base_sku, branch, EXTRACT(MONTH FROM month)::integer AS month_number,
                           COUNT(DISTINCT EXTRACT(YEAR FROM month)) FILTER (WHERE net_quantity > 0) AS positive_years
                    FROM monthly
                    GROUP BY base_sku, branch, EXTRACT(MONTH FROM month)
                ), seasonal AS (
                    SELECT base_sku, branch,
                           ARRAY_AGG(month_number ORDER BY month_number)
                               FILTER (WHERE positive_years >= 2) AS seasonal_months
                    FROM month_profile
                    GROUP BY base_sku, branch
                ), pair AS (
                    SELECT monthly.base_sku, monthly.branch,
                           (ARRAY_AGG(region ORDER BY month DESC))[1] AS region,
                           (ARRAY_AGG(branch_name ORDER BY month DESC))[1] AS branch_name,
                           (ARRAY_AGG(sku_name ORDER BY month DESC))[1] AS sku_name,
                           MIN(month) FILTER (WHERE net_quantity > 0)::date AS first_positive_month,
                           MAX(month) FILTER (WHERE net_quantity > 0)::date AS last_positive_month,
                           COUNT(*) FILTER (WHERE net_quantity > 0)::integer AS positive_months,
                           BOOL_OR(has_active_variant) AS is_active,
                           COALESCE(SUM(GREATEST(net_quantity, 0)) FILTER (
                               WHERE month > (SELECT data_as_of FROM bounds) - INTERVAL '12 months'
                           ), 0)::double precision AS demand_12m
                    FROM monthly
                    GROUP BY monthly.base_sku, monthly.branch
                ), base_state AS (
                    SELECT base_sku,
                           MIN(month) FILTER (WHERE net_quantity > 0)::date AS base_first_positive_month
                    FROM monthly
                    GROUP BY base_sku
                ), latest_episode AS (
                    SELECT base_sku, branch, episode_id, status, demand_pattern, adi, cv2
                    FROM {MART_TABLE}
                    WHERE is_latest_episode
                )
                SELECT pair.*, base_state.base_first_positive_month,
                       COALESCE(seasonal.seasonal_months, ARRAY[]::integer[]) AS seasonal_months,
                       episode.episode_id,
                       COALESCE(
                           episode.status,
                           CASE WHEN pair.is_active THEN 'Hoạt động' ELSE 'Vô hiệu hóa' END
                       ) AS status,
                       COALESCE(
                           episode.demand_pattern,
                           CASE WHEN pair.is_active THEN 'Insufficient-New' ELSE 'Excluded-Inactive' END
                       ) AS demand_pattern,
                       episode.adi, episode.cv2, bounds.data_as_of
                FROM pair
                JOIN base_state USING (base_sku)
                LEFT JOIN seasonal USING (base_sku, branch)
                LEFT JOIN latest_episode episode USING (base_sku, branch)
                CROSS JOIN bounds
                {where}
                """,
                params,
            )
        ).fetchall()

    if not rows:
        raise HTTPException(404, "No forecast segmentation data for the selected filters")

    data_as_of: date = rows[0]["data_as_of"]
    classified = [_classify_series(dict(row), data_as_of, horizon) for row in rows]
    lifecycle_counts = Counter(row["lifecycle"] for row in classified)
    evidence_counts = Counter(row["evidence_level"] for row in classified)
    pattern_counts = Counter(row["demand_pattern"] or "Unknown" for row in classified)
    strategy_counts = Counter(row["recommended_strategy"] for row in classified)
    matrix_counts = Counter((row["lifecycle"], row["demand_pattern"] or "Unknown") for row in classified)
    region_counts: dict[str, Counter[str]] = {}
    for row in classified:
        region_counts.setdefault(row["region"], Counter())[row["lifecycle"]] += 1

    sorted_samples = sorted(
        classified,
        key=lambda row: (
            row["lifecycle"] not in {"SEASONAL_RETURN_EXPECTED", "NEW_AT_BRANCH", "DORMANT_SUSPECTED"},
            -float(row["demand_12m"] or 0),
        ),
    )[:sample_size]
    total = len(classified)
    seasonal_count = sum(bool(row["has_seasonal_signal"]) for row in classified)
    relaunch_count = sum(bool(row["is_relaunched"]) for row in classified)

    branches = sorted(
        {
            (row["region"], row["branch"], row["branch_name"] or row["branch"])
            for row in classified
        }
    )
    return {
        "data_as_of_month": data_as_of,
        "forecast_horizon": horizon,
        "filters": {"region": region or "", "branch": branch or ""},
        "options": {
            "regions": sorted({row["region"] for row in classified}),
            "branches": [
                {"region": item[0], "branch_code": item[1], "branch_name": item[2]}
                for item in branches
            ],
        },
        "kpis": {
            "series_count": total,
            "seasonal_signal_count": seasonal_count,
            "seasonal_signal_share": seasonal_count / total,
            "relaunch_count": relaunch_count,
            "relaunch_share": relaunch_count / total,
            "standard_or_high_count": sum(
                evidence_counts[level] for level in ("STANDARD", "HIGH")
            ),
        },
        "lifecycle_distribution": _distribution(lifecycle_counts, LIFECYCLE_LABELS, total),
        "evidence_distribution": _distribution(evidence_counts, EVIDENCE_LABELS, total),
        "pattern_distribution": _distribution(pattern_counts, {}, total),
        "strategy_distribution": _distribution(strategy_counts, STRATEGY_LABELS, total),
        "lifecycle_pattern_matrix": [
            {
                "lifecycle": lifecycle,
                "lifecycle_label": LIFECYCLE_LABELS.get(lifecycle, lifecycle),
                "demand_pattern": pattern,
                "count": count,
            }
            for (lifecycle, pattern), count in sorted(matrix_counts.items())
        ],
        "region_distribution": [
            {
                "region": name,
                "series_count": sum(counts.values()),
                "seasonal_return_count": counts["SEASONAL_RETURN_EXPECTED"],
                "off_season_count": counts["OFF_SEASON"],
                "dormant_suspected_count": counts["DORMANT_SUSPECTED"],
                "new_at_branch_count": counts["NEW_AT_BRANCH"],
            }
            for name, counts in sorted(region_counts.items())
        ],
        "samples": [
            {
                "base_sku": row["base_sku"],
                "sku_name": row["sku_name"],
                "branch": row["branch"],
                "branch_name": row["branch_name"],
                "region": row["region"],
                "lifecycle": row["lifecycle"],
                "lifecycle_label": LIFECYCLE_LABELS[row["lifecycle"]],
                "evidence_level": row["evidence_level"],
                "evidence_label": EVIDENCE_LABELS[row["evidence_level"]],
                "demand_pattern": row["demand_pattern"] or "Unknown",
                "recommended_strategy": row["recommended_strategy"],
                "strategy_label": STRATEGY_LABELS[row["recommended_strategy"]],
                "history_months": row["history_months"],
                "positive_months": row["positive_months"],
                "months_since_positive": row["months_since_positive"],
                "demand_12m": row["demand_12m"],
                "has_seasonal_signal": row["has_seasonal_signal"],
                "season_ahead": row["season_ahead"],
                "is_relaunched": row["is_relaunched"],
            }
            for row in sorted_samples
        ],
        "methodology": {
            "recent_window": "Có bán trong 3 tháng gần nhất được xem là ACTIVE_RECENT.",
            "seasonal_signal": "Một tháng dương lịch có demand dương trong ít nhất 2 năm và positive-rate toàn chuỗi dưới 75%; chỉ là tín hiệu sơ bộ vì dữ liệu có tối đa khoảng 30 tháng.",
            "season_ahead": f"Một trong {horizon} tháng forecast tiếp theo nằm trong nhóm tháng có tín hiệu mùa vụ.",
            "episode": "Episode chỉ tạo cờ relaunch; không reset history_months hoặc evidence level.",
            "evidence": "6 tháng + 2 tháng dương là provisional; 12 + 3 là standard; 18 + 6 là high.",
        },
    }
