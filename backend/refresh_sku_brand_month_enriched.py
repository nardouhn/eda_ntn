r"""Build month-region features and enrich source.mart_sku_branch_month.

Run from ``backend`` with a write-capable Supabase ``DATABASE_URL``:

    .\.venv\Scripts\python.exe refresh_sku_brand_month_enriched.py

The script only writes to two analytics relations owned by this pipeline:
``analytics.dim_month_region_features`` and
``analytics.mart_sku_brand_month_enriched``. The source mart is read-only.
"""

from __future__ import annotations

import argparse
import calendar
import csv
import os
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal
from pathlib import Path

import psycopg
from dotenv import load_dotenv


SOURCE_TABLE = "source.mart_sku_branch_month"
FEATURE_TABLE = "analytics.dim_month_region_features"
ENRICHED_TABLE = "analytics.mart_sku_brand_month_enriched"
START_MONTH = date(2024, 1, 1)
END_MONTH = date(2026, 6, 1)
REGIONS = ("Khác", "Tây Nguyên", "Đông Nam Bộ", "Tây Nam Bộ")
FEATURE_COLUMNS = (
    "thang",
    "vung",
    "trend_index",
    "gg_trends_index",
    "gg_trends_lag1",
    "flag_mua_mua",
    "ty_trong_chay_tet",
    "ty_trong_thang_gieng",
    "ty_trong_thang_co_hon",
    "ty_trong_thanh_minh",
    "feature_refreshed_at",
)

# Các khoảng ngày là [start, end), tức ngày end không thuộc sự kiện.
TET_DATES = (date(2024, 2, 10), date(2025, 1, 29), date(2026, 2, 17))
LUNAR_MONTH_1 = (
    (date(2024, 2, 10), date(2024, 3, 10)),
    (date(2025, 1, 29), date(2025, 2, 28)),
    (date(2026, 2, 17), date(2026, 3, 19)),
)
LUNAR_MONTH_7 = (
    (date(2024, 8, 4), date(2024, 9, 3)),
    (date(2025, 8, 23), date(2025, 9, 22)),
    (date(2026, 8, 13), date(2026, 9, 11)),
)
# Thanh Minh bắt đầu tại tiết Thanh Minh và kết thúc trước tiết Cốc Vũ.
QINGMING = (
    (date(2024, 4, 4), date(2024, 4, 19)),
    (date(2025, 4, 4), date(2025, 4, 20)),
    (date(2026, 4, 5), date(2026, 4, 20)),
)


@dataclass(frozen=True)
class MonthRegionFeature:
    thang: date
    vung: str
    trend_index: int
    gg_trends_index: Decimal
    gg_trends_lag1: Decimal
    flag_mua_mua: int
    ty_trong_chay_tet: Decimal
    ty_trong_thang_gieng: Decimal
    ty_trong_thang_co_hon: Decimal
    ty_trong_thanh_minh: Decimal


def add_months(value: date, offset: int) -> date:
    index = value.year * 12 + value.month - 1 + offset
    return date(index // 12, index % 12 + 1, 1)


def month_starts(start: date = START_MONTH, end: date = END_MONTH) -> list[date]:
    result: list[date] = []
    current = start
    while current <= end:
        result.append(current)
        current = add_months(current, 1)
    return result


def overlap_share(month: date, intervals: tuple[tuple[date, date], ...]) -> Decimal:
    month_end = add_months(month, 1)
    overlap_days = sum(
        max(0, (min(month_end, end) - max(month, start)).days)
        for start, end in intervals
    )
    days = calendar.monthrange(month.year, month.month)[1]
    return (Decimal(overlap_days) / Decimal(days)).quantize(Decimal("0.000001"))


def load_google_trends(path: Path) -> dict[date, Decimal]:
    values: dict[date, Decimal] = {}
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != ["Time", "Trung_Binh_Trend"]:
            raise ValueError(
                "Google Trends CSV phải có đúng hai cột Time,Trung_Binh_Trend"
            )
        for row in reader:
            parsed = datetime.strptime(row["Time"], "%m/%d/%Y").date()
            month = parsed.replace(day=1)
            if month in values:
                raise ValueError(f"Google Trends bị trùng tháng {month:%Y-%m}")
            values[month] = Decimal(row["Trung_Binh_Trend"])
    return values


def rain_flag(region: str, month_number: int) -> int:
    if region == "Khác":
        return int(8 <= month_number <= 12)
    return int(5 <= month_number <= 11)


def build_features(trends: dict[date, Decimal]) -> list[MonthRegionFeature]:
    months = month_starts()
    missing_current = [month for month in months if month not in trends]
    missing_lags = [month for month in months if add_months(month, -1) not in trends]
    if missing_current or missing_lags:
        current_text = ", ".join(month.strftime("%Y-%m") for month in missing_current)
        lag_text = ", ".join(month.strftime("%Y-%m") for month in missing_lags)
        raise ValueError(
            "Google Trends thiếu dữ liệu; "
            f"current=[{current_text}], nguồn lag1=[{lag_text}]"
        )

    pre_tet = tuple((tet - timedelta(days=30), tet) for tet in TET_DATES)
    rows: list[MonthRegionFeature] = []
    for trend_index, month in enumerate(months, start=1):
        common = {
            "thang": month,
            "trend_index": trend_index,
            "gg_trends_index": trends[month],
            "gg_trends_lag1": trends[add_months(month, -1)],
            "ty_trong_chay_tet": overlap_share(month, pre_tet),
            "ty_trong_thang_gieng": overlap_share(month, LUNAR_MONTH_1),
            "ty_trong_thang_co_hon": overlap_share(month, LUNAR_MONTH_7),
            "ty_trong_thanh_minh": overlap_share(month, QINGMING),
        }
        for region in REGIONS:
            rows.append(
                MonthRegionFeature(
                    vung=region,
                    flag_mua_mua=rain_flag(region, month.month),
                    **common,
                )
            )
    return rows


def load_database_url() -> str:
    load_dotenv(Path(__file__).resolve().parent / ".env")
    value = os.getenv("DATABASE_URL", "").strip()
    if not value:
        raise RuntimeError("DATABASE_URL is required in backend/.env")
    return value


def relation_columns(connection: psycopg.Connection, schema: str, table: str) -> list[str]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = %s AND table_name = %s
            ORDER BY ordinal_position
            """,
            [schema, table],
        )
        return [row[0] for row in cursor.fetchall()]


def ensure_source_contract(connection: psycopg.Connection) -> list[str]:
    source_columns = relation_columns(connection, "source", "mart_sku_branch_month")
    if not source_columns:
        raise RuntimeError(f"Không tìm thấy {SOURCE_TABLE}")
    missing = {"month", "region"} - set(source_columns)
    if missing:
        raise RuntimeError(f"{SOURCE_TABLE} thiếu cột bắt buộc: {sorted(missing)}")
    collisions = set(source_columns) & set(FEATURE_COLUMNS)
    if collisions:
        raise RuntimeError(
            f"Tên cột feature trùng với bảng nguồn: {sorted(collisions)}"
        )
    return source_columns


def feature_rows(rows: list[MonthRegionFeature]) -> list[tuple[object, ...]]:
    return [
        (
            row.thang,
            row.vung,
            row.trend_index,
            row.gg_trends_index,
            row.gg_trends_lag1,
            row.flag_mua_mua,
            row.ty_trong_chay_tet,
            row.ty_trong_thang_gieng,
            row.ty_trong_thang_co_hon,
            row.ty_trong_thanh_minh,
        )
        for row in rows
    ]


FEATURE_DDL = """
CREATE TABLE IF NOT EXISTS analytics.dim_month_region_features (
    thang date NOT NULL,
    vung text NOT NULL,
    trend_index integer NOT NULL CHECK (trend_index > 0),
    gg_trends_index numeric(10, 3) NOT NULL,
    gg_trends_lag1 numeric(10, 3) NOT NULL,
    flag_mua_mua smallint NOT NULL CHECK (flag_mua_mua IN (0, 1)),
    ty_trong_chay_tet numeric(8, 6) NOT NULL CHECK (ty_trong_chay_tet BETWEEN 0 AND 1),
    ty_trong_thang_gieng numeric(8, 6) NOT NULL CHECK (ty_trong_thang_gieng BETWEEN 0 AND 1),
    ty_trong_thang_co_hon numeric(8, 6) NOT NULL CHECK (ty_trong_thang_co_hon BETWEEN 0 AND 1),
    ty_trong_thanh_minh numeric(8, 6) NOT NULL CHECK (ty_trong_thanh_minh BETWEEN 0 AND 1),
    feature_refreshed_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (thang, vung),
    CHECK (vung IN ('Khác', 'Tây Nguyên', 'Đông Nam Bộ', 'Tây Nam Bộ'))
);
ALTER TABLE analytics.dim_month_region_features
    ADD COLUMN IF NOT EXISTS gg_trends_index numeric(10, 3);
COMMENT ON TABLE analytics.dim_month_region_features IS
    'Feature ngoại sinh tháng x vùng cho forecast; kỳ chuẩn 2024-01 đến 2026-06.';
"""


REGION_NORMALIZATION_SQL = """
CASE
    WHEN UPPER(BTRIM(source.region)) IN ('TNB', 'TÂY NAM BỘ') THEN 'Tây Nam Bộ'
    WHEN UPPER(BTRIM(source.region)) IN ('DNB', 'ĐÔNG NAM BỘ') THEN 'Đông Nam Bộ'
    WHEN UPPER(BTRIM(source.region)) IN ('MT-TNG', 'TÂY NGUYÊN') THEN 'Tây Nguyên'
    ELSE 'Khác'
END
"""


def refresh(database_url: str, rows: list[MonthRegionFeature], recreate: bool) -> tuple[int, int]:
    with psycopg.connect(database_url) as connection:
        source_columns = ensure_source_contract(connection)
        with connection.cursor() as cursor:
            cursor.execute(FEATURE_DDL)
            cursor.execute(
                "DELETE FROM analytics.dim_month_region_features WHERE thang BETWEEN %s AND %s",
                [START_MONTH, END_MONTH],
            )
            cursor.executemany(
                """
                INSERT INTO analytics.dim_month_region_features (
                    thang, vung, trend_index, gg_trends_index, gg_trends_lag1,
                    flag_mua_mua,
                    ty_trong_chay_tet, ty_trong_thang_gieng,
                    ty_trong_thang_co_hon, ty_trong_thanh_minh
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                feature_rows(rows),
            )
            cursor.execute(
                "ALTER TABLE analytics.dim_month_region_features "
                "ALTER COLUMN gg_trends_index SET NOT NULL"
            )

            if recreate:
                cursor.execute("DROP TABLE IF EXISTS analytics.mart_sku_brand_month_enriched")

            cursor.execute(
                f"""
                CREATE TABLE IF NOT EXISTS analytics.mart_sku_brand_month_enriched AS
                SELECT source.*, feature.thang, feature.vung, feature.trend_index,
                       feature.gg_trends_index, feature.gg_trends_lag1,
                       feature.flag_mua_mua,
                       feature.ty_trong_chay_tet, feature.ty_trong_thang_gieng,
                       feature.ty_trong_thang_co_hon, feature.ty_trong_thanh_minh,
                       now()::timestamptz AS feature_refreshed_at
                FROM {SOURCE_TABLE} source
                JOIN analytics.dim_month_region_features feature
                  ON feature.thang = source.month::date
                 AND feature.vung = {REGION_NORMALIZATION_SQL}
                WHERE FALSE
                """
            )

            target_columns = relation_columns(
                connection, "analytics", "mart_sku_brand_month_enriched"
            )
            expected_columns = [*source_columns, *FEATURE_COLUMNS]
            if target_columns != expected_columns:
                raise RuntimeError(
                    "Schema mart enriched không còn khớp bảng nguồn. "
                    "Chạy lại với --recreate sau khi kiểm tra dependency."
                )

            cursor.execute("TRUNCATE TABLE analytics.mart_sku_brand_month_enriched")
            cursor.execute(
                f"""
                INSERT INTO analytics.mart_sku_brand_month_enriched
                SELECT source.*, feature.thang, feature.vung, feature.trend_index,
                       feature.gg_trends_index, feature.gg_trends_lag1,
                       feature.flag_mua_mua,
                       feature.ty_trong_chay_tet, feature.ty_trong_thang_gieng,
                       feature.ty_trong_thang_co_hon, feature.ty_trong_thanh_minh,
                       now()::timestamptz AS feature_refreshed_at
                FROM {SOURCE_TABLE} source
                JOIN analytics.dim_month_region_features feature
                  ON feature.thang = source.month::date
                 AND feature.vung = {REGION_NORMALIZATION_SQL}
                WHERE source.month::date BETWEEN %s AND %s
                """,
                [START_MONTH, END_MONTH],
            )
            enriched_count = cursor.rowcount
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS mart_sku_brand_month_enriched_month_region_idx "
                "ON analytics.mart_sku_brand_month_enriched (thang, vung)"
            )
            cursor.execute(
                "COMMENT ON TABLE analytics.mart_sku_brand_month_enriched IS "
                "'Bản vật lý mở rộng của source.mart_sku_branch_month với feature tháng x vùng.'"
            )
        connection.commit()
    return len(rows), enriched_count


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--trends-file",
        type=Path,
        default=Path(__file__).resolve().parent / "google_trends_trung_binh.csv",
    )
    parser.add_argument(
        "--recreate",
        action="store_true",
        help="Tạo lại riêng mart enriched khi schema nguồn đã đổi.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Chỉ sinh và kiểm tra feature, không kết nối Supabase.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    trends = load_google_trends(args.trends_file)
    rows = build_features(trends)
    if args.dry_run:
        print(f"Validated {len(rows)} month-region feature rows; no database writes.")
        return
    feature_count, enriched_count = refresh(load_database_url(), rows, args.recreate)
    print(f"Refreshed {FEATURE_TABLE}: {feature_count:,} rows")
    print(f"Refreshed {ENRICHED_TABLE}: {enriched_count:,} rows")


if __name__ == "__main__":
    main()
