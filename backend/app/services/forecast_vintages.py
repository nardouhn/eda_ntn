"""Immutable Forecast vintage parsing and PostgreSQL persistence."""

from __future__ import annotations

import csv
import hashlib
import io
from collections import defaultdict
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any

from psycopg.types.json import Json


REQUIRED_COLUMNS = {
    "forecast_origin",
    "target_month",
    "horizon",
    "base_sku",
    "branch_code",
    "forecast_m2",
}
OPTIONAL_COLUMNS = {
    "forecast_m2_original",
    "bottom_up_pair_m2",
    "direct_branch_m2",
    "scale_factor",
    "behavior_route",
    "lifecycle_state",
    "method",
    "is_forecasted",
    "cap_binding",
    "reconciliation_method",
}


class ForecastCsvError(ValueError):
    """A CSV does not meet the immutable Forecast publication contract."""


@dataclass(frozen=True)
class ForecastPairMonth:
    forecast_origin: date
    target_month: date
    horizon: int
    base_sku: str
    branch_code: str
    forecast_m2: Decimal
    forecast_m2_original: Decimal | None
    bottom_up_pair_m2: Decimal | None
    direct_branch_m2: Decimal | None
    scale_factor: Decimal | None
    behavior_route: str | None
    lifecycle_state: str | None
    method: str | None
    is_forecasted: bool
    cap_binding: str | None
    reconciliation_method: str


@dataclass(frozen=True)
class ParsedForecastCsv:
    rows: tuple[ForecastPairMonth, ...]
    forecast_origin: date
    target_months: tuple[date, ...]
    checksum: str
    validation_summary: dict[str, Any]


def add_months(value: date, offset: int) -> date:
    month_index = value.year * 12 + value.month - 1 + offset
    return date(month_index // 12, month_index % 12 + 1, 1)


def _parse_month(value: str, column: str, row_number: int) -> date:
    try:
        parsed = date.fromisoformat(value.strip())
    except ValueError as error:
        raise ForecastCsvError(f"Dòng {row_number}: {column} phải ở dạng YYYY-MM-DD") from error
    if parsed.day != 1:
        raise ForecastCsvError(f"Dòng {row_number}: {column} phải là ngày đầu tháng")
    return parsed


def _optional_decimal(value: str | None, column: str, row_number: int) -> Decimal | None:
    if value is None or not value.strip():
        return None
    try:
        return Decimal(value.strip())
    except InvalidOperation as error:
        raise ForecastCsvError(f"Dòng {row_number}: {column} phải là số thập phân dùng dấu chấm") from error


def _required_decimal(value: str | None, column: str, row_number: int) -> Decimal:
    parsed = _optional_decimal(value, column, row_number)
    if parsed is None:
        raise ForecastCsvError(f"Dòng {row_number}: thiếu {column}")
    return parsed


def _optional_text(value: str | None) -> str | None:
    return value.strip() if value and value.strip() else None


def _parse_bool(value: str | None, row_number: int) -> bool:
    if value is None or not value.strip():
        return True
    normalized = value.strip().lower()
    if normalized in {"1", "true", "t", "yes"}:
        return True
    if normalized in {"0", "false", "f", "no"}:
        return False
    raise ForecastCsvError(f"Dòng {row_number}: is_forecasted phải là true/false")


def parse_forecast_csv(raw: bytes) -> ParsedForecastCsv:
    """Parse, normalize, and validate a canonical Forecast CSV before DB writes."""
    if not raw:
        raise ForecastCsvError("File CSV rỗng")
    checksum = hashlib.sha256(raw).hexdigest()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise ForecastCsvError("CSV phải dùng UTF-8 hoặc UTF-8 with BOM") from error

    reader = csv.DictReader(io.StringIO(text))
    headers = set(reader.fieldnames or [])
    missing = sorted(REQUIRED_COLUMNS - headers)
    if missing:
        raise ForecastCsvError(f"Thiếu cột bắt buộc: {', '.join(missing)}")

    rows: list[ForecastPairMonth] = []
    keys: set[tuple[str, str, date]] = set()
    origins: set[date] = set()
    pair_horizons: dict[tuple[str, str], set[int]] = defaultdict(set)
    for row_number, raw_row in enumerate(reader, start=2):
        base_sku = (raw_row.get("base_sku") or "").strip()
        branch_code = (raw_row.get("branch_code") or "").strip()
        if not base_sku or not branch_code:
            raise ForecastCsvError(f"Dòng {row_number}: base_sku và branch_code không được rỗng")
        if len(base_sku) > 160 or len(branch_code) > 64:
            raise ForecastCsvError(f"Dòng {row_number}: mã SKU hoặc branch vượt giới hạn độ dài")
        origin = _parse_month(raw_row.get("forecast_origin") or "", "forecast_origin", row_number)
        target_month = _parse_month(raw_row.get("target_month") or "", "target_month", row_number)
        try:
            horizon = int((raw_row.get("horizon") or "").strip())
        except ValueError as error:
            raise ForecastCsvError(f"Dòng {row_number}: horizon phải là số nguyên") from error
        if not 1 <= horizon <= 12:
            raise ForecastCsvError(f"Dòng {row_number}: horizon phải nằm trong 1..12")
        if add_months(origin, horizon) != target_month:
            raise ForecastCsvError(f"Dòng {row_number}: target_month không khớp forecast_origin + horizon")
        forecast_m2 = _required_decimal(raw_row.get("forecast_m2"), "forecast_m2", row_number)
        if forecast_m2 < 0:
            raise ForecastCsvError(f"Dòng {row_number}: forecast_m2 không được âm")
        key = (base_sku, branch_code, target_month)
        if key in keys:
            raise ForecastCsvError(f"Dòng {row_number}: trùng khóa Base SKU × branch × tháng")
        keys.add(key)
        origins.add(origin)
        pair_horizons[(base_sku, branch_code)].add(horizon)
        rows.append(
            ForecastPairMonth(
                forecast_origin=origin,
                target_month=target_month,
                horizon=horizon,
                base_sku=base_sku,
                branch_code=branch_code,
                forecast_m2=forecast_m2,
                forecast_m2_original=_optional_decimal(raw_row.get("forecast_m2_original"), "forecast_m2_original", row_number),
                bottom_up_pair_m2=_optional_decimal(raw_row.get("bottom_up_pair_m2"), "bottom_up_pair_m2", row_number),
                direct_branch_m2=_optional_decimal(raw_row.get("direct_branch_m2"), "direct_branch_m2", row_number),
                scale_factor=_optional_decimal(raw_row.get("scale_factor"), "scale_factor", row_number),
                behavior_route=_optional_text(raw_row.get("behavior_route")),
                lifecycle_state=_optional_text(raw_row.get("lifecycle_state")),
                method=_optional_text(raw_row.get("method")),
                is_forecasted=_parse_bool(raw_row.get("is_forecasted"), row_number),
                cap_binding=_optional_text(raw_row.get("cap_binding")),
                reconciliation_method=_optional_text(raw_row.get("reconciliation_method")) or "UNSPECIFIED",
            )
        )
    if not rows:
        raise ForecastCsvError("CSV không có dòng dữ liệu")
    if len(origins) != 1:
        raise ForecastCsvError("CSV phải có đúng một forecast_origin")
    expected_horizons = set(range(1, max(row.horizon for row in rows) + 1))
    incomplete_pairs = [pair for pair, horizons in pair_horizons.items() if horizons != expected_horizons]
    if incomplete_pairs:
        raise ForecastCsvError("Mỗi cặp Base SKU × branch phải có đủ tất cả horizon của publication")

    target_months = tuple(sorted({row.target_month for row in rows}))
    forecast_origin = next(iter(origins))
    return ParsedForecastCsv(
        rows=tuple(rows),
        forecast_origin=forecast_origin,
        target_months=target_months,
        checksum=checksum,
        validation_summary={
            "header_count": len(headers),
            "row_count": len(rows),
            "pair_count": len(pair_horizons),
            "branch_count": len({row.branch_code for row in rows}),
            "base_sku_count": len({row.base_sku for row in rows}),
            "horizon_count": len(target_months),
            "forecast_total_m2": str(sum(row.forecast_m2 for row in rows)),
            "checksum_algorithm": "sha256",
        },
    )


async def import_validated_vintage(
    conn: Any,
    *,
    vintage_key: str,
    primary_signal: str,
    source_file_name: str,
    created_by: str | None,
    parsed: ParsedForecastCsv,
) -> dict[str, Any]:
    """Persist a validated, immutable vintage and all three serving summaries."""
    async with conn.transaction():
        existing = await (
            await conn.execute(
                "select vintage_key from analytics.forecast_vintage where vintage_key=%s or source_sha256=%s",
                [vintage_key, parsed.checksum],
            )
        ).fetchone()
        if existing:
            raise ForecastCsvError("vintage_key hoặc checksum nguồn đã tồn tại; publication không được ghi đè")
        vintage = await (
            await conn.execute(
                """
                insert into analytics.forecast_vintage (
                  vintage_key, status, primary_signal, forecast_origin, target_start_month,
                  target_end_month, horizon_count, source_file_name, source_sha256,
                  source_row_count, validation_summary, created_by
                ) values (%s, 'draft', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                returning id, vintage_key
                """,
                [
                    vintage_key, primary_signal, parsed.forecast_origin, parsed.target_months[0],
                    parsed.target_months[-1], len(parsed.target_months), source_file_name,
                    parsed.checksum, len(parsed.rows), Json(parsed.validation_summary), created_by,
                ],
            )
        ).fetchone()
        vintage_id = vintage["id"]
        async with conn.cursor() as cursor:
            await cursor.executemany(
                """
            insert into analytics.forecast_pair_month (
              vintage_id, base_sku, branch_code, target_month, horizon, forecast_m2,
              forecast_m2_original, bottom_up_pair_m2, direct_branch_m2, scale_factor,
              behavior_route, lifecycle_state, method, is_forecasted, cap_binding, reconciliation_method
            ) values (%(vintage_id)s, %(base_sku)s, %(branch_code)s, %(target_month)s, %(horizon)s,
              %(forecast_m2)s, %(forecast_m2_original)s, %(bottom_up_pair_m2)s, %(direct_branch_m2)s,
              %(scale_factor)s, %(behavior_route)s, %(lifecycle_state)s, %(method)s,
              %(is_forecasted)s, %(cap_binding)s, %(reconciliation_method)s)
            """,
                [{"vintage_id": vintage_id, **row.__dict__} for row in parsed.rows],
            )
        await conn.execute(
            """
            insert into analytics.forecast_branch_month (
              vintage_id, branch_code, target_month, forecast_m2, forecast_m2_original,
              direct_branch_m2, base_sku_count, pair_count, forecasted_pair_count, cap_bound_pair_months
            )
            select vintage_id, branch_code, target_month, sum(forecast_m2),
              sum(coalesce(bottom_up_pair_m2, forecast_m2_original)),
              max(direct_branch_m2), count(distinct base_sku), count(*),
              count(*) filter (where is_forecasted), count(*) filter (where coalesce(cap_binding, 'NO_CAP') <> 'NO_CAP')
            from analytics.forecast_pair_month where vintage_id=%s
            group by vintage_id, branch_code, target_month
            """,
            [vintage_id],
        )
        await conn.execute(
            """
            insert into analytics.forecast_base_sku_month (
              vintage_id, base_sku, target_month, forecast_m2, branch_count, pair_count
            )
            select vintage_id, base_sku, target_month, sum(forecast_m2),
              count(distinct branch_code), count(*)
            from analytics.forecast_pair_month where vintage_id=%s
            group by vintage_id, base_sku, target_month
            """,
            [vintage_id],
        )
        await conn.execute(
            """
            insert into analytics.forecast_portfolio_month (
              vintage_id, target_month, forecast_m2, forecast_m2_original, direct_branch_m2,
              branch_count, base_sku_count, pair_count
            )
            select pair.vintage_id, pair.target_month, sum(pair.forecast_m2),
              sum(coalesce(pair.bottom_up_pair_m2, pair.forecast_m2_original)),
              branch_totals.direct_branch_m2, count(distinct pair.branch_code), count(distinct pair.base_sku), count(*)
            from analytics.forecast_pair_month pair
            join (
              select vintage_id, target_month, sum(direct_branch_m2) as direct_branch_m2
              from analytics.forecast_branch_month where vintage_id=%s
              group by vintage_id, target_month
            ) branch_totals using (vintage_id, target_month)
            where pair.vintage_id=%s
            group by pair.vintage_id, pair.target_month, branch_totals.direct_branch_m2
            """,
            [vintage_id, vintage_id],
        )
        check = await (
            await conn.execute(
                """
                select
                  (select sum(forecast_m2) from analytics.forecast_pair_month where vintage_id=%s) as pair_total,
                  (select sum(forecast_m2) from analytics.forecast_branch_month where vintage_id=%s) as branch_total,
                  (select sum(forecast_m2) from analytics.forecast_base_sku_month where vintage_id=%s) as sku_total,
                  (select sum(forecast_m2) from analytics.forecast_portfolio_month where vintage_id=%s) as portfolio_total
                """,
                [vintage_id, vintage_id, vintage_id, vintage_id],
            )
        ).fetchone()
        if len({check["pair_total"], check["branch_total"], check["sku_total"], check["portfolio_total"]}) != 1:
            raise ForecastCsvError("Đối soát tổng Pair = Branch = SKU = Portfolio thất bại")
        await conn.execute(
            "update analytics.forecast_vintage set status='validated', validated_at=now() where id=%s",
            [vintage_id],
        )
    return {"vintage_key": vintage["vintage_key"], "status": "validated", **parsed.validation_summary}


async def promote_vintage(conn: Any, vintage_key: str) -> dict[str, Any]:
    """Promote one validated vintage and retain the former version as superseded."""
    async with conn.transaction():
        vintage = await (
            await conn.execute(
                "select id, vintage_key, status from analytics.forecast_vintage where vintage_key=%s for update",
                [vintage_key],
            )
        ).fetchone()
        if not vintage:
            raise ForecastCsvError("Không tìm thấy forecast vintage")
        if vintage["status"] != "validated":
            raise ForecastCsvError("Chỉ vintage đã validated mới được promote")
        await conn.execute(
            "update analytics.forecast_vintage set status='superseded' where status='promoted'",
        )
        await conn.execute(
            "update analytics.forecast_vintage set status='promoted', promoted_at=now() where id=%s",
            [vintage["id"]],
        )
    return {"vintage_key": vintage_key, "status": "promoted"}
