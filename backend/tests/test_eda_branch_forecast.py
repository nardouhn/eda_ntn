from datetime import date

from app.main import app
from app.routes.eda_branch_forecast import _branch_metrics, _correlation, _wape


def test_branch_forecast_route_is_registered() -> None:
    assert "/api/v1/eda/branch-forecast/overview" in {route.path for route in app.routes}


def test_metric_helpers() -> None:
    assert _wape([(10, 8), (5, 10)]) == 7 / 18
    assert _correlation([(1, 2), (2, 4), (3, 6)]) == 1.0


def test_seasonal_branch_is_detected_when_seasonal_naive_wins() -> None:
    rows = []
    seasonal = [100.0, 10.0, 10.0, 100.0, 10.0, 10.0, 100.0, 10.0, 10.0, 100.0, 10.0, 10.0]
    for index in range(30):
        month_index = 2024 * 12 + index
        rows.append({
            "branch": "001",
            "branch_name": "CN 1",
            "region": "DNB",
            "month": date(month_index // 12, month_index % 12 + 1, 1),
            "quantity": seasonal[index % 12],
            "active_skus": 10,
            "line_count": 5,
            "is_active": True,
        })
    result = _branch_metrics(rows, rows[0]["month"], rows[-1]["month"])
    assert result["forecastability_segment"] == "SEASONAL"
    assert result["seasonal_naive_wape"] == 0.0
    assert result["seasonal_origins"] == 18
