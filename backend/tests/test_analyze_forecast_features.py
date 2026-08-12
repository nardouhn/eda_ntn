from analyze_forecast_features import feature_recommendations, normalize_rows


def test_feature_recommendations_separate_core_drop_and_leakage() -> None:
    rows = {row["feature"]: row for row in feature_recommendations()}
    assert rows["lag1"]["decision"] == "core"
    assert rows["factory_sku"]["decision"] == "drop"
    assert rows["gg_trends_target"]["decision"] == "leakage"
    assert rows["current_status"]["decision"] == "gating"


def test_normalize_rows_makes_values_csv_and_json_safe() -> None:
    from datetime import date
    from decimal import Decimal

    rows = normalize_rows([{"ratio": Decimal("0.25"), "month": date(2026, 6, 1)}])
    assert rows == [{"ratio": 0.25, "month": "2026-06-01"}]
