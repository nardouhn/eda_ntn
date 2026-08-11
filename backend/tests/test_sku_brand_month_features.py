from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

from refresh_sku_brand_month_enriched import (
    build_features,
    load_google_trends,
    overlap_share,
    rain_flag,
    TET_DATES,
)


CSV_PATH = Path(__file__).resolve().parents[1] / "google_trends_trung_binh.csv"


def feature_map():
    rows = build_features(load_google_trends(CSV_PATH))
    return rows, {(row.thang, row.vung): row for row in rows}


def test_builds_complete_month_region_primary_key() -> None:
    rows, indexed = feature_map()
    assert len(rows) == 30 * 4 == 120
    assert len(indexed) == len(rows)
    assert {row.trend_index for row in rows if row.thang == date(2024, 1, 1)} == {1}
    assert {row.trend_index for row in rows if row.thang == date(2026, 6, 1)} == {30}


def test_google_trends_is_shifted_one_month() -> None:
    _, indexed = feature_map()
    assert indexed[(date(2024, 1, 1), "Khác")].gg_trends_index == Decimal("21.75")
    assert indexed[(date(2024, 1, 1), "Khác")].gg_trends_lag1 == Decimal("25.75")
    assert indexed[(date(2026, 6, 1), "Tây Nam Bộ")].gg_trends_index == Decimal("27.0")
    assert indexed[(date(2026, 6, 1), "Tây Nam Bộ")].gg_trends_lag1 == Decimal("32.75")


def test_rain_flag_uses_agreed_region_calendars() -> None:
    assert rain_flag("Tây Nam Bộ", 5) == 1
    assert rain_flag("Đông Nam Bộ", 11) == 1
    assert rain_flag("Tây Nguyên", 12) == 0
    assert rain_flag("Khác", 7) == 0
    assert rain_flag("Khác", 8) == 1
    assert rain_flag("Khác", 12) == 1


def test_pre_tet_share_matches_january_2025_example() -> None:
    pre_tet = tuple((tet - timedelta(days=30), tet) for tet in TET_DATES)
    assert overlap_share(date(2025, 1, 1), pre_tet) == Decimal("0.903226")


def test_lunar_and_qingming_shares_are_day_weighted() -> None:
    _, indexed = feature_map()
    january_2025 = indexed[(date(2025, 1, 1), "Khác")]
    february_2025 = indexed[(date(2025, 2, 1), "Khác")]
    april_2025 = indexed[(date(2025, 4, 1), "Khác")]
    assert january_2025.ty_trong_thang_gieng == Decimal("0.096774")
    assert february_2025.ty_trong_thang_gieng == Decimal("0.964286")
    assert april_2025.ty_trong_thanh_minh == Decimal("0.533333")
