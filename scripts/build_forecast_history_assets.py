"""Attach the immutable V02 history/rolling-H1 quality metrics to B06 assets.

The script is intentionally an offline publisher.  It does not mutate the
WorkFinals source CSVs and it does not calculate actuals from the forecast
files.  The output remains one small JSON payload per branch for lazy loading
by the Forecast drawer.

Example:
  python scripts/build_forecast_history_assets.py \
    --pair-history C:\\imports\\04_PAIR_TARGET_HISTORY_WIDE.csv \
    --branch-history C:\\imports\\05_BRANCH_TARGET_HISTORY_WIDE.csv
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path
from typing import Any


HISTORY_MONTHS = [f"2026-{month:02d}-01" for month in range(1, 7)]
MIN_H1_POINTS = 4
MIN_BACKTEST_ACTUAL_M2 = 100.0


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def as_number(value: str | None) -> float | None:
    return float(value) if value not in (None, "") else None


def metric_payload(error: float, actual: float, observations: int) -> dict[str, Any]:
    wape = error / actual if actual > 0 else None
    return {
        "wape_h1": wape,
        "observations": observations,
        "actual_m2": actual,
        "qualified": observations >= MIN_H1_POINTS and actual >= MIN_BACKTEST_ACTUAL_M2,
    }


def monthly_wape(actual: float | None, forecast: float | None) -> float | None:
    """Return the point error used to derive the displayed Acc = 1 - WAPE."""
    if actual is None or forecast is None or actual <= 0:
        return None
    return abs(forecast - actual) / actual


def monthly_accuracy(actual: float | None, forecast: float | None) -> float | None:
    """Acc is a manager-facing 0–100% score: max(0, 1 - point error)."""
    wape = monthly_wape(actual, forecast)
    return max(0.0, 1 - wape) if wape is not None else None


def history_rank(item: dict[str, Any]) -> tuple[int, float, float]:
    accuracy = item.get("accuracy") or {}
    if accuracy.get("qualified") and accuracy.get("wape_h1") is not None:
        return (0, float(accuracy["wape_h1"]), -sum(item.get("values") or []))
    return (1, float("inf"), -sum(item.get("values") or []))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pair-history", type=Path, required=True)
    parser.add_argument("--branch-history", type=Path, required=True)
    parser.add_argument(
        "--forecast-dir",
        type=Path,
        default=Path("frontend/public/data/forecast"),
        help="Forecast static asset directory, relative to the repository root.",
    )
    args = parser.parse_args()
    forecast_dir = args.forecast_dir.resolve()
    manifest_path = forecast_dir / "manifest.json"
    branch_dir = forecast_dir / "branches"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    pair_history: dict[tuple[str, str], list[float | None]] = defaultdict(lambda: [None] * len(HISTORY_MONTHS))
    pair_h1_forecast: dict[tuple[str, str], list[float | None]] = defaultdict(lambda: [None] * len(HISTORY_MONTHS))
    pair_metrics: dict[tuple[str, str], list[float]] = defaultdict(lambda: [0.0, 0.0, 0.0])
    month_index = {month: index for index, month in enumerate(HISTORY_MONTHS)}
    for row in read_csv(args.pair_history):
        month = row["target_month"]
        key = (row["branch_code"], row["base_sku"])
        if month in month_index and row.get("actual_m2") not in (None, ""):
            pair_history[key][month_index[month]] = as_number(row["actual_m2"])
        if month in month_index and row.get("forecast_h1_m2") not in (None, ""):
            pair_h1_forecast[key][month_index[month]] = as_number(row["forecast_h1_m2"])
        if (
            month in month_index
            and row.get("actual_m2") not in (None, "")
            and row.get("forecast_h1_m2") not in (None, "")
        ):
            actual = as_number(row["actual_m2"]) or 0.0
            forecast = as_number(row["forecast_h1_m2"]) or 0.0
            aggregate = pair_metrics[key]
            aggregate[0] += abs(forecast - actual)
            aggregate[1] += actual
            aggregate[2] += 1

    branch_history: dict[str, list[float | None]] = defaultdict(lambda: [None] * len(HISTORY_MONTHS))
    branch_h1_forecast: dict[str, list[float | None]] = defaultdict(lambda: [None] * len(HISTORY_MONTHS))
    for row in read_csv(args.branch_history):
        month = row["target_month"]
        if month in month_index and row.get("actual_m2") not in (None, ""):
            branch_history[row["branch_code"]][month_index[month]] = as_number(row["actual_m2"])
        if month in month_index and row.get("forecast_h1_m2") not in (None, ""):
            branch_h1_forecast[row["branch_code"]][month_index[month]] = as_number(row["forecast_h1_m2"])

    sku_metrics: dict[str, list[float]] = defaultdict(lambda: [0.0, 0.0, 0.0])
    sku_monthly: dict[str, list[dict[str, float | int]]] = defaultdict(
        lambda: [{"actual": 0.0, "forecast": 0.0, "error": 0.0, "actual_count": 0, "forecast_count": 0, "matched_count": 0} for _ in HISTORY_MONTHS]
    )
    branch_files = sorted(branch_dir.glob("*.json"))
    if not branch_files:
        raise SystemExit(f"No branch assets found in {branch_dir}")

    for branch_path in branch_files:
        branch = json.loads(branch_path.read_text(encoding="utf-8"))
        branch_code = str(branch["branch_code"])
        branch["history"] = branch_history[branch_code]
        branch["history_forecast"] = branch_h1_forecast[branch_code]
        branch["history_wape"] = [
            monthly_wape(actual, forecast)
            for actual, forecast in zip(branch_history[branch_code], branch_h1_forecast[branch_code])
        ]
        branch["history_accuracy"] = [
            monthly_accuracy(actual, forecast)
            for actual, forecast in zip(branch_history[branch_code], branch_h1_forecast[branch_code])
        ]
        for pair in branch.get("pairs", []):
            key = (branch_code, pair["sku"])
            pair["history"] = pair_history[key]
            pair["history_forecast"] = pair_h1_forecast[key]
            pair["history_wape"] = [
                monthly_wape(actual, forecast)
                for actual, forecast in zip(pair_history[key], pair_h1_forecast[key])
            ]
            pair["history_accuracy"] = [
                monthly_accuracy(actual, forecast)
                for actual, forecast in zip(pair_history[key], pair_h1_forecast[key])
            ]
            error, actual, observations = pair_metrics[key]
            pair["accuracy"] = metric_payload(error, actual, int(observations))
            sku_aggregate = sku_metrics[pair["sku"]]
            sku_aggregate[0] += error
            sku_aggregate[1] += actual
            sku_aggregate[2] += observations
            for index, (monthly_actual, monthly_forecast) in enumerate(zip(pair_history[key], pair_h1_forecast[key])):
                aggregate = sku_monthly[pair["sku"]][index]
                if monthly_actual is not None:
                    aggregate["actual"] += monthly_actual
                    aggregate["actual_count"] += 1
                if monthly_forecast is not None:
                    aggregate["forecast"] += monthly_forecast
                    aggregate["forecast_count"] += 1
                if monthly_actual is not None and monthly_forecast is not None:
                    aggregate["error"] += abs(monthly_forecast - monthly_actual)
                    aggregate["matched_count"] += 1
        branch["pairs"].sort(key=history_rank)
        branch_path.write_text(json.dumps(branch, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    for sku in manifest.get("skus", []):
        error, actual, observations = sku_metrics[sku["sku"]]
        sku["accuracy"] = metric_payload(error, actual, int(observations))
        monthly = sku_monthly[sku["sku"]]
        sku["history"] = [item["actual"] if item["actual_count"] else None for item in monthly]
        sku["history_forecast"] = [item["forecast"] if item["forecast_count"] else None for item in monthly]
        sku["history_wape"] = [
            item["error"] / item["actual"] if item["actual"] > 0 and item["matched_count"] else None
            for item in monthly
        ]
        sku["history_accuracy"] = [
            max(0.0, 1 - item["error"] / item["actual"]) if item["actual"] > 0 and item["matched_count"] else None
            for item in monthly
        ]
    manifest["skus"].sort(key=history_rank)

    branch_codes = {str(item["branch_code"]) for item in manifest.get("branches", [])}
    actual_portfolio = [0.0] * len(HISTORY_MONTHS)
    forecast_portfolio = [0.0] * len(HISTORY_MONTHS)
    for branch_code in branch_codes:
        for index, value in enumerate(branch_history[branch_code]):
            if value is not None:
                actual_portfolio[index] += value
        for index, value in enumerate(branch_h1_forecast[branch_code]):
            if value is not None:
                forecast_portfolio[index] += value

    manifest["history_months"] = HISTORY_MONTHS
    manifest["actual_portfolio"] = actual_portfolio
    manifest["forecast_portfolio_h1"] = forecast_portfolio
    manifest["history_wape"] = [monthly_wape(actual, forecast) for actual, forecast in zip(actual_portfolio, forecast_portfolio)]
    manifest["history_accuracy"] = [monthly_accuracy(actual, forecast) for actual, forecast in zip(actual_portfolio, forecast_portfolio)]
    for branch in manifest.get("branches", []):
        branch_code = str(branch["branch_code"])
        branch["history"] = branch_history[branch_code]
        branch["history_forecast"] = branch_h1_forecast[branch_code]
        branch["history_wape"] = [
            monthly_wape(actual, forecast)
            for actual, forecast in zip(branch_history[branch_code], branch_h1_forecast[branch_code])
        ]
        branch["history_accuracy"] = [
            monthly_accuracy(actual, forecast)
            for actual, forecast in zip(branch_history[branch_code], branch_h1_forecast[branch_code])
        ]
    manifest["history_source"] = {
        "run": "wf_monthly_rolling_vintage_2026_20260819T081845Z",
        "pair_file": "04_PAIR_TARGET_HISTORY_WIDE.csv",
        "branch_file": "05_BRANCH_TARGET_HISTORY_WIDE.csv",
        "actual_months": HISTORY_MONTHS,
        "metric": "Acc H1 rolling",
        "metric_months": HISTORY_MONTHS,
        "eligibility": {
            "minimum_h1_observations": MIN_H1_POINTS,
            "minimum_actual_m2": MIN_BACKTEST_ACTUAL_M2,
        },
    }
    manifest["diagnostics"]["actual_status"] = "AVAILABLE_2026M01_TO_2026M06"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    qualified_pairs = sum(
        1
        for branch_path in branch_files
        for pair in json.loads(branch_path.read_text(encoding="utf-8")).get("pairs", [])
        if pair.get("accuracy", {}).get("qualified")
    )
    print(
        json.dumps(
            {
                "branch_assets": len(branch_files),
                "history_months": HISTORY_MONTHS,
                "portfolio_actual_m2": actual_portfolio,
                "qualified_pairs": qualified_pairs,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
