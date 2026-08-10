from __future__ import annotations

from fastapi import APIRouter

from app.db import get_pool


router = APIRouter(prefix="/eda", tags=["eda"])


@router.get("/overview")
async def overview(branch_code: str | None = None) -> dict:
    branch_filter = "and m.branch_code = %s" if branch_code else ""
    params = [branch_code] if branch_code else []
    async with get_pool().connection() as conn:
        kpis = await (
            await conn.execute(
                f"""
                select
                  count(distinct m.base_sku) base_skus,
                  count(distinct m.branch_code) branches,
                  sum(m.gross_positive_qty) gross_qty,
                  sum(m.return_qty) return_qty,
                  sum(m.net_qty) net_qty,
                  max(m.month) data_as_of
                from analytics.mart_item_branch_month m
                where true {branch_filter}
                """,
                params,
            )
        ).fetchone()
        status_counts = await (
            await conn.execute(
                "select status, count(*) value from analytics.dim_base_sku where product_type='L1' group by status"
            )
        ).fetchall()
        trend = await (
            await conn.execute(
                f"""
                select month, sum(gross_positive_qty) gross_qty,
                       sum(return_qty) return_qty, sum(net_qty) net_qty
                from analytics.mart_item_branch_month m
                where true {branch_filter}
                group by month order by month
                """,
                params,
            )
        ).fetchall()
        regions = await (
            await conn.execute(
                f"""
                select coalesce(b.region, 'Chưa xác định') region,
                       sum(m.gross_positive_qty) gross_qty
                from analytics.mart_item_branch_month m
                join analytics.dim_branch b using(branch_code)
                where true {branch_filter}
                group by b.region order by gross_qty desc
                """,
                params,
            )
        ).fetchall()
        sizes = await (
            await conn.execute(
                f"""
                select coalesce(s.size_code, 'N/A') size_code,
                       sum(m.gross_positive_qty) gross_qty
                from analytics.mart_item_branch_month m
                join analytics.dim_base_sku s using(base_sku)
                where true {branch_filter}
                group by s.size_code order by gross_qty desc limit 10
                """,
                params,
            )
        ).fetchall()
        dq = await (
            await conn.execute(
                "select rule_code, severity, count(*) value from analytics.data_quality_issue group by rule_code,severity"
            )
        ).fetchall()
    return {"kpis": kpis, "status_counts": status_counts, "trend": trend, "regions": regions, "sizes": sizes, "data_quality": dq}

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
    # (Phần thực thi và format dict bên dưới giữ nguyên như code cũ của bạn)
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
    # Lọc bỏ các tháng trước khi SKU ra mắt bằng cách tìm first_sale_month
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
      -- Chỉ đếm các SKU ĐÃ TỒN TẠI (tháng hiện tại >= tháng ra mắt)
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
