from __future__ import annotations

from fastapi import APIRouter

from app.db import get_pool

router = APIRouter(prefix="/eda", tags=["eda"])

SOURCE_TABLE = "source.mart_sku_branch_month"
REGION_SQL = "COALESCE(NULLIF(BTRIM(region), ''), 'Chưa xác định')"

# 1. XỬ LÝ LỖI FONT "VÔ HIỆU HÓA" CỰC MẠNH
def clean_status_sql(col_name: str) -> str:
    # Bắt mọi chuỗi bắt đầu bằng "vô hi" (không phân biệt hoa thường) 
    # để gom gọn toàn bộ "Vô hiệu hoá", "Vô hiệu hóa", và "Vô hi???u hoá" thành 1.
    return f"(CASE WHEN BTRIM({col_name}) ILIKE 'vô hi%%' THEN 'Vô hiệu hoá' ELSE BTRIM(COALESCE({col_name}, '')) END)"

SKU_STATUS_CLEAN = clean_status_sql("sku_status")
BRANCH_STATUS_CLEAN = clean_status_sql("branch_status")

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
        clauses.append(f"LOWER({SKU_STATUS_CLEAN}) = LOWER(BTRIM(%s))")
        params.append(sku_status)
    if branch_status:
        clauses.append(f"LOWER({BRANCH_STATUS_CLEAN}) = LOWER(BTRIM(%s))")
        params.append(branch_status)
        
    if search:
        clauses.append("(branch ILIKE %s OR COALESCE(branch_name, '') ILIKE %s)")
        term = f"%{search.strip()}%"
        params.extend([term, term])
        
    return " AND ".join(clauses), params

@router.get("/filters")
async def filters() -> dict:
    """API cấp dữ liệu cho thanh công cụ lọc của trang Tổng quan"""
    async with get_pool().connection() as conn:
        branch_rows = await (
            await conn.execute(
                f"""
                SELECT BTRIM(branch) AS branch,
                       COALESCE(MAX(NULLIF(BTRIM(branch_name), '')), BTRIM(branch)) AS branch_name,
                       MAX({REGION_SQL}) AS region,
                       COALESCE(MAX(NULLIF({BRANCH_STATUS_CLEAN}, '')), 'Chưa xác định') AS branch_status
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
                SELECT DISTINCT {SKU_STATUS_CLEAN} AS value
                FROM {SOURCE_TABLE}
                WHERE NULLIF(BTRIM(sku_status), '') IS NOT NULL
                ORDER BY value
                """
            )
        ).fetchall()
        
        branch_status_rows = await (
            await conn.execute(
                f"""
                SELECT DISTINCT {BRANCH_STATUS_CLEAN} AS value
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
    """API cấp dữ liệu thống kê Vĩ mô (Không chứa logic ADI/CV2)"""
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
        
        # 2. TỶ LỆ THEO SẢN LƯỢNG: Top Sản Phẩm
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
        
        # 2. TỶ LỆ THEO SẢN LƯỢNG: Tỷ trọng Vùng miền
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
        
        # 2. TỶ LỆ THEO SẢN LƯỢNG: Tỷ trọng Chi nhánh
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
        
        # 2. TỶ LỆ THEO SẢN LƯỢNG: Tỷ trọng Bộ mẫu
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