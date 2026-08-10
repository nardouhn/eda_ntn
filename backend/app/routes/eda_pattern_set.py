from __future__ import annotations

from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.db import get_pool
from app.demand_pattern import ADI_THRESHOLD, CV2_THRESHOLD, MIN_HISTORY_MONTHS, MIN_POSITIVE_MONTHS
from app.services.demand_pattern_episode import MART_TABLE


router = APIRouter(prefix="/eda/pattern-set", tags=["EDA Pattern Set"])
SOURCE_TABLE = "source.mart_sku_branch_month"
REGION_SQL = "COALESCE(NULLIF(BTRIM(region), ''), 'Chưa xác định')"
ACTIVE_SQL = "(LOWER(BTRIM(COALESCE(sku_status,'')))='hoạt động' AND LOWER(BTRIM(COALESCE(branch_status,'')))='hoạt động')"
LIFECYCLE_NEW_MONTHS = 6
LIFECYCLE_RATE = .15
INACTIVE_ALERT_DELTA = .15


def _add_months(value: date, offset: int) -> date:
    index=value.year*12+value.month-1+offset
    return date(index//12,index%12+1,1)


def _month_series(start: date, end: date) -> list[date]:
    values=[]; current=start
    while current<=end: values.append(current); current=_add_months(current,1)
    return values


def _parse_month(value: str | None, fallback: date) -> date:
    if not value: return fallback
    try: return date.fromisoformat(value[:10]).replace(day=1)
    except ValueError as exc: raise HTTPException(422,f"Invalid month: {value}") from exc


def _dimension_filter(region, branch, size_code, factory_sku, search) -> tuple[str,list[object]]:
    clauses=["NULLIF(BTRIM(pattern_set),'') IS NOT NULL"]; params=[]
    if region: clauses.append(f"{REGION_SQL}=%s"); params.append(region)
    if branch: clauses.append("branch=%s"); params.append(branch)
    if size_code: clauses.append("price_group=%s"); params.append(size_code)
    if factory_sku: clauses.append("factory_sku ILIKE %s"); params.append(f"%{factory_sku.strip()}%")
    if search:
        clauses.append("(pattern_set ILIKE %s OR COALESCE(sku_name,'') ILIKE %s)"); term=f"%{search.strip()}%"; params.extend([term,term])
    return " AND ".join(clauses),params


def _post_filter(pattern, abc, lifecycle) -> tuple[str,list[object]]:
    clauses=[]; params=[]
    if pattern: clauses.append("demand_pattern=%s"); params.append(pattern)
    if abc: clauses.append("abc_class=%s"); params.append(abc)
    if lifecycle: clauses.append("lifecycle=%s"); params.append(lifecycle)
    return ("WHERE "+" AND ".join(clauses) if clauses else ""),params


def _rollup_cte(dimension_where: str) -> str:
    """Roll-up latest branch episode; tuyệt đối không tính lại ADI/CV²."""
    return f"""
        WITH bounds AS (SELECT %s::date date_from,%s::date date_to,%s::date previous_from,%s::date previous_to),
        scoped AS (
            SELECT BTRIM(pattern_set) pattern_set,base_sku,bravo_sku,factory_sku,price_group size_code,
                   branch,branch_name,{REGION_SQL} region,month,quantity::double precision quantity,
                   CASE WHEN quantity>0 THEN GREATEST(total_amount,0) ELSE 0 END::double precision revenue,
                   GREATEST(line_count,0)::bigint line_count,{ACTIVE_SQL} item_active,sku_name
            FROM {SOURCE_TABLE} WHERE {dimension_where}
        ), pair_mapping AS (
            SELECT pattern_set,base_sku,branch,MAX(sku_name) sku_name,MAX(size_code) size_code
            FROM scoped GROUP BY pattern_set,base_sku,branch
        ), pair_facts AS (
            SELECT pattern_set,base_sku,branch,
                   GREATEST(SUM(quantity) FILTER(WHERE month BETWEEN bounds.date_from AND bounds.date_to),0)::double precision gross_quantity,
                   COALESCE(SUM(revenue) FILTER(WHERE month BETWEEN bounds.date_from AND bounds.date_to),0)::double precision revenue,
                   COALESCE(SUM(line_count) FILTER(WHERE month BETWEEN bounds.date_from AND bounds.date_to),0)::bigint line_count
            FROM scoped CROSS JOIN bounds GROUP BY pattern_set,base_sku,branch
        ), pair_rollup AS (
            SELECT mapping.*,facts.gross_quantity,facts.revenue,facts.line_count,episode.adi,episode.cv2,
                   episode.history_months,episode.positive_months,episode.demand_pattern,
                   episode.series_weight,episode.is_excluded,episode.status
            FROM pair_mapping mapping JOIN pair_facts facts USING(pattern_set,base_sku,branch)
            JOIN {MART_TABLE} episode USING(base_sku,branch)
            WHERE episode.is_latest_episode
        ), pattern_weights AS (
            SELECT pattern_set,
                   SUM(series_weight) FILTER(WHERE NOT is_excluded AND demand_pattern IN('Smooth','Erratic','Intermittent','Lumpy')) eligible_weight,
                   SUM(series_weight) FILTER(WHERE NOT is_excluded AND demand_pattern='Smooth') smooth_weight,
                   SUM(series_weight) FILTER(WHERE NOT is_excluded AND demand_pattern='Erratic') erratic_weight,
                   SUM(series_weight) FILTER(WHERE NOT is_excluded AND demand_pattern='Intermittent') intermittent_weight,
                   SUM(series_weight) FILTER(WHERE NOT is_excluded AND demand_pattern='Lumpy') lumpy_weight,
                   SUM(adi*series_weight) FILTER(WHERE NOT is_excluded AND adi IS NOT NULL)/NULLIF(SUM(series_weight) FILTER(WHERE NOT is_excluded AND adi IS NOT NULL),0) avg_adi,
                   SUM(cv2*series_weight) FILTER(WHERE NOT is_excluded AND cv2 IS NOT NULL)/NULLIF(SUM(series_weight) FILTER(WHERE NOT is_excluded AND cv2 IS NOT NULL),0) avg_cv2,
                   ROUND(SUM(history_months*series_weight) FILTER(WHERE NOT is_excluded)/NULLIF(SUM(series_weight) FILTER(WHERE NOT is_excluded),0))::integer history_months,
                   ROUND(SUM(positive_months*series_weight) FILTER(WHERE NOT is_excluded)/NULLIF(SUM(series_weight) FILTER(WHERE NOT is_excluded),0))::integer positive_months
            FROM pair_rollup GROUP BY pattern_set
        ), pattern_meta AS (
            SELECT pattern_set,MAX(sku_name) sku_name,MAX(size_code) size_code,
                   COUNT(DISTINCT base_sku)::integer base_sku_count,COUNT(DISTINCT bravo_sku)::integer variant_count,
                   COUNT(DISTINCT bravo_sku) FILTER(WHERE item_active)::integer active_variant_count,
                   COUNT(DISTINCT bravo_sku) FILTER(WHERE NOT item_active)::integer inactive_variant_count,
                   BOOL_OR(item_active) is_active,MIN(month) first_observed_month,
                   MAX(month) FILTER(WHERE quantity>0) last_positive_sale_month,
                   COUNT(DISTINCT branch) FILTER(WHERE quantity>0)::integer selling_branch_count
            FROM scoped GROUP BY pattern_set
        ), monthly AS (
            SELECT pattern_set,month,GREATEST(SUM(quantity),0)::double precision quantity,
                   SUM(revenue)::double precision revenue,SUM(line_count)::bigint line_count
            FROM scoped GROUP BY pattern_set,month
        ), period AS (
            SELECT monthly.pattern_set,
                   COALESCE(SUM(quantity) FILTER(WHERE month BETWEEN bounds.date_from AND bounds.date_to),0)::double precision gross_quantity,
                   COALESCE(SUM(revenue) FILTER(WHERE month BETWEEN bounds.date_from AND bounds.date_to),0)::double precision revenue,
                   COALESCE(SUM(line_count) FILTER(WHERE month BETWEEN bounds.date_from AND bounds.date_to),0)::bigint line_count,
                   SUM(quantity) FILTER(WHERE month BETWEEN bounds.date_to-INTERVAL '2 months' AND bounds.date_to)/3 recent_3m,
                   SUM(quantity) FILTER(WHERE month BETWEEN bounds.date_to-INTERVAL '5 months' AND bounds.date_to-INTERVAL '3 months')/3 prior_3m,
                   MAX(quantity) FILTER(WHERE month=bounds.date_to) latest_quantity,
                   MAX(quantity) FILTER(WHERE month=bounds.date_to-INTERVAL '1 month') previous_quantity
            FROM monthly CROSS JOIN bounds GROUP BY monthly.pattern_set
        ), calculated AS (
            SELECT meta.*,period.gross_quantity,period.revenue,period.line_count,
                   weights.history_months,weights.positive_months,weights.avg_adi adi,
                   CASE WHEN weights.avg_cv2 IS NULL THEN NULL ELSE SQRT(weights.avg_cv2) END cv,
                   weights.avg_cv2 cv2,
                   COALESCE(weights.smooth_weight,0)/NULLIF(weights.eligible_weight,0) smooth_share,
                   COALESCE(weights.erratic_weight,0)/NULLIF(weights.eligible_weight,0) erratic_share,
                   COALESCE(weights.intermittent_weight,0)/NULLIF(weights.eligible_weight,0) intermittent_share,
                   COALESCE(weights.lumpy_weight,0)/NULLIF(weights.eligible_weight,0) lumpy_share,
                   CASE GREATEST(COALESCE(weights.smooth_weight,0),COALESCE(weights.erratic_weight,0),COALESCE(weights.intermittent_weight,0),COALESCE(weights.lumpy_weight,0))
                     WHEN COALESCE(weights.smooth_weight,0) THEN 'Smooth' WHEN COALESCE(weights.erratic_weight,0) THEN 'Erratic'
                     WHEN COALESCE(weights.intermittent_weight,0) THEN 'Intermittent' ELSE 'Lumpy' END demand_pattern,
                   1-GREATEST(COALESCE(weights.smooth_weight,0),COALESCE(weights.erratic_weight,0),COALESCE(weights.intermittent_weight,0),COALESCE(weights.lumpy_weight,0))/NULLIF(weights.eligible_weight,0) pattern_dispersion,
                   CASE WHEN period.previous_quantity>0 THEN COALESCE(period.latest_quantity,0)/period.previous_quantity-1 END growth,
                   CASE WHEN meta.first_observed_month>=bounds.date_to-INTERVAL '5 months' THEN 'Mới ra mắt'
                     WHEN COALESCE(period.prior_3m,0)=0 AND COALESCE(period.recent_3m,0)>0 THEN 'Đang tăng trưởng'
                     WHEN period.prior_3m>0 AND period.recent_3m/period.prior_3m-1>={LIFECYCLE_RATE} THEN 'Đang tăng trưởng'
                     WHEN period.prior_3m>0 AND period.recent_3m/period.prior_3m-1<=-{LIFECYCLE_RATE} THEN 'Đang suy giảm' ELSE 'Trưởng thành' END lifecycle,
                   CASE WHEN meta.is_active THEN 'Hoạt động' ELSE 'Vô hiệu hóa' END status,
                   meta.inactive_variant_count::double precision/NULLIF(meta.variant_count,0) inactive_variant_rate,
                   NULL::double precision previous_inactive_variant_rate,NULL::double precision inactive_rate_change,
                   CASE WHEN period.line_count>0 THEN period.gross_quantity/period.line_count END quantity_per_line,
                   CASE WHEN period.line_count>0 THEN period.revenue/period.line_count END revenue_per_line,
                   bounds.date_from,bounds.date_to,bounds.previous_from,bounds.previous_to
            FROM pattern_meta meta JOIN period USING(pattern_set) JOIN pattern_weights weights USING(pattern_set) CROSS JOIN bounds
        ), scored AS (
            SELECT calculated.*,SUM(gross_quantity) OVER() total_quantity,
                   COALESCE(SUM(gross_quantity) OVER(ORDER BY gross_quantity DESC,pattern_set ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING),0) quantity_before
            FROM calculated
        ), classified AS (
            SELECT scored.*,CASE WHEN total_quantity<=0 THEN 'C' WHEN quantity_before/total_quantity<.80 THEN 'A'
                   WHEN quantity_before/total_quantity<.95 THEN 'B' ELSE 'C' END abc_class,
                   CASE WHEN total_quantity>0 THEN gross_quantity/total_quantity END contribution_pct,
                   CASE WHEN total_quantity>0 THEN (quantity_before+gross_quantity)/total_quantity END cumulative_pct
            FROM scored
        )
    """


@router.get("/overview")
async def overview(region: str|None=None,branch: str|None=None,size_code: str|None=None,factory_sku: str|None=None,
    search: str|None=None,date_from: str|None=None,date_to: str|None=None,demand_pattern: str|None=None,
    abc_class: str|None=None,lifecycle: str|None=None,page:int=Query(1,ge=1),page_size:int=Query(50,ge=1,le=200))->dict:
    async with get_pool().connection() as conn:
        bounds=await(await conn.execute(f"SELECT MIN(month) min_month,MAX(month) max_month FROM {SOURCE_TABLE}")).fetchone()
        if not bounds or not bounds["max_month"]: raise HTTPException(503,"No source data")
        source_min,source_max=bounds["min_month"],bounds["max_month"]
        end=min(_parse_month(date_to,source_max),source_max); start=max(_parse_month(date_from,_add_months(end,-11)),source_min)
        if start>end: raise HTTPException(422,"date_from must be before date_to")
        months=(end.year-start.year)*12+end.month-start.month+1; previous_to=_add_months(start,-1); previous_from=_add_months(previous_to,-months+1)
        options=await(await conn.execute(f"""SELECT DISTINCT {REGION_SQL} region,branch branch_code,
          MAX(branch_name) OVER(PARTITION BY branch) branch_name,price_group size_code FROM {SOURCE_TABLE}
          WHERE NULLIF(BTRIM(pattern_set),'') IS NOT NULL ORDER BY region,branch_code,size_code""")).fetchall()
        where,where_params=_dimension_filter(region,branch,size_code,factory_sku,search); post,post_params=_post_filter(demand_pattern,abc_class,lifecycle)
        cte=_rollup_cte(where); common=[start,end,previous_from,previous_to,*where_params]
        fields="""pattern_set,sku_name,size_code,base_sku_count,variant_count,active_variant_count,inactive_variant_count,
          inactive_variant_rate,previous_inactive_variant_rate,inactive_rate_change,status,first_observed_month,last_positive_sale_month,
          selling_branch_count,gross_quantity,revenue,line_count,quantity_per_line,revenue_per_line,growth,lifecycle,history_months,
          positive_months,adi,cv,cv2,demand_pattern,abc_class,contribution_pct,cumulative_pct,smooth_share,erratic_share,
          intermittent_share,lumpy_share,pattern_dispersion"""
        rows=await(await conn.execute(f"{cte} SELECT {fields},COUNT(*) OVER() filtered_total FROM classified {post} ORDER BY gross_quantity DESC,pattern_set LIMIT %s OFFSET %s",[*common,*post_params,page_size,(page-1)*page_size])).fetchall()
        summary=await(await conn.execute(f"""{cte} SELECT COUNT(*) pattern_count,COALESCE(SUM(gross_quantity),0)::double precision gross_quantity,
          COALESCE(SUM(revenue),0)::double precision revenue,COUNT(*) FILTER(WHERE is_active) active_count,COUNT(*) FILTER(WHERE NOT is_active) inactive_count,
          COUNT(*) FILTER(WHERE first_observed_month BETWEEN date_from AND date_to) new_count,
          COUNT(*) FILTER(WHERE first_observed_month BETWEEN previous_from AND previous_to) previous_new_count,
          COUNT(*) FILTER(WHERE pattern_dispersion>=.4) pattern_dispersion_alert_count,
          0 inactive_alert_count,COALESCE(SUM(variant_count),0)::integer variant_count,COALESCE(SUM(inactive_variant_count),0)::integer inactive_variant_count
          FROM classified {post}""",[*common,*post_params])).fetchone()
        ranking_rows=await(await conn.execute(f"{cte} SELECT pattern_set,sku_name,gross_quantity,revenue,growth,abc_class,contribution_pct,cumulative_pct,inactive_variant_rate,previous_inactive_variant_rate,inactive_rate_change FROM classified {post} ORDER BY gross_quantity DESC,pattern_set",[*common,*post_params])).fetchall()
        period_filter=f"month BETWEEN %s AND %s AND {where}"; period_params=[start,end,*where_params]
        size_rows=await(await conn.execute(f"""SELECT price_group size_code,GREATEST(SUM(quantity),0)::double precision gross_quantity,
          SUM(CASE WHEN quantity>0 THEN GREATEST(total_amount,0) ELSE 0 END)::double precision revenue,
          GREATEST(SUM(quantity) FILTER(WHERE month=%s),0)::double precision latest_quantity,GREATEST(SUM(quantity) FILTER(WHERE month=%s),0)::double precision previous_quantity
          FROM {SOURCE_TABLE} WHERE {period_filter} GROUP BY price_group ORDER BY gross_quantity DESC""",[end,_add_months(end,-1),*period_params])).fetchall()
        matrix_rows=await(await conn.execute(f"""SELECT price_group size_code,{REGION_SQL} region,GREATEST(SUM(quantity),0)::double precision gross_quantity,
          SUM(CASE WHEN quantity>0 THEN GREATEST(total_amount,0) ELSE 0 END)::double precision revenue,
          GREATEST(SUM(quantity) FILTER(WHERE month=%s),0)::double precision latest_quantity,GREATEST(SUM(quantity) FILTER(WHERE month=%s),0)::double precision previous_quantity
          FROM {SOURCE_TABLE} WHERE {period_filter} GROUP BY price_group,{REGION_SQL} ORDER BY price_group,gross_quantity DESC""",[end,_add_months(end,-1),*period_params])).fetchall()
        pattern_region=await(await conn.execute(f"""WITH scoped AS(SELECT BTRIM(pattern_set) pattern_set,{REGION_SQL} region,GREATEST(SUM(quantity),0)::double precision gross_quantity,
          SUM(CASE WHEN quantity>0 THEN GREATEST(total_amount,0) ELSE 0 END)::double precision revenue,GREATEST(SUM(quantity) FILTER(WHERE month=%s),0)::double precision latest_quantity,GREATEST(SUM(quantity) FILTER(WHERE month=%s),0)::double precision previous_quantity
          FROM {SOURCE_TABLE} WHERE {period_filter} GROUP BY BTRIM(pattern_set),{REGION_SQL}), scored AS(SELECT scoped.*,SUM(gross_quantity) OVER(PARTITION BY region) region_total,
          COALESCE(SUM(gross_quantity) OVER(PARTITION BY region ORDER BY gross_quantity DESC,pattern_set ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING),0) quantity_before FROM scoped)
          SELECT *,CASE WHEN region_total<=0 THEN 'C' WHEN quantity_before/region_total<.8 THEN 'A' WHEN quantity_before/region_total<.95 THEN 'B' ELSE 'C' END abc_class,
          CASE WHEN region_total>0 THEN gross_quantity/region_total END contribution_pct,CASE WHEN region_total>0 THEN (quantity_before+gross_quantity)/region_total END cumulative_pct,
          CASE WHEN previous_quantity>0 THEN latest_quantity/previous_quantity-1 END growth FROM scored ORDER BY pattern_set,region""",[end,_add_months(end,-1),*period_params])).fetchall()
        trend_keys=[row["pattern_set"] for row in rows]; trend_rows=[]
        if trend_keys: trend_rows=await(await conn.execute(f"""SELECT BTRIM(pattern_set) pattern_set,month,GREATEST(SUM(quantity),0)::double precision quantity,SUM(GREATEST(line_count,0))::bigint line_count
          FROM {SOURCE_TABLE} WHERE BTRIM(pattern_set)=ANY(%s) AND month BETWEEN %s AND %s GROUP BY BTRIM(pattern_set),month ORDER BY month""",[trend_keys,max(start,_add_months(end,-11)),end])).fetchall()
    trend_map={key:{} for key in trend_keys}
    for row in trend_rows: trend_map[row["pattern_set"]][row["month"]]=dict(row)
    trend_months=_month_series(max(start,_add_months(end,-11)),end); items=[]
    for source in rows:
        row=dict(source); row.pop("filtered_total",None); row["trend"]=[{"month":month,"quantity":float(trend_map[row["pattern_set"]].get(month,{}).get("quantity",0)),"line_count":int(trend_map[row["pattern_set"]].get(month,{}).get("line_count",0))} for month in trend_months]; items.append(row)
    ranking=[dict(row) for row in ranking_rows]; growth=sorted((row for row in ranking if row.get("growth") is not None),key=lambda row:row["growth"],reverse=True)
    def with_growth(source):
        result=[]
        for raw in source: row=dict(raw); prev=float(row.pop("previous_quantity",0) or 0); latest=float(row.pop("latest_quantity",0) or 0); row["growth"]=latest/prev-1 if prev else None; result.append(row)
        return result
    branches={row["branch_code"]:{"region":row["region"],"branch_code":row["branch_code"],"branch_name":row["branch_name"]} for row in options}
    alerts=sorted((row for row in items if float(row.get("pattern_dispersion") or 0)>=.4),key=lambda row:row["pattern_dispersion"],reverse=True)[:20]
    return {"data_as_of_month":source_max,"filters":{"region":region or "","branch":branch or "","size_code":size_code or "","factory_sku":factory_sku or "","search":search or "","date_from":start,"date_to":end,"demand_pattern":demand_pattern or "","abc_class":abc_class or "","lifecycle":lifecycle or ""},
      "options":{"regions":sorted({row["region"] for row in options}),"branches":sorted(branches.values(),key=lambda row:row["branch_code"]),"size_codes":sorted({row["size_code"] for row in options if row["size_code"]}),"demand_patterns":["Smooth","Erratic","Intermittent","Lumpy"],"abc_classes":["A","B","C"],"lifecycles":["Mới ra mắt","Đang tăng trưởng","Trưởng thành","Đang suy giảm"]},
      "thresholds":{"adi":ADI_THRESHOLD,"cv2":CV2_THRESHOLD,"min_history_months":MIN_HISTORY_MONTHS,"min_positive_months":MIN_POSITIVE_MONTHS},
      "methodology":{"pattern_rollup":"Lựa chọn A: weighted distribution từ latest episode Base SKU × Branch; không tính lại ADI/CV² ở cấp bộ mẫu.","weight":"sqrt(min(history_months,36)/12)","dispersion":"Cảnh báo khi pattern chủ đạo dưới 60% weighted share.","lifecycle":{"new":"Mới ra mắt: trong 6 tháng gần nhất.","growth":"Tăng trưởng: 3 tháng gần nhất tăng ít nhất 15%.","mature":"Trưởng thành: biến động trong ±15%.","decline":"Suy giảm: giảm ít nhất 15%."},"inactive_alert":"Inactive variant là KPI trạng thái; pattern không được tính lại từ variant gộp."},
      "pattern_source":"analytics.mart_demand_pattern_episode","kpis":dict(summary or {}),"page":page,"page_size":page_size,"total":int(rows[0]["filtered_total"]) if rows else 0,"items":items,
      "ranking":{"top":ranking[:10],"bottom":sorted(ranking,key=lambda row:(row["gross_quantity"],row["pattern_set"]))[:10],"growth_top":growth[:10],"growth_bottom":list(reversed(growth[-10:])),"pareto":ranking,"pareto_80_count":next((i+1 for i,row in enumerate(ranking) if float(row.get("cumulative_pct") or 0)>=.8),len(ranking))},
      "inactive_alerts":alerts,"pattern_dispersion_alerts":alerts,"sizes":with_growth(size_rows),"size_region":with_growth(matrix_rows),"pattern_region":[dict(row) for row in pattern_region]}


@router.get("/detail")
async def detail(pattern_set:str,region:str|None=None,branch:str|None=None,size_code:str|None=None,factory_sku:str|None=None,date_from:str|None=None,date_to:str|None=None)->dict:
    async with get_pool().connection() as conn:
        bounds=await(await conn.execute(f"SELECT MIN(month) min_month,MAX(month) max_month FROM {SOURCE_TABLE}")).fetchone(); source_min,source_max=bounds["min_month"],bounds["max_month"]
        end=min(_parse_month(date_to,source_max),source_max); start=max(_parse_month(date_from,_add_months(end,-11)),source_min)
        where,params=_dimension_filter(region,branch,size_code,factory_sku,None); scoped=f"BTRIM(pattern_set)=%s AND month BETWEEN %s AND %s AND {where}"; scoped_params=[pattern_set,start,end,*params]
        history=await(await conn.execute(f"""SELECT month,GREATEST(SUM(quantity),0)::double precision quantity,SUM(CASE WHEN quantity>0 THEN GREATEST(total_amount,0) ELSE 0 END)::double precision revenue,SUM(GREATEST(line_count,0))::bigint line_count FROM {SOURCE_TABLE} WHERE {scoped} GROUP BY month ORDER BY month""",scoped_params)).fetchall()
        if not history: raise HTTPException(404,"Pattern set not found")
        variants=await(await conn.execute(f"""WITH mapping AS(SELECT bravo_sku,base_sku,branch,MAX(factory_sku) factory_sku,MAX(sku_name) sku_name,MIN(month) first_observed_month,MAX(month) FILTER(WHERE quantity>0) last_positive_sale_month,GREATEST(SUM(quantity),0)::double precision gross_quantity,BOOL_OR({ACTIVE_SQL}) is_active FROM {SOURCE_TABLE} WHERE {scoped} GROUP BY bravo_sku,base_sku,branch), joined AS(SELECT mapping.*,episode.adi,episode.cv2,episode.history_months,episode.positive_months,episode.negative_net_months,episode.demand_pattern,episode.series_weight,episode.is_excluded FROM mapping JOIN {MART_TABLE} episode USING(base_sku,branch) WHERE episode.is_latest_episode), rolled AS(SELECT bravo_sku,MAX(base_sku) base_sku,MAX(factory_sku) factory_sku,MAX(sku_name) sku_name,BOOL_OR(is_active) is_active,MIN(first_observed_month) first_observed_month,MAX(last_positive_sale_month) last_positive_sale_month,SUM(gross_quantity) gross_quantity,SUM(adi*series_weight) FILTER(WHERE NOT is_excluded AND adi IS NOT NULL)/NULLIF(SUM(series_weight) FILTER(WHERE NOT is_excluded AND adi IS NOT NULL),0) adi,SUM(cv2*series_weight) FILTER(WHERE NOT is_excluded AND cv2 IS NOT NULL)/NULLIF(SUM(series_weight) FILTER(WHERE NOT is_excluded AND cv2 IS NOT NULL),0) cv2,ROUND(SUM(history_months*series_weight) FILTER(WHERE NOT is_excluded)/NULLIF(SUM(series_weight) FILTER(WHERE NOT is_excluded),0))::integer history_months,ROUND(SUM(positive_months*series_weight) FILTER(WHERE NOT is_excluded)/NULLIF(SUM(series_weight) FILTER(WHERE NOT is_excluded),0))::integer positive_months,SUM(negative_net_months)::integer negative_months,SUM(series_weight) FILTER(WHERE NOT is_excluded AND demand_pattern='Smooth') smooth_weight,SUM(series_weight) FILTER(WHERE NOT is_excluded AND demand_pattern='Erratic') erratic_weight,SUM(series_weight) FILTER(WHERE NOT is_excluded AND demand_pattern='Intermittent') intermittent_weight,SUM(series_weight) FILTER(WHERE NOT is_excluded AND demand_pattern='Lumpy') lumpy_weight FROM joined GROUP BY bravo_sku) SELECT *,CASE GREATEST(COALESCE(smooth_weight,0),COALESCE(erratic_weight,0),COALESCE(intermittent_weight,0),COALESCE(lumpy_weight,0)) WHEN COALESCE(smooth_weight,0) THEN 'Smooth' WHEN COALESCE(erratic_weight,0) THEN 'Erratic' WHEN COALESCE(intermittent_weight,0) THEN 'Intermittent' ELSE 'Lumpy' END demand_pattern,CASE WHEN is_active THEN 'Hoạt động' ELSE 'Vô hiệu hóa' END status FROM rolled ORDER BY gross_quantity DESC,bravo_sku""",scoped_params)).fetchall()
        distribution=await(await conn.execute(f"SELECT {REGION_SQL} region,branch branch_code,MAX(branch_name) branch_name,GREATEST(SUM(quantity),0)::double precision gross_quantity FROM {SOURCE_TABLE} WHERE {scoped} GROUP BY {REGION_SQL},branch ORDER BY gross_quantity DESC",scoped_params)).fetchall()
    total=sum(float(row["gross_quantity"] or 0) for row in variants); result=[]
    for source in variants:
        row=dict(source); row["contribution_pct"]=float(row["gross_quantity"] or 0)/total if total else None; factory=str(row.get("factory_sku") or "").upper(); row["variant_type"]="D" if factory.endswith("D") else "V" if factory.endswith("V") else "Gốc"; result.append(row)
    return {"pattern_set":pattern_set,"filters":{"date_from":start,"date_to":end},"thresholds":{"adi":ADI_THRESHOLD,"cv2":CV2_THRESHOLD},"methodology":"Variant pattern là weighted roll-up từ Base SKU × Branch latest episode, không phải ADI/CV² tính lại trên demand variant gộp.","history":[dict(row) for row in history],"variants":result,"distribution":[dict(row) for row in distribution]}
