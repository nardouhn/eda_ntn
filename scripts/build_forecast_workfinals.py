"""Build the frontend-only Forecast data contract from a frozen WorkFinals B06 parquet.

The generated assets intentionally keep the R2_CAP30 reconciled signal as the
operational value.  Original Pair and Direct Branch are retained only as
diagnostic/reference totals; they must never replace the operational forecast.
"""

from __future__ import annotations

import argparse
import json
from collections.abc import Iterable
from pathlib import Path

import pandas as pd


MONTHS = ["2026-07-01", "2026-08-01", "2026-09-01"]
REQUIRED_COLUMNS = {
    "forecast_origin",
    "target_month",
    "horizon",
    "base_sku",
    "branch_code",
    "behavior_route",
    "lifecycle_state",
    "forecast_m2_original",
    "method",
    "is_forecasted",
    "vintage_id",
    "bottom_up_pair_m2",
    "direct_branch_m2",
    "scale_factor",
    "cap_binding",
    "forecast_m2",
    "reconciliation_method",
}


def values_by_month(rows: pd.DataFrame, column: str) -> list[float]:
    indexed = rows.set_index("month_key")[column]
    return [float(indexed[month]) for month in MONTHS]


def sum_values(rows: pd.DataFrame, column: str) -> list[float]:
    totals = rows.groupby("month_key", sort=False)[column].sum()
    return [float(totals[month]) for month in MONTHS]


def first_values(rows: pd.DataFrame, column: str) -> list[float]:
    first = rows.groupby(["branch_code", "month_key"], sort=False)[column].first().reset_index()
    totals = first.groupby("month_key", sort=False)[column].sum()
    return [float(totals[month]) for month in MONTHS]


def serialise(rows: Iterable[dict]) -> str:
    return json.dumps(list(rows), ensure_ascii=False, separators=(",", ":"))


def build(source: Path, output: Path) -> None:
    frame = pd.read_parquet(source)
    missing = REQUIRED_COLUMNS.difference(frame.columns)
    if missing:
        raise ValueError(f"Missing WorkFinals B06 columns: {sorted(missing)}")

    frame = frame.copy()
    frame["target_month"] = pd.to_datetime(frame["target_month"])
    frame["forecast_origin"] = pd.to_datetime(frame["forecast_origin"])
    frame["month_key"] = frame["target_month"].dt.strftime("%Y-%m-%d")
    observed_months = sorted(frame["month_key"].unique().tolist())
    if observed_months != MONTHS:
        raise ValueError(f"Expected {MONTHS}, got {observed_months}")
    if frame["reconciliation_method"].nunique() != 1 or frame["reconciliation_method"].iat[0] != "R2_CAP30":
        raise ValueError("This builder accepts only the promoted R2_CAP30 output")
    if frame["vintage_id"].nunique() != 1:
        raise ValueError("Expected exactly one frozen vintage")
    if frame["forecast_origin"].nunique() != 1:
        raise ValueError("Expected exactly one forecast origin")

    output.mkdir(parents=True, exist_ok=True)
    detail_dir = output / "branches"
    detail_dir.mkdir(exist_ok=True)

    pair_keys = ["branch_code", "base_sku"]
    branch_rows: list[dict] = []
    for branch_code, branch_frame in frame.groupby("branch_code", sort=True):
        pair_count = branch_frame[pair_keys].drop_duplicates().shape[0]
        forecasted_pairs = branch_frame.loc[branch_frame["is_forecasted"], pair_keys].drop_duplicates().shape[0]
        branch_rows.append(
            {
                "branch_code": str(branch_code),
                "values": sum_values(branch_frame, "forecast_m2"),
                "original_values": first_values(branch_frame, "bottom_up_pair_m2"),
                "direct_values": first_values(branch_frame, "direct_branch_m2"),
                "base_sku_count": int(branch_frame["base_sku"].nunique()),
                "pair_count": int(pair_count),
                "forecasted_pairs": int(forecasted_pairs),
                "cap_bound_pair_months": int(branch_frame["cap_binding"].ne("NO_CAP").sum()),
            }
        )

        pairs: list[dict] = []
        for sku, pair_frame in branch_frame.groupby("base_sku", sort=False):
            pair_frame = pair_frame.sort_values("horizon")
            pairs.append(
                {
                    "sku": str(sku),
                    "values": values_by_month(pair_frame, "forecast_m2"),
                    "forecasted": bool(pair_frame["is_forecasted"].any()),
                    "route": str(pair_frame["behavior_route"].iat[0]),
                    "method": str(pair_frame["method"].iat[0]),
                    "lifecycle_state": str(pair_frame["lifecycle_state"].iat[0]),
                    "cap_binding": sorted(set(pair_frame["cap_binding"].astype(str))),
                }
            )
        pairs.sort(key=lambda row: sum(row["values"]), reverse=True)
        (detail_dir / f"{branch_code}.json").write_text(
            json.dumps(
                {
                    "branch_code": str(branch_code),
                    "values": branch_rows[-1]["values"],
                    "pairs": pairs,
                },
                ensure_ascii=False,
                separators=(",", ":"),
            ),
            encoding="utf-8",
        )

    sku_rows: list[dict] = []
    for sku, sku_frame in frame.groupby("base_sku", sort=False):
        sku_rows.append(
            {
                "sku": str(sku),
                "values": sum_values(sku_frame, "forecast_m2"),
                "branch_count": int(sku_frame.loc[sku_frame["forecast_m2"] > 0, "branch_code"].nunique()),
                "pair_count": int(sku_frame[["branch_code", "base_sku"]].drop_duplicates().shape[0]),
            }
        )
    sku_rows.sort(key=lambda row: sum(row["values"]), reverse=True)

    portfolio = sum_values(frame, "forecast_m2")
    original = first_values(frame, "bottom_up_pair_m2")
    direct = first_values(frame, "direct_branch_m2")
    branch_total = [sum(row["values"][index] for row in branch_rows) for index in range(3)]
    sku_total = [sum(row["values"][index] for row in sku_rows) for index in range(3)]
    for label, candidate in (("branch", branch_total), ("sku", sku_total)):
        if any(abs(left - right) > 1e-6 for left, right in zip(portfolio, candidate)):
            raise ValueError(f"{label} total does not conserve the reconciled portfolio")

    manifest = {
        "schema_version": 1,
        "source": "WorkFinals",
        "vintage_id": str(frame["vintage_id"].iat[0]),
        "source_run": "wf_branch_stage07_reconciled_forecast_20260817T175335Z",
        "source_file": "forecast_pair_reconciled_2026Q3.parquet",
        "forecast_origin": frame["forecast_origin"].iat[0].strftime("%Y-%m-%d"),
        "months": MONTHS,
        "unit": "m²",
        "primary_signal": "Reconciled R2_CAP30",
        "pair_count": int(frame[pair_keys].drop_duplicates().shape[0]),
        "base_sku_count": int(frame["base_sku"].nunique()),
        "branch_count": int(frame["branch_code"].nunique()),
        "portfolio": {"values": portfolio, "original_values": original, "direct_values": direct},
        "branches": branch_rows,
        "skus": sku_rows,
        "diagnostics": {
            "reconciliation_method": "R2_CAP30",
            "scale_range": [float(frame["scale_factor"].min()), float(frame["scale_factor"].max())],
            "cap_binding_pair_months": int(frame["cap_binding"].ne("NO_CAP").sum()),
            "conservation_status": "PASS",
            "actual_status": "PENDING_TARGET_CLOSE",
        },
    }
    (output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {output / 'manifest.json'} and {len(branch_rows)} branch detail files")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="B06 forecast_pair_reconciled_2026Q3.parquet")
    parser.add_argument("output", type=Path, help="frontend/public/data/forecast")
    arguments = parser.parse_args()
    build(arguments.source, arguments.output)


if __name__ == "__main__":
    main()
