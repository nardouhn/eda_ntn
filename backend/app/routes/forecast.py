from __future__ import annotations

import secrets
from collections import defaultdict
from datetime import date
from re import fullmatch
from typing import Any

from fastapi import APIRouter, File, Form, Header, HTTPException, Query, UploadFile, status

from app.config import get_settings
from app.db import get_pool
from app.services.forecast import add_months, build_forecast_series
from app.services.forecast_vintages import ForecastCsvError, import_validated_vintage, parse_forecast_csv, promote_vintage


router = APIRouter(prefix="/forecast", tags=["forecast"])
settings = get_settings()


def _number(value: Any) -> float | None:
    return float(value) if value is not None else None


def _month(value: date) -> str:
    return value.isoformat()


async def _resolve_vintage(conn: Any, vintage_key: str | None) -> dict[str, Any]:
    if vintage_key:
        row = await (
            await conn.execute(
                """
                select * from analytics.forecast_vintage
                where vintage_key=%s and status in ('promoted', 'superseded')
                """,
                [vintage_key],
            )
        ).fetchone()
    else:
        row = await (
            await conn.execute(
                "select * from analytics.forecast_vintage where status='promoted'"
            )
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Không có Forecast vintage đã được promote")
    return row


def _require_import_token(token: str | None) -> None:
    if not settings.forecast_import_token:
        raise HTTPException(status_code=503, detail="Forecast import chưa được cấu hình trên server")
    if not token or not secrets.compare_digest(token, settings.forecast_import_token):
        raise HTTPException(status_code=401, detail="Không có quyền import Forecast")


@router.get("/vintages")
async def list_vintages() -> dict[str, Any]:
    """List historical publications available to the Forecast diagnostics view."""
    async with get_pool().connection() as conn:
        rows = await (
            await conn.execute(
                """
                select vintage_key, status, primary_signal, forecast_origin, target_start_month,
                  target_end_month, horizon_count, unit, source_file_name, source_sha256,
                  source_row_count, validation_summary, created_at, validated_at, promoted_at
                from analytics.forecast_vintage
                where status in ('promoted', 'superseded')
                order by promoted_at desc nulls last, created_at desc
                """
            )
        ).fetchall()
    return {"vintages": rows}


@router.get("/vintages/manifest")
async def vintage_manifest(vintage_key: str | None = Query(default=None)) -> dict[str, Any]:
    """Serve a publication summary without sending the full pair-level grain."""
    async with get_pool().connection() as conn:
        vintage = await _resolve_vintage(conn, vintage_key)
        vintage_id = vintage["id"]
        portfolio_rows = await (
            await conn.execute(
                """
                select target_month, forecast_m2, forecast_m2_original, direct_branch_m2
                from analytics.forecast_portfolio_month where vintage_id=%s order by target_month
                """,
                [vintage_id],
            )
        ).fetchall()
        branch_rows = await (
            await conn.execute(
                """
                select branch_code, target_month, forecast_m2, forecast_m2_original, direct_branch_m2,
                  base_sku_count, pair_count, forecasted_pair_count, cap_bound_pair_months
                from analytics.forecast_branch_month where vintage_id=%s order by branch_code, target_month
                """,
                [vintage_id],
            )
        ).fetchall()
        sku_rows = await (
            await conn.execute(
                """
                select base_sku, target_month, forecast_m2, branch_count, pair_count
                from analytics.forecast_base_sku_month where vintage_id=%s order by base_sku, target_month
                """,
                [vintage_id],
            )
        ).fetchall()
        diagnostics = await (
            await conn.execute(
                """
                select min(scale_factor) as scale_min, max(scale_factor) as scale_max,
                  count(*) filter (where coalesce(cap_binding, 'NO_CAP') <> 'NO_CAP') as cap_binding_pair_months,
                  min(reconciliation_method) as reconciliation_method
                from analytics.forecast_pair_month where vintage_id=%s
                """,
                [vintage_id],
            )
        ).fetchone()

    months = [_month(row["target_month"]) for row in portfolio_rows]
    branch_map: dict[str, dict[str, Any]] = {}
    for row in branch_rows:
        item = branch_map.setdefault(
            row["branch_code"],
            {"branch_code": row["branch_code"], "values": [], "original_values": [], "direct_values": [], "base_sku_count": 0, "pair_count": 0, "forecasted_pairs": 0, "cap_bound_pair_months": 0},
        )
        item["values"].append(_number(row["forecast_m2"]) or 0)
        item["original_values"].append(_number(row["forecast_m2_original"]) or 0)
        item["direct_values"].append(_number(row["direct_branch_m2"]) or 0)
        item["base_sku_count"] = max(item["base_sku_count"], row["base_sku_count"])
        item["pair_count"] = max(item["pair_count"], row["pair_count"])
        item["forecasted_pairs"] = max(item["forecasted_pairs"], row["forecasted_pair_count"])
        item["cap_bound_pair_months"] += row["cap_bound_pair_months"]
    sku_map: dict[str, dict[str, Any]] = {}
    for row in sku_rows:
        item = sku_map.setdefault(row["base_sku"], {"sku": row["base_sku"], "values": [], "branch_count": 0, "pair_count": 0})
        item["values"].append(_number(row["forecast_m2"]) or 0)
        item["branch_count"] = max(item["branch_count"], row["branch_count"])
        item["pair_count"] = max(item["pair_count"], row["pair_count"])
    validation_summary = vintage["validation_summary"] or {}
    return {
        "source": "Forecast API",
        "vintage_id": vintage["vintage_key"],
        "vintage_status": vintage["status"],
        "source_run": vintage["vintage_key"],
        "source_file": vintage["source_file_name"],
        "source_checksum": vintage["source_sha256"],
        "forecast_origin": _month(vintage["forecast_origin"]),
        "months": months,
        "unit": vintage["unit"],
        "primary_signal": vintage["primary_signal"],
        "pair_count": validation_summary.get("pair_count", 0),
        "base_sku_count": validation_summary.get("base_sku_count", 0),
        "branch_count": validation_summary.get("branch_count", 0),
        "portfolio": {
            "values": [_number(row["forecast_m2"]) or 0 for row in portfolio_rows],
            "original_values": [_number(row["forecast_m2_original"]) or 0 for row in portfolio_rows],
            "direct_values": [_number(row["direct_branch_m2"]) or 0 for row in portfolio_rows],
        },
        "branches": sorted(branch_map.values(), key=lambda item: sum(item["values"]), reverse=True),
        "skus": sorted(sku_map.values(), key=lambda item: sum(item["values"]), reverse=True),
        "diagnostics": {
            "reconciliation_method": diagnostics["reconciliation_method"] or "UNSPECIFIED",
            "scale_range": [_number(diagnostics["scale_min"]) or 0, _number(diagnostics["scale_max"]) or 0],
            "cap_binding_pair_months": diagnostics["cap_binding_pair_months"],
            "conservation_status": "PASS",
            "actual_status": "PENDING_TARGET_CLOSE",
        },
    }


@router.get("/vintages/{vintage_key}/branches/{branch_code}")
async def vintage_branch_detail(vintage_key: str, branch_code: str) -> dict[str, Any]:
    async with get_pool().connection() as conn:
        vintage = await _resolve_vintage(conn, vintage_key)
        rows = await (
            await conn.execute(
                """
                select base_sku, target_month, forecast_m2, is_forecasted, behavior_route,
                  method, lifecycle_state, cap_binding
                from analytics.forecast_pair_month
                where vintage_id=%s and branch_code=%s
                order by base_sku, target_month
                """,
                [vintage["id"], branch_code],
            )
        ).fetchall()
    if not rows:
        raise HTTPException(status_code=404, detail="Không có phân bổ Base SKU cho chi nhánh này")
    pairs: dict[str, dict[str, Any]] = {}
    values = [0.0] * len({row["target_month"] for row in rows})
    for row in rows:
        item = pairs.setdefault(
            row["base_sku"],
            {"sku": row["base_sku"], "values": [], "forecasted": False, "route": row["behavior_route"] or "—", "method": row["method"] or "—", "lifecycle_state": row["lifecycle_state"] or "—", "cap_binding": []},
        )
        value = _number(row["forecast_m2"]) or 0
        item["values"].append(value)
        item["forecasted"] = item["forecasted"] or row["is_forecasted"]
        if row["cap_binding"] and row["cap_binding"] not in item["cap_binding"]:
            item["cap_binding"].append(row["cap_binding"])
        values[sorted({candidate["target_month"] for candidate in rows}).index(row["target_month"])] += value
    return {"branch_code": branch_code, "values": values, "pairs": sorted(pairs.values(), key=lambda item: sum(item["values"]), reverse=True)}


@router.post("/vintages/import", status_code=status.HTTP_201_CREATED)
async def import_vintage(
    file: UploadFile = File(...),
    vintage_key: str = Form(...),
    primary_signal: str = Form(...),
    x_forecast_import_token: str | None = Header(default=None),
    x_forecast_import_actor: str | None = Header(default=None),
) -> dict[str, Any]:
    """Create a new validated publication. The endpoint never overwrites one."""
    _require_import_token(x_forecast_import_token)
    if not fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{2,119}", vintage_key):
        raise HTTPException(status_code=422, detail="vintage_key chỉ gồm chữ, số, _ hoặc - (3–120 ký tự)")
    if not primary_signal.strip() or len(primary_signal) > 160:
        raise HTTPException(status_code=422, detail="primary_signal phải có 1–160 ký tự")
    if file.content_type not in {"text/csv", "application/csv", "application/vnd.ms-excel", None}:
        raise HTTPException(status_code=415, detail="Chỉ nhận file CSV")
    raw = await file.read(settings.forecast_upload_max_bytes + 1)
    if len(raw) > settings.forecast_upload_max_bytes:
        raise HTTPException(status_code=413, detail="CSV vượt giới hạn dung lượng của server")
    try:
        parsed = parse_forecast_csv(raw)
        async with get_pool().connection() as conn:
            result = await import_validated_vintage(
                conn,
                vintage_key=vintage_key,
                primary_signal=primary_signal.strip(),
                source_file_name=(file.filename or "forecast.csv").replace("\\", "/").rsplit("/", 1)[-1],
                created_by=(x_forecast_import_actor or "").strip()[:160] or None,
                parsed=parsed,
            )
    except ForecastCsvError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    finally:
        await file.close()
    return result


@router.post("/vintages/{vintage_key}/promote")
async def promote_vintage_endpoint(
    vintage_key: str,
    x_forecast_import_token: str | None = Header(default=None),
) -> dict[str, Any]:
    _require_import_token(x_forecast_import_token)
    try:
        async with get_pool().connection() as conn:
            return await promote_vintage(conn, vintage_key)
    except ForecastCsvError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


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
