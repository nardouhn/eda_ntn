from __future__ import annotations

from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Query

from app.db import get_pool
from app.services.forecast import add_months, build_forecast_series


router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.get("/matrix")
async def matrix(
    branch_code: str,
    limit: int = Query(30, ge=1, le=100),
    horizon: int = Query(3, ge=1, le=6),
) -> dict:
    async with get_pool().connection() as conn:
        freshness = await (
            await conn.execute(
                "select source_max_month from analytics.pipeline_run where status='published' order by finished_at desc limit 1"
            )
        ).fetchone()
        data_as_of: date = freshness["source_max_month"]
        top_rows = await (
            await conn.execute(
                """
                select s.base_sku, b.sku_name, b.status, s.gross_qty_12m
                from analytics.mart_item_summary s
                join analytics.dim_base_sku b using(base_sku)
                where s.branch_code=%s and b.product_type='L1'
                order by s.gross_qty_12m desc limit %s
                """,
                [branch_code, limit],
            )
        ).fetchall()
        base_skus = [row["base_sku"] for row in top_rows]
        history_rows = []
        if base_skus:
            history_rows = await (
                await conn.execute(
                    """
                    select base_sku, month, gross_positive_qty
                    from analytics.mart_item_branch_month
                    where branch_code=%s and base_sku=any(%s) and month >= %s
                    order by base_sku, month
                    """,
                    [branch_code, base_skus, add_months(data_as_of, -29)],
                )
            ).fetchall()
        branch = await (
            await conn.execute(
                "select branch_code,branch_name,region from analytics.dim_branch where branch_code=%s",
                [branch_code],
            )
        ).fetchone()

    histories: dict[str, dict[date, float]] = defaultdict(dict)
    for row in history_rows:
        histories[row["base_sku"]][row["month"]] = float(row["gross_positive_qty"])

    rows = []
    aggregate_forecast = 0.0
    aggregate_actual = 0.0
    aggregate_abs_error = 0.0
    for item in top_rows:
        method, points, metrics = build_forecast_series(histories[item["base_sku"]], data_as_of, horizon=horizon)
        cells = []
        for point in points:
            cells.append(
                {
                    "month": point.month,
                    "period_type": point.period_type,
                    "forecast": point.forecast,
                    "actual": point.actual,
                    "accuracy": point.accuracy,
                    "lower": max(0.0, point.forecast - 1.28 * metrics["residual_scale"]) if point.forecast is not None else None,
                    "upper": point.forecast + 1.28 * metrics["residual_scale"] if point.forecast is not None else None,
                }
            )
            if point.period_type == "past" and point.forecast is not None and point.actual is not None:
                aggregate_forecast += point.forecast
                aggregate_actual += point.actual
                aggregate_abs_error += abs(point.forecast - point.actual)
        rows.append({**item, "method": method, "metrics": metrics, "cells": cells})

    return {
        "data_as_of_month": data_as_of,
        "branch": branch,
        "metrics": {
            "forecast_total": aggregate_forecast,
            "actual_total": aggregate_actual,
            "wape": aggregate_abs_error / aggregate_actual if aggregate_actual > 0 else None,
        },
        "rows": rows,
    }
