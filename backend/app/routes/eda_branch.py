from __future__ import annotations

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import logging

from app.db import get_pool

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/eda/branch", tags=["EDA Branch"])

BRANCH_ACTIVE_SQL = "LOWER(BTRIM(COALESCE(m.branch_status, ''))) = 'hoạt động'"

@router.get("/overview")
async def get_branch_overview(
    branch_code: Optional[str] = Query(None, description="Lọc theo chi nhánh"),
    region: Optional[str] = Query(None, description="Lọc theo vùng"),
    search: Optional[str] = Query(None, description="Tìm kiếm chi nhánh"),
    status: str = Query("all", pattern="^(all|active|inactive)$", description="Trạng thái chi nhánh"),
) -> dict:
    """
    Phân tích Hiệu suất & Độ phủ Chi nhánh theo Sản lượng (M²).
    """
    filters = []
    params: list[object] = []

    if status == "active":
        filters.append(BRANCH_ACTIVE_SQL)
    elif status == "inactive":
        filters.append(f"NOT ({BRANCH_ACTIVE_SQL})")
    
    if branch_code:
        filters.append("m.branch = %s")
        params.append(branch_code)
    
    if region:
        if region == "Chưa xác định":
            filters.append("(m.region IS NULL OR m.region = '')")
        else:
            filters.append("m.region = %s")
            params.append(region)
    
    if search:
        search_term = f"%{search}%"
        filters.append("(m.branch_name ILIKE %s OR m.branch ILIKE %s)")
        params.extend([search_term, search_term])
    
    filter_clause = "AND " + " AND ".join(filters) if filters else ""
    
    try:
        async with get_pool().connection() as conn:
            # 1. KPIs Tổng quan
            overview = await (
                await conn.execute(
                    f"""
                    SELECT
                        COUNT(DISTINCT m.branch) as total_branches,
                        COUNT(DISTINCT m.base_sku) as total_skus,
                        COALESCE(SUM(m.quantity), 0)::float as total_quantity,
                        COALESCE(SUM(m.total_amount), 0)::float as total_amount
                    FROM source.mart_sku_branch_month m
                    WHERE 1=1 {filter_clause}
                    """,
                    params
                )
            ).fetchone()
            
            # 2. PHÂN TÍCH VÙNG MIỀN: Sắp xếp theo Sản lượng (total_quantity)
            region_analysis = await (
                await conn.execute(
                    f"""
                    SELECT 
                        COALESCE(NULLIF(m.region, ''), 'Chưa xác định') as region,
                        COUNT(DISTINCT m.branch) as branch_count,
                        COUNT(DISTINCT m.base_sku) as sku_count,
                        COALESCE(SUM(m.quantity), 0)::float as total_quantity,
                        COALESCE(SUM(m.total_amount), 0)::float as total_amount,
                        ROUND((SUM(m.total_amount) / NULLIF(SUM(m.quantity), 0))::numeric, 0)::float as avg_price_per_m2
                    FROM source.mart_sku_branch_month m
                    WHERE 1=1 {filter_clause}
                    GROUP BY 1
                    ORDER BY total_quantity DESC
                    """,
                    params
                )
            ).fetchall()
            
            # 3. TOP CHI NHÁNH VỀ ĐỘ PHỦ MẪU MÃ (SKU Diversity)
            sku_coverage = await (
                await conn.execute(
                    f"""
                    SELECT 
                        m.branch,
                        MAX(m.branch_name) as branch_name,
                        COUNT(DISTINCT m.base_sku) as sku_count,
                        COALESCE(SUM(m.quantity), 0)::float as total_quantity
                    FROM source.mart_sku_branch_month m
                    WHERE 1=1 {filter_clause}
                    GROUP BY m.branch
                    ORDER BY sku_count DESC
                    LIMIT 10
                    """,
                    params
                )
            ).fetchall()
            
            # 4. PARETO THEO SẢN LƯỢNG (Khối lượng M² gánh team)
            branch_performance = await (
                await conn.execute(
                    f"""
                    WITH branch_agg AS (
                        SELECT 
                            m.branch,
                            MAX(m.branch_name) as branch_name,
                            COALESCE(NULLIF(MAX(m.region), ''), 'Chưa xác định') as region,
                            CASE WHEN BOOL_OR({BRANCH_ACTIVE_SQL}) THEN 'Hoạt động' ELSE 'Vô hiệu hóa' END as status,
                            COUNT(DISTINCT m.base_sku) as sku_count,
                            COALESCE(SUM(m.quantity), 0)::float as total_quantity,
                            COALESCE(SUM(m.total_amount), 0)::float as total_amount,
                            COUNT(DISTINCT m.month) as active_months
                        FROM source.mart_sku_branch_month m
                        WHERE 1=1 {filter_clause}
                        GROUP BY m.branch
                    ),
                    totals AS (
                        -- Cập nhật tổng theo Quantity thay vì Amount
                        SELECT SUM(total_quantity) as grand_total FROM branch_agg
                    ),
                    cum_calc AS (
                        SELECT 
                            b.*,
                            -- Tính Khối lượng M² / SKU thay vì Doanh thu / SKU
                            ROUND((b.total_quantity / NULLIF(b.sku_count, 0))::numeric, 2)::float as volume_per_sku,
                            -- Tỷ trọng tích lũy theo Quantity
                            SUM(b.total_quantity) OVER (ORDER BY b.total_quantity DESC) / NULLIF(t.grand_total, 0) as cum_ratio
                        FROM branch_agg b CROSS JOIN totals t
                    )
                    SELECT 
                        branch, branch_name, region, status, sku_count, total_quantity, total_amount,
                        active_months, volume_per_sku,
                        CASE 
                            WHEN cum_ratio <= 0.80 THEN 'Nhóm A (Khối lượng lớn)'
                            WHEN cum_ratio <= 0.95 THEN 'Nhóm B (Khá)'
                            ELSE 'Nhóm C (Thấp)'
                        END as pareto_group
                    FROM cum_calc
                    ORDER BY total_quantity DESC
                    """,
                    params
                )
            ).fetchall()
            
        return {
            "overview": dict(overview) if overview else {},
            "region_analysis": [dict(row) for row in region_analysis],
            "sku_coverage": [dict(row) for row in sku_coverage],
            "branch_performance": [dict(row) for row in branch_performance],
            "filters": {"status": status},
        }
    except Exception as e:
        logger.error(f"Lỗi API EDA Branch Overview: {str(e)}")
        raise HTTPException(status_code=500, detail="Không thể tải dữ liệu phân tích chi nhánh.")


@router.get("/detail/{branch_code}")
async def get_branch_detail(
    branch_code: str,
    status: str = Query("all", pattern="^(all|active|inactive)$", description="Trạng thái chi nhánh"),
) -> dict:
    """ API Detail cho từng chi nhánh """
    filters = ["m.branch = %s"]
    if status == "active":
        filters.append(BRANCH_ACTIVE_SQL)
    elif status == "inactive":
        filters.append(f"NOT ({BRANCH_ACTIVE_SQL})")
    params = [branch_code]
    filter_clause = "AND " + " AND ".join(filters)
    
    try:
        async with get_pool().connection() as conn:
            branch_info = await (
                await conn.execute(
                    f"""
                    SELECT 
                        m.branch,
                        MAX(m.branch_name) as branch_name,
                        COALESCE(NULLIF(MAX(m.region), ''), 'Chưa xác định') as region,
                        COUNT(DISTINCT m.base_sku) as sku_count,
                        COALESCE(SUM(m.quantity), 0)::float as total_quantity,
                        COALESCE(SUM(m.total_amount), 0)::float as total_amount,
                        COUNT(DISTINCT m.month) as month_count
                    FROM source.mart_sku_branch_month m
                    WHERE 1=1 {filter_clause}
                    GROUP BY m.branch
                    """,
                    params
                )
            ).fetchone()
            
            trend = await (
                await conn.execute(
                    f"""
                    SELECT 
                        m.month,
                        COALESCE(SUM(m.quantity), 0)::float as quantity,
                        COALESCE(SUM(m.total_amount), 0)::float as total_amount,
                        COUNT(DISTINCT m.base_sku) as sku_count
                    FROM source.mart_sku_branch_month m
                    WHERE 1=1 {filter_clause}
                    GROUP BY m.month
                    ORDER BY m.month
                    """,
                    params
                )
            ).fetchall()
            
            top_skus = await (
                await conn.execute(
                    f"""
                    SELECT 
                        m.base_sku,
                        MAX(m.sku_name) as sku_name,
                        MAX(m.unit) as size_code,
                        COALESCE(SUM(m.quantity), 0)::float as quantity,
                        COALESCE(SUM(m.total_amount), 0)::float as total_amount
                    FROM source.mart_sku_branch_month m
                    WHERE 1=1 {filter_clause}
                    GROUP BY m.base_sku
                    -- Sắp xếp theo Sản lượng thay vì Doanh thu
                    ORDER BY quantity DESC
                    LIMIT 20
                    """,
                    params
                )
            ).fetchall()
            
        return {
            "branch_info": dict(branch_info) if branch_info else {},
            "trend": [dict(row) for row in trend],
            "top_skus": [dict(row) for row in top_skus]
        }
    except Exception as e:
        logger.error(f"Lỗi API EDA Branch Detail: {str(e)}")
        raise HTTPException(status_code=500, detail="Không thể tải chi tiết chi nhánh.")