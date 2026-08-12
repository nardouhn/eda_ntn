from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date
from itertools import permutations
from math import copysign, log1p, sqrt
from statistics import fmean, median
from typing import Any

from fastapi import APIRouter, HTTPException

from app.db import get_pool


router = APIRouter(prefix="/eda/branch-drivers", tags=["EDA Branch Drivers"])

SOURCE_TABLE = "source.mart_sku_branch_month"
REGION_SQL = "COALESCE(NULLIF(BTRIM(region), ''), 'Chưa xác định')"
ACTIVE_SQL = "LOWER(BTRIM(COALESCE(branch_status, ''))) = 'hoạt động'"

FEATURES = {
    "trend_index": ("Trend index", "known_future"),
    "gg_trends_index": ("GG hiện tại", "unknown_at_origin"),
    "gg_trends_lag1": ("GG lag 1", "forecast_safe"),
    "flag_mua_mua": ("Mùa mưa", "known_future"),
    "ty_trong_chay_tet": ("Chạy Tết", "known_future"),
    "ty_trong_thang_gieng": ("Tháng Giêng", "known_future"),
    "ty_trong_thang_co_hon": ("Tháng cô hồn", "known_future"),
    "ty_trong_thanh_minh": ("Thanh Minh", "known_future"),
}


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


def _signed_log1p(value: float) -> float:
    return copysign(log1p(abs(value)), value)


def _rolling_mean(values: dict[date, float], target: date, months: int) -> float | None:
    observed = [values.get(_add_months(target, -offset)) for offset in range(months)]
    available = [value for value in observed if value is not None]
    return fmean(available) if available else None


def _feature_associations(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for feature, (label, availability) in FEATURES.items():
        pairs = [
            (_signed_log1p(float(row["quantity"])), float(row[feature]))
            for row in rows if row.get(feature) is not None
        ]
        active = [float(row["quantity"]) for row in rows if row.get(feature) is not None and float(row[feature]) > 0]
        baseline = [float(row["quantity"]) for row in rows if row.get(feature) is not None and float(row[feature]) == 0]
        uplift = fmean(active) / fmean(baseline) - 1 if active and baseline and fmean(baseline) > 0 else None
        result.append({
            "feature": feature,
            "label": label,
            "availability": availability,
            "observations": len(pairs),
            "correlation": _correlation(pairs),
            "event_uplift": uplift,
        })
    return result


def _feature_matrix(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    keys = list(FEATURES)
    for left in keys:
        for right in keys:
            pairs = [(float(row[left]), float(row[right])) for row in rows if row.get(left) is not None and row.get(right) is not None]
            result.append({
                "feature_x": left,
                "feature_y": right,
                "label_x": FEATURES[left][0],
                "label_y": FEATURES[right][0],
                "observations": len(pairs),
                "correlation": 1.0 if left == right else _correlation(pairs),
            })
    return result


def _lag_associations(values: dict[date, float], lags: tuple[int, ...] = (1, 2, 3, 6, 12)) -> list[dict[str, Any]]:
    transformed = {month: _signed_log1p(value) for month, value in values.items()}
    return [
        {
            "lag": lag,
            "observations": len(pairs := [
                (transformed[_add_months(month, -lag)], actual)
                for month, actual in transformed.items() if _add_months(month, -lag) in transformed
            ]),
            "correlation": _correlation(pairs),
        }
        for lag in lags
    ]


def _region_influence(by_branch: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    raw = {branch: {row["month"]: float(row["quantity"]) for row in rows} for branch, rows in by_branch.items()}
    regions = {branch: str(rows[-1]["region"]) for branch, rows in by_branch.items()}
    result: list[dict[str, Any]] = []
    for branch, own in raw.items():
        peers: dict[date, float] = defaultdict(float)
        for other, series in raw.items():
            if other != branch and regions[other] == regions[branch]:
                for month, value in series.items():
                    peers[month] += value
        correlations = []
        for lag in (0, 1, 2, 3):
            pairs = [
                (_signed_log1p(peers[_add_months(month, -lag)]), _signed_log1p(value))
                for month, value in own.items() if _add_months(month, -lag) in peers
            ]
            correlations.append({"lag": lag, "observations": len(pairs), "correlation": _correlation(pairs)})
        total_own, total_peers = sum(own.values()), sum(peers.values())
        best = max(correlations, key=lambda row: abs(row["correlation"] or 0.0))
        result.append({
            "branch": branch,
            "region": regions[branch],
            "branch_share_of_region": total_own / (total_own + total_peers) if total_own + total_peers else None,
            "correlations": correlations,
            "strongest_lag": best["lag"],
            "strongest_correlation": best["correlation"],
        })
    return result


def _sku_influence(rows: list[dict[str, Any]], branch_values: dict[date, float]) -> list[dict[str, Any]]:
    by_sku: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_sku[str(row["base_sku"])].append(row)
    total_abs = sum(abs(float(row["quantity"])) for row in rows) or 1.0
    result = []
    for base_sku, sku_rows in by_sku.items():
        series = {row["month"]: float(row["quantity"]) for row in sku_rows}
        same_pairs = [
            (_signed_log1p(value), _signed_log1p(branch_values[month] - value))
            for month, value in series.items() if month in branch_values
        ]
        lag_rows = []
        for lag in (1, 2, 3):
            pairs = [
                (_signed_log1p(series[_add_months(month, -lag)]), _signed_log1p(total))
                for month, total in branch_values.items() if _add_months(month, -lag) in series
            ]
            lag_rows.append({"lag": lag, "observations": len(pairs), "correlation": _correlation(pairs)})
        best = max(lag_rows, key=lambda row: abs(row["correlation"] or 0.0))
        net = sum(series.values())
        result.append({
            "base_sku": base_sku,
            "sku_name": max((row.get("sku_name") or "" for row in sku_rows), default=""),
            "net_quantity": net,
            "absolute_quantity_share": sum(abs(value) for value in series.values()) / total_abs,
            "same_month_remainder_correlation": _correlation(same_pairs),
            "strongest_lag": best["lag"],
            "strongest_lag_correlation": best["correlation"],
            "lag_correlations": lag_rows,
        })
    return sorted(result, key=lambda row: row["absolute_quantity_share"], reverse=True)


def _branch_network(by_branch: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    series = {
        branch: {row["month"]: _signed_log1p(float(row["quantity"])) for row in rows}
        for branch, rows in by_branch.items()
    }
    branches = sorted(series)
    links: list[dict[str, Any]] = []
    for index, left in enumerate(branches):
        for right in branches[index + 1:]:
            common = sorted(set(series[left]) & set(series[right]))
            same = _correlation([(series[left][month], series[right][month]) for month in common])
            directional = []
            for lag in (1, 2, 3):
                directional.extend([
                    {"direction": f"{left} → {right}", "lag": lag, "correlation": _correlation([
                        (series[left][month], series[right][_add_months(month, lag)])
                        for month in common if _add_months(month, lag) in series[right]
                    ])},
                    {"direction": f"{right} → {left}", "lag": lag, "correlation": _correlation([
                        (series[right][month], series[left][_add_months(month, lag)])
                        for month in common if _add_months(month, lag) in series[left]
                    ])},
                ])
            best_lead = max(directional, key=lambda row: abs(row["correlation"] or 0.0))
            if same is not None:
                left_region = str(by_branch[left][-1]["region"])
                right_region = str(by_branch[right][-1]["region"])
                links.append({
                    "branch_a": left,
                    "branch_b": right,
                    "region_a": left_region,
                    "region_b": right_region,
                    "region_scope": "Cùng vùng" if left_region == right_region else "Khác vùng",
                    "overlap_months": len(common),
                    "same_month_correlation": same,
                    "lead_lag_details": directional,
                    "strongest_lead_direction": best_lead["direction"],
                    "strongest_lead_lag": best_lead["lag"],
                    "strongest_lead_correlation": best_lead["correlation"],
                })
    return sorted(links, key=lambda row: abs(row["same_month_correlation"]), reverse=True)


def _cluster_branches(rows: list[dict[str, Any]], k: int = 4) -> list[dict[str, Any]]:
    if not rows:
        return []
    fields = ["cv", "naive_wape", "trend_rate_6m", "seasonal_gain", "top5_sku_share", "external_sensitivity"]
    raw = [[float(row.get(field) or 0.0) for field in fields] for row in rows]
    medians = [median(vector[column] for vector in raw) for column in range(len(fields))]
    sorted_columns = [sorted(vector[column] for vector in raw) for column in range(len(fields))]
    q1 = [column[len(column) // 4] for column in sorted_columns]
    q3 = [column[(len(column) * 3) // 4] for column in sorted_columns]
    scales = [(upper - lower) or 1.0 for lower, upper in zip(q1, q3)]
    vectors = [
        [max(-3.0, min(3.0, (value - medians[column]) / scales[column])) for column, value in enumerate(vector)]
        for vector in raw
    ]
    cluster_count = min(k, len(vectors))
    ordered_vectors = sorted(vectors, key=sum)
    centers = [ordered_vectors[min(len(vectors) - 1, int((index + .5) * len(vectors) / cluster_count))][:] for index in range(cluster_count)]
    assignments = [0] * len(vectors)
    for _ in range(30):
        updated = [min(range(len(centers)), key=lambda idx: sum((a-b) ** 2 for a, b in zip(vector, centers[idx]))) for vector in vectors]
        if updated == assignments and _ > 0:
            break
        assignments = updated
        for cluster in range(len(centers)):
            members = [vector for vector, assigned in zip(vectors, assignments) if assigned == cluster]
            if members:
                centers[cluster] = [fmean(vector[column] for vector in members) for column in range(len(fields))]
    cluster_rows: list[dict[str, Any]] = []
    for cluster in range(len(centers)):
        members = [row for row, assigned in zip(rows, assignments) if assigned == cluster]
        if not members:
            continue
        centroid = {field: fmean(float(row.get(field) or 0.0) for row in members) for field in fields}
        cluster_rows.append({
            "cluster_id": cluster,
            "branch_count": len(members),
            "centroid": centroid,
            "branches": [row["branch"] for row in members],
        })
    archetypes = {
        "volatile": ("Biến động & khó baseline", "Global robust/Tweedie + ensemble"),
        "external": ("Nhạy mùa vụ/sự kiện", "Global model + calendar/event interaction"),
        "trend": ("Xu hướng gần đây", "Global trend-aware + Holt baseline"),
        "concentrated": ("Danh mục tập trung/pooled", "Global model + SKU-mix/region shrinkage"),
    }
    scores: list[dict[str, float]] = []
    for cluster in cluster_rows:
        centroid = cluster["centroid"]
        relative = {field: (centroid[field] - medians[index]) / scales[index] for index, field in enumerate(fields)}
        scores.append({
            "volatile": relative["cv"] + relative["naive_wape"],
            "external": relative["seasonal_gain"] + relative["external_sensitivity"],
            "trend": abs(centroid["trend_rate_6m"]) / scales[2],
            "concentrated": relative["top5_sku_share"],
        })
    names = list(archetypes)
    assignment = max(
        permutations(names, len(cluster_rows)),
        key=lambda candidate: sum(scores[index][name] for index, name in enumerate(candidate)),
    )
    for cluster, name in zip(cluster_rows, assignment):
        cluster["label"], cluster["recommended_model"] = archetypes[name]
    lookup = {branch: cluster["cluster_id"] for cluster in cluster_rows for branch in cluster["branches"]}
    meta = {cluster["cluster_id"]: cluster for cluster in cluster_rows}
    for row in rows:
        cluster = meta[lookup[row["branch"]]]
        row["cluster_id"] = cluster["cluster_id"]
        row["cluster_label"] = cluster["label"]
        row["cluster_model"] = cluster["recommended_model"]
    return cluster_rows


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
                           SUM(quantity)::double precision AS demand,
                           SUM(line_count)::bigint AS line_count
                    FROM {SOURCE_TABLE}
                    WHERE branch IS NOT NULL AND base_sku IS NOT NULL AND month IS NOT NULL
                    GROUP BY branch,base_sku,month
                ), branch_month AS (
                    SELECT branch,month,MAX(branch_name) AS branch_name,MAX(region) AS region,
                           BOOL_OR(branch_is_active) AS is_active,
                           SUM(demand)::double precision AS quantity,
                           COUNT(*) FILTER (WHERE demand>0)::integer AS active_skus,
                           SUM(line_count)::bigint AS line_count
                    FROM sku_month
                    GROUP BY branch,month
                )
                SELECT branch_month.*,
                       feature.trend_index,feature.gg_trends_index,feature.gg_trends_lag1,
                       feature.flag_mua_mua,feature.ty_trong_chay_tet,
                       feature.ty_trong_thang_gieng,feature.ty_trong_thang_co_hon,
                       feature.ty_trong_thanh_minh
                FROM branch_month
                LEFT JOIN analytics.dim_month_region_features feature
                  ON feature.thang=branch_month.month
                 AND feature.vung=CASE
                    WHEN UPPER(BTRIM(branch_month.region)) IN ('TNB','TÂY NAM BỘ') THEN 'Tây Nam Bộ'
                    WHEN UPPER(BTRIM(branch_month.region)) IN ('DNB','ĐÔNG NAM BỘ') THEN 'Đông Nam Bộ'
                    WHEN UPPER(BTRIM(branch_month.region)) IN ('MT-TNG','TÂY NGUYÊN') THEN 'Tây Nguyên'
                    ELSE 'Khác' END
                ORDER BY branch,month
                """
            )
        ).fetchall()
        feature_rows = await (
            await conn.execute(
                """SELECT thang,vung,trend_index,gg_trends_index,gg_trends_lag1,
                          flag_mua_mua,ty_trong_chay_tet,ty_trong_thang_gieng,
                          ty_trong_thang_co_hon,ty_trong_thanh_minh
                   FROM analytics.dim_month_region_features ORDER BY thang,vung"""
            )
        ).fetchall()
        sku_rows = await (
            await conn.execute(
                f"""
                WITH bounds AS (SELECT MAX(month)::date AS max_month FROM {SOURCE_TABLE}),
                sku AS (
                    SELECT branch,base_sku,MAX(sku_name) AS sku_name,
                           SUM(monthly_net)::double precision AS quantity
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
    all_metrics = [_branch_metrics(rows, global_min, global_max) for rows in by_branch.values()]
    active_codes = {row["branch"] for row in all_metrics if row["status"] == "Hoạt động"}
    by_branch = {code: rows for code, rows in by_branch.items() if code in active_codes}
    metrics = [row for row in all_metrics if row["status"] == "Hoạt động"]
    if region:
        metrics = [row for row in metrics if row["region"] == region]
        by_branch = {row["branch"]: by_branch[row["branch"]] for row in metrics}
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

    branch_associations: list[dict[str, Any]] = []
    for row in metrics:
        associations = _feature_associations(by_branch[row["branch"]])
        safe_associations = [item for item in associations if item["availability"] != "unknown_at_origin"]
        row["external_sensitivity"] = max((abs(item["correlation"] or 0.0) for item in safe_associations), default=0.0)
        row["top_external_driver"] = max(safe_associations, key=lambda item: abs(item["correlation"] or 0.0))["label"]
        branch_associations.extend({"branch": row["branch"], "branch_name": row["branch_name"], "region": row["region"], **item} for item in associations)
    clusters = _cluster_branches(metrics)
    selected_code = branch if branch and any(row["branch"] == branch for row in metrics) else metrics[0]["branch"]
    selected = next(row for row in metrics if row["branch"] == selected_code)
    async with get_pool().connection() as conn:
        selected_sku_month_rows = await (
            await conn.execute(
                f"""SELECT base_sku,MAX(sku_name) AS sku_name,month::date AS month,
                           SUM(quantity)::double precision AS quantity
                    FROM {SOURCE_TABLE}
                    WHERE branch=%s AND month IS NOT NULL AND base_sku IS NOT NULL
                    GROUP BY base_sku,month ORDER BY base_sku,month""",
                (selected_code,),
            )
        ).fetchall()
    selected_values = {row["month"]: float(row["quantity"]) for row in by_branch[selected_code]}
    selected_lags = _lag_associations(selected_values)
    branch_lag_profiles = [
        {"branch": row["branch"], "branch_name": row["branch_name"], "region": row["region"], "lags": _lag_associations({item["month"]: float(item["quantity"]) for item in by_branch[row["branch"]]})}
        for row in metrics
    ]
    region_influences = _region_influence(by_branch)
    selected_region_influence = next(row for row in region_influences if row["branch"] == selected_code)
    selected_sku_influence = _sku_influence([dict(row) for row in selected_sku_month_rows], selected_values)[:30]
    global_skus: dict[str, dict[str, Any]] = {}
    total_abs_sku_quantity = 0.0
    for source in sku_rows:
        if source["branch"] not in active_codes:
            continue
        quantity = float(source["quantity"])
        total_abs_sku_quantity += abs(quantity)
        item = global_skus.setdefault(str(source["base_sku"]), {"base_sku": str(source["base_sku"]), "sku_name": source["sku_name"] or "", "net_quantity": 0.0, "absolute_quantity": 0.0, "branches": 0, "top5_branches": 0})
        item["net_quantity"] += quantity
        item["absolute_quantity"] += abs(quantity)
        item["branches"] += 1
        item["top5_branches"] += int(source["rank"] <= 5)
    global_sku_influence = sorted(global_skus.values(), key=lambda row: row["absolute_quantity"], reverse=True)[:30]
    for item in global_sku_influence:
        item["absolute_quantity_share"] = item["absolute_quantity"] / total_abs_sku_quantity if total_abs_sku_quantity else 0.0
    selected_detail = {**selected, "top_skus": sku_by_branch.get(selected_code, [])}
    table_rows = [{key: value for key, value in row.items() if key not in {"history", "monthly_profile"}} for row in metrics]
    segment_counts = Counter(row["forecastability_segment"] for row in metrics)
    network = _branch_network(by_branch)
    region_month: dict[tuple[str, date], dict[str, Any]] = {}
    for rows in by_branch.values():
        for row in rows:
            key = (row["region"], row["month"])
            if key not in region_month:
                region_month[key] = {**row, "quantity": 0.0}
            region_month[key]["quantity"] += float(row["quantity"])
    region_associations: list[dict[str, Any]] = []
    by_region: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for (region_name, _), row in region_month.items():
        by_region[region_name].append(row)
    for region_name, rows in by_region.items():
        region_associations.extend({"region": region_name, **item} for item in _feature_associations(rows))
    selected_links = [row for row in network if selected_code in {row["branch_a"], row["branch_b"]}][:15]
    active_metrics = metrics
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
            "cluster_count": len(clusters),
            "strong_external_count": sum(row["external_sensitivity"] >= .35 for row in metrics),
        },
        "segment_distribution": [
            {"segment": segment, "count": count}
            for segment, count in segment_counts.most_common()
        ],
        "branches": table_rows,
        "selected": selected_detail,
        "branch_feature_associations": branch_associations,
        "region_feature_associations": region_associations,
        "feature_interaction_matrix": _feature_matrix([dict(row) for row in feature_rows]),
        "clusters": clusters,
        "branch_network": network[:100],
        "selected_branch_links": selected_links,
        "selected_lag_associations": selected_lags,
        "branch_lag_profiles": branch_lag_profiles,
        "branch_region_influences": region_influences,
        "selected_region_influence": selected_region_influence,
        "selected_sku_influence": selected_sku_influence,
        "global_sku_influence": global_sku_influence,
        "methodology": {
            "target": "SUM(quantity) của toàn bộ dòng theo chi nhánh × tháng; không lấy MAX và không chặn quantity âm ở tầng SKU.",
            "seasonal": "Seasonal candidate khi có ít nhất 6 origin lag-12 và Seasonal Naive cải thiện WAPE >=10% so với Naive.",
            "coverage": "LOW_COVERAGE khi dưới 12 tháng quan sát hoặc coverage lịch dưới 80%.",
            "concentration": "Top-1/Top-5 share và HHI đo mức tổng chi nhánh phụ thuộc vào vài SKU.",
            "drivers": "Correlation dùng log1p(quantity), chỉ mô tả liên hệ; GG hiện tại bị đánh dấu unknown-at-origin.",
            "lags": "Lag 1/2/3/6/12 là correlation giữa signed-log quantity quá khứ và quantity hiện tại; chỉ dùng lag có đủ origin trong backtest.",
            "network": "Đồng biến và lead-lag 1–3 tháng giữa chi nhánh là tín hiệu thăm dò, không chứng minh chi nhánh này gây demand cho chi nhánh khác.",
            "region_influence": "Ảnh hưởng vùng dùng tổng quantity các chi nhánh cùng vùng nhưng loại chính chi nhánh đang đo để tránh tương quan part-whole giả.",
            "sku_influence": "SKU xếp theo tỷ trọng absolute quantity; correlation cùng tháng dùng phần còn lại của chi nhánh, còn lag 1–3 so SKU quá khứ với tổng chi nhánh hiện tại.",
            "clustering": "K-means 4 cụm với robust scaling/IQR và chặn outlier trên CV, Naive WAPE, trend, seasonal gain, Top-5 share và external sensitivity; tên cụm là đặc trưng tương đối nổi trội để routing model, không phải nhãn nghiệp vụ cố định.",
        },
    }
