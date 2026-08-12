from __future__ import annotations

from fastapi import APIRouter

from app.db import get_pool


router = APIRouter(prefix="/eda", tags=["eda"])

SOURCE_TABLE = "source.mart_sku_branch_month"
REGION_SQL = "COALESCE(NULLIF(BTRIM(region), ''), 'Chưa xác định')"


def _overview_scope(
    branch_code: str | None,
    region: str | None,
    sku_status: str | None,
    branch_status: str | None,
    search: str | None,
) -> tuple[str, list[str]]:
    clauses = ["base_sku IS NOT NULL", "branch IS NOT NULL", "month IS NOT NULL"]
    params: list[str] = []
    if branch_code:
        clauses.append("BTRIM(branch) = %s")
        params.append(branch_code.strip())
    if region:
        clauses.append(f"{REGION_SQL} = %s")
        params.append(region.strip())
    if sku_status:
        clauses.append("LOWER(BTRIM(COALESCE(sku_status, ''))) = LOWER(BTRIM(%s))")
        params.append(sku_status)
    if branch_status:
        clauses.append("LOWER(BTRIM(COALESCE(branch_status, ''))) = LOWER(BTRIM(%s))")
        params.append(branch_status)
    if search:
        clauses.append("(branch ILIKE %s OR COALESCE(branch_name, '') ILIKE %s)")
        term = f"%{search.strip()}%"
        params.extend([term, term])
    return " AND ".join(clauses), params


@router.get("/filters")
async def filters() -> dict:
    """Return the filter shape consumed by the EDA overview page."""
    async with get_pool().connection() as conn:
        branch_rows = await (
            await conn.execute(
                f"""
                SELECT BTRIM(branch) AS branch,
                       COALESCE(MAX(NULLIF(BTRIM(branch_name), '')), BTRIM(branch)) AS branch_name,
                       MAX({REGION_SQL}) AS region,
                       COALESCE(MAX(NULLIF(BTRIM(branch_status), '')), 'Chưa xác định') AS branch_status
                FROM {SOURCE_TABLE}
                WHERE NULLIF(BTRIM(branch), '') IS NOT NULL
                GROUP BY BTRIM(branch)
                ORDER BY BTRIM(branch)
                """
            )
        ).fetchall()
        region_rows = await (
            await conn.execute(
                f"SELECT DISTINCT {REGION_SQL} AS value FROM {SOURCE_TABLE} ORDER BY value"
            )
        ).fetchall()
        sku_status_rows = await (
            await conn.execute(
                f"""
                SELECT DISTINCT BTRIM(sku_status) AS value
                FROM {SOURCE_TABLE}
                WHERE NULLIF(BTRIM(sku_status), '') IS NOT NULL
                ORDER BY value
                """
            )
        ).fetchall()
        branch_status_rows = await (
            await conn.execute(
                f"""
                SELECT DISTINCT BTRIM(branch_status) AS value
                FROM {SOURCE_TABLE}
                WHERE NULLIF(BTRIM(branch_status), '') IS NOT NULL
                ORDER BY value
                """
            )
        ).fetchall()
    return {
        "branches": [dict(row) for row in branch_rows],
        "regions": [row["value"] for row in region_rows],
        "sku_statuses": [row["value"] for row in sku_status_rows],
        "branch_statuses": [row["value"] for row in branch_status_rows],
    }


@router.get("/overview")
async def overview(
    branch_code: str | None = None,
    region: str | None = None,
    sku_status: str | None = None,
    branch_status: str | None = None,
    search: str | None = None,
) -> dict:
    where, params = _overview_scope(
        branch_code, region, sku_status, branch_status, search
    )
    revenue_sql = "CASE WHEN quantity > 0 THEN GREATEST(total_amount, 0) ELSE 0 END"
    async with get_pool().connection() as conn:
        kpis = await (
            await conn.execute(
                f"""
                SELECT COUNT(DISTINCT base_sku)::integer AS total_base_skus,
                       COUNT(DISTINCT bravo_sku)::integer AS total_bravo_skus,
                       COUNT(DISTINCT branch)::integer AS total_branches,
                       GREATEST(COALESCE(SUM(quantity), 0), 0)::double precision AS total_quantity,
                       COALESCE(SUM({revenue_sql}), 0)::double precision AS total_amount,
                       MAX(month) AS data_as_of,
                       MIN(month) AS data_from
                FROM {SOURCE_TABLE}
                WHERE {where}
                """,
                params,
            )
        ).fetchone()
        trend = await (
            await conn.execute(
                f"""
                SELECT month,
                       GREATEST(COALESCE(SUM(quantity), 0), 0)::double precision AS total_quantity,
                       COALESCE(SUM({revenue_sql}), 0)::double precision AS total_amount,
                       COUNT(DISTINCT base_sku) FILTER (WHERE quantity > 0)::integer AS active_skus,
                       COUNT(DISTINCT branch) FILTER (WHERE quantity > 0)::integer AS active_branches
                FROM {SOURCE_TABLE}
                WHERE {where}
                GROUP BY month
                ORDER BY month
                """,
                params,
            )
        ).fetchall()
        
        # CẬP NHẬT: Sắp xếp theo Sản lượng thay vì Doanh thu
        top_products = await (
            await conn.execute(
                f"""
                SELECT base_sku,
                       COALESCE(MAX(NULLIF(BTRIM(sku_name), '')), base_sku) AS sku_name,
                       COALESCE(MAX(NULLIF(BTRIM(price_group), '')), 'N/A') AS size_code,
                       GREATEST(COALESCE(SUM(quantity), 0), 0)::double precision AS total_quantity,
                       COALESCE(SUM({revenue_sql}), 0)::double precision AS total_amount
                FROM {SOURCE_TABLE}
                WHERE {where}
                GROUP BY base_sku
                ORDER BY total_quantity DESC, base_sku
                LIMIT 10
                """,
                params,
            )
        ).fetchall()
        
        # CẬP NHẬT: Tỷ trọng dựa trên Sản lượng thay vì Doanh thu
        region_proportion = await (
            await conn.execute(
                f"""
                SELECT {REGION_SQL} AS name,
                       GREATEST(COALESCE(SUM(quantity), 0), 0)::double precision AS value
                FROM {SOURCE_TABLE}
                WHERE {where}
                GROUP BY {REGION_SQL}
                ORDER BY value DESC, name
                """,
                params,
            )
        ).fetchall()
        
        # CẬP NHẬT: Tỷ trọng dựa trên Sản lượng thay vì Doanh thu
        branch_proportion = await (
            await conn.execute(
                f"""
                SELECT COALESCE(MAX(NULLIF(BTRIM(branch_name), '')), BTRIM(branch)) AS name,
                       GREATEST(COALESCE(SUM(quantity), 0), 0)::double precision AS value
                FROM {SOURCE_TABLE}
                WHERE {where}
                GROUP BY BTRIM(branch)
                ORDER BY value DESC, name
                LIMIT 10
                """,
                params,
            )
        ).fetchall()
        
        # CẬP NHẬT: Tỷ trọng dựa trên Sản lượng thay vì Doanh thu
        pattern_proportion = await (
            await conn.execute(
                f"""
                SELECT BTRIM(pattern_set) AS name,
                       GREATEST(COALESCE(SUM(quantity), 0), 0)::double precision AS value
                FROM {SOURCE_TABLE}
                WHERE {where} AND NULLIF(BTRIM(pattern_set), '') IS NOT NULL
                GROUP BY BTRIM(pattern_set)
                ORDER BY value DESC, name
                LIMIT 10
                """,
                params,
            )
        ).fetchall()
    return {
        "kpis": dict(kpis) if kpis else {},
        "trend": [dict(row) for row in trend],
        "top_products": [dict(row) for row in top_products],
        "region_proportion": [dict(row) for row in region_proportion],
        "branch_proportion": [dict(row) for row in branch_proportion],
        "pattern_proportion": [dict(row) for row in pattern_proportion],
    }

@router.get("/crosstab-history-pattern")
async def crosstab_history_pattern(branch_code: str | None = None) -> list[dict]:
    branch_filter = "and branch_code = %s" if branch_code else ""
    params = [branch_code] if branch_code else []
    
    query = f"""
    WITH global_max AS (
      -- Lấy tháng xa nhất của toàn bộ DB làm mốc hiện tại
      SELECT MAX(month) as current_month 
      FROM analytics.mart_item_branch_month
    ),
    sku_stats AS (
      SELECT
        m.base_sku,
        m.branch_code,
        -- Tháng ĐẦU TIÊN CÓ GIAO DỊCH thực tế
        MIN(CASE WHEN m.gross_positive_qty > 0 THEN m.month END) as first_sale_month,
        -- Tính tổng số tháng phát sinh sales > 0
        SUM(CASE WHEN m.gross_positive_qty > 0 THEN 1 ELSE 0 END) as n_active_months,
        AVG(CASE WHEN m.gross_positive_qty > 0 THEN m.gross_positive_qty END) as avg_nz_demand,
        STDDEV(CASE WHEN m.gross_positive_qty > 0 THEN m.gross_positive_qty END) as std_nz_demand,
        MAX(g.current_month) as global_max_month
      FROM analytics.mart_item_branch_month m
      CROSS JOIN global_max g
      WHERE true {branch_filter}
      GROUP BY m.base_sku, m.branch_code
    ),
    classified AS (
      SELECT
        base_sku,
        branch_code,
        -- Tính tổng số tháng TỪ LÚC RA MẮT đến HIỆN TẠI
        ((extract(year from global_max_month) - extract(year from first_sale_month)) * 12 + 
         (extract(month from global_max_month) - extract(month from first_sale_month)) + 1)::integer as actual_total_months,
        n_active_months,
        power(std_nz_demand / nullif(avg_nz_demand, 0), 2) as cv2
      FROM sku_stats
      -- Chỉ xét những mã ĐÃ TỪNG BÁN
      WHERE first_sale_month IS NOT NULL 
    ),
    pattern_classified AS (
      SELECT
        CASE
          WHEN actual_total_months >= 24 THEN 'Full-history'
          WHEN actual_total_months >= 6 THEN 'Short-history'
          ELSE 'Cold-start'
        END as history_pattern,
        
        -- Cập nhật ADI mới dựa trên khoảng thời gian thực tế
        actual_total_months::float / nullif(n_active_months, 0) as adi,
        cv2,
        actual_total_months,
        n_active_months
      FROM classified
    )
    SELECT
      history_pattern,
      CASE
        -- Ngưỡng mới: ADI = 3.99, CV2 = 0.89
        WHEN actual_total_months < 3 OR n_active_months < 3 THEN 'Insufficient/Cold-start'
        WHEN adi IS NULL OR cv2 IS NULL THEN 'Insufficient/Cold-start'
        WHEN adi < 3.99 AND cv2 < 0.89 THEN 'Smooth'
        WHEN adi < 3.99 AND cv2 >= 0.89 THEN 'Erratic'
        WHEN adi >= 3.99 AND cv2 < 0.89 THEN 'Intermittent'
        WHEN adi >= 3.99 AND cv2 >= 0.89 THEN 'Lumpy'
        ELSE 'Insufficient/Cold-start'
      END as demand_pattern,
      count(*) as count
    FROM pattern_classified
    GROUP BY history_pattern, demand_pattern
    """
    
    async with get_pool().connection() as conn:
        rows = await (await conn.execute(query, params)).fetchall()
        
    results = {}
    for row in rows:
        hp = row["history_pattern"]
        dp = row["demand_pattern"]
        cnt = row["count"]
        if hp not in results:
            results[hp] = {"history_pattern": hp, "Smooth": 0, "Erratic": 0, "Intermittent": 0, "Lumpy": 0, "Insufficient/Cold-start": 0}
        results[hp][dp] = cnt
        
    final_results = []
    for hp, data in results.items():
        total = sum(data[k] for k in ["Smooth", "Erratic", "Intermittent", "Lumpy", "Insufficient/Cold-start"])
        if total > 0:
            for k in ["Smooth", "Erratic", "Intermittent", "Lumpy", "Insufficient/Cold-start"]:
                data[k] = round((data[k] / total) * 100, 2)
        final_results.append(data)
        
    return final_results

@router.get("/timeline-sample")
async def timeline_sample(branch_code: str | None = None) -> list[dict]:
    branch_filter = "and branch_code = %s" if branch_code else ""
    params = [branch_code] if branch_code else []
    
    query = f"""
    WITH global_max AS (
      SELECT MAX(month) as current_month FROM analytics.mart_item_branch_month
    ),
    sku_stats AS (
      SELECT
        m.base_sku,
        m.branch_code,
        MIN(CASE WHEN m.gross_positive_qty > 0 THEN m.month END) as first_sale_month,
        SUM(CASE WHEN m.gross_positive_qty > 0 THEN 1 ELSE 0 END) as n_active_months,
        AVG(CASE WHEN m.gross_positive_qty > 0 THEN m.gross_positive_qty END) as avg_nz_demand,
        STDDEV(CASE WHEN m.gross_positive_qty > 0 THEN m.gross_positive_qty END) as std_nz_demand,
        MAX(g.current_month) as global_max_month
      FROM analytics.mart_item_branch_month m
      CROSS JOIN global_max g
      WHERE true {branch_filter}
      GROUP BY m.base_sku, m.branch_code
    ),
    classified AS (
      SELECT
        base_sku,
        branch_code,
        ((extract(year from global_max_month) - extract(year from first_sale_month)) * 12 + 
         (extract(month from global_max_month) - extract(month from first_sale_month)) + 1)::integer as actual_total_months,
        n_active_months,
        power(std_nz_demand / nullif(avg_nz_demand, 0), 2) as cv2
      FROM sku_stats
      WHERE first_sale_month IS NOT NULL
    ),
    pattern_classified AS (
      SELECT
        base_sku,
        branch_code,
        actual_total_months::float / nullif(n_active_months, 0) as adi,
        cv2,
        actual_total_months,
        n_active_months
      FROM classified
    ),
    final_pattern AS (
      SELECT
        base_sku,
        branch_code,
        CASE
          -- Ngưỡng mới: 3.99 và 0.89
          WHEN actual_total_months < 3 OR n_active_months < 3 THEN 'Insufficient/Cold-start'
          WHEN adi IS NULL OR cv2 IS NULL THEN 'Insufficient/Cold-start'
          WHEN adi < 3.99 AND cv2 < 0.89 THEN 'Smooth'
          WHEN adi < 3.99 AND cv2 >= 0.89 THEN 'Erratic'
          WHEN adi >= 3.99 AND cv2 < 0.89 THEN 'Intermittent'
          WHEN adi >= 3.99 AND cv2 >= 0.89 THEN 'Lumpy'
          ELSE 'Insufficient/Cold-start'
        END as demand_pattern
      FROM pattern_classified
    ),
    sampled AS (
      SELECT * FROM (
        SELECT 
          *,
          ROW_NUMBER() OVER(PARTITION BY demand_pattern ORDER BY random()) as rn
        FROM final_pattern
      ) t
      WHERE rn <= 10
    )
    SELECT
      s.base_sku,
      s.branch_code,
      s.demand_pattern,
      m.month,
      m.gross_positive_qty,
      m.net_qty
    FROM sampled s
    JOIN analytics.mart_item_branch_month m 
      ON s.base_sku = m.base_sku AND s.branch_code = m.branch_code
    ORDER BY s.demand_pattern, s.base_sku, s.branch_code, m.month
    """
    async with get_pool().connection() as conn:
        rows = await (await conn.execute(query, params)).fetchall()
        
    results = {}
    for row in rows:
        key = (row["base_sku"], row["branch_code"])
        if key not in results:
            results[key] = {
                "base_sku": row["base_sku"],
                "branch_code": row["branch_code"],
                "demand_pattern": row["demand_pattern"],
                "timeline": []
            }
        results[key]["timeline"].append({
            "month": str(row["month"]),
            "gross_positive_qty": float(row["gross_positive_qty"]),
            "net_qty": float(row["net_qty"]) if row["net_qty"] is not None else 0
        })
        
    return list(results.values())

@router.get("/branch-coverage")
async def branch_coverage() -> list[dict]:
    query = """
    WITH sku_first_sale AS (
      SELECT 
        base_sku, 
        branch_code, 
        MIN(CASE WHEN gross_positive_qty > 0 THEN month END) as first_sale_month
      FROM analytics.mart_item_branch_month
      GROUP BY base_sku, branch_code
    )
    SELECT
      m.month,
      m.branch_code,
      COUNT(m.base_sku) as total_skus,
      SUM(CASE WHEN m.gross_positive_qty > 0 THEN 1 ELSE 0 END) as active_skus,
      ROUND((SUM(CASE WHEN m.gross_positive_qty > 0 THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(m.base_sku), 0)::numeric) * 100, 2) as coverage_pct
    FROM analytics.mart_item_branch_month m
    JOIN sku_first_sale f 
      ON m.base_sku = f.base_sku AND m.branch_code = f.branch_code
    WHERE m.month >= f.first_sale_month
    GROUP BY m.month, m.branch_code
    ORDER BY m.month, m.branch_code
    """
    async with get_pool().connection() as conn:
        rows = await (await conn.execute(query)).fetchall()
        
    return [dict(r) for r in rows]