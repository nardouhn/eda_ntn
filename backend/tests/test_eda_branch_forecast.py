from datetime import date

from app.main import app
from app.routes.eda_branch_forecast import (
    _branch_metrics,
    _branch_network,
    _cluster_branches,
    _correlation,
    _feature_associations,
    _lag_associations,
    _region_influence,
    _seasonality_analysis,
    _sku_influence,
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


def test_lag_region_and_sku_influence_helpers() -> None:
    months = [date(2024, month, 1) for month in range(1, 7)]
    branch_a = [{"branch": "A", "region": "DNB", "month": month, "quantity": float(index + 1)} for index, month in enumerate(months)]
    branch_b = [{"branch": "B", "region": "DNB", "month": month, "quantity": float((index + 1) * 2)} for index, month in enumerate(months)]
    values = {row["month"]: row["quantity"] for row in branch_a}

    lags = _lag_associations(values, (1, 2))
    assert lags[0]["observations"] == 5
    assert lags[0]["correlation"] > .9

    region = _region_influence({"A": branch_a, "B": branch_b})
    assert region[0]["correlations"][0]["correlation"] > .99

    sku_rows = [
        {"base_sku": "SKU1", "sku_name": "One", "month": month, "quantity": float(index + 1)}
        for index, month in enumerate(months)
    ]
    sku = _sku_influence(sku_rows, values)[0]
    assert sku["absolute_quantity_share"] == 1.0
    assert sku["strongest_lag"] in {1, 2, 3}


def test_seasonality_compares_selected_branch_with_same_region() -> None:
    rows_by_branch = {}
    metrics = []
    for branch, multiplier in [("A", 1.0), ("B", 2.0), ("C", 3.0)]:
        rows = []
        for index in range(24):
            month_index = 2024 * 12 + index
            rows.append({
                "branch": branch,
                "branch_name": f"CN {branch}",
                "region": "DNB" if branch != "C" else "TNB",
                "month": date(month_index // 12, month_index % 12 + 1, 1),
                "quantity": multiplier * (200 if index % 12 == 0 else 100),
                "active_skus": 10,
                "line_count": 5,
                "is_active": True,
                "flag_mua_mua": int(index % 12 >= 4),
            })
        rows_by_branch[branch] = rows
        metrics.append(_branch_metrics(rows, rows[0]["month"], rows[-1]["month"]))

    result = _seasonality_analysis(metrics, rows_by_branch, "A")
    assert result["same_region_branch_count"] == 2
    assert {row["branch"] for row in result["branches"]} == {"A", "B"}
    assert result["comparison_profile"][0]["selected_index"] > 1
    assert result["branches"][0]["selected_similarity"] == 1.0
