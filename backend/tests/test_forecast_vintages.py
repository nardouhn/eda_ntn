from __future__ import annotations

import hashlib

import pytest

from app.services.forecast_vintages import ForecastCsvError, parse_forecast_csv


HEADER = "forecast_origin,target_month,horizon,base_sku,branch_code,forecast_m2,is_forecasted,reconciliation_method\n"


def csv_rows(*rows: str) -> bytes:
    return (HEADER + "\n".join(rows) + "\n").encode("utf-8")


def valid_csv() -> bytes:
    return csv_rows(
        "2026-06-01,2026-07-01,1,SKU-A,001,12.2,true,R2_CAP30",
        "2026-06-01,2026-08-01,2,SKU-A,001,11.1,true,R2_CAP30",
        "2026-06-01,2026-09-01,3,SKU-A,001,10.0,true,R2_CAP30",
        "2026-06-01,2026-07-01,1,SKU-B,001,4,false,R2_CAP30",
        "2026-06-01,2026-08-01,2,SKU-B,001,5,false,R2_CAP30",
        "2026-06-01,2026-09-01,3,SKU-B,001,6,false,R2_CAP30",
    )


def test_parse_forecast_csv_validates_complete_pair_horizons_and_checksum() -> None:
    raw = valid_csv()
    parsed = parse_forecast_csv(raw)

    assert parsed.forecast_origin.isoformat() == "2026-06-01"
    assert [month.isoformat() for month in parsed.target_months] == ["2026-07-01", "2026-08-01", "2026-09-01"]
    assert len(parsed.rows) == 6
    assert parsed.validation_summary["pair_count"] == 2
    assert parsed.validation_summary["forecast_total_m2"] == "48.3"
    assert parsed.checksum == hashlib.sha256(raw).hexdigest()


def test_parse_forecast_csv_rejects_duplicate_pair_month() -> None:
    raw = valid_csv() + b"2026-06-01,2026-07-01,1,SKU-A,001,3,true,R2_CAP30\n"

    with pytest.raises(ForecastCsvError, match="trùng khóa"):
        parse_forecast_csv(raw)


def test_parse_forecast_csv_rejects_target_not_matching_origin_and_horizon() -> None:
    raw = csv_rows(
        "2026-06-01,2026-08-01,1,SKU-A,001,12,true,R2_CAP30",
    )

    with pytest.raises(ForecastCsvError, match="không khớp"):
        parse_forecast_csv(raw)


def test_parse_forecast_csv_rejects_incomplete_pair_horizons() -> None:
    raw = csv_rows(
        "2026-06-01,2026-07-01,1,SKU-A,001,12,true,R2_CAP30",
        "2026-06-01,2026-08-01,2,SKU-B,001,6,true,R2_CAP30",
    )

    with pytest.raises(ForecastCsvError, match="đủ tất cả horizon"):
        parse_forecast_csv(raw)
