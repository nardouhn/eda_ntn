from datetime import date

from app.main import app
from app.routes.eda_branch_forecast import (
    _branch_metrics,
    _branch_network,
    _cluster_branches,
    _correlation,
    _feature_associations,
    _wape,
)


def test_branch_forecast_route_is_registered() -> None:
    assert "/api/v1/eda/branch-drivers/overview" in {route.path for route in app.routes}


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


def test_feature_association_and_branch_network() -> None:
    rows_a = []
    rows_b = []
    for index in range(12):
        month_index = 2024 * 12 + index
        month = date(month_index // 12, month_index % 12 + 1, 1)
        features = {
            "trend_index": index,
            "gg_trends_index": index,
            "gg_trends_lag1": index,
            "flag_mua_mua": int(index >= 6),
            "ty_trong_chay_tet": int(index == 0),
            "ty_trong_thang_gieng": int(index == 1),
            "ty_trong_thang_co_hon": int(index == 7),
            "ty_trong_thanh_minh": int(index == 3),
        }
        rows_a.append({"branch": "A", "region": "DNB", "month": month, "quantity": index + 1, **features})
        rows_b.append({"branch": "B", "region": "DNB", "month": month, "quantity": (index + 1) * 2, **features})

    associations = _feature_associations(rows_a)
    assert next(row for row in associations if row["feature"] == "trend_index")["correlation"] > 0.9
    link = _branch_network({"A": rows_a, "B": rows_b})[0]
    assert link["same_month_correlation"] > 0.99
    assert link["region_scope"] == "Cùng vùng"


def test_cluster_branches_adds_model_routing_fields() -> None:
    rows = [
        {
            "branch": str(index),
            "mean_monthly_quantity": 100 + index,
            "cv": index / 10,
            "naive_wape": .1 + index / 20,
            "trend_rate_6m": 0.0,
            "seasonal_gain": 0.0,
            "top5_sku_share": .2,
            "external_sensitivity": .1,
        }
        for index in range(4)
    ]
    clusters = _cluster_branches(rows, k=2)
    assert len(clusters) == 2
    assert all("cluster_id" in row and "cluster_model" in row for row in rows)
