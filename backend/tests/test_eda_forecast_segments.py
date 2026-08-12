from datetime import date

from app.main import app
from app.routes.eda_forecast_segments import _classify_series


def _row(**overrides):
    value = {
        "first_positive_month": date(2025, 1, 1),
        "last_positive_month": date(2026, 5, 1),
        "base_first_positive_month": date(2024, 1, 1),
        "positive_months": 8,
        "seasonal_months": [],
        "status": "Hoạt động",
        "episode_id": 1,
        "demand_pattern": "Smooth",
    }
    value.update(overrides)
    return value


def test_forecast_segment_route_is_registered() -> None:
    assert "/api/v1/eda/forecast-segments/overview" in {route.path for route in app.routes}


def test_recent_zero_does_not_override_upcoming_season() -> None:
    result = _classify_series(
        _row(
            first_positive_month=date(2024, 1, 1),
            last_positive_month=date(2025, 10, 1),
            seasonal_months=[8, 9],
        ),
        date(2026, 6, 1),
        3,
    )
    assert result["lifecycle"] == "SEASONAL_RETURN_EXPECTED"
    assert result["recommended_strategy"] == "SEASONAL_HURDLE"


def test_regular_monthly_seller_is_not_mislabeled_as_seasonal() -> None:
    result = _classify_series(
        _row(
            first_positive_month=date(2024, 1, 1),
            last_positive_month=date(2025, 10, 1),
            positive_months=25,
            seasonal_months=[7, 8, 9],
        ),
        date(2026, 6, 1),
        3,
    )
    assert result["has_seasonal_signal"] is False
    assert result["lifecycle"] == "DORMANT_SUSPECTED"


def test_episode_only_sets_relaunch_flag_and_keeps_full_pair_history() -> None:
    result = _classify_series(
        _row(
            first_positive_month=date(2024, 1, 1),
            last_positive_month=date(2026, 5, 1),
            positive_months=7,
            episode_id=2,
        ),
        date(2026, 6, 1),
        3,
    )
    assert result["history_months"] == 30
    assert result["evidence_level"] == "HIGH"
    assert result["is_relaunched"] is True


def test_new_at_branch_borrows_cross_branch_signal() -> None:
    result = _classify_series(
        _row(
            first_positive_month=date(2026, 4, 1),
            last_positive_month=date(2026, 6, 1),
            positive_months=3,
        ),
        date(2026, 6, 1),
        3,
    )
    assert result["lifecycle"] == "NEW_AT_BRANCH"
    assert result["recommended_strategy"] == "BORROW_CROSS_BRANCH"
