from __future__ import annotations

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import logging

from app.db import get_pool
from app.demand_pattern import (
    ADI_THRESHOLD,
    CV2_THRESHOLD,
    INACTIVE_RECENT_MONTHS,
    MIN_HISTORY_MONTHS,
    MIN_POSITIVE_MONTHS,
    THRESHOLD_UPDATED_AT,
)
from app.services.demand_pattern_episode import MART_TABLE

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/eda/sku", tags=["EDA SKU"])

SKU_ACTIVE_SQL = "LOWER(BTRIM(COALESCE(source.sku_status, ''))) = 'hoạt động'"

@router.get("/overview")
async def get_sku_overview(
    branch_code: Optional[str] = Query(None, description="Lọc theo chi nhánh"),
    region: Optional[str] = Query(None, description="Lọc theo vùng"),
    search: Optional[str] = Query(None, description="Tìm kiếm SKU"),
    status: str = Query("all", pattern="^(all|active|inactive)$", description="Trạng thái SKU"),
) -> dict:
    """
    Phân tích chuyên sâu SKU từ latest episode Base SKU × Branch dùng chung.

    ADI/CV² và Demand Pattern ở cấp Base SKU là weighted roll-up; endpoint này
    không tính lại pattern từ chuỗi demand đã gộp.
    """
    filters = ["episode.is_latest_episode"]
    params: list[object] = []

    if status == "active":
        filters.append("pair_status.sku_is_active")
        fact_status_clause = f"WHERE {SKU_ACTIVE_SQL}"
    elif status == "inactive":
        filters.append("NOT pair_status.sku_is_active")
        fact_status_clause = f"WHERE NOT ({SKU_ACTIVE_SQL})"
    else:
        fact_status_clause = ""
    
    if branch_code:
        filters.append("episode.branch = %s")
        params.append(branch_code)
    
    if region:
        if region == "Chưa xác định":
            filters.append("COALESCE(NULLIF(BTRIM(episode.region), ''), 'Chưa xác định') = %s")
            params.append(region)
        else:
            filters.append("episode.region = %s")
            params.append(region)
    
    if search:
        search_term = f"%{search}%"
        filters.append("(episode.base_sku ILIKE %s OR COALESCE(episode.sku_name, '') ILIKE %s)")
        params.extend([search_term, search_term])

    filter_clause = " AND ".join(filters)
    
    try:
        async with get_pool().connection() as conn:
            mart_state = await (
                await conn.execute("SELECT to_regclass(%s) AS relation_name", [MART_TABLE])
            ).fetchone()
            if not mart_state or mart_state["relation_name"] is None:
                raise HTTPException(503, "Demand Pattern episode mart is unavailable")

            query = f"""
            WITH pair_status AS (
                SELECT source.base_sku, source.branch,
                       BOOL_OR({SKU_ACTIVE_SQL}) AS sku_is_active
                FROM source.mart_sku_branch_month source
                GROUP BY source.base_sku, source.branch
            ),
            latest AS (
                SELECT episode.*, pair_status.sku_is_active
                FROM {MART_TABLE} episode
                JOIN pair_status USING (base_sku, branch)
                WHERE {filter_clause}
            ),
            pair_facts AS (
                SELECT
                    source.base_sku,
                    source.branch,
                    MAX(source.unit) AS size_code,
                    SUM(GREATEST(source.quantity, 0))::double precision AS total_quantity,
                    SUM(CASE WHEN source.quantity > 0 THEN GREATEST(source.total_amount, 0) ELSE 0 END)::double precision AS total_amount
                FROM source.mart_sku_branch_month source
                JOIN latest USING (base_sku, branch)
                {fact_status_clause}
                GROUP BY source.base_sku, source.branch
            ),
            rolled AS (
                SELECT
                    latest.base_sku,
                    MAX(latest.sku_name) AS sku_name,
                    MAX(pair_facts.size_code) AS size_code,
                    CASE WHEN BOOL_OR(latest.sku_is_active) THEN 'Hoạt động' ELSE 'Vô hiệu hóa' END AS status,
                    COALESCE(SUM(pair_facts.total_quantity), 0)::double precision AS total_quantity,
                    COALESCE(SUM(pair_facts.total_amount), 0)::double precision AS total_amount,
                    COUNT(DISTINCT latest.branch)::integer AS branch_count,
                    ROUND(SUM(latest.history_months * latest.series_weight) FILTER (WHERE NOT latest.is_excluded)
                        / NULLIF(SUM(latest.series_weight) FILTER (WHERE NOT latest.is_excluded), 0))::integer AS history_months,
                    ROUND(SUM(latest.positive_months * latest.series_weight) FILTER (WHERE NOT latest.is_excluded)
                        / NULLIF(SUM(latest.series_weight) FILTER (WHERE NOT latest.is_excluded), 0))::integer AS positive_months,
                    SUM(latest.adi * latest.series_weight) FILTER (WHERE NOT latest.is_excluded AND latest.adi IS NOT NULL)
                        / NULLIF(SUM(latest.series_weight) FILTER (WHERE NOT latest.is_excluded AND latest.adi IS NOT NULL), 0) AS adi,
                    SUM(latest.cv2 * latest.series_weight) FILTER (WHERE NOT latest.is_excluded AND latest.cv2 IS NOT NULL)
                        / NULLIF(SUM(latest.series_weight) FILTER (WHERE NOT latest.is_excluded AND latest.cv2 IS NOT NULL), 0) AS cv2,
                    COALESCE(SUM(latest.series_weight) FILTER (
                        WHERE NOT latest.is_excluded
                          AND latest.demand_pattern IN ('Smooth', 'Erratic', 'Intermittent', 'Lumpy')
                    ), 0) AS eligible_weight,
                    COALESCE(SUM(latest.series_weight) FILTER (WHERE NOT latest.is_excluded AND latest.demand_pattern = 'Smooth'), 0) AS smooth_weight,
                    COALESCE(SUM(latest.series_weight) FILTER (WHERE NOT latest.is_excluded AND latest.demand_pattern = 'Erratic'), 0) AS erratic_weight,
                    COALESCE(SUM(latest.series_weight) FILTER (WHERE NOT latest.is_excluded AND latest.demand_pattern = 'Intermittent'), 0) AS intermittent_weight,
                    COALESCE(SUM(latest.series_weight) FILTER (WHERE NOT latest.is_excluded AND latest.demand_pattern = 'Lumpy'), 0) AS lumpy_weight,
                    COUNT(*) FILTER (WHERE latest.demand_pattern = 'Insufficient-New') AS insufficient_count,
                    COUNT(*) FILTER (WHERE latest.demand_pattern = 'Excluded-Inactive') AS excluded_count,
                    COUNT(*) AS pair_count,
                    MAX(latest.last_positive_month) AS last_positive_month,
                    MAX(latest.source_end_month) AS source_end_month
                FROM latest
                LEFT JOIN pair_facts USING (base_sku, branch)
                GROUP BY latest.base_sku
            ), classified AS (
                SELECT rolled.*,
                    CASE
                        WHEN eligible_weight > 0 THEN
                            CASE GREATEST(smooth_weight, erratic_weight, intermittent_weight, lumpy_weight)
                                WHEN smooth_weight THEN 'Smooth'
                                WHEN erratic_weight THEN 'Erratic'
                                WHEN intermittent_weight THEN 'Intermittent'
                                ELSE 'Lumpy'
                            END
                        WHEN excluded_count = pair_count THEN 'Excluded-Inactive'
                        ELSE 'Insufficient-New'
                    END AS demand_pattern
                FROM rolled
            )
            SELECT
                base_sku,
                sku_name,
                size_code,
                status,
                total_quantity,
                total_amount,
                branch_count,
                history_months,
                positive_months,
                ROUND(adi::numeric, 4) AS adi,
                ROUND(cv2::numeric, 4) AS cv2,
                demand_pattern,
                CASE
                    WHEN demand_pattern IN ('Lumpy', 'Insufficient-New', 'Excluded-Inactive') THEN true
                    WHEN last_positive_month IS NULL THEN true
                    WHEN last_positive_month <= source_end_month - INTERVAL '{INACTIVE_RECENT_MONTHS} months' THEN true
                    ELSE false
                END AS is_check_pattern
            FROM classified
            ORDER BY total_quantity DESC
            """
            raw_data = await (await conn.execute(query, params)).fetchall()
            
            sku_list = []
            scatter_data = []
            distribution = {
                "Smooth": 0,
                "Erratic": 0,
                "Intermittent": 0,
                "Lumpy": 0,
                "Insufficient-New": 0,
                "Excluded-Inactive": 0,
            }
            
            check_pattern_count = 0
            
            for row in raw_data:
                item = dict(row)
                dp = item["demand_pattern"]
                
                if dp in distribution: distribution[dp] += 1
                if item["is_check_pattern"]: check_pattern_count += 1
                
                # Trực quan hóa tọa độ (loại bỏ nhiễu hiển thị)
                if item["adi"] is not None and item["cv2"] is not None and dp in {"Smooth", "Erratic", "Intermittent", "Lumpy"}:
                    if item["adi"] <= 12 and item["cv2"] <= 5: 
                        scatter_data.append({
                            "adi": float(item["adi"]),
                            "cv2": float(item["cv2"]),
                            "demand_pattern": dp,
                            "base_sku": item["base_sku"]
                        })
                
                sku_list.append(item)
                
            return {
                "overview": {
                    "total_valid_skus": len(raw_data),
                    "check_pattern_count": check_pattern_count,
                    "smooth_count": distribution["Smooth"],
                    "lumpy_count": distribution["Lumpy"]
                },
                "demand_distribution": [{"name": k, "value": v} for k, v in distribution.items() if v > 0],
                "scatter_data": scatter_data,
                "sku_list": sku_list,
                "thresholds": {
                    "adi": ADI_THRESHOLD,
                    "cv2": CV2_THRESHOLD,
                    "min_history_months": MIN_HISTORY_MONTHS,
                    "min_positive_months": MIN_POSITIVE_MONTHS,
                    "inactive_recent_months": INACTIVE_RECENT_MONTHS,
                    "updated_at": THRESHOLD_UPDATED_AT,
                },
                "pattern_source": MART_TABLE,
                "methodology": "Weighted roll-up từ latest episode Base SKU × Branch; không tính lại ADI/CV² trên chuỗi SKU gộp.",
                "filters": {"status": status},
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi API EDA SKU Overview: {str(e)}")
        raise HTTPException(status_code=500, detail="Không thể tải dữ liệu SKU từ Database.")


@router.get("/detail/{base_sku}")
async def get_sku_detail(
    base_sku: str,
    branch_code: Optional[str] = Query(None, description="Lọc theo chi nhánh"),
) -> dict:
    """
    Chi tiết một SKU cụ thể
    """
    filters = ["base_sku = %s"]
    params = [base_sku]
    
    if branch_code:
        filters.append("branch = %s")
        params.append(branch_code)
    
    filter_clause = "AND " + " AND ".join(filters[1:]) if len(filters) > 1 else ""
    
    try:
        async with get_pool().connection() as conn:
            # Thông tin SKU
            sku_info = await (
                await conn.execute(
                    f"""
                    SELECT 
                        base_sku,
                        MAX(sku_name) as sku_name,
                        MAX(unit) as size_code,
                        MAX(sku_status) as status,
                        COUNT(DISTINCT bravo_sku) as bravo_count,
                        COUNT(DISTINCT branch) as branch_count,
                        COALESCE(SUM(quantity), 0) as total_quantity,
                        COALESCE(SUM(total_amount), 0) as total_amount,
                        COUNT(DISTINCT month) as month_count,
                        MIN(month) as first_sale_month,
                        MAX(month) as last_sale_month
                    FROM source.mart_sku_branch_month
                    WHERE base_sku = %s {filter_clause}
                    GROUP BY base_sku
                    """,
                    [base_sku] + params[1:] if len(params) > 1 else params
                )
            ).fetchone()
            
            # Trend theo tháng
            trend = await (
                await conn.execute(
                    f"""
                    SELECT 
                        month,
                        COALESCE(SUM(quantity), 0) as quantity,
                        COALESCE(SUM(total_amount), 0) as total_amount,
                        COUNT(DISTINCT branch) as branch_count
                    FROM source.mart_sku_branch_month
                    WHERE base_sku = %s {filter_clause}
                    GROUP BY month
                    ORDER BY month
                    """,
                    [base_sku] + params[1:] if len(params) > 1 else params
                )
            ).fetchall()
            
            # Phân phối theo chi nhánh
            branch_distribution = await (
                await conn.execute(
                    f"""
                    SELECT 
                        branch,
                        MAX(branch_name) as branch_name,
                        MAX(region) as region,
                        COALESCE(SUM(quantity), 0) as quantity,
                        COALESCE(SUM(total_amount), 0) as total_amount,
                        COUNT(DISTINCT month) as month_count
                    FROM source.mart_sku_branch_month
                    WHERE base_sku = %s {filter_clause}
                    GROUP BY branch
                    ORDER BY quantity DESC
                    """,
                    [base_sku] + params[1:] if len(params) > 1 else params
                )
            ).fetchall()
            
        return {
            "sku_info": dict(sku_info) if sku_info else {},
            "trend": [dict(row) for row in trend],
            "branch_distribution": [dict(row) for row in branch_distribution]
        }
    except Exception as e:
        logger.error(f"Lỗi API EDA SKU Detail: {str(e)}")
        raise HTTPException(status_code=500, detail="Không thể tải chi tiết SKU.")
