from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date
from math import sqrt


@dataclass(frozen=True)
class ForecastPoint:
    month: date
    forecast: float | None
    actual: float | None
    accuracy: float | None
    period_type: str


def add_months(value: date, months: int) -> date:
    month_index = value.year * 12 + value.month - 1 + months
    return date(month_index // 12, month_index % 12 + 1, 1)


def candidate_forecasts(history: dict[date, float], target: date) -> dict[str, float]:
    past = sorted((month, qty) for month, qty in history.items() if month < target)
    candidates: dict[str, float] = {}
    if past:
        candidates["naive"] = max(0.0, past[-1][1])
    recent = [qty for _, qty in past[-3:]]
    if recent:
        candidates["moving_average_3"] = max(0.0, sum(recent) / len(recent))
    if len(recent) == 3:
        candidates["weighted_average_3"] = max(
            0.0, recent[-1] * 0.5 + recent[-2] * 0.3 + recent[-3] * 0.2
        )
    seasonal_month = add_months(target, -12)
    if seasonal_month in history:
        candidates["seasonal_naive"] = max(0.0, history[seasonal_month])
    return candidates


def select_method(history: dict[date, float], origins: Iterable[date]) -> str:
    errors: dict[str, list[float]] = {}
    for target in origins:
        actual = history.get(target)
        if actual is None:
            continue
        for method, forecast in candidate_forecasts(history, target).items():
            errors.setdefault(method, []).append(abs(forecast - actual))
    if not errors:
        return "naive"
    priority = {"seasonal_naive": 0, "moving_average_3": 1, "weighted_average_3": 2, "naive": 3}
    return min(errors, key=lambda method: (sum(errors[method]) / len(errors[method]), priority[method]))


def build_forecast_series(
    history: dict[date, float],
    data_as_of: date,
    backtest_months: int = 6,
    horizon: int = 3,
) -> tuple[str, list[ForecastPoint], dict[str, float | None]]:
    origins = [add_months(data_as_of, offset) for offset in range(-(backtest_months - 1), 1)]
    method = select_method(history, origins)
    points: list[ForecastPoint] = []
    errors: list[float] = []
    signed_errors: list[float] = []
    actual_sum = 0.0

    for target in origins:
        actual = history.get(target)
        forecast = candidate_forecasts(history, target).get(method)
        accuracy = None
        if actual is not None and forecast is not None:
            error = forecast - actual
            errors.append(abs(error))
            signed_errors.append(error)
            actual_sum += abs(actual)
            if actual > 0:
                accuracy = max(0.0, 1.0 - abs(error) / actual)
        points.append(ForecastPoint(target, forecast, actual, accuracy, "past"))

    residual_scale = sqrt(sum(error * error for error in signed_errors) / len(signed_errors)) if signed_errors else 0.0
    for step in range(1, horizon + 1):
        target = add_months(data_as_of, step)
        forecast = candidate_forecasts(history, target).get(method)
        points.append(ForecastPoint(target, forecast, None, None, "future"))

    metrics = {
        "wape": sum(errors) / actual_sum if actual_sum > 0 else None,
        "mae": sum(errors) / len(errors) if errors else None,
        "bias": sum(signed_errors) / actual_sum if actual_sum > 0 else None,
        "residual_scale": residual_scale,
    }
    return method, points, metrics
