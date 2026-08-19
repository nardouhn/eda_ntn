from __future__ import annotations

from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.db import get_pool
from app.services.forecast import add_months

router = APIRouter(prefix="/items", tags=["items"])

ACTIVE_STATUS_LABELS = ("hoạt động",)


def active_status_sql(column: str) -> str:
    """Build the status check used by the source mart.

    The source mart uses the Vietnamese business labels ``Hoạt động`` and
    ``Vô hiệu hóa``.
    """
    labels = ", ".join(f"'{label}'" for label in ACTIVE_STATUS_LABELS)
    return f"LOWER(BTRIM(COALESCE({column}, ''))) IN ({labels})"


SKU_IS_ACTIVE_SQL = active_status_sql("sku_status")
BRANCH_IS_ACTIVE_SQL = active_status_sql("branch_status")
ITEM_IS_ACTIVE_SQL = f"({SKU_IS_ACTIVE_SQL} AND {BRANCH_IS_ACTIVE_SQL})"
ITEM_SOURCE_CTE_SQL = f"""
    WITH item_source AS (
        SELECT *,
               {ITEM_IS_ACTIVE_SQL} AS item_is_active,
               BOOL_OR({ITEM_IS_ACTIVE_SQL}) OVER (
                   PARTITION BY base_sku, branch
               ) AS base_is_active
        FROM source.mart_sku_branch_month
    )
"""


def item_status_filter_sql(status: str, active_expression: str = ITEM_IS_ACTIVE_SQL) -> str | None:
    if status == "active":
        return active_expression
    if status == "inactive":
        return f"NOT ({active_expression})"
    return None


def grouped_status_having_sql(status: str) -> str:
    if status == "active":
        return "HAVING BOOL_OR(base_is_active) IS TRUE"
    if status == "inactive":
        return "HAVING BOOL_OR(base_is_active) IS NOT TRUE"
    return ""


def month_range(data_as_of: date, count: int = 12) -> list[date]:
    return [add_months(data_as_of, offset) for offset in range(-(count - 1), 1)]


def inclusive_month_range(start_month: date, end_month: date) -> list[date]:
    start = date(start_month.year, start_month.month, 1)
    end = date(end_month.year, end_month.month, 1)

    if start > end:
        return []

    count = (end.year - start.year) * 12 + (end.month - start.month) + 1

    return [
        add_months(start, offset)
        for offset in range(count)
    ]

@router.get("")
async def list_items(
    q: str | None = None,
    branch_code: str = "__ALL__",
    status: str = "all",
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> dict:
    filters = []
    params: list[object] = []

    # 1. Lọc trước khi gom nhóm (WHERE)
    if branch_code != "__ALL__":
        filters.append("branch = %s")
        params.append(branch_code)

    if q:
        filters.append("(base_sku ILIKE %s OR COALESCE(sku_name, '') ILIKE %s OR bravo_sku ILIKE %s)")
        term = f"%{q.strip()}%"
        params.extend([term, term, term])

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
    status_having = grouped_status_having_sql(status)
    aggregate_status_filter = item_status_filter_sql(status, "item_is_active") or "TRUE"
    history_status_filter = item_status_filter_sql(status)

    offset = (page - 1) * page_size

    async with get_pool().connection() as conn:
        freshness = await (
            await conn.execute("SELECT MAX(month) AS source_max_month FROM source.mart_sku_branch_month")
        ).fetchone()

        if not freshness or not freshness["source_max_month"]:
            raise HTTPException(503, "No published data run")

        data_as_of = freshness["source_max_month"]
        min_12m_month = add_months(data_as_of, -11)

        # 3. Đếm tổng số tổ hợp (base_sku, branch)
        total_query = f"""
            {ITEM_SOURCE_CTE_SQL}
            SELECT COUNT(*) AS total FROM (
                SELECT 1
                FROM item_source
                {where_clause}
                GROUP BY base_sku, branch
                {status_having}
            ) t
        """
        total_row = await (await conn.execute(total_query, params)).fetchone()

        # 4. Kéo danh sách Base SKU x Chi nhánh
        list_query = f"""
            {ITEM_SOURCE_CTE_SQL}
            SELECT
                base_sku,
                branch AS branch_code,
                MAX(sku_name) AS sku_name,
                CASE
                    WHEN BOOL_OR(base_is_active) IS TRUE THEN 'Hoạt động'
                    ELSE 'Vô hiệu hóa'
                END AS status,
                COUNT(DISTINCT CASE WHEN item_is_active THEN bravo_sku END) AS active_variant_count,
                COUNT(DISTINCT CASE WHEN NOT item_is_active THEN bravo_sku END) AS inactive_variant_count,
                COUNT(DISTINCT bravo_sku) AS variant_count,
                MAX(CASE WHEN {aggregate_status_filter} AND quantity > 0 THEN month END) AS last_positive_sale_month,
                COALESCE(SUM(CASE WHEN {aggregate_status_filter} AND month >= %s AND quantity > 0 THEN quantity ELSE 0 END), 0) AS gross_qty_12m,
                COALESCE(SUM(CASE WHEN {aggregate_status_filter} AND month >= %s AND quantity < 0 THEN ABS(quantity) ELSE 0 END), 0) AS return_qty_12m,
                COALESCE(SUM(CASE WHEN {aggregate_status_filter} AND month >= %s THEN quantity ELSE 0 END), 0) AS net_qty_12m
            FROM item_source
            {where_clause}
            GROUP BY base_sku, branch
            {status_having}
            ORDER BY gross_qty_12m DESC, base_sku, branch
            LIMIT %s OFFSET %s
        """
        list_params = [min_12m_month, min_12m_month, min_12m_month, *params, page_size, offset]
        rows = await (await conn.execute(list_query, list_params)).fetchall()

        # Lưu dữ liệu history theo key cặp: (base_sku, branch_code)
        histories: dict[tuple[str, str], dict[date, float]] = {(row["base_sku"], row["branch_code"]): {} for row in rows}

        if rows:
            unique_base_skus = list({row["base_sku"] for row in rows})
            unique_branches = list({row["branch_code"] for row in rows})
            history_status_clause = f"AND {history_status_filter}" if history_status_filter else ""

            history_query = f"""
                SELECT base_sku, branch, month, SUM(CASE WHEN quantity > 0 THEN quantity ELSE 0 END) AS value
                FROM source.mart_sku_branch_month
                WHERE base_sku = ANY(%s) AND branch = ANY(%s) AND month >= %s
                {history_status_clause}
                GROUP BY base_sku, branch, month
                ORDER BY month
            """
            history_rows = await (await conn.execute(history_query, [unique_base_skus, unique_branches, min_12m_month])).fetchall()

            for history in history_rows:
                key = (history["base_sku"], history["branch"])
                if key in histories:
                    histories[key][history["month"]] = float(history["value"] or 0)

    months = month_range(data_as_of)
    items = []
    for row in rows:
        item = dict(row)
        key = (row["base_sku"], row["branch_code"])
        item["trend"] = [
            {"month": month, "value": histories[key].get(month, 0.0)} for month in months
        ]
        items.append(item)

    return {
        "data_as_of_month": data_as_of,
        "page": page,
        "page_size": page_size,
        "total": total_row["total"] if total_row else 0,
        "items": items,
    }
@router.get("/{base_sku}/history")
async def item_history(
    base_sku: str,
    branch_code: str = Query(...),
    start_month: date = Query(date(2024, 1, 1)),
    end_month: date = Query(date(2026, 6, 1)),
) -> dict:

    start = date(
        start_month.year,
        start_month.month,
        1,
    )

    end = date(
        end_month.year,
        end_month.month,
        1,
    )

    if start > end:
        raise HTTPException(
            400,
            "start_month must be before or equal to end_month",
        )

    month_count = (
        (end.year - start.year) * 12
        + (end.month - start.month)
        + 1
    )

    if month_count > 120:
        raise HTTPException(
            400,
            "History range is too large",
        )

    async with get_pool().connection() as conn:

        # Check Base SKU + Branch có tồn tại hay không
        exists = await (
            await conn.execute(
                """
                SELECT 1
                FROM source.mart_sku_branch_month
                WHERE base_sku = %s
                  AND branch = %s
                LIMIT 1
                """,
                [
                    base_sku,
                    branch_code,
                ],
            )
        ).fetchone()

        if not exists:
            raise HTTPException(
                404,
                "SKU + Branch not found",
            )

        # Lấy demand theo từng tháng
        rows = await (
            await conn.execute(
                """
                SELECT
                    month,
                    SUM(
                        CASE
                            WHEN quantity > 0
                            THEN quantity
                            ELSE 0
                        END
                    ) AS value
                FROM source.mart_sku_branch_month
                WHERE base_sku = %s
                  AND branch = %s
                  AND month >= %s
                  AND month <= %s
                GROUP BY month
                ORDER BY month
                """,
                [
                    base_sku,
                    branch_code,
                    start,
                    end,
                ],
            )
        ).fetchall()

    values_by_month = {
    date(
        row["month"].year,
        row["month"].month,
        1,
    ): float(row["value"] or 0)
    for row in rows
}

    months = inclusive_month_range(
        start,
        end,
    )

    return {
        "base_sku": base_sku,
        "branch_code": branch_code,
        "start_month": start,
        "end_month": end,
        "items": [
            {
                "month": month,
                "value": values_by_month.get(
                    month,
                    0.0,
                ),
            }
            for month in months
        ],
    }

# 5. Thêm branch_code vào API variants để biết đang click vào biến thể của chi nhánh nào
@router.get("/{base_sku}/variants")
async def variants(base_sku: str, branch_code: str = Query(...)) -> dict:
    async with get_pool().connection() as conn:
        base = await (
            await conn.execute(
                f"""
                SELECT
                    base_sku,
                    branch AS branch_code,
                    MAX(sku_name) AS sku_name,
                    CASE
                        WHEN BOOL_OR({ITEM_IS_ACTIVE_SQL}) IS TRUE THEN 'Hoạt động'
                        ELSE 'Vô hiệu hóa'
                    END AS status
                FROM source.mart_sku_branch_month
                WHERE base_sku = %s AND branch = %s
                GROUP BY base_sku, branch
                """,
                [base_sku, branch_code],
            )
        ).fetchone()

        if not base:
            raise HTTPException(404, "SKU + Branch not found")

        rows = await (
            await conn.execute(
                f"""
                SELECT
                    bravo_sku,
                    MAX(sku_name) AS sku_name,
                    CASE
                        WHEN BOOL_OR({ITEM_IS_ACTIVE_SQL}) IS TRUE THEN 'Hoạt động'
                        ELSE 'Vô hiệu hóa'
                    END AS status,
                    MIN(month) AS first_observed_month,
                    MAX(month) AS last_observed_month,
                    MAX(CASE WHEN quantity > 0 THEN month END) AS last_positive_sale_month
                FROM source.mart_sku_branch_month
                WHERE base_sku = %s AND branch = %s
                GROUP BY bravo_sku
                ORDER BY status DESC, bravo_sku
                """,
                [base_sku, branch_code],
            )
        ).fetchall()

    return {"base": base, "items": rows}
