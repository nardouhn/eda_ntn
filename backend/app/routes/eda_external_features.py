from __future__ import annotations

from collections import defaultdict
from math import sqrt

from fastapi import APIRouter, HTTPException, Query

from app.db import get_pool


router = APIRouter(prefix="/eda/external-features", tags=["EDA External Features"])

SOURCE_TABLE = "source.mart_sku_branch_month"
FEATURE_TABLE = "analytics.dim_month_region_features"
REGION_SQL = """CASE
    WHEN UPPER(BTRIM(source.region)) IN ('TNB', 'TÂY NAM BỘ') THEN 'Tây Nam Bộ'
    WHEN UPPER(BTRIM(source.region)) IN ('DNB', 'ĐÔNG NAM BỘ') THEN 'Đông Nam Bộ'
    WHEN UPPER(BTRIM(source.region)) IN ('MT-TNG', 'TÂY NGUYÊN') THEN 'Tây Nguyên'
    ELSE 'Khác'
END"""


def _metric_sql(metric: str) -> str:
    if metric == "revenue":
        return "COALESCE(SUM(CASE WHEN source.quantity > 0 THEN GREATEST(source.total_amount, 0) ELSE 0 END), 0)::double precision"
    return "GREATEST(SUM(source.quantity), 0)::double precision"


def _number(value) -> float | None:
    return float(value) if value is not None else None


def _correlation(left: list[float | None], right: list[float | None]) -> float | None:
    pairs = [(x, y) for x, y in zip(left, right) if x is not None and y is not None]
    if len(pairs) < 3:
        return None
    xs, ys = zip(*pairs)
    x_mean, y_mean = sum(xs) / len(xs), sum(ys) / len(ys)
    numerator = sum((x - x_mean) * (y - y_mean) for x, y in pairs)
    denominator = sqrt(
        sum((x - x_mean) ** 2 for x in xs) * sum((y - y_mean) ** 2 for y in ys)
    )
    return numerator / denominator if denominator else None


def _decompose(rows: list[dict]) -> tuple[list[dict], dict]:
    if not rows:
        return [], {"slope": None, "intercept": None, "method": "additive_linear_month_of_year"}
    xs = [float(row["trend_index"]) for row in rows]
    ys = [float(row["value"]) for row in rows]
    x_mean, y_mean = sum(xs) / len(xs), sum(ys) / len(ys)
    variance = sum((value - x_mean) ** 2 for value in xs)
    slope = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ys)) / variance if variance else 0.0
    intercept = y_mean - slope * x_mean
    residuals: dict[int, list[float]] = defaultdict(list)
    for row, x, y in zip(rows, xs, ys):
        residuals[row["month"].month].append(y - (intercept + slope * x))
    seasonal = {month: sum(values) / len(values) for month, values in residuals.items()}
    points = []
    for row, x, y in zip(rows, xs, ys):
        trend = intercept + slope * x
        seasonal_value = seasonal.get(row["month"].month, 0.0)
        points.append(
            {
                **row,
                "value": y,
                "linear_trend": trend,
                "seasonal": seasonal_value,
                "fitted": trend + seasonal_value,
            }
        )
    return points, {
        "slope": slope,
        "intercept": intercept,
        "method": "additive_linear_trend_plus_month_of_year_residual_mean",
    }


async def _ensure_feature_table(conn) -> None:
    state = await (await conn.execute("SELECT to_regclass(%s) relation_name", [FEATURE_TABLE])).fetchone()
    if not state or state["relation_name"] is None:
        raise HTTPException(
            503,
            "External feature mart is unavailable. Run refresh_sku_brand_month_enriched.py first.",
        )
    required = {
        "thang", "vung", "trend_index", "gg_trends_index", "gg_trends_lag1",
        "flag_mua_mua", "ty_trong_chay_tet", "ty_trong_thang_gieng",
        "ty_trong_thang_co_hon", "ty_trong_thanh_minh",
    }
    columns = await (
        await conn.execute(
            """SELECT column_name FROM information_schema.columns
               WHERE table_schema='analytics' AND table_name='dim_month_region_features'"""
        )
    ).fetchall()
    missing = required - {row["column_name"] for row in columns}
    if missing:
        raise HTTPException(
            503,
            f"External feature mart is missing columns: {', '.join(sorted(missing))}. Refresh it before using EDA.",
        )


@router.get("/{level}")
async def external_feature_analysis(
    level: str,
    metric: str = Query("quantity", pattern="^(quantity|revenue)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=50),
) -> dict:
    if level not in {"overview", "region", "branch", "sku", "branch-sku", "pattern-set"}:
        raise HTTPException(404, "Unknown external-feature analysis level")
    value_sql = _metric_sql(metric)
    async with get_pool().connection() as conn:
        await _ensure_feature_table(conn)
        bounds = await (
            await conn.execute(f"SELECT MIN(thang) date_from, MAX(thang) date_to FROM {FEATURE_TABLE}")
        ).fetchone()
        if not bounds or not bounds["date_from"] or not bounds["date_to"]:
            raise HTTPException(503, "External feature mart is empty. Refresh it before using EDA.")

        if level == "overview":
            rows = await (
                await conn.execute(
                    f"""
                    WITH monthly_sales AS (
                        SELECT source.month::date AS month, {value_sql} AS value
                        FROM {SOURCE_TABLE} source
                        WHERE source.month::date BETWEEN %s AND %s
                        GROUP BY source.month::date
                    ), monthly_feature_base AS (
                        SELECT thang AS month, MAX(trend_index) trend_index,
                               MAX(gg_trends_index)::double precision gg_trends_index,
                               MAX(gg_trends_lag1)::double precision gg_trends_lag1,
                               MAX(ty_trong_chay_tet)::double precision ty_trong_chay_tet,
                               MAX(ty_trong_thang_gieng)::double precision ty_trong_thang_gieng,
                               MAX(ty_trong_thang_co_hon)::double precision ty_trong_thang_co_hon,
                               MAX(ty_trong_thanh_minh)::double precision ty_trong_thanh_minh
                        FROM {FEATURE_TABLE}
                        GROUP BY thang
                    ), monthly_features AS (
                        SELECT base.*,
                               LAG(gg_trends_index, 2) OVER (ORDER BY month) gg_trends_lag2,
                               LAG(gg_trends_index, 3) OVER (ORDER BY month) gg_trends_lag3
                        FROM monthly_feature_base base
                    )
                    SELECT feature.*, COALESCE(sales.value, 0)::double precision value
                    FROM monthly_features feature
                    LEFT JOIN monthly_sales sales USING(month)
                    ORDER BY month
                    """,
                    [bounds["date_from"], bounds["date_to"]],
                )
            ).fetchall()
            raw = [dict(row) for row in rows]
            points, decomposition = _decompose(raw)
            values = [point["value"] for point in points]
            correlations = {
                field: _correlation(values, [_number(point.get(field)) for point in points])
                for field in (
                    "gg_trends_index",
                    "gg_trends_lag1",
                    "gg_trends_lag2",
                    "gg_trends_lag3",
                    "ty_trong_chay_tet",
                    "ty_trong_thang_gieng",
                    "ty_trong_thang_co_hon",
                    "ty_trong_thanh_minh",
                )
            }
            return {
                "level": level,
                "metric": metric,
                "filters": dict(bounds),
                "correlations": correlations,
                "decomposition": decomposition,
                "monthly": points,
                "methodology": "Feature không có vùng được SELECT/GROUP một lần theo tháng trước khi tính correlation; decomposition cộng tính gồm linear trend + seasonal trung bình residual theo tháng trong năm.",
            }

        if level == "region":
            rows = await (
                await conn.execute(
                    f"""
                    WITH monthly AS (
                        SELECT source.month::date AS month, {REGION_SQL} AS region, {value_sql} AS value
                        FROM {SOURCE_TABLE} source
                        WHERE source.month::date BETWEEN %s AND %s
                        GROUP BY source.month::date, {REGION_SQL}
                    ), joined AS (
                        SELECT monthly.*, feature.flag_mua_mua,
                               feature.ty_trong_chay_tet::double precision ty_trong_chay_tet,
                               feature.ty_trong_thang_gieng::double precision ty_trong_thang_gieng,
                               feature.ty_trong_thang_co_hon::double precision ty_trong_thang_co_hon,
                               feature.ty_trong_thanh_minh::double precision ty_trong_thanh_minh
                        FROM monthly JOIN {FEATURE_TABLE} feature
                          ON feature.thang=monthly.month AND feature.vung=monthly.region
                    )
                    SELECT region, COUNT(*)::integer observed_months,
                           AVG(value) FILTER(WHERE flag_mua_mua=1)::double precision rainy_avg,
                           AVG(value) FILTER(WHERE flag_mua_mua=0)::double precision dry_avg,
                           CORR(value, flag_mua_mua)::double precision rain_correlation,
                           CORR(value, ty_trong_chay_tet)::double precision tet_correlation,
                           CORR(value, ty_trong_thang_co_hon)::double precision co_hon_correlation,
                           CORR(value, ty_trong_thanh_minh)::double precision thanh_minh_correlation,
                           REGR_SLOPE(value, ty_trong_chay_tet)::double precision tet_sensitivity,
                           REGR_SLOPE(value, ty_trong_thang_co_hon)::double precision co_hon_sensitivity,
                           AVG(value) FILTER(WHERE ty_trong_chay_tet > 0)::double precision tet_event_avg,
                           AVG(value) FILTER(WHERE ty_trong_thang_gieng > 0)::double precision gieng_event_avg,
                           AVG(value) FILTER(WHERE ty_trong_thang_co_hon > 0)::double precision co_hon_event_avg,
                           AVG(value) FILTER(WHERE ty_trong_thanh_minh > 0)::double precision thanh_minh_event_avg,
                           AVG(value) FILTER(WHERE ty_trong_chay_tet = 0 AND ty_trong_thang_gieng = 0
                                                AND ty_trong_thang_co_hon = 0 AND ty_trong_thanh_minh = 0)::double precision baseline_avg
                    FROM joined GROUP BY region ORDER BY region
                    """,
                    [bounds["date_from"], bounds["date_to"]],
                )
            ).fetchall()
            result = []
            for source in rows:
                row = dict(source)
                rainy, dry = _number(row["rainy_avg"]), _number(row["dry_avg"])
                row["rainy_change_pct"] = rainy / dry - 1 if rainy is not None and dry else None
                baseline = _number(row["baseline_avg"])
                for event in ("tet", "gieng", "co_hon", "thanh_minh"):
                    event_avg = _number(row[f"{event}_event_avg"])
                    row[f"{event}_uplift_pct"] = event_avg / baseline - 1 if event_avg is not None and baseline else None
                result.append(row)
            return {
                "level": level,
                "metric": metric,
                "filters": dict(bounds),
                "items": result,
                "methodology": "So sánh trung bình tháng mưa/khô và Pearson correlation trên chuỗi tháng riêng từng vùng; kết quả mô tả, chưa kiểm soát mọi biến gây nhiễu.",
            }

        if level == "branch":
            rows = await (
                await conn.execute(
                    f"""
                    WITH branch_month AS (
                        SELECT source.branch AS branch_code, MAX(source.branch_name) AS branch_name,
                               source.month::date AS month, {REGION_SQL} AS region, {value_sql} AS value
                        FROM {SOURCE_TABLE} source
                        WHERE source.month::date BETWEEN %s AND %s
                        GROUP BY source.branch, source.month::date, {REGION_SQL}
                    ), branch_mean AS (
                        SELECT branch_code, AVG(value) mean_value FROM branch_month GROUP BY branch_code
                    ), normalized AS (
                        SELECT data.*, data.value/NULLIF(mean.mean_value,0) normalized_value
                        FROM branch_month data JOIN branch_mean mean USING(branch_code)
                    ), region_month AS (
                        SELECT region,month,AVG(normalized_value) region_normalized
                        FROM normalized GROUP BY region,month
                    )
                    SELECT data.branch_code,MAX(data.branch_name) branch_name,MAX(data.region) region,
                           COUNT(*)::integer observed_months,SUM(data.value)::double precision total_value,
                           AVG(ABS(data.normalized_value-region.region_normalized))::double precision operational_outlier_score,
                           AVG(data.normalized_value-region.region_normalized)::double precision signed_deviation,
                           COUNT(*) OVER()::integer total_count
                    FROM normalized data JOIN region_month region USING(region,month)
                    WHERE data.normalized_value IS NOT NULL
                    GROUP BY data.branch_code HAVING COUNT(*) >= 6
                    ORDER BY operational_outlier_score DESC NULLS LAST LIMIT %s OFFSET %s
                    """,
                    [bounds["date_from"], bounds["date_to"], page_size, (page - 1) * page_size],
                )
            ).fetchall()
            return {
                "level": level,
                "metric": metric,
                "filters": dict(bounds),
                "page": page,
                "page_size": page_size,
                "total": int(rows[0]["total_count"]) if rows else 0,
                "items": [dict(row) for row in rows],
                "methodology": "Chuẩn hóa mỗi chi nhánh theo mức trung bình riêng rồi so với baseline các chi nhánh cùng vùng trong đúng tháng; seasonal chung của vùng được loại khỏi score.",
            }

        dimensions = {
            "sku": ("source.base_sku", "MAX(source.sku_name)", "base_sku", "sku_name", "source.base_sku IS NOT NULL"),
            "branch-sku": ("source.base_sku || '|' || source.branch", "MAX(source.sku_name) || ' · ' || MAX(source.branch_name)", "entity_key", "entity_name", "source.base_sku IS NOT NULL AND source.branch IS NOT NULL"),
            "pattern-set": ("BTRIM(source.pattern_set)", "BTRIM(source.pattern_set)", "pattern_set", "entity_name", "NULLIF(BTRIM(source.pattern_set),'') IS NOT NULL"),
        }
        key_sql, name_sql, key_alias, name_alias, valid_sql = dimensions[level]
        region_group = f", {REGION_SQL}" if level == "branch-sku" else ""
        region_select = f", {REGION_SQL} region" if level == "branch-sku" else ""
        feature_join = (
            f"feature.thang=monthly.month AND feature.vung=monthly.region"
            if level == "branch-sku"
            else "feature.thang=monthly.month"
        )
        feature_source = (
            FEATURE_TABLE
            if level == "branch-sku"
            else f"(SELECT thang,MAX(gg_trends_index) gg_trends_index,MAX(gg_trends_lag1) gg_trends_lag1,MAX(ty_trong_chay_tet) ty_trong_chay_tet,MAX(ty_trong_thang_gieng) ty_trong_thang_gieng,MAX(ty_trong_thang_co_hon) ty_trong_thang_co_hon,MAX(ty_trong_thanh_minh) ty_trong_thanh_minh FROM {FEATURE_TABLE} GROUP BY thang)"
        )
        rows = await (
            await conn.execute(
                f"""
                WITH monthly AS (
                    SELECT {key_sql} AS entity_key, {name_sql} AS entity_name,
                           source.month::date AS month {region_select}, {value_sql} AS value
                    FROM {SOURCE_TABLE} source
                    WHERE source.month::date BETWEEN %s AND %s AND {valid_sql}
                    GROUP BY {key_sql}, source.month::date {region_group}
                ), joined AS (
                    SELECT monthly.*,feature.gg_trends_index::double precision gg_trends_index,
                           feature.gg_trends_lag1::double precision gg_trends_lag1,
                           feature.ty_trong_chay_tet::double precision ty_trong_chay_tet,
                           feature.ty_trong_thang_gieng::double precision ty_trong_thang_gieng,
                           feature.ty_trong_thang_co_hon::double precision ty_trong_thang_co_hon,
                           feature.ty_trong_thanh_minh::double precision ty_trong_thanh_minh
                    FROM monthly JOIN {feature_source} feature ON {feature_join}
                )
                SELECT entity_key AS {key_alias},MAX(entity_name) {name_alias},
                       COUNT(*)::integer observed_months,SUM(value)::double precision total_value,
                       CORR(value,gg_trends_index)::double precision gg_correlation,
                       CORR(value,gg_trends_lag1)::double precision gg_lag1_correlation,
                       CORR(value,ty_trong_chay_tet)::double precision tet_correlation,
                       CORR(value,ty_trong_thang_co_hon)::double precision co_hon_correlation,
                       CORR(value,ty_trong_thanh_minh)::double precision thanh_minh_correlation,
                       COUNT(*) FILTER(WHERE ty_trong_chay_tet > 0)::integer tet_event_months,
                       COUNT(*) FILTER(WHERE ty_trong_thanh_minh > 0)::integer thanh_minh_event_months,
                       AVG(value) FILTER(WHERE ty_trong_chay_tet > 0)::double precision tet_event_avg,
                       AVG(value) FILTER(WHERE ty_trong_thanh_minh > 0)::double precision thanh_minh_event_avg,
                       AVG(value) FILTER(WHERE ty_trong_chay_tet = 0 AND ty_trong_thang_gieng = 0
                                            AND ty_trong_thang_co_hon = 0 AND ty_trong_thanh_minh = 0)::double precision baseline_avg,
                       COUNT(*) OVER()::integer total_count
                FROM joined GROUP BY entity_key HAVING COUNT(*) >= 6
                ORDER BY GREATEST(
                    COALESCE(ABS(CORR(value,gg_trends_lag1)),0),
                    COALESCE(ABS(CORR(value,ty_trong_chay_tet)),0),
                    COALESCE(ABS(CORR(value,ty_trong_thang_co_hon)),0),
                    COALESCE(ABS(CORR(value,ty_trong_thanh_minh)),0)
                ) DESC, total_value DESC LIMIT %s OFFSET %s
                """,
                [bounds["date_from"], bounds["date_to"], page_size, (page - 1) * page_size],
            )
        ).fetchall()
        items = []
        total_months = (bounds["date_to"].year - bounds["date_from"].year) * 12 + bounds["date_to"].month - bounds["date_from"].month + 1
        for source in rows:
            row = dict(source)
            row["coverage_pct"] = int(row["observed_months"]) / total_months
            baseline = _number(row["baseline_avg"])
            for event in ("tet", "thanh_minh"):
                event_avg = _number(row[f"{event}_event_avg"])
                row[f"{event}_uplift_pct"] = event_avg / baseline - 1 if event_avg is not None and baseline else None
            row["gg_confidence"] = "reliable" if int(row["observed_months"]) >= 18 else "low"
            row["tet_confidence"] = "reliable" if int(row["observed_months"]) >= 18 and int(row["tet_event_months"]) >= 2 else "low"
            row["thanh_minh_confidence"] = "reliable" if int(row["observed_months"]) >= 18 and int(row["thanh_minh_event_months"]) >= 2 else "low"
            items.append(row)
        methodology = {
            "sku": "Correlation trên demand tháng đã gộp toàn vùng theo Base SKU; feature không có vùng được distinct/group một lần theo tháng.",
            "branch-sku": "Thống kê mô tả cho cặp SKU × chi nhánh có ít nhất 6 tháng quan sát; không fit model riêng vì chuỗi thưa.",
            "pattern-set": "pattern_set có liên kết trực tiếp với dòng bán theo tháng trong source mart, nên correlation được tính sau khi gộp demand theo bộ mẫu × tháng.",
        }[level]
        return {
            "level": level,
            "metric": metric,
            "filters": dict(bounds),
            "page": page,
            "page_size": page_size,
            "total": int(rows[0]["total_count"]) if rows else 0,
            "items": items,
            "methodology": methodology,
        }
