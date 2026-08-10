from __future__ import annotations

from fastapi import APIRouter

from app.db import get_pool


router = APIRouter(prefix="/metadata", tags=["metadata"])


@router.get("/branches")
async def branches(status: str = "active") -> dict:
    clauses = []
    params: list[str] = []
    if status in {"active", "inactive"}:
        clauses.append("status = %s")
        params.append(status)
    where = f"where {' and '.join(clauses)}" if clauses else ""
    query = f"""
        select
          b.branch_code,
          b.branch_name,
          b.region,
          b.brand,
          b.status
        from analytics.dim_branch b
        {where}
        order by exists (
          select 1 from analytics.mart_item_summary s
          where s.branch_code = b.branch_code
        ) desc, b.branch_code
    """
    async with get_pool().connection() as conn:
        rows = await (await conn.execute(query, params)).fetchall()
        freshness = await (
            await conn.execute(
                "select source_max_month from analytics.pipeline_run where status='published' order by finished_at desc limit 1"
            )
        ).fetchone()
    return {"data_as_of_month": freshness["source_max_month"] if freshness else None, "items": rows}
