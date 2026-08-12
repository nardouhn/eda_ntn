"""Audit feature cho forecast demand Base SKU × Chi nhánh × tháng.

Script chỉ đọc các bảng đang phục vụ EDA và xuất CSV/JSON để đánh giá:

- schema_inventory.csv
- source_profile.csv
- numeric_target_association.csv
- numeric_redundancy.csv
- categorical_target_association.csv
- mapping_redundancy.csv
- feature_recommendations.csv
- modeling_panel_sample.csv
- audit_summary.json

Correlation được tính với target tháng kế tiếp và lag khớp đúng tháng lịch. Missing
không bị tự động đổi thành zero. Covariance được xuất để tham khảo nhưng không dùng
so sánh độ quan trọng giữa các feature có đơn vị khác nhau.
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import json
import os
import sys
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any, Iterable

from dotenv import load_dotenv
from psycopg import AsyncConnection
from psycopg.rows import dict_row


DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent / "forecast_feature_analysis_output"


@dataclass(frozen=True)
class AuditConfig:
    output_dir: Path
    panel_limit: int = 20_000


SCHEMA_QUERY = """
SELECT table_schema, table_name, ordinal_position, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE (table_schema='source' AND table_name='mart_sku_branch_month')
   OR (table_schema='analytics' AND table_name IN (
       'mart_demand_pattern_episode',
       'dim_month_region_features',
       'mart_sku_brand_month_enriched'
   ))
ORDER BY table_schema, table_name, ordinal_position
"""


SOURCE_PROFILE_QUERY = """
SELECT
    COUNT(*)::bigint AS source_rows,
    MIN(month)::date AS min_month,
    MAX(month)::date AS max_month,
    COUNT(DISTINCT base_sku)::bigint AS base_skus,
    COUNT(DISTINCT bravo_sku)::bigint AS bravo_skus,
    COUNT(DISTINCT branch)::bigint AS branches,
    COUNT(DISTINCT region)::bigint AS regions,
    COUNT(DISTINCT price_group)::bigint AS price_groups,
    COUNT(DISTINCT factory_sku)::bigint AS factory_skus,
    COUNT(DISTINCT pattern_set)::bigint AS pattern_sets,
    COUNT(DISTINCT sku_name)::bigint AS sku_names,
    COUNT(DISTINCT unit)::bigint AS units,
    COUNT(*) FILTER (WHERE NULLIF(BTRIM(region),'') IS NULL)::bigint AS region_missing,
    COUNT(*) FILTER (WHERE NULLIF(BTRIM(price_group),'') IS NULL)::bigint AS price_group_missing,
    COUNT(*) FILTER (WHERE NULLIF(BTRIM(factory_sku),'') IS NULL)::bigint AS factory_sku_missing,
    COUNT(*) FILTER (WHERE NULLIF(BTRIM(pattern_set),'') IS NULL)::bigint AS pattern_set_missing,
    COUNT(*) FILTER (WHERE NULLIF(BTRIM(sku_name),'') IS NULL)::bigint AS sku_name_missing
FROM source.mart_sku_branch_month
"""


NUMERIC_ASSOCIATION_QUERY = r"""
WITH monthly AS (
    SELECT base_sku, branch, month::date AS month,
           GREATEST(SUM(quantity),0)::double precision AS demand,
           SUM(line_count)::double precision AS line_count,
           SUM(CASE WHEN quantity>0 THEN GREATEST(total_amount,0) ELSE 0 END)::double precision AS revenue,
           MAX(trend_index)::double precision AS trend_index,
           MAX(gg_trends_index)::double precision AS gg_trends_current,
           MAX(gg_trends_lag1)::double precision AS gg_trends_lag1,
           MAX(flag_mua_mua)::double precision AS rain_flag,
           MAX(ty_trong_chay_tet)::double precision AS tet_share,
           MAX(ty_trong_thang_gieng)::double precision AS thang_gieng_share,
           MAX(ty_trong_thang_co_hon)::double precision AS co_hon_share,
           MAX(ty_trong_thanh_minh)::double precision AS thanh_minh_share
    FROM analytics.mart_sku_brand_month_enriched
    GROUP BY base_sku, branch, month
), panel AS (
    SELECT target.base_sku, target.branch,
           origin.month AS origin_month, target.month AS target_month,
           target.demand AS target_demand,
           origin.demand AS lag1,
           lag2.demand AS lag2,
           lag3.demand AS lag3,
           lag6.demand AS lag6,
           lag12.demand AS lag12,
           origin.line_count AS line_count_lag1,
           origin.revenue AS revenue_lag1,
           (
               origin.demand + COALESCE(lag2.demand,0) + COALESCE(lag3.demand,0)
           ) / (
               1 + (lag2.demand IS NOT NULL)::integer + (lag3.demand IS NOT NULL)::integer
           ) AS rolling3_observed,
           target.trend_index AS trend_target,
           target.gg_trends_current AS gg_current_target,
           target.gg_trends_lag1 AS gg_lag1_target,
           target.rain_flag AS rain_target,
           target.tet_share AS tet_target,
           target.thang_gieng_share AS thang_gieng_target,
           target.co_hon_share AS co_hon_target,
           target.thanh_minh_share AS thanh_minh_target
    FROM monthly target
    JOIN monthly origin
      ON origin.base_sku=target.base_sku
     AND origin.branch=target.branch
     AND origin.month=target.month-INTERVAL '1 month'
    LEFT JOIN monthly lag2
      ON lag2.base_sku=target.base_sku AND lag2.branch=target.branch
     AND lag2.month=target.month-INTERVAL '2 months'
    LEFT JOIN monthly lag3
      ON lag3.base_sku=target.base_sku AND lag3.branch=target.branch
     AND lag3.month=target.month-INTERVAL '3 months'
    LEFT JOIN monthly lag6
      ON lag6.base_sku=target.base_sku AND lag6.branch=target.branch
     AND lag6.month=target.month-INTERVAL '6 months'
    LEFT JOIN monthly lag12
      ON lag12.base_sku=target.base_sku AND lag12.branch=target.branch
     AND lag12.month=target.month-INTERVAL '12 months'
), values_long(feature, value, target, availability) AS (
    SELECT 'lag1',lag1,target_demand,'forecast_safe' FROM panel UNION ALL
    SELECT 'lag2',lag2,target_demand,'forecast_safe' FROM panel UNION ALL
    SELECT 'lag3',lag3,target_demand,'forecast_safe' FROM panel UNION ALL
    SELECT 'lag6',lag6,target_demand,'forecast_safe' FROM panel UNION ALL
    SELECT 'lag12',lag12,target_demand,'forecast_safe' FROM panel UNION ALL
    SELECT 'rolling3_observed',rolling3_observed,target_demand,'forecast_safe' FROM panel UNION ALL
    SELECT 'line_count_lag1',line_count_lag1,target_demand,'forecast_safe' FROM panel UNION ALL
    SELECT 'revenue_lag1',revenue_lag1,target_demand,'forecast_safe' FROM panel UNION ALL
    SELECT 'trend_target',trend_target,target_demand,'known_future' FROM panel UNION ALL
    SELECT 'gg_current_target',gg_current_target,target_demand,'leakage_if_unknown' FROM panel UNION ALL
    SELECT 'gg_lag1_target',gg_lag1_target,target_demand,'forecast_safe_if_published' FROM panel UNION ALL
    SELECT 'rain_target',rain_target,target_demand,'known_future' FROM panel UNION ALL
    SELECT 'tet_target',tet_target,target_demand,'known_future' FROM panel UNION ALL
    SELECT 'thang_gieng_target',thang_gieng_target,target_demand,'known_future' FROM panel UNION ALL
    SELECT 'co_hon_target',co_hon_target,target_demand,'known_future' FROM panel UNION ALL
    SELECT 'thanh_minh_target',thanh_minh_target,target_demand,'known_future' FROM panel
)
SELECT feature, MAX(availability) AS availability,
       COUNT(value)::bigint AS paired_rows,
       (SELECT COUNT(*) FROM panel)::bigint AS eligible_panel_rows,
       ROUND(COUNT(value)::numeric / NULLIF((SELECT COUNT(*) FROM panel),0), 6) AS coverage,
       COUNT(DISTINCT value)::bigint AS distinct_values,
       CORR(value,target) AS pearson_raw,
       CORR(LN(1+GREATEST(value,0)),LN(1+target)) AS pearson_log1p,
       COVAR_POP(value,target) AS covariance,
       STDDEV_POP(value) AS feature_std,
       STDDEV_POP(target) AS target_std
FROM values_long
GROUP BY feature
ORDER BY ABS(CORR(LN(1+GREATEST(value,0)),LN(1+target))) DESC NULLS LAST
"""


NUMERIC_REDUNDANCY_QUERY = r"""
WITH monthly AS (
    SELECT base_sku,branch,month::date AS month,
           GREATEST(SUM(quantity),0)::double precision AS demand,
           SUM(line_count)::double precision AS line_count,
           SUM(CASE WHEN quantity>0 THEN GREATEST(total_amount,0) ELSE 0 END)::double precision AS revenue
    FROM source.mart_sku_branch_month
    GROUP BY base_sku,branch,month
), panel AS (
    SELECT origin.demand AS lag1, lag2.demand AS lag2, lag3.demand AS lag3,
           origin.line_count AS line_count_lag1, origin.revenue AS revenue_lag1,
           (origin.demand+COALESCE(lag2.demand,0)+COALESCE(lag3.demand,0)) /
             (1+(lag2.demand IS NOT NULL)::integer+(lag3.demand IS NOT NULL)::integer)
             AS rolling3_observed
    FROM monthly target
    JOIN monthly origin ON origin.base_sku=target.base_sku AND origin.branch=target.branch
      AND origin.month=target.month-INTERVAL '1 month'
    LEFT JOIN monthly lag2 ON lag2.base_sku=target.base_sku AND lag2.branch=target.branch
      AND lag2.month=target.month-INTERVAL '2 months'
    LEFT JOIN monthly lag3 ON lag3.base_sku=target.base_sku AND lag3.branch=target.branch
      AND lag3.month=target.month-INTERVAL '3 months'
), feature_pairs(pair,feature_a,feature_b,value_a,value_b) AS (
    SELECT 'lag1__rolling3','lag1','rolling3_observed',LN(1+lag1),LN(1+rolling3_observed) FROM panel UNION ALL
    SELECT 'lag1__lag2','lag1','lag2',LN(1+lag1),LN(1+lag2) FROM panel UNION ALL
    SELECT 'lag2__lag3','lag2','lag3',LN(1+lag2),LN(1+lag3) FROM panel UNION ALL
    SELECT 'lag1__revenue_lag1','lag1','revenue_lag1',LN(1+lag1),LN(1+revenue_lag1) FROM panel UNION ALL
    SELECT 'lag1__line_count_lag1','lag1','line_count_lag1',LN(1+lag1),LN(1+line_count_lag1) FROM panel
), calendar AS (
    SELECT trend_index::double precision AS trend,
           gg_trends_index::double precision AS gg,
           gg_trends_lag1::double precision AS gg_lag1,
           flag_mua_mua::double precision AS rain,
           ty_trong_chay_tet::double precision AS tet,
           ty_trong_thang_gieng::double precision AS gieng,
           ty_trong_thang_co_hon::double precision AS co_hon,
           ty_trong_thanh_minh::double precision AS thanh_minh
    FROM analytics.dim_month_region_features
), calendar_pairs(pair,feature_a,feature_b,value_a,value_b) AS (
    SELECT 'trend__gg','trend','gg_trends_index',trend,gg FROM calendar UNION ALL
    SELECT 'trend__gg_lag1','trend','gg_trends_lag1',trend,gg_lag1 FROM calendar UNION ALL
    SELECT 'gg__gg_lag1','gg_trends_index','gg_trends_lag1',gg,gg_lag1 FROM calendar UNION ALL
    SELECT 'tet__gieng','tet_share','thang_gieng_share',tet,gieng FROM calendar UNION ALL
    SELECT 'tet__rain','tet_share','rain_flag',tet,rain FROM calendar UNION ALL
    SELECT 'gieng__rain','thang_gieng_share','rain_flag',gieng,rain FROM calendar UNION ALL
    SELECT 'co_hon__rain','co_hon_share','rain_flag',co_hon,rain FROM calendar UNION ALL
    SELECT 'thanh_minh__rain','thanh_minh_share','rain_flag',thanh_minh,rain FROM calendar
), all_pairs AS (
    SELECT * FROM feature_pairs UNION ALL SELECT * FROM calendar_pairs
)
SELECT pair,feature_a,feature_b,
       COUNT(*) FILTER (WHERE value_a IS NOT NULL AND value_b IS NOT NULL)::bigint AS paired_rows,
       CORR(value_a,value_b) AS pearson,
       CASE WHEN ABS(CORR(value_a,value_b)) >= .90 THEN 'drop_or_regularize'
            WHEN ABS(CORR(value_a,value_b)) >= .75 THEN 'review_redundancy'
            ELSE 'keep_if_backtest_helps' END AS recommendation
FROM all_pairs
GROUP BY pair,feature_a,feature_b
ORDER BY ABS(CORR(value_a,value_b)) DESC NULLS LAST
"""


CATEGORICAL_ASSOCIATION_QUERY = r"""
WITH monthly AS (
    SELECT base_sku,branch,month::date AS month,
           MAX(COALESCE(NULLIF(BTRIM(region),''),'UNKNOWN')) AS region,
           MAX(price_group) AS price_group, MAX(factory_sku) AS factory_sku,
           MAX(pattern_set) AS pattern_set, MAX(sku_name) AS sku_name,
           GREATEST(SUM(quantity),0)::double precision AS demand
    FROM source.mart_sku_branch_month
    GROUP BY base_sku,branch,month
), panel AS (
    SELECT target.demand AS target_demand,
           origin.base_sku,origin.branch,origin.region,origin.price_group,
           origin.factory_sku,origin.pattern_set,origin.sku_name,
           episode.demand_pattern,episode.series_scope
    FROM monthly target
    JOIN monthly origin ON origin.base_sku=target.base_sku AND origin.branch=target.branch
      AND origin.month=target.month-INTERVAL '1 month'
    LEFT JOIN analytics.mart_demand_pattern_episode episode
      ON episode.base_sku=origin.base_sku AND episode.branch=origin.branch
     AND episode.is_latest_episode
), values_long(feature,category,target,availability) AS (
    SELECT 'region',region,target_demand,'forecast_safe' FROM panel UNION ALL
    SELECT 'branch',branch,target_demand,'forecast_safe' FROM panel UNION ALL
    SELECT 'price_group',price_group,target_demand,'forecast_safe' FROM panel UNION ALL
    SELECT 'pattern_set',pattern_set,target_demand,'forecast_safe' FROM panel UNION ALL
    SELECT 'factory_sku',factory_sku,target_demand,'redundant_with_base_sku' FROM panel UNION ALL
    SELECT 'base_sku',base_sku,target_demand,'forecast_safe' FROM panel UNION ALL
    SELECT 'sku_name',sku_name,target_demand,'display_only' FROM panel UNION ALL
    SELECT 'demand_pattern',demand_pattern,target_demand,'leakage_unless_recomputed_at_origin' FROM panel UNION ALL
    SELECT 'series_scope',series_scope,target_demand,'leakage_unless_recomputed_at_origin' FROM panel
), overall AS (
    SELECT feature,AVG(target) AS target_mean,
           SUM(POWER(target,2))-COUNT(*)*POWER(AVG(target),2) AS total_ss
    FROM values_long WHERE category IS NOT NULL GROUP BY feature
), grouped AS (
    SELECT feature,category,COUNT(*)::bigint AS rows,AVG(target) AS group_mean
    FROM values_long WHERE category IS NOT NULL GROUP BY feature,category
), feature_meta AS (
    SELECT feature,MAX(availability) AS availability
    FROM values_long GROUP BY feature
)
SELECT grouped.feature,feature_meta.availability,
       COUNT(DISTINCT grouped.category)::bigint AS categories,
       SUM(grouped.rows)::bigint AS paired_rows,
       MIN(grouped.rows)::bigint AS min_group_rows,
       MAX(grouped.rows)::bigint AS max_group_rows,
       SUM(grouped.rows*POWER(grouped.group_mean-overall.target_mean,2)) /
         NULLIF(overall.total_ss,0) AS eta_squared_in_sample
FROM grouped
JOIN overall USING(feature)
JOIN feature_meta USING(feature)
GROUP BY grouped.feature,feature_meta.availability,overall.total_ss
ORDER BY eta_squared_in_sample DESC NULLS LAST
"""


MAPPING_REDUNDANCY_QUERY = r"""
WITH base_mapping AS (
    SELECT base_sku,
           COUNT(DISTINCT sku_name)::bigint AS sku_names,
           COUNT(DISTINCT factory_sku)::bigint AS factory_skus,
           COUNT(DISTINCT price_group)::bigint AS price_groups,
           COUNT(DISTINCT pattern_set)::bigint AS pattern_sets
    FROM source.mart_sku_branch_month GROUP BY base_sku
), branch_mapping AS (
    SELECT branch,
           COUNT(DISTINCT branch_name)::bigint AS branch_names,
           COUNT(DISTINCT region)::bigint AS regions,
           COUNT(DISTINCT branch_status)::bigint AS statuses
    FROM source.mart_sku_branch_month GROUP BY branch
)
SELECT 'base_sku' AS entity,COUNT(*)::bigint AS entities,
       COUNT(*) FILTER (WHERE sku_names>1)::bigint AS multiple_names,
       COUNT(*) FILTER (WHERE factory_skus>1)::bigint AS multiple_factory_skus,
       COUNT(*) FILTER (WHERE price_groups>1)::bigint AS multiple_price_groups,
       COUNT(*) FILTER (WHERE pattern_sets>1)::bigint AS multiple_pattern_sets,
       NULL::bigint AS multiple_regions,NULL::bigint AS multiple_statuses
FROM base_mapping
UNION ALL
SELECT 'branch',COUNT(*)::bigint,
       COUNT(*) FILTER (WHERE branch_names>1)::bigint,
       NULL,NULL,NULL,
       COUNT(*) FILTER (WHERE regions>1)::bigint,
       COUNT(*) FILTER (WHERE statuses>1)::bigint
FROM branch_mapping
"""


PANEL_SAMPLE_QUERY = r"""
WITH monthly AS (
    SELECT base_sku,branch,month::date AS month,
           MAX(COALESCE(NULLIF(BTRIM(region),''),'UNKNOWN')) AS region,
           MAX(price_group) AS price_group,MAX(pattern_set) AS pattern_set,
           GREATEST(SUM(quantity),0)::double precision AS demand,
           SUM(line_count)::double precision AS line_count,
           SUM(CASE WHEN quantity>0 THEN GREATEST(total_amount,0) ELSE 0 END)::double precision AS revenue
    FROM source.mart_sku_branch_month
    GROUP BY base_sku,branch,month
)
SELECT target.base_sku,target.branch,origin.region,origin.price_group,origin.pattern_set,
       origin.month AS origin_month,target.month AS target_month,
       target.demand AS target_demand,
       origin.demand AS lag1,lag2.demand AS lag2,lag3.demand AS lag3,
       lag6.demand AS lag6,lag12.demand AS lag12,
       origin.line_count AS line_count_lag1,origin.revenue AS revenue_lag1,
       (lag2.demand IS NOT NULL) AS lag2_available,
       (lag3.demand IS NOT NULL) AS lag3_available,
       (lag6.demand IS NOT NULL) AS lag6_available,
       (lag12.demand IS NOT NULL) AS lag12_available
FROM monthly target
JOIN monthly origin ON origin.base_sku=target.base_sku AND origin.branch=target.branch
 AND origin.month=target.month-INTERVAL '1 month'
LEFT JOIN monthly lag2 ON lag2.base_sku=target.base_sku AND lag2.branch=target.branch
 AND lag2.month=target.month-INTERVAL '2 months'
LEFT JOIN monthly lag3 ON lag3.base_sku=target.base_sku AND lag3.branch=target.branch
 AND lag3.month=target.month-INTERVAL '3 months'
LEFT JOIN monthly lag6 ON lag6.base_sku=target.base_sku AND lag6.branch=target.branch
 AND lag6.month=target.month-INTERVAL '6 months'
LEFT JOIN monthly lag12 ON lag12.base_sku=target.base_sku AND lag12.branch=target.branch
 AND lag12.month=target.month-INTERVAL '12 months'
ORDER BY target.month DESC,target.base_sku,target.branch
LIMIT %s
"""


def feature_recommendations() -> list[dict[str, str]]:
    """Danh sách quyết định ban đầu; kết luận cuối phải qua rolling backtest."""
    rows = [
        ("base_sku", "categorical", "core", "ID sản phẩm cho global model"),
        ("branch", "categorical", "core", "ID chi nhánh cho global model"),
        ("normalized_region", "categorical", "core", "Cấp cha, cold-start và interaction mùa mưa"),
        ("pattern_set", "categorical", "core", "Chia sẻ tín hiệu cho SKU thưa/mới"),
        ("price_group", "categorical", "candidate", "Tín hiệu in-sample thấp; giữ nếu ablation cải thiện"),
        ("lag1", "numeric", "core", "Tín hiệu recency chính"),
        ("lag2", "numeric", "core", "Giữ kèm availability flag"),
        ("lag3", "numeric", "core", "Giữ kèm availability flag"),
        ("rolling3_observed", "numeric", "core", "Tín hiệu log-scale mạnh nhất trong audit"),
        ("lag6", "numeric", "candidate", "Coverage thấp; kiểm chứng bằng ablation"),
        ("lag12", "numeric", "candidate", "Coverage rất thấp; raw corr bị scale chi phối"),
        ("line_count_lag1", "numeric", "candidate", "Có tín hiệu nhưng tương quan với demand lag1"),
        ("revenue_lag1", "numeric", "candidate", "Khá trùng demand lag1; cân nhắc dùng avg_price thay thế"),
        ("target_month_sin_cos", "calendar", "core", "Biểu diễn chu kỳ, biết trước tại origin"),
        ("rain_target", "calendar", "candidate", "Tác động có thể phi tuyến theo region"),
        ("tet_gieng_co_hon_thanh_minh", "calendar", "candidate", "Giữ theo nhóm và kiểm tra ablation"),
        ("gg_trends_lag1", "external", "candidate", "Tín hiệu tổng thể yếu; chỉ giữ nếu backtest thắng"),
        ("gg_trends_target", "external", "leakage", "Không biết tại forecast origin"),
        ("adi_cv2_pattern", "series_metadata", "candidate", "Phải tính lại as-of-origin"),
        ("current_status", "business_status", "gating", "Suppress hiện tại; không gắn ngược vào lịch sử"),
        ("factory_sku", "categorical", "drop", "Ánh xạ 1-1 với base_sku trong dữ liệu hiện tại"),
        ("sku_name", "categorical", "drop", "Chỉ hiển thị; gần trùng base_sku"),
        ("branch_name", "categorical", "drop", "Ánh xạ 1-1 với branch"),
        ("bravo_sku", "categorical", "drop", "Sai grain target Base SKU"),
        ("unit", "categorical", "drop", "Chỉ có một giá trị"),
        ("thang", "calendar", "drop", "Trùng tuyệt đối với month"),
        ("vung", "categorical", "drop", "Giữ một normalized_region duy nhất"),
        ("feature_refreshed_at", "metadata", "drop", "Metadata pipeline, không phải demand signal"),
        ("calculated_at", "metadata", "drop", "Metadata pipeline, có nguy cơ leakage"),
    ]
    return [
        {"feature": feature, "feature_type": kind, "decision": decision, "reason": reason}
        for feature, kind, decision, reason in rows
    ]


def serialize(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, Path):
        return str(value)
    return value


def normalize_rows(rows: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{key: serialize(value) for key, value in row.items()} for row in rows]


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        path.write_text("", encoding="utf-8-sig")
        return
    with path.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


async def fetch_rows(conn: AsyncConnection, query: str, params: list[Any] | None = None) -> list[dict[str, Any]]:
    result = await conn.execute(query, params or [])
    return normalize_rows([dict(row) for row in await result.fetchall()])


async def run_audit(config: AuditConfig) -> dict[str, Any]:
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError("DATABASE_URL is required. Tạo backend/.env hoặc export biến môi trường.")

    config.output_dir.mkdir(parents=True, exist_ok=True)
    async with await AsyncConnection.connect(
        database_url,
        row_factory=dict_row,
        autocommit=True,
    ) as conn:
        datasets = {
            "schema_inventory": await fetch_rows(conn, SCHEMA_QUERY),
            "source_profile": await fetch_rows(conn, SOURCE_PROFILE_QUERY),
            "numeric_target_association": await fetch_rows(conn, NUMERIC_ASSOCIATION_QUERY),
            "numeric_redundancy": await fetch_rows(conn, NUMERIC_REDUNDANCY_QUERY),
            "categorical_target_association": await fetch_rows(conn, CATEGORICAL_ASSOCIATION_QUERY),
            "mapping_redundancy": await fetch_rows(conn, MAPPING_REDUNDANCY_QUERY),
            "feature_recommendations": feature_recommendations(),
            "modeling_panel_sample": await fetch_rows(
                conn,
                PANEL_SAMPLE_QUERY,
                [config.panel_limit],
            ) if config.panel_limit > 0 else [],
        }

    for name, rows in datasets.items():
        write_csv(config.output_dir / f"{name}.csv", rows)

    numeric = datasets["numeric_target_association"]
    summary = {
        "generated_at": datetime.now().astimezone().isoformat(),
        "output_dir": config.output_dir,
        "panel_sample_limit": config.panel_limit,
        "source_profile": datasets["source_profile"][0] if datasets["source_profile"] else {},
        "strongest_log_features": [
            {
                "feature": row["feature"],
                "pearson_log1p": row["pearson_log1p"],
                "coverage": row["coverage"],
                "availability": row["availability"],
            }
            for row in numeric[:8]
        ],
        "warnings": [
            "Correlation/covariance là mô tả đơn biến, không thay thế rolling backtest.",
            "Covariance phụ thuộc đơn vị nên không dùng xếp hạng feature khác thang đo.",
            "Categorical eta-squared là in-sample và thiên vị feature cardinality cao.",
            "Panel chỉ gồm target có origin tháng liền trước được quan sát; không tự zero-fill missing.",
            "Demand pattern/ADI/CV2 từ latest episode gây leakage khi backtest nếu không tính lại as-of-origin.",
        ],
    }
    with (config.output_dir / "audit_summary.json").open("w", encoding="utf-8") as file:
        json.dump(summary, file, ensure_ascii=False, indent=2, default=serialize, allow_nan=False)
    return summary


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audit feature forecast từ các bảng EDA")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Thư mục output (mặc định: {DEFAULT_OUTPUT_DIR})",
    )
    parser.add_argument(
        "--panel-limit",
        type=int,
        default=20_000,
        help="Số dòng modeling panel mẫu; dùng 0 để không xuất panel",
    )
    return parser.parse_args()


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    load_dotenv(Path(__file__).resolve().parent / ".env")
    args = parse_args()
    if args.panel_limit < 0:
        raise SystemExit("--panel-limit phải >= 0")
    summary = asyncio.run(
        run_audit(AuditConfig(output_dir=args.output_dir.resolve(), panel_limit=args.panel_limit))
    )
    print("Hoàn tất audit feature forecast.")
    print(f"Output: {summary['output_dir']}")
    for row in summary["strongest_log_features"][:5]:
        print(
            f"- {row['feature']}: corr_log1p={row['pearson_log1p']}, "
            f"coverage={row['coverage']}"
        )


if __name__ == "__main__":
    main()
