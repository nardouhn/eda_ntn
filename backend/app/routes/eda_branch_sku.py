from __future__ import annotations

from datetime import date
from statistics import fmean, stdev

from fastapi import APIRouter, HTTPException, Query

from app.db import get_pool
from app.demand_pattern import (
    ADI_THRESHOLD, CV2_THRESHOLD, INACTIVE_RECENT_MONTHS, MIN_HISTORY_MONTHS,
    MIN_POSITIVE_MONTHS, PATTERN_OPTIONS, RELAUNCH_GAP_MONTHS, THRESHOLD_UPDATED_AT,
)
from app.services.demand_pattern_episode import MART_TABLE


router = APIRouter(prefix="/eda/branch-sku", tags=["EDA SKU x Branch"])
SOURCE_TABLE = "source.mart_sku_branch_month"
REGION_SQL = "COALESCE(NULLIF(BTRIM(region), ''), 'Chưa xác định')"


def _add_months(value: date, offset: int) -> date:
    index = value.year * 12 + value.month - 1 + offset
    return date(index // 12, index % 12 + 1, 1)


def _parse_date(value: str | None, fallback: date) -> date:
    if not value:
        return fallback
    try:
        return date.fromisoformat(value[:10]).replace(day=1)
    except ValueError as exc:
        raise HTTPException(422, f"Invalid date: {value}") from exc


def _central_cte(region: str | None, branch: str | None) -> tuple[str, list[object]]:
    dimension_filters: list[str] = []
    params: list[object] = []
    if region:
        dimension_filters.append(f"AND {REGION_SQL} = %s")
        params.append(region)
    if branch:
        dimension_filters.append("AND branch = %s")
        params.append(branch)
    filters = "\n".join(dimension_filters)
    return f"""
        WITH bounds AS (SELECT %s::date AS date_from, %s::date AS date_to),
        dimensions AS (
            SELECT base_sku, branch, MAX({REGION_SQL}) AS region,
                   MAX(branch_name) AS branch_name, MAX(sku_name) AS sku_name
            FROM {SOURCE_TABLE}
            WHERE base_sku IS NOT NULL AND branch IS NOT NULL {filters}
            GROUP BY base_sku, branch
        ), monthly AS (
            SELECT source.base_sku, source.branch, source.month,
                   GREATEST(SUM(source.quantity), 0)::double precision AS quantity,
                   SUM(source.quantity)::double precision AS net_quantity,
                   SUM(CASE WHEN source.quantity > 0 THEN GREATEST(source.total_amount, 0) ELSE 0 END)::double precision AS revenue
            FROM {SOURCE_TABLE} source CROSS JOIN bounds
            WHERE source.month BETWEEN bounds.date_from AND bounds.date_to
            GROUP BY source.base_sku, source.branch, source.month
        ), facts AS (
            SELECT monthly.base_sku, monthly.branch,
                   COALESCE(SUM(quantity), 0)::double precision AS gross_quantity,
                   COALESCE(SUM(revenue), 0)::double precision AS revenue,
                   BOOL_OR(net_quantity < 0) AS has_negative_net_month,
                   AVG(quantity) FILTER (WHERE quantity > 0)::double precision AS mean_positive,
                   STDDEV_SAMP(quantity) FILTER (WHERE quantity > 0)::double precision AS std_positive,
                   MAX(quantity) AS max_positive_demand,
                   MAX(quantity) FILTER (WHERE month = bounds.date_to) AS latest_quantity,
                   MAX(quantity) FILTER (WHERE month = bounds.date_to - INTERVAL '1 month') AS previous_quantity,
                   MAX(quantity) FILTER (WHERE month = bounds.date_to - INTERVAL '12 months') AS previous_year_quantity
            FROM monthly CROSS JOIN bounds GROUP BY monthly.base_sku, monthly.branch
        ), episode_history AS (
            SELECT episode.*,
                   LAG(demand_pattern) OVER (PARTITION BY base_sku, branch ORDER BY episode_id) AS previous_demand_pattern
            FROM {MART_TABLE} episode
        ), latest AS (SELECT * FROM episode_history WHERE is_latest_episode),
        combined AS (
            SELECT dimensions.region, dimensions.branch, dimensions.branch_name,
                   dimensions.base_sku, dimensions.sku_name,
                   COALESCE(facts.gross_quantity, 0)::double precision AS gross_quantity,
                   COALESCE(facts.revenue, 0)::double precision AS revenue,
                   CASE WHEN facts.previous_quantity > 0 THEN COALESCE(facts.latest_quantity, 0) / facts.previous_quantity - 1 END AS growth,
                   CASE WHEN facts.previous_year_quantity > 0 THEN COALESCE(facts.latest_quantity, 0) / facts.previous_year_quantity - 1 END AS yoy_growth,
                   latest.adi, latest.cv2, CASE WHEN latest.cv2 IS NULL THEN NULL ELSE SQRT(latest.cv2) END AS cv,
                   latest.demand_pattern, latest.status, latest.status = 'Hoạt động' AS is_active,
                   latest.episode_id, latest.episode_start_month, latest.episode_end_month,
                   latest.history_months, latest.positive_months, latest.last_positive_month,
                   CASE WHEN latest.last_positive_month IS NULL THEN NULL ELSE
                       ((EXTRACT(YEAR FROM latest.source_end_month) - EXTRACT(YEAR FROM latest.last_positive_month)) * 12
                        + EXTRACT(MONTH FROM latest.source_end_month) - EXTRACT(MONTH FROM latest.last_positive_month))::integer END AS months_since_last_positive,
                   latest.negative_net_months > 0 AS has_negative_net_month,
                   facts.mean_positive, facts.std_positive, facts.max_positive_demand,
                   latest.previous_demand_pattern,
                   latest.previous_demand_pattern IS NOT NULL AND latest.previous_demand_pattern <> latest.demand_pattern AS pattern_changed,
                   latest.series_weight, latest.is_excluded
            FROM dimensions JOIN latest USING (base_sku, branch)
            LEFT JOIN facts USING (base_sku, branch)
        ), scored AS (
            SELECT combined.*, SUM(gross_quantity) OVER (PARTITION BY branch) AS branch_quantity,
                   COALESCE(SUM(gross_quantity) OVER (
                       PARTITION BY branch ORDER BY gross_quantity DESC, base_sku
                       ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS quantity_before
            FROM combined
        ), classified AS (
            SELECT scored.*,
                   CASE WHEN branch_quantity <= 0 THEN 'C'
                        WHEN quantity_before / branch_quantity < .80 THEN 'A'
                        WHEN quantity_before / branch_quantity < .95 THEN 'B' ELSE 'C' END AS abc_class
            FROM scored
        )
    """, [*params]


def _post_filter(sku: str | None, pattern: str | None, abc: str | None, status: str) -> tuple[str, list[object]]:
    clauses: list[str] = []
    params: list[object] = []
    if sku:
        clauses.append("(base_sku ILIKE %s OR COALESCE(sku_name, '') ILIKE %s)")
        params.extend([f"%{sku.strip()}%"] * 2)
    if pattern:
        clauses.append("demand_pattern = %s"); params.append(pattern)
    if abc:
        clauses.append("abc_class = %s"); params.append(abc)
    if status == "active": clauses.append("is_active")
    if status == "inactive": clauses.append("NOT is_active")
    return ("WHERE " + " AND ".join(clauses) if clauses else ""), params


def _warnings(row: dict) -> list[str]:
    result: list[str] = []
    if row.get("demand_pattern") == "Lumpy": result.append("Demand Lumpy — cần review thủ công")
    if row.get("demand_pattern") == "Insufficient-New": result.append("Chưa đủ lịch sử demand")
    if row.get("demand_pattern") == "Excluded-Inactive": result.append("Inactive quá lâu — loại khỏi phân loại")
    if row.get("status") == "Vô hiệu hóa": result.append("SKU hoặc chi nhánh đã vô hiệu hóa")
    if row.get("has_negative_net_month"): result.append("Có tháng net quantity âm")
    if row.get("demand_spike"): result.append("Demand spike bất thường")
    if row.get("pattern_changed"): result.append("Pattern changed so với episode trước")
    return result


@router.get("/overview")
async def get_branch_sku_overview(
    region: str | None = None, branch: str | None = None, brand: str | None = None,
    sku: str | None = None, date_from: str | None = None, date_to: str | None = None,
    demand_pattern: str | None = None, abc_class: str | None = None, status: str = "all",
    metric: str = Query("quantity", pattern="^(quantity|revenue|growth)$"),
    page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200),
) -> dict:
    if brand: raise HTTPException(422, "source mart does not contain a brand column")
    async with get_pool().connection() as conn:
        bounds = await (await conn.execute(f"SELECT MIN(month) min_month, MAX(month) max_month FROM {SOURCE_TABLE}")).fetchone()
        if not bounds or not bounds["max_month"]: raise HTTPException(503, "No source data")
        source_min, source_max = bounds["min_month"], bounds["max_month"]
        effective_to = min(_parse_date(date_to, source_max), source_max)
        effective_from = max(_parse_date(date_from, _add_months(effective_to, -11)), source_min)
        if effective_from > effective_to: raise HTTPException(422, "date_from must be before date_to")
        options = await (await conn.execute(f"""SELECT DISTINCT {REGION_SQL} region, branch branch_code,
            MAX(branch_name) OVER (PARTITION BY branch) branch_name FROM {SOURCE_TABLE} ORDER BY region, branch_code""")).fetchall()
        view_exists = await (await conn.execute(
            "SELECT to_regclass(%s) AS relation_name", [MART_TABLE]
        )).fetchone()
        if not view_exists or view_exists["relation_name"] is None:
            return {
                "data_as_of_month": source_max,
                "pattern_source": "unavailable",
                "pattern_source_available": False,
                "filters": {"region": region or "", "branch": branch or "", "brand": "", "sku": sku or "", "date_from": effective_from, "date_to": effective_to, "demand_pattern": demand_pattern or "", "abc_class": abc_class or "", "status": status},
                "options": {"regions": sorted({row["region"] for row in options}), "branches": [dict(row) for row in options], "brands": [], "brand_supported": False, "demand_patterns": list(PATTERN_OPTIONS), "abc_classes": ["A", "B", "C"]},
                "thresholds": {"adi": ADI_THRESHOLD, "cv2": CV2_THRESHOLD, "min_history_months": MIN_HISTORY_MONTHS, "min_positive_months": MIN_POSITIVE_MONTHS, "inactive_recent_months": INACTIVE_RECENT_MONTHS, "relaunch_gap_months": RELAUNCH_GAP_MONTHS, "updated_at": THRESHOLD_UPDATED_AT},
                "methodology": "Demand Pattern tạm thời để trống vì nguồn episode dùng chung chưa được cấu hình.",
                "warning_definitions": {},
                "kpis": {"pair_count": 0, "gross_quantity": 0.0, "revenue": 0.0, "lumpy_count": 0, "insufficient_new_count": 0, "excluded_inactive_count": 0},
                "heatmap": {"metric": metric, "branches": [], "skus": [], "cells": []},
                "page": page, "page_size": page_size, "total": 0, "items": [], "exceptions": [],
            }
        view_state = await (await conn.execute(
            f"SELECT MAX(source_end_month) data_as_of, COUNT(*) row_count FROM {MART_TABLE}"
        )).fetchone()
        if not view_state or not view_state["row_count"]:
            raise HTTPException(503, "Demand Pattern episode view is empty")
        cte, scope_params = _central_cte(region, branch)
        post, post_params = _post_filter(sku, demand_pattern, abc_class, status)
        common = [effective_from, effective_to, *scope_params]
        fields = """region, branch AS branch_code, branch_name, base_sku, sku_name, gross_quantity,
            revenue, growth, yoy_growth, adi, cv, cv2, demand_pattern, abc_class, status,
            history_months, positive_months, last_positive_month, months_since_last_positive,
            has_negative_net_month, episode_id, episode_start_month, episode_end_month,
            previous_demand_pattern, pattern_changed,
            CASE WHEN std_positive > 0 AND max_positive_demand > mean_positive + 3 * std_positive THEN TRUE ELSE FALSE END demand_spike"""
        rows = await (await conn.execute(f"""{cte} SELECT {fields}, COUNT(*) OVER() filtered_total
            FROM classified {post} ORDER BY gross_quantity DESC, base_sku, branch LIMIT %s OFFSET %s""",
            [*common, *post_params, page_size, (page - 1) * page_size])).fetchall()
        summary = await (await conn.execute(f"""{cte} SELECT COUNT(*) pair_count,
            COALESCE(SUM(gross_quantity),0)::double precision gross_quantity,
            COALESCE(SUM(revenue),0)::double precision revenue,
            COUNT(*) FILTER(WHERE demand_pattern='Lumpy') lumpy_count,
            COUNT(*) FILTER(WHERE demand_pattern='Insufficient-New') insufficient_new_count,
            COUNT(*) FILTER(WHERE demand_pattern='Excluded-Inactive') excluded_inactive_count
            FROM classified {post}""", [*common, *post_params])).fetchone()
        metric_col = {"quantity":"gross_quantity", "revenue":"revenue", "growth":"growth"}[metric]
        heatmap = await (await conn.execute(f"""{cte}, filtered AS (SELECT * FROM classified {post}),
            top_branches AS (SELECT branch FROM filtered GROUP BY branch ORDER BY SUM(gross_quantity) DESC LIMIT 10),
            top_skus AS (SELECT base_sku FROM filtered GROUP BY base_sku ORDER BY SUM(gross_quantity) DESC LIMIT 20)
            SELECT base_sku, MAX(sku_name) sku_name, branch branch_code, MAX(branch_name) branch_name,
                   MAX({metric_col})::double precision value FROM filtered
            JOIN top_branches USING(branch) JOIN top_skus USING(base_sku)
            GROUP BY base_sku, branch ORDER BY base_sku, branch""", [*common, *post_params])).fetchall()
        exception_rows = await (await conn.execute(f"""{cte}, filtered AS (SELECT * FROM classified {post})
            SELECT {fields} FROM filtered WHERE demand_pattern IN ('Lumpy','Insufficient-New','Excluded-Inactive')
                OR NOT is_active OR has_negative_net_month ORDER BY gross_quantity DESC LIMIT 20""",
            [*common, *post_params])).fetchall()
        pairs = [(row["base_sku"], row["branch_code"]) for row in rows]
        trend_rows = []
        if pairs:
            pair_skus = [base_sku for base_sku, _ in pairs]
            pair_branches = [branch_code for _, branch_code in pairs]
            trend_rows = await (await conn.execute(f"""SELECT source.base_sku, source.branch, source.month,
                GREATEST(SUM(source.quantity),0)::double precision value,
                SUM(source.quantity) < 0 net_negative
                FROM {SOURCE_TABLE} source
                JOIN unnest(%s::text[], %s::text[]) AS selected(base_sku, branch)
                  ON selected.base_sku = source.base_sku AND selected.branch = source.branch
                WHERE source.month BETWEEN %s AND %s
                GROUP BY source.base_sku,source.branch,source.month ORDER BY source.month""",
                [pair_skus, pair_branches, max(source_min, _add_months(effective_to,-11)), effective_to])).fetchall()
    trend_map: dict[tuple[str,str], list[dict]] = {pair: [] for pair in pairs}
    for point in trend_rows: trend_map[(point["base_sku"],point["branch"])].append({"month":point["month"],"value":point["value"],"net_negative":point["net_negative"]})
    items=[]
    for source in rows:
        row=dict(source); row.pop("filtered_total",None); row["trend"]=trend_map.get((row["base_sku"],row["branch_code"]),[]); row["warnings"]=_warnings(row); items.append(row)
    exceptions=[]
    for source in exception_rows: row=dict(source); row["warnings"]=_warnings(row); exceptions.append(row)
    heat=[dict(row) for row in heatmap]
    return {
        "data_as_of_month": view_state["data_as_of"], "pattern_source":"analytics.mart_demand_pattern_episode",
        "filters":{"region":region or "","branch":branch or "","brand":"","sku":sku or "","date_from":effective_from,"date_to":effective_to,"demand_pattern":demand_pattern or "","abc_class":abc_class or "","status":status},
        "options":{"regions":sorted({row["region"] for row in options}),"branches":[dict(row) for row in options],"brands":[],"brand_supported":False,"demand_patterns":list(PATTERN_OPTIONS),"abc_classes":["A","B","C"]},
        "thresholds":{"adi":ADI_THRESHOLD,"cv2":CV2_THRESHOLD,"min_history_months":MIN_HISTORY_MONTHS,"min_positive_months":MIN_POSITIVE_MONTHS,"inactive_recent_months":INACTIVE_RECENT_MONTHS,"relaunch_gap_months":RELAUNCH_GAP_MONTHS,"updated_at":THRESHOLD_UPDATED_AT},
        "methodology":"Bảng chính dùng episode mới nhất từ SQL view dùng chung; drill-down hiển thị toàn bộ episode.",
        "warning_definitions":{"Demand Lumpy — cần review thủ công":"ADI và CV² đều cao.","Chưa đủ lịch sử demand":"Episode chưa đủ lịch sử.","Inactive quá lâu — loại khỏi phân loại":"Inactive vượt cửa sổ 12 tháng.","Có tháng net quantity âm":"Return lớn hơn sales trong tháng.","Pattern changed so với episode trước":"Pattern episode mới nhất khác episode trước."},
        "kpis":dict(summary or {}), "heatmap":{"metric":metric,"branches":[{"branch_code":x["branch_code"],"branch_name":x["branch_name"]} for x in heat],"skus":[{"base_sku":x["base_sku"],"sku_name":x["sku_name"]} for x in heat],"cells":heat},
        "page":page,"page_size":page_size,"total":int(rows[0]["filtered_total"]) if rows else 0,"items":items,"exceptions":exceptions,
    }


@router.get("/detail")
async def get_branch_sku_detail(base_sku: str, branch: str) -> dict:
    async with get_pool().connection() as conn:
        episodes = await (await conn.execute(f"""SELECT episode_id,
            episode_start_month start_month, episode_end_month end_month, last_positive_month,
            history_months, positive_months, adi, cv2, demand_pattern, is_latest_episode is_current,
            NOT is_excluded used_for_current_pattern, status
            FROM {MART_TABLE} WHERE base_sku=%s AND branch=%s ORDER BY episode_id""", [base_sku,branch])).fetchall()
        if not episodes: raise HTTPException(404,"SKU x branch not found in Demand Pattern episode view")
        history_rows = await (await conn.execute(f"""SELECT month, SUM(quantity)::double precision net_quantity,
            SUM(CASE WHEN quantity>0 THEN GREATEST(total_amount,0) ELSE 0 END)::double precision revenue
            FROM {SOURCE_TABLE} WHERE base_sku=%s AND branch=%s GROUP BY month ORDER BY month""",[base_sku,branch])).fetchall()
    episode_list=[dict(row) for row in episodes]
    history=[]
    for source in history_rows:
        point=dict(source); episode=next((row for row in episode_list if row["start_month"]<=point["month"]<=row["end_month"]),None)
        history.append({"month":point["month"],"quantity":max(float(point["net_quantity"] or 0),0),"net_quantity":float(point["net_quantity"] or 0),"revenue":float(point["revenue"] or 0),"status":episode["status"] if episode else episode_list[-1]["status"],"episode_id":episode["episode_id"] if episode else None,"net_negative":float(point["net_quantity"] or 0)<0})
    current=episode_list[-1]; previous=episode_list[-2] if len(episode_list)>1 else None
    values=[point["quantity"] for point in history if point["episode_id"]==current["episode_id"] and point["quantity"]>0]
    warnings=[]
    if any(point["net_negative"] for point in history): warnings.append("Có tháng net quantity âm")
    if len(values)>=3 and stdev(values)>0 and max(values)>fmean(values)+3*stdev(values): warnings.append("Demand spike bất thường")
    if previous and previous["demand_pattern"]!=current["demand_pattern"]: warnings.append("Pattern changed so với episode trước")
    return {"base_sku":base_sku,"branch_code":branch,"status":current["status"],"episodes":episode_list,"history":history,"warnings":warnings,"previous_demand_pattern":previous["demand_pattern"] if previous else None,"pattern_changed":bool(previous and previous["demand_pattern"]!=current["demand_pattern"]),"thresholds":{"adi":ADI_THRESHOLD,"cv2":CV2_THRESHOLD,"relaunch_gap_months":RELAUNCH_GAP_MONTHS}}
