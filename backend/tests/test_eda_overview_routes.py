from app.main import app
from app.routes.eda import _overview_scope


def test_eda_overview_routes_are_registered() -> None:
    paths = {route.path for route in app.routes}
    assert "/api/v1/eda/filters" in paths
    assert "/api/v1/eda/overview" in paths


def test_overview_scope_keeps_filter_values_parameterized() -> None:
    where, params = _overview_scope(
        branch_code="071",
        region="Miền Nam",
        sku_status="Hoạt động",
        branch_status="Hoạt động",
        search="Hồ Chí Minh",
    )

    assert "071" not in where
    assert "Hồ Chí Minh" not in where
    assert params == [
        "071",
        "Miền Nam",
        "Hoạt động",
        "Hoạt động",
        "%Hồ Chí Minh%",
        "%Hồ Chí Minh%",
    ]
