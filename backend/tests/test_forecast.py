from datetime import date

from app.services.forecast import add_months, build_forecast_series, candidate_forecasts


def test_add_months_crosses_year() -> None:
    assert add_months(date(2025, 12, 1), 1) == date(2026, 1, 1)
    assert add_months(date(2026, 1, 1), -1) == date(2025, 12, 1)


def test_candidate_forecasts_are_past_only() -> None:
    history = {
        date(2026, 1, 1): 10.0,
        date(2026, 2, 1): 20.0,
        date(2026, 3, 1): 30.0,
    }
    values = candidate_forecasts(history, date(2026, 3, 1))
    assert values["naive"] == 20.0
    assert values["moving_average_3"] == 15.0


def test_zero_actual_has_no_accuracy() -> None:
    history = {date(2025, month, 1): float(month) for month in range(1, 13)}
    history[date(2026, 1, 1)] = 0.0
    _, points, _ = build_forecast_series(history, date(2026, 1, 1), backtest_months=1, horizon=1)
    assert points[0].accuracy is None
