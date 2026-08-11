from datetime import date
from pathlib import Path

import pytest

from app.main import app
from app.routes.eda_external_features import _correlation, _decompose, _metric_sql


def test_external_feature_route_is_registered() -> None:
    paths = {route.path for route in app.routes}
    assert "/api/v1/eda/external-features/{level}" in paths


def test_correlation_handles_perfect_and_constant_series() -> None:
    assert _correlation([1, 2, 3], [2, 4, 6]) == pytest.approx(1.0)
    assert _correlation([1, 1, 1], [2, 3, 4]) is None


def test_decomposition_separates_linear_trend() -> None:
    rows = [
        {
            "month": date(2024, month, 1),
            "trend_index": month,
            "value": 100 + 5 * month,
        }
        for month in range(1, 7)
    ]
    points, model = _decompose(rows)
    assert model["slope"] == pytest.approx(5.0)
    assert all(point["fitted"] == pytest.approx(point["value"]) for point in points)


def test_metric_sql_is_allowlisted() -> None:
    assert "quantity" in _metric_sql("quantity")
    assert "total_amount" in _metric_sql("revenue")
    assert _metric_sql("unexpected") == _metric_sql("quantity")


def test_month_alias_is_explicit_for_postgres() -> None:
    route_path = Path(__file__).resolve().parents[1] / "app" / "routes" / "eda_external_features.py"
    source = route_path.read_text(encoding="utf-8")
    assert "source.month::date month" not in source
    assert "source.month::date AS month" in source
