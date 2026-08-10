from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
OUTPUT_DIR = ROOT / ".upload_tmp"


def clean_text(series: pd.Series) -> pd.Series:
    return series.astype("string").str.strip().replace({"": pd.NA})


def iso_date(series: pd.Series) -> pd.Series:
    values = pd.to_datetime(series, errors="coerce")
    return values.dt.strftime("%Y-%m-%d")


def iso_datetime(series: pd.Series) -> pd.Series:
    values = pd.to_datetime(series, errors="coerce")
    return values.dt.strftime("%Y-%m-%dT%H:%M:%S")


def json_value(value: Any) -> Any:
    if pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if hasattr(value, "item"):
        return value.item()
    return str(value) if not isinstance(value, (str, int, float, bool)) else value


def prepare_branches() -> pd.DataFrame:
    path = DATA_DIR / "master-data-channel_20260803_7475.xlsx"
    raw = pd.read_excel(path, sheet_name="Channel", dtype=object)
    result = pd.DataFrame(
        {
            "branch_code": clean_text(raw.iloc[:, 0]),
            "branch_name": clean_text(raw.iloc[:, 1]),
            "region": clean_text(raw.iloc[:, 2]),
            "brand": clean_text(raw.iloc[:, 3]),
            "source_status": clean_text(raw.iloc[:, 4]),
            "source_created_at": iso_datetime(raw.iloc[:, 5]),
            "source_updated_at": iso_datetime(raw.iloc[:, 6]),
        }
    )
    if result["branch_code"].duplicated().any():
        raise ValueError("Duplicate branch_code in channel master")
    return result


def prepare_disabled_skus() -> pd.DataFrame:
    path = DATA_DIR / "master-data-sku_20260803_7474.xlsx"
    raw = pd.read_excel(path, sheet_name="SKU", dtype=object)
    raw_payload = raw.apply(
        lambda row: json.dumps(
            {str(key): json_value(value) for key, value in row.items()},
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        axis=1,
    )
    result = pd.DataFrame(
        {
            "bravo_sku": clean_text(raw.iloc[:, 1]),
            "base_sku": clean_text(raw.iloc[:, 0]),
            "sku_name": clean_text(raw.iloc[:, 2]),
            "uom": clean_text(raw.iloc[:, 3]),
            "product_group": clean_text(raw.iloc[:, 16]),
            "brand": clean_text(raw.iloc[:, 17]),
            "pattern_set": clean_text(raw.iloc[:, 18]),
            "sample_role": clean_text(raw.iloc[:, 19]),
            "branch_channel": clean_text(raw.iloc[:, 20]),
            "shipping_size": clean_text(raw.iloc[:, 21]),
            "price_group": clean_text(raw.iloc[:, 22]),
            "abc_class": clean_text(raw.iloc[:, 24]),
            "model_age_months": pd.to_numeric(raw.iloc[:, 25], errors="coerce"),
            "launch_date": iso_date(raw.iloc[:, 26]),
            "factory_code": clean_text(raw.iloc[:, 27]),
            "factory_sku": clean_text(raw.iloc[:, 28]),
            "sale_sku": clean_text(raw.iloc[:, 29]),
            "pull_source": clean_text(raw.iloc[:, 30]),
            "moq": pd.to_numeric(raw.iloc[:, 31], errors="coerce"),
            "source_status": clean_text(raw.iloc[:, 32]),
            "replacement_sku": clean_text(raw.iloc[:, 33]),
            "source_created_at": iso_datetime(raw.iloc[:, 34]),
            "source_updated_at": iso_datetime(raw.iloc[:, 36]),
            "raw_payload": raw_payload,
        }
    )
    if result["bravo_sku"].duplicated().any():
        raise ValueError("Duplicate bravo_sku in disabled SKU master")
    return result


def prepare_sales() -> pd.DataFrame:
    path = DATA_DIR / "sales_monthly_by_sku_branch_202607161619.csv"
    result = pd.read_csv(
        path,
        dtype={
            "bravo_sku": "string",
            "sku_name": "string",
            "branch_code": "string",
            "unit": "string",
        },
        encoding="utf-8-sig",
    )
    for column in ["bravo_sku", "sku_name", "branch_code", "unit"]:
        result[column] = clean_text(result[column])
    result["month"] = iso_date(result["month"])
    result["total_quantity"] = pd.to_numeric(result["total_quantity"], errors="coerce")
    result["total_amount"] = pd.to_numeric(result["total_amount"], errors="coerce")
    result["line_count"] = pd.to_numeric(result["line_count"], errors="coerce").astype("Int64")
    if result.duplicated(["bravo_sku", "branch_code", "month"]).any():
        raise ValueError("Duplicate sales composite key")
    return result


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    datasets = {
        "branches.csv": prepare_branches(),
        "disabled_skus.csv": prepare_disabled_skus(),
        "sales_monthly.csv": prepare_sales(),
    }
    for filename, frame in datasets.items():
        frame.to_csv(OUTPUT_DIR / filename, index=False, encoding="utf-8", lineterminator="\n")
        print(f"{filename}: {len(frame):,} rows")


if __name__ == "__main__":
    main()
