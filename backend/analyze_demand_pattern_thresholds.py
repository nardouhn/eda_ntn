"""Phân tích ngưỡng Demand Pattern ở cấp Base SKU + Branch.

Pipeline đầy đủ:
1. Đồng bộ active/inactive với ``app.routes.items`` và net quantity ở cấp tháng.
2. Cắt inactive tại tháng demand dương cuối, loại inactive cũ và tách relaunch.
3. Tính ADI trên toàn episode; tính CV² trên các tháng demand dương.
4. Dùng trọng số lịch sử và ``log(ADI)``/``log1p(CV²)`` để tìm split low/high.
5. Sinh candidate bằng weighted Otsu, ghép hai split thành bốn demand pattern.
6. Bootstrap theo Base SKU + Branch; snap tâm bootstrap về candidate full-sample
   hợp lệ, gần tối ưu để lấy ngưỡng cuối.

Chạy từ thư mục backend:
    python analyze_demand_pattern_thresholds.py
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import psycopg
from dotenv import load_dotenv

from app.demand_pattern import ADI_THRESHOLD as DEPLOYED_ADI_THRESHOLD
from app.demand_pattern import CV2_THRESHOLD as DEPLOYED_CV2_THRESHOLD


PATTERN_ORDER = ("Smooth", "Erratic", "Intermittent", "Lumpy")
PATTERN_COLORS = {
    "Smooth": "#10b981",
    "Erratic": "#f59e0b",
    "Intermittent": "#6366f1",
    "Lumpy": "#ef4444",
}
SOURCE_TABLE = "source.mart_sku_branch_month"
SOURCE_SCHEMA_COLUMNS = (
    "bravo_sku",
    "base_sku",
    "sku_status",
    "price_group",
    "factory_sku",
    "branch",
    "branch_name",
    "region",
    "branch_status",
    "month",
    "unit",
    "quantity",
    "total_amount",
    "line_count",
    "sku_name",
    "pattern_set",
)
# Dùng cùng định nghĩa active với API /items: SKU và branch đều phải hoạt động.
DEMAND_SOURCE_COLUMNS = (
    "region",
    "base_sku",
    "branch",
    "month",
    "quantity",
    "sku_status",
    "branch_status",
)
LEVEL_COLUMNS = ["base_sku", "branch"]
DEMAND_EPSILON = 1e-9
ACTIVE_STATUS_LABELS = ("hoạt động",)


def active_status_sql(column: str) -> str:
    """Giữ đồng nhất với ``app.routes.items.active_status_sql``."""
    labels = ", ".join(f"'{label}'" for label in ACTIVE_STATUS_LABELS)
    return f"LOWER(BTRIM(COALESCE({column}, ''))) IN ({labels})"


SKU_IS_ACTIVE_SQL = active_status_sql("sku_status")
BRANCH_IS_ACTIVE_SQL = active_status_sql("branch_status")
ITEM_IS_ACTIVE_SQL = f"({SKU_IS_ACTIVE_SQL} AND {BRANCH_IS_ACTIVE_SQL})"


@dataclass(frozen=True)
class AnalysisConfig:
    min_history_months: int = 12
    min_positive_months: int = 3
    inactive_recent_months: int = 12
    relaunch_gap_months: int = 6
    history_weight_power: float = 0.5
    history_weight_cap_months: int = 36
    min_pattern_share: float = 0.05
    recommendation_score_ratio: float = 0.98
    bootstrap_iterations: int = 200
    random_seed: int = 42
    full_grid_size: int = 33
    bootstrap_grid_size: int = 21


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Tính ADI/CV² ở cấp base_sku + branch và tìm ngưỡng Demand Pattern "
            "phù hợp với phân phối dữ liệu."
        )
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "demand_pattern_analysis_output",
        help="Thư mục lưu CSV, JSON và biểu đồ.",
    )
    parser.add_argument("--min-history-months", type=int, default=12)
    parser.add_argument("--min-positive-months", type=int, default=3)
    parser.add_argument(
        "--inactive-recent-months",
        type=int,
        default=12,
        help=(
            "Chỉ giữ episode mới nhất của SKU inactive nếu lần có net demand dương "
            "cuối cùng cách data-as-of không quá số tháng này."
        ),
    )
    parser.add_argument(
        "--relaunch-gap-months",
        type=int,
        default=6,
        help="Tách episode mới khi giữa hai tháng demand dương có ít nhất từng này tháng zero.",
    )
    parser.add_argument(
        "--history-weight-power",
        type=float,
        default=0.5,
        help="Số mũ của trọng số độ dài; 0=tắt weight, 0.5=sqrt, 1=linear.",
    )
    parser.add_argument("--history-weight-cap-months", type=int, default=36)
    parser.add_argument("--min-pattern-share", type=float, default=0.05)
    parser.add_argument(
        "--recommendation-score-ratio",
        type=float,
        default=0.98,
        help=(
            "Chỉ chốt ngưỡng trong nhóm candidate có score đạt ít nhất tỷ lệ "
            "này so với score tốt nhất toàn mẫu."
        ),
    )
    parser.add_argument("--bootstrap", type=int, default=200)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--full-grid-size", type=int, default=33)
    parser.add_argument("--bootstrap-grid-size", type=int, default=21)
    return parser.parse_args()


def validate_config(config: AnalysisConfig) -> None:
    if config.min_history_months < 1:
        raise ValueError("min_history_months phải >= 1")
    if config.min_positive_months < 2:
        raise ValueError("min_positive_months phải >= 2 để tính STDDEV_SAMP")
    if config.inactive_recent_months < 0:
        raise ValueError("inactive_recent_months phải >= 0")
    if config.relaunch_gap_months < 1:
        raise ValueError("relaunch_gap_months phải >= 1")
    if not 0 <= config.history_weight_power <= 1:
        raise ValueError("history_weight_power phải nằm trong [0, 1]")
    if config.history_weight_cap_months < 1:
        raise ValueError("history_weight_cap_months phải >= 1")
    if not 0 <= config.min_pattern_share < 0.25:
        raise ValueError("min_pattern_share phải nằm trong [0, 0.25)")
    if not 0 < config.recommendation_score_ratio <= 1:
        raise ValueError("recommendation_score_ratio phải nằm trong (0, 1]")
    if config.bootstrap_iterations < 1:
        raise ValueError("bootstrap_iterations phải >= 1")
    if config.full_grid_size < 3 or config.bootstrap_grid_size < 3:
        raise ValueError("grid_size phải >= 3")


def load_database_url() -> str:
    load_dotenv(Path(__file__).resolve().parent / ".env")
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError("Thiếu DATABASE_URL trong backend/.env hoặc biến môi trường.")
    return database_url


def load_monthly_demand(database_url: str) -> pd.DataFrame:
    # Net ở grain tháng trước khi chặn demand âm. Làm vậy để return cùng tháng
    # bù đúng vào sales, thay vì bị xóa bởi GREATEST(quantity, 0) ở grain dòng.
    query = f"""
        SELECT
            COALESCE(MAX(NULLIF(BTRIM(region), '')), 'Chưa xác định') AS region,
            base_sku,
            branch,
            month,
            COALESCE(SUM(quantity), 0)::double precision AS net_quantity,
            COALESCE(
                SUM(quantity) FILTER (WHERE {ITEM_IS_ACTIVE_SQL}),
                0
            )::double precision AS active_net_quantity,
            BOOL_OR({ITEM_IS_ACTIVE_SQL}) AS has_active_variant
        FROM {SOURCE_TABLE}
        WHERE base_sku IS NOT NULL
          AND branch IS NOT NULL
          AND month IS NOT NULL
        GROUP BY base_sku, branch, month
        ORDER BY base_sku, branch, month
    """

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            columns = [column.name for column in cursor.description]

    monthly = pd.DataFrame(rows, columns=columns)
    if monthly.empty:
        raise RuntimeError("Query không trả về dữ liệu.")

    monthly["region"] = (
        monthly["region"]
        .fillna("Chưa xác định")
        .astype(str)
        .str.strip()
        .replace("", "Chưa xác định")
    )
    monthly["base_sku"] = monthly["base_sku"].astype(str).str.strip()
    monthly["branch"] = monthly["branch"].astype(str).str.strip()
    monthly["month"] = (
        pd.to_datetime(monthly["month"], errors="coerce")
        .dt.to_period("M")
        .dt.to_timestamp()
    )
    for column in ("net_quantity", "active_net_quantity"):
        monthly[column] = pd.to_numeric(monthly[column], errors="coerce").fillna(0.0)
    monthly["has_active_variant"] = monthly["has_active_variant"].fillna(False).astype(bool)
    return monthly.dropna(subset=["month"])


def months_between(start: pd.Timestamp, end: pd.Timestamp) -> int:
    return (end.year - start.year) * 12 + end.month - start.month


def split_episode_bounds(
    demand: pd.Series,
    relaunch_gap_months: int,
) -> list[tuple[pd.Timestamp, pd.Timestamp]]:
    """Tách tại gap zero dài; không gắn gap chết vào episode trước hoặc sau."""
    positive_months = demand.index[demand.to_numpy(dtype=float) > DEMAND_EPSILON]
    if len(positive_months) == 0:
        return []

    starts = [positive_months[0]]
    previous_positive = positive_months[0]
    bounds: list[tuple[pd.Timestamp, pd.Timestamp]] = []
    for positive_month in positive_months[1:]:
        zero_gap = months_between(previous_positive, positive_month) - 1
        if zero_gap >= relaunch_gap_months:
            bounds.append((starts[-1], previous_positive))
            starts.append(positive_month)
        previous_positive = positive_month
    bounds.append((starts[-1], demand.index[-1]))
    return bounds


def build_demand_episodes(
    monthly: pd.DataFrame,
    config: AnalysisConfig,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Dựng các episode demand và danh sách base SKU + branch bị loại.

    Active theo đúng ``items.py``: tồn tại variant có cả SKU và branch active.
    Base active dùng net của các variant active và kéo đến data-as-of. Base
    inactive chỉ được giữ nếu mới ngừng gần đây, dùng net của toàn bộ variant,
    và kết thúc đúng tháng net demand dương cuối cùng.
    """
    analysis_end_month = monthly["month"].max()
    panel_parts: list[pd.DataFrame] = []
    excluded_rows: list[dict[str, object]] = []

    for keys, group in monthly.groupby(LEVEL_COLUMNS, sort=False, observed=True):
        group = group.sort_values("month")
        is_active = bool(group["has_active_variant"].any())
        selected_net_column = "active_net_quantity" if is_active else "net_quantity"
        observed = group.set_index("month")[selected_net_column].astype(float)
        first_observed = observed.index.min()
        last_observed = observed.index.max()

        # Netting hoàn tất ở cấp tháng; net âm được giữ trong cột audit nhưng
        # demand dùng cho ADI/CV² có miền không âm.
        positive_months = observed.index[observed.to_numpy() > DEMAND_EPSILON]
        if positive_months.empty:
            excluded_rows.append(
                {
                    "region": group.iloc[-1]["region"],
                    "base_sku": keys[0],
                    "branch": keys[1],
                    "status": "Hoạt động" if is_active else "Vô hiệu hóa",
                    "first_observed_month": first_observed,
                    "last_observed_month": last_observed,
                    "last_positive_month": pd.NaT,
                    "months_since_last_positive": math.nan,
                    "exclusion_reason": "no_positive_monthly_net_demand",
                }
            )
            continue

        first_sale_month = positive_months.min()
        last_sale_month = positive_months.max()
        recency_months = months_between(last_sale_month, analysis_end_month)

        if not is_active and recency_months > config.inactive_recent_months:
            excluded_rows.append(
                {
                    "region": group.iloc[-1]["region"],
                    "base_sku": keys[0],
                    "branch": keys[1],
                    "status": "Vô hiệu hóa",
                    "first_observed_month": first_observed,
                    "last_observed_month": last_observed,
                    "last_positive_month": last_sale_month,
                    "months_since_last_positive": recency_months,
                    "exclusion_reason": "permanently_inactive_outside_recent_window",
                }
            )
            continue

        series_end_month = analysis_end_month if is_active else last_sale_month
        complete_months = pd.date_range(first_sale_month, series_end_month, freq="MS")
        net_series = observed.reindex(complete_months, fill_value=0.0).astype(float)
        demand_series = net_series.clip(lower=0.0)
        episode_bounds = split_episode_bounds(demand_series, config.relaunch_gap_months)

        for episode_id, (episode_start, episode_end) in enumerate(episode_bounds, start=1):
            episode_net = net_series.loc[episode_start:episode_end]
            episode_demand = demand_series.loc[episode_start:episode_end]
            part = pd.DataFrame(
                {
                    "month": episode_demand.index,
                    "demand": episode_demand.to_numpy(dtype=float),
                    "net_quantity": episode_net.to_numpy(dtype=float),
                }
            )
            part["base_sku"], part["branch"] = keys
            part["region"] = group.iloc[-1]["region"]
            part["episode_id"] = episode_id
            part["episode_count"] = len(episode_bounds)
            part["is_latest_episode"] = episode_id == len(episode_bounds)
            part["status"] = "Hoạt động" if is_active else "Vô hiệu hóa"
            part["series_scope"] = "active" if is_active else "recent_inactive_window"
            part["source_end_month"] = analysis_end_month
            part["pair_last_positive_month"] = last_sale_month
            part["months_since_pair_last_positive"] = recency_months
            # Inactive gần đây chỉ đóng góp episode hoạt động cuối; episode cũ
            # vẫn xuất ra để audit nhưng không tham gia tìm ngưỡng.
            part["include_for_threshold"] = is_active or episode_id == len(episode_bounds)
            part["scope_exclusion_reason"] = (
                ""
                if part["include_for_threshold"].iloc[0]
                else "historical_episode_of_recent_inactive"
            )
            panel_parts.append(part)

    if not panel_parts:
        raise RuntimeError("Không có episode active/recent-inactive nào có net demand dương.")

    panel = pd.concat(panel_parts, ignore_index=True)
    excluded = pd.DataFrame(
        excluded_rows,
        columns=[
            "region",
            "base_sku",
            "branch",
            "status",
            "first_observed_month",
            "last_observed_month",
            "last_positive_month",
            "months_since_last_positive",
            "exclusion_reason",
        ],
    )
    return panel.sort_values(
        [*LEVEL_COLUMNS, "episode_id", "month"]
    ).reset_index(drop=True), excluded


def calculate_one_series_stats(group: pd.DataFrame) -> dict[str, object]:
    values = group.sort_values("month")["demand"].to_numpy(dtype=float)
    positive = values[values > DEMAND_EPSILON]
    history_months = int(values.size)
    positive_months = int(positive.size)

    adi = history_months / positive_months if positive_months else math.nan
    mean_positive = float(positive.mean()) if positive_months else math.nan

    # ddof=1 tương đương STDDEV_SAMP của PostgreSQL.
    cv2 = (
        float((positive.std(ddof=1) / mean_positive) ** 2)
        if positive_months >= 2 and mean_positive > 0
        else math.nan
    )

    return {
        "first_month": group["month"].min(),
        "last_month": group["month"].max(),
        "last_positive_month": group.loc[group["demand"] > DEMAND_EPSILON, "month"].max(),
        "history_months": history_months,
        "positive_months": positive_months,
        "zero_months": history_months - positive_months,
        "negative_net_months": int((group["net_quantity"] < -DEMAND_EPSILON).sum()),
        "net_quantity_sum": float(group["net_quantity"].sum()),
        "demand_sum": float(values.sum()),
        "positive_rate": positive_months / history_months if history_months else math.nan,
        "mean_positive_demand": mean_positive,
        "adi": adi,
        "cv2": cv2,
    }


def calculate_demand_stats(
    panel: pd.DataFrame,
    config: AnalysisConfig,
) -> pd.DataFrame:
    rows: list[dict[str, object]] = []
    episode_columns = [*LEVEL_COLUMNS, "episode_id"]
    for keys, group in panel.groupby(episode_columns, sort=False, observed=True):
        first = group.sort_values("month").iloc[0]
        row = {
            "region": first["region"],
            "base_sku": keys[0],
            "branch": keys[1],
            "episode_id": int(keys[2]),
            "episode_count": int(first["episode_count"]),
            "is_latest_episode": bool(first["is_latest_episode"]),
            "status": first["status"],
            "series_scope": first["series_scope"],
            "source_end_month": first["source_end_month"],
            "pair_last_positive_month": first["pair_last_positive_month"],
            "months_since_pair_last_positive": int(
                first["months_since_pair_last_positive"]
            ),
            "include_for_threshold": bool(first["include_for_threshold"]),
            "scope_exclusion_reason": first["scope_exclusion_reason"],
        }
        row.update(calculate_one_series_stats(group))
        rows.append(row)

    stats = pd.DataFrame(rows)
    capped_history = stats["history_months"].clip(
        upper=config.history_weight_cap_months
    )
    baseline = max(config.min_history_months, 1)
    stats["series_weight"] = (
        capped_history.astype(float) / baseline
    ) ** config.history_weight_power
    stats["is_eligible"] = (
        stats["include_for_threshold"]
        & (stats["history_months"] >= config.min_history_months)
        & (stats["positive_months"] >= config.min_positive_months)
        & stats["adi"].notna()
        & stats["cv2"].notna()
    )
    return stats


def sanity_check_formulas() -> None:
    def from_values(values: list[float]) -> dict[str, object]:
        sample = pd.DataFrame(
            {
                "month": pd.date_range("2025-01-01", periods=len(values), freq="MS"),
                "demand": values,
                "net_quantity": values,
            }
        )
        return calculate_one_series_stats(sample)

    every_month = from_values([10, 10, 10, 10])
    every_other_month = from_values([10, 0, 10, 0])
    variable = from_values([10, 0, 30, 0, 20, 0])

    assert np.isclose(every_month["adi"], 1.0)
    assert np.isclose(every_month["cv2"], 0.0)
    assert np.isclose(every_other_month["adi"], 2.0)
    assert np.isclose(every_other_month["cv2"], 0.0)
    assert np.isclose(variable["adi"], 2.0)
    assert np.isclose(variable["cv2"], (10.0 / 20.0) ** 2)


def sanity_check_episode_policy() -> None:
    rows = [
        # Active mixed-variant pair: active_net_quantity mới là target.
        ("ACTIVE", "001", "2025-01-01", 100.0, 10.0, True),
        ("ACTIVE", "001", "2025-02-01", -3.0, -3.0, True),
        ("ACTIVE", "001", "2025-03-01", 20.0, 20.0, True),
        # Gap 6 tháng zero giữa Feb và Sep phải tạo episode mới.
        ("RELAUNCH", "001", "2025-01-01", 5.0, 5.0, True),
        ("RELAUNCH", "001", "2025-02-01", 5.0, 5.0, True),
        ("RELAUNCH", "001", "2025-09-01", 7.0, 7.0, True),
        ("RELAUNCH", "001", "2025-11-01", 0.0, 0.0, True),
        # Inactive gần đây: return tháng 11 không được kéo dài episode sau Sep.
        ("RECENT", "001", "2025-09-01", 8.0, 0.0, False),
        ("RECENT", "001", "2025-11-01", -2.0, 0.0, False),
        # Inactive cũ bị loại hoàn toàn khỏi tập episode.
        ("DEAD", "001", "2025-01-01", 9.0, 0.0, False),
        ("DEAD", "001", "2025-11-01", 0.0, 0.0, False),
    ]
    sample = pd.DataFrame(
        rows,
        columns=[
            "base_sku",
            "branch",
            "month",
            "net_quantity",
            "active_net_quantity",
            "has_active_variant",
        ],
    )
    sample["month"] = pd.to_datetime(sample["month"])
    sample["region"] = "Test"
    config = AnalysisConfig(inactive_recent_months=3, relaunch_gap_months=6)
    panel, excluded = build_demand_episodes(sample, config)

    active = panel[panel["base_sku"] == "ACTIVE"].sort_values("month")
    assert active.iloc[0]["demand"] == 10.0
    assert active.iloc[1]["net_quantity"] == -3.0
    assert active.iloc[1]["demand"] == 0.0

    relaunch = panel[panel["base_sku"] == "RELAUNCH"]
    assert relaunch["episode_id"].nunique() == 2
    assert relaunch.loc[relaunch["episode_id"] == 1, "month"].max() == pd.Timestamp(
        "2025-02-01"
    )
    assert relaunch.loc[relaunch["episode_id"] == 2, "month"].min() == pd.Timestamp(
        "2025-09-01"
    )

    recent = panel[panel["base_sku"] == "RECENT"]
    assert recent["month"].max() == pd.Timestamp("2025-09-01")
    assert "DEAD" not in set(panel["base_sku"])
    dead = excluded[excluded["base_sku"] == "DEAD"].iloc[0]
    assert dead["exclusion_reason"] == "permanently_inactive_outside_recent_window"


def pattern_codes(
    adi: np.ndarray,
    cv2: np.ndarray,
    adi_threshold: float,
    cv2_threshold: float,
) -> np.ndarray:
    """0=Smooth, 1=Erratic, 2=Intermittent, 3=Lumpy."""
    return (
        (adi >= adi_threshold).astype(np.int8) * 2
        + (cv2 >= cv2_threshold).astype(np.int8)
    )


def pattern_names(
    frame: pd.DataFrame,
    adi_threshold: float,
    cv2_threshold: float,
) -> np.ndarray:
    codes = pattern_codes(
        frame["adi"].to_numpy(dtype=float),
        frame["cv2"].to_numpy(dtype=float),
        adi_threshold,
        cv2_threshold,
    )
    return np.asarray(PATTERN_ORDER)[codes]


def prepare_feature_arrays(
    frame: pd.DataFrame,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    columns = ["adi", "cv2"]
    clean = frame[columns].replace([np.inf, -np.inf], np.nan).dropna()
    if clean.empty:
        raise ValueError("Không có ADI/CV² hợp lệ để tìm ngưỡng.")

    adi = clean["adi"].to_numpy(dtype=float)
    cv2 = clean["cv2"].to_numpy(dtype=float)
    weights = (
        frame.loc[clean.index, "series_weight"].to_numpy(dtype=float)
        if "series_weight" in frame.columns
        else np.ones(len(clean), dtype=float)
    )
    if np.any(~np.isfinite(weights)) or np.any(weights <= 0):
        raise ValueError("series_weight phải hữu hạn và > 0.")

    features = np.column_stack([np.log(adi), np.log1p(cv2)])
    mean = np.average(features, axis=0, weights=weights)
    variance = np.average((features - mean) ** 2, axis=0, weights=weights)
    std = np.sqrt(variance)
    std[std == 0] = 1.0
    z = (features - mean) / std
    return adi, cv2, z, weights


def weighted_split_candidates(
    transformed_values: np.ndarray,
    weights: np.ndarray,
    grid_size: int,
    min_pattern_share: float,
    inverse_transform: Callable[[np.ndarray], np.ndarray],
) -> np.ndarray:
    """Tạo ranh giới nằm giữa hai giá trị quan sát, không đặt lên điểm dữ liệu.

    Mỗi phía của một ngưỡng phải có đủ khối lượng cho ít nhất hai pattern.
    Trong mọi khoảng trống hợp lệ, giữ ``grid_size`` split có weighted Otsu
    gain cao nhất. Cách này tìm valley của phân phối thay vì lấy quantile tùy ý.
    """
    order = np.argsort(transformed_values)
    sorted_values = transformed_values[order]
    sorted_weights = weights[order]
    unique_values, inverse = np.unique(sorted_values, return_inverse=True)
    if len(unique_values) < 2:
        raise ValueError("Feature chỉ có một giá trị; không thể tìm ngưỡng thấp/cao.")

    unique_weights = np.bincount(inverse, weights=sorted_weights)
    unique_sums = np.bincount(
        inverse,
        weights=sorted_weights * sorted_values,
    )
    unique_square_sums = np.bincount(
        inverse,
        weights=sorted_weights * sorted_values**2,
    )
    low_shares = np.cumsum(unique_weights)[:-1] / unique_weights.sum()
    min_side_share = max(2.0 * min_pattern_share, 0.05)
    valid = (low_shares >= min_side_share) & (
        low_shares <= 1.0 - min_side_share
    )
    valid_positions = np.flatnonzero(valid)
    if len(valid_positions) == 0:
        raise ValueError("Không có split đủ dữ liệu ở cả hai phía.")

    cumulative_weights = np.cumsum(unique_weights)[:-1]
    cumulative_sums = np.cumsum(unique_sums)[:-1]
    cumulative_square_sums = np.cumsum(unique_square_sums)[:-1]
    total_weight = unique_weights.sum()
    total_sum = unique_sums.sum()
    total_square_sum = unique_square_sums.sum()

    low_sse = cumulative_square_sums - cumulative_sums**2 / cumulative_weights
    high_weights = total_weight - cumulative_weights
    high_sums = total_sum - cumulative_sums
    high_square_sums = total_square_sum - cumulative_square_sums
    high_sse = high_square_sums - high_sums**2 / high_weights
    total_sse = total_square_sum - total_sum**2 / total_weight
    if total_sse <= DEMAND_EPSILON:
        raise ValueError("Feature không có đủ phương sai để tìm ngưỡng.")

    gains = np.clip(1.0 - (low_sse + high_sse) / total_sse, 0.0, 1.0)
    ranked_valid = valid_positions[
        np.argsort(gains[valid_positions], kind="stable")[::-1]
    ]
    selected_positions = ranked_valid[:grid_size]
    transformed_midpoints = np.asarray(
        [
            (unique_values[position] + unique_values[position + 1]) / 2.0
            for position in selected_positions
        ],
        dtype=float,
    )
    return np.asarray(inverse_transform(transformed_midpoints), dtype=float)


def weighted_binary_split_gain(
    values: np.ndarray,
    high_mask: np.ndarray,
    weights: np.ndarray,
) -> float:
    """Tỷ lệ phương sai một chiều được giải thích bởi split thấp/cao."""
    if high_mask.all() or not high_mask.any():
        return 0.0

    overall_mean = np.average(values, weights=weights)
    total_sse = float((weights * (values - overall_mean) ** 2).sum())
    if total_sse <= DEMAND_EPSILON:
        return 0.0

    within_sse = 0.0
    for mask in (~high_mask, high_mask):
        group_mean = np.average(values[mask], weights=weights[mask])
        within_sse += float(
            (weights[mask] * (values[mask] - group_mean) ** 2).sum()
        )
    return max(0.0, min(1.0, 1.0 - within_sse / total_sse))


def evaluate_threshold_arrays(
    adi: np.ndarray,
    cv2: np.ndarray,
    z: np.ndarray,
    weights: np.ndarray,
    adi_threshold: float,
    cv2_threshold: float,
    min_pattern_share: float,
) -> dict[str, float] | None:
    codes = pattern_codes(adi, cv2, adi_threshold, cv2_threshold)
    counts = np.bincount(codes, minlength=4).astype(float)
    count_shares = counts / len(codes)
    cluster_weights = np.bincount(codes, weights=weights, minlength=4).astype(float)
    shares = cluster_weights / weights.sum()
    if np.any(shares < min_pattern_share):
        return None

    adi_high = adi >= adi_threshold
    cv2_high = cv2 >= cv2_threshold
    adi_split_gain = weighted_binary_split_gain(z[:, 0], adi_high, weights)
    cv2_split_gain = weighted_binary_split_gain(z[:, 1], cv2_high, weights)

    # Chỉ dùng separation 4 cụm như diagnostic. Objective chính là geometric
    # mean của hai split 1D, nên một ngưỡng ADI tốt không thể bù cho CV² tệ.
    overall_mean = np.average(z, axis=0, weights=weights)
    total_sse = float((weights[:, None] * (z - overall_mean) ** 2).sum())
    within_sse = 0.0
    for code in range(4):
        mask = codes == code
        cluster = z[mask]
        if len(cluster):
            cluster_weight = weights[mask]
            centroid = np.average(cluster, axis=0, weights=cluster_weight)
            within_sse += float(
                (cluster_weight[:, None] * (cluster - centroid) ** 2).sum()
            )

    separation = 1.0 - within_sse / total_sse if total_sse else 0.0
    nonzero_shares = shares[shares > 0]
    entropy = float(
        -(nonzero_shares * np.log(nonzero_shares)).sum() / np.log(len(PATTERN_ORDER))
    )

    score = math.sqrt(adi_split_gain * cv2_split_gain)
    result = {
        "adi_threshold": float(adi_threshold),
        "cv2_threshold": float(cv2_threshold),
        "score": score,
        "adi_split_gain": adi_split_gain,
        "cv2_split_gain": cv2_split_gain,
        "separation": separation,
        "entropy": entropy,
        "min_share": float(shares.min()),
        "min_weighted_share": float(shares.min()),
        "min_count_share": float(count_shares.min()),
    }
    result.update(
        {
            f"{pattern.lower()}_share": float(shares[index])
            for index, pattern in enumerate(PATTERN_ORDER)
        }
    )
    result.update(
        {
            f"{pattern.lower()}_count_share": float(count_shares[index])
            for index, pattern in enumerate(PATTERN_ORDER)
        }
    )
    return result


def evaluate_thresholds(
    frame: pd.DataFrame,
    adi_threshold: float,
    cv2_threshold: float,
    min_pattern_share: float,
) -> dict[str, float] | None:
    adi, cv2, z, weights = prepare_feature_arrays(frame)
    return evaluate_threshold_arrays(
        adi,
        cv2,
        z,
        weights,
        adi_threshold,
        cv2_threshold,
        min_pattern_share,
    )


def find_best_thresholds(
    frame: pd.DataFrame,
    grid_size: int,
    min_pattern_share: float,
) -> tuple[dict[str, float], pd.DataFrame]:
    adi, cv2, z, weights = prepare_feature_arrays(frame)
    adi_candidates = weighted_split_candidates(
        np.log(adi),
        weights,
        grid_size,
        min_pattern_share,
        np.exp,
    )
    cv2_candidates = weighted_split_candidates(
        np.log1p(cv2),
        weights,
        grid_size,
        min_pattern_share,
        np.expm1,
    )

    results: list[dict[str, float]] = []
    for adi_threshold in adi_candidates:
        for cv2_threshold in cv2_candidates:
            result = evaluate_threshold_arrays(
                adi,
                cv2,
                z,
                weights,
                float(adi_threshold),
                float(cv2_threshold),
                min_pattern_share,
            )
            if result is not None:
                results.append(result)

    if not results:
        raise ValueError(
            "Không có cặp ngưỡng thỏa min_pattern_share. "
            "Hãy giảm --min-pattern-share hoặc kiểm tra dữ liệu."
        )

    table = (
        pd.DataFrame(results)
        .sort_values(
            ["score", "min_weighted_share", "separation"],
            ascending=False,
        )
        .reset_index(drop=True)
    )
    return table.iloc[0].to_dict(), table


def sanity_check_threshold_search() -> None:
    # Bốn regime rõ ràng với khoảng trống thật giữa low/high trên cả hai trục.
    frame = pd.DataFrame(
        {
            "adi": [1.00, 1.10, 1.20, 1.15, 4.00, 4.20, 4.50, 4.30] * 4,
            "cv2": [0.08, 0.10, 1.00, 1.10, 0.09, 0.12, 1.20, 1.30] * 4,
            "series_weight": [1.0, 1.2, 1.0, 1.2, 1.4, 1.6, 1.4, 1.6] * 4,
        }
    )
    best, search_table = find_best_thresholds(
        frame,
        grid_size=9,
        min_pattern_share=0.05,
    )
    assert 1.20 < best["adi_threshold"] < 4.00
    assert 0.12 < best["cv2_threshold"] < 1.00
    assert best["adi_split_gain"] > 0.8
    assert best["cv2_split_gain"] > 0.8
    # Threshold phải nằm giữa hai mức quan sát, không trùng một giá trị dữ liệu.
    assert best["adi_threshold"] not in set(frame["adi"])
    assert best["cv2_threshold"] not in set(frame["cv2"])

    bootstrap = pd.DataFrame(
        {
            "adi_threshold": [best["adi_threshold"] * 0.98, best["adi_threshold"] * 1.02],
            "cv2_threshold": [best["cv2_threshold"] * 0.97, best["cv2_threshold"] * 1.03],
        }
    )
    selected, center = select_recommended_thresholds(
        frame,
        search_table,
        bootstrap,
        score_ratio=0.98,
    )
    assert selected["score"] >= search_table["score"].max() * 0.98
    assert center["adi_threshold"] > 0
    assert center["cv2_threshold"] >= 0


def bootstrap_thresholds(
    eligible: pd.DataFrame,
    config: AnalysisConfig,
) -> pd.DataFrame:
    rng = np.random.default_rng(config.random_seed)
    results: list[dict[str, float]] = []
    # Lấy mẫu theo base_sku + branch để các episode của cùng một series luôn
    # đi cùng nhau; lấy mẫu từng episode độc lập sẽ đánh giá thấp uncertainty.
    grouped_indices = [
        group.index.to_numpy()
        for _, group in eligible.groupby(LEVEL_COLUMNS, sort=False, observed=True)
    ]

    for iteration in range(config.bootstrap_iterations):
        group_positions = rng.integers(
            0,
            len(grouped_indices),
            size=len(grouped_indices),
        )
        sampled_indices = np.concatenate(
            [grouped_indices[position] for position in group_positions]
        )
        sample = eligible.loc[sampled_indices].reset_index(drop=True)
        try:
            best, _ = find_best_thresholds(
                sample,
                config.bootstrap_grid_size,
                config.min_pattern_share,
            )
        except ValueError:
            continue

        best["iteration"] = iteration + 1
        results.append(best)
        if (iteration + 1) % 10 == 0 or iteration == 0:
            print(
                f"Bootstrap {iteration + 1}/{config.bootstrap_iterations} "
                f"(thành công: {len(results)})"
            )

    if not results:
        raise ValueError(
            "Bootstrap không tìm được ngưỡng hợp lệ. "
            "Hãy giảm --min-pattern-share hoặc kiểm tra dữ liệu."
        )
    return pd.DataFrame(results)


def select_recommended_thresholds(
    eligible: pd.DataFrame,
    full_sample_search: pd.DataFrame,
    bootstrap: pd.DataFrame,
    score_ratio: float,
) -> tuple[dict[str, float], dict[str, float]]:
    """Chốt một split hợp lệ trên full sample, gần trung tâm bootstrap.

    Median bootstrap riêng rẽ có thể rơi đúng lên một giá trị quan sát hoặc tạo
    thành cặp chưa từng được đánh giá. Vì vậy median chỉ là tâm ổn định. Kết quả
    cuối được snap về candidate full-sample thỏa min share, nằm trong nhóm có
    score gần tối ưu, rồi chọn candidate gần tâm bootstrap nhất trên feature
    space đã scale.
    """
    center = {
        "adi_threshold": float(bootstrap["adi_threshold"].median()),
        "cv2_threshold": float(bootstrap["cv2_threshold"].median()),
    }
    best_score = float(full_sample_search["score"].max())
    score_floor = best_score * score_ratio
    candidates = full_sample_search.loc[
        full_sample_search["score"] >= score_floor
    ].copy()
    if candidates.empty:
        raise RuntimeError("Không có candidate gần tối ưu để chốt ngưỡng.")

    weights = eligible["series_weight"].to_numpy(dtype=float)
    log_adi = np.log(eligible["adi"].to_numpy(dtype=float))
    log_cv2 = np.log1p(eligible["cv2"].to_numpy(dtype=float))
    adi_scale = math.sqrt(
        float(np.average((log_adi - np.average(log_adi, weights=weights)) ** 2, weights=weights))
    )
    cv2_scale = math.sqrt(
        float(np.average((log_cv2 - np.average(log_cv2, weights=weights)) ** 2, weights=weights))
    )
    adi_scale = max(adi_scale, DEMAND_EPSILON)
    cv2_scale = max(cv2_scale, DEMAND_EPSILON)

    candidates["bootstrap_center_distance"] = np.sqrt(
        (
            (np.log(candidates["adi_threshold"]) - math.log(center["adi_threshold"]))
            / adi_scale
        )
        ** 2
        + (
            (
                np.log1p(candidates["cv2_threshold"])
                - math.log1p(center["cv2_threshold"])
            )
            / cv2_scale
        )
        ** 2
    )
    selected = (
        candidates.sort_values(
            ["bootstrap_center_distance", "score", "min_weighted_share"],
            ascending=[True, False, False],
        )
        .iloc[0]
        .to_dict()
    )
    selected["score_floor"] = score_floor
    return selected, center


def compare_threshold_candidates(
    eligible: pd.DataFrame,
    recommended_adi: float,
    recommended_cv2: float,
) -> pd.DataFrame:
    candidates = {
        "Data-driven (bootstrap-stable Otsu)": (recommended_adi, recommended_cv2),
        "Syntetos-Boylan reference": (1.32, 0.49),
        "Deployed backend": (DEPLOYED_ADI_THRESHOLD, DEPLOYED_CV2_THRESHOLD),
    }
    rows: list[dict[str, object]] = []
    for name, (adi_threshold, cv2_threshold) in candidates.items():
        result = evaluate_thresholds(
            eligible,
            adi_threshold,
            cv2_threshold,
            min_pattern_share=0.0,
        )
        if result is None:
            continue
        rows.append({"candidate": name, **result})
    return pd.DataFrame(rows)


def save_scatter_plot(
    eligible: pd.DataFrame,
    adi_threshold: float,
    cv2_threshold: float,
    target: Path,
) -> None:
    plot_data = eligible.copy()
    plot_data["demand_pattern"] = pattern_names(
        plot_data,
        adi_threshold,
        cv2_threshold,
    )

    figure, axis = plt.subplots(figsize=(11, 7))
    for pattern in PATTERN_ORDER:
        subset = plot_data[plot_data["demand_pattern"] == pattern]
        axis.scatter(
            subset["adi"],
            subset["cv2"],
            s=18,
            alpha=0.45,
            label=f"{pattern} ({len(subset):,})",
            color=PATTERN_COLORS[pattern],
        )

    axis.axvline(
        adi_threshold,
        color="black",
        linestyle="--",
        linewidth=1.5,
        label=f"ADI threshold = {adi_threshold:.3f}",
    )
    axis.axhline(
        cv2_threshold,
        color="black",
        linestyle=":",
        linewidth=1.5,
        label=f"CV² threshold = {cv2_threshold:.3f}",
    )
    axis.set_xscale("log")
    axis.set_yscale("symlog", linthresh=0.01)
    axis.set_xlabel("ADI (log scale)")
    axis.set_ylabel("CV² (symlog scale)")
    axis.set_title("Demand pattern ở cấp Base SKU + Branch")
    axis.grid(alpha=0.2)
    axis.legend(bbox_to_anchor=(1.02, 1), loc="upper left")
    figure.tight_layout()
    figure.savefig(target, dpi=180, bbox_inches="tight")
    plt.close(figure)


def serialize_json_value(value: object) -> object:
    """Convert third-party scalar types to values supported by json.

    A ``default`` callback must never return the same unsupported object. Doing
    so makes ``json`` detect a circular reference instead of showing the real
    unsupported type.
    """
    if isinstance(value, np.bool_):
        return bool(value)
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.floating):
        number = float(value)
        return number if math.isfinite(number) else None
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if value is pd.NA or value is pd.NaT:
        return None
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Path):
        return str(value)
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def sanity_check_json_serializer() -> None:
    sample = {
        "boolean": np.bool_(True),
        "integer": np.int64(3),
        "floating": np.float64(1.25),
        "timestamp": pd.Timestamp("2025-01-01"),
        "path": Path("output"),
    }
    decoded = json.loads(json.dumps(sample, default=serialize_json_value))
    assert decoded == {
        "boolean": True,
        "integer": 3,
        "floating": 1.25,
        "timestamp": "2025-01-01T00:00:00",
        "path": "output",
    }


def run_analysis(config: AnalysisConfig, output_dir: Path) -> None:
    validate_config(config)
    sanity_check_formulas()
    sanity_check_episode_policy()
    sanity_check_threshold_search()
    sanity_check_json_serializer()
    output_dir.mkdir(parents=True, exist_ok=True)

    print("Đang đọc demand tháng từ database...")
    monthly = load_monthly_demand(load_database_url())
    print(
        f"Đã đọc {len(monthly):,} dòng aggregate; "
        f"tháng mới nhất: {monthly['month'].max().date()}"
    )

    print("Đang dựng episode active/recent-inactive và tính ADI/CV²...")
    panel, excluded = build_demand_episodes(monthly, config)
    stats = calculate_demand_stats(panel, config)
    eligible = stats.loc[stats["is_eligible"]].copy()
    if eligible.empty:
        raise RuntimeError("Không có SKU đủ điều kiện để tìm ngưỡng.")

    total_pairs = monthly[LEVEL_COLUMNS].drop_duplicates().shape[0]
    retained_pairs = stats[LEVEL_COLUMNS].drop_duplicates().shape[0]
    print(f"Tổng base_sku + branch nguồn: {total_pairs:,}")
    print(f"Base_sku + branch được giữ: {retained_pairs:,}")
    print(f"Base_sku + branch bị loại: {len(excluded):,}")
    print(f"Tổng episode: {len(stats):,}")
    print(f"Episode đủ điều kiện tìm ngưỡng: {len(eligible):,}")

    print("Đang grid search trên toàn bộ mẫu...")
    best_full_sample, search_table = find_best_thresholds(
        eligible,
        config.full_grid_size,
        config.min_pattern_share,
    )
    print(
        "Ngưỡng tốt nhất toàn mẫu: "
        f"ADI={best_full_sample['adi_threshold']:.6f}, "
        f"CV²={best_full_sample['cv2_threshold']:.6f}"
    )

    print("Đang bootstrap để kiểm tra độ ổn định...")
    bootstrap = bootstrap_thresholds(eligible, config)
    recommended_candidate, bootstrap_center = select_recommended_thresholds(
        eligible,
        search_table,
        bootstrap,
        config.recommendation_score_ratio,
    )
    recommended_adi = float(recommended_candidate["adi_threshold"])
    recommended_cv2 = float(recommended_candidate["cv2_threshold"])
    stability = bootstrap[["adi_threshold", "cv2_threshold", "score"]].quantile(
        [0.10, 0.50, 0.90]
    )

    stats["demand_pattern"] = np.where(
        stats["include_for_threshold"], "Insufficient", "Excluded"
    )
    eligible_mask = stats["is_eligible"]
    stats.loc[eligible_mask, "demand_pattern"] = pattern_names(
        stats.loc[eligible_mask],
        recommended_adi,
        recommended_cv2,
    )

    comparison = compare_threshold_candidates(
        eligible,
        recommended_adi,
        recommended_cv2,
    )
    pattern_counts = pd.crosstab(
        stats["region"],
        stats["demand_pattern"],
        margins=True,
    )
    pattern_shares = pd.crosstab(
        stats["region"],
        stats["demand_pattern"],
        normalize="index",
    ).mul(100)

    recommended_evaluation = evaluate_thresholds(
        eligible,
        recommended_adi,
        recommended_cv2,
        min_pattern_share=0.0,
    )
    if recommended_evaluation is None:
        raise RuntimeError("Không đánh giá được ngưỡng đề xuất.")

    adi_width_ratio = (
        stability.loc[0.90, "adi_threshold"]
        - stability.loc[0.10, "adi_threshold"]
    ) / max(recommended_adi, DEMAND_EPSILON)
    cv2_width_ratio = (
        stability.loc[0.90, "cv2_threshold"]
        - stability.loc[0.10, "cv2_threshold"]
    ) / max(recommended_cv2, DEMAND_EPSILON)

    summary = {
        "level": LEVEL_COLUMNS,
        "source_table": SOURCE_TABLE,
        "source_schema_columns": SOURCE_SCHEMA_COLUMNS,
        "source_columns_used": DEMAND_SOURCE_COLUMNS,
        "active_status_definition": ITEM_IS_ACTIVE_SQL,
        "demand_definition": (
            "monthly_net = SUM(quantity) at base_sku + branch + month; "
            "active base uses active-variant monthly_net, inactive base uses all-variant "
            "monthly_net; demand = GREATEST(monthly_net, 0) only after monthly netting"
        ),
        "series_policy": {
            "active": "first positive month through source data-as-of month",
            "recent_inactive": "latest activity window ending at last positive net-demand month",
            "permanently_inactive": "excluded when recency exceeds inactive_recent_months",
            "relaunch": "split after relaunch_gap_months consecutive zero-demand months",
            "weight": (
                "(min(history_months, history_weight_cap_months) / "
                "min_history_months) ** history_weight_power"
            ),
        },
        "formula": {
            "adi": "history_months / positive_months",
            "cv2": "(STDDEV_SAMP(positive_month_demand) / AVG(positive_month_demand))^2",
        },
        "threshold_method": {
            "feature_space": "log(ADI), log1p(CV2), weighted z-score",
            "candidates": (
                "midpoints between adjacent observed values with the highest "
                "weighted one-dimensional Otsu gains"
            ),
            "objective": (
                "geometric mean of weighted one-dimensional variance reduction "
                "for the ADI low/high split and CV2 low/high split"
            ),
            "constraint": "each of four weighted pattern shares >= min_pattern_share",
            "entropy_usage": "diagnostic only; not part of optimization score",
        },
        "config": config.__dict__,
        "row_counts": {
            "source_base_sku_branch": total_pairs,
            "retained_base_sku_branch": retained_pairs,
            "excluded_base_sku_branch": len(excluded),
            "total_episodes": len(stats),
            "eligible_episodes": len(eligible),
            "insufficient_or_out_of_scope_episodes": int((~stats["is_eligible"]).sum()),
            "bootstrap_successful": len(bootstrap),
        },
        "recommended": {
            "adi_threshold": recommended_adi,
            "cv2_threshold": recommended_cv2,
            "selection": {
                "bootstrap_center": bootstrap_center,
                "full_sample_candidate": recommended_candidate,
                "rule": (
                    "nearest valid full-sample candidate to bootstrap median center, "
                    "among candidates meeting recommendation_score_ratio"
                ),
            },
            "evaluation": recommended_evaluation,
        },
        "best_full_sample": best_full_sample,
        "bootstrap_interval_10_90": {
            "adi_threshold": [
                float(stability.loc[0.10, "adi_threshold"]),
                float(stability.loc[0.90, "adi_threshold"]),
            ],
            "cv2_threshold": [
                float(stability.loc[0.10, "cv2_threshold"]),
                float(stability.loc[0.90, "cv2_threshold"]),
            ],
        },
        "warnings": {
            "pattern_too_small": bool(
                recommended_evaluation["min_share"] < config.min_pattern_share
            ),
            "adi_threshold_unstable": bool(adi_width_ratio > 0.50),
            "cv2_threshold_unstable": bool(cv2_width_ratio > 0.50),
        },
    }

    stats.to_csv(output_dir / "demand_stats.csv", index=False, encoding="utf-8-sig")
    excluded.to_csv(
        output_dir / "excluded_base_sku_branch.csv",
        index=False,
        encoding="utf-8-sig",
    )
    search_table.to_csv(
        output_dir / "threshold_grid_search.csv",
        index=False,
        encoding="utf-8-sig",
    )
    bootstrap.to_csv(
        output_dir / "bootstrap_thresholds.csv",
        index=False,
        encoding="utf-8-sig",
    )
    comparison.to_csv(
        output_dir / "threshold_comparison.csv",
        index=False,
        encoding="utf-8-sig",
    )
    stability.to_csv(output_dir / "threshold_stability.csv", encoding="utf-8-sig")
    pattern_counts.to_csv(
        output_dir / "pattern_counts_by_region.csv",
        encoding="utf-8-sig",
    )
    pattern_shares.to_csv(
        output_dir / "pattern_shares_by_region_pct.csv",
        encoding="utf-8-sig",
    )
    save_scatter_plot(
        eligible,
        recommended_adi,
        recommended_cv2,
        output_dir / "demand_pattern_scatter.png",
    )
    json_target = output_dir / "recommended_thresholds.json"
    json_temporary = output_dir / "recommended_thresholds.json.tmp"
    with json_temporary.open("w", encoding="utf-8") as file:
        json.dump(
            summary,
            file,
            ensure_ascii=False,
            indent=2,
            default=serialize_json_value,
            allow_nan=False,
        )
    json_temporary.replace(json_target)

    print()
    print("Hoàn tất.")
    print(f"ADI_THRESHOLD = {recommended_adi:.6f}")
    print(f"CV2_THRESHOLD = {recommended_cv2:.6f}")
    print(f"Kết quả đã lưu tại: {output_dir.resolve()}")
    if any(summary["warnings"].values()):
        print("CẢNH BÁO: Ngưỡng chưa đủ ổn định hoặc có pattern quá nhỏ; xem warnings trong JSON.")


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    args = parse_args()
    config = AnalysisConfig(
        min_history_months=args.min_history_months,
        min_positive_months=args.min_positive_months,
        inactive_recent_months=args.inactive_recent_months,
        relaunch_gap_months=args.relaunch_gap_months,
        history_weight_power=args.history_weight_power,
        history_weight_cap_months=args.history_weight_cap_months,
        min_pattern_share=args.min_pattern_share,
        recommendation_score_ratio=args.recommendation_score_ratio,
        bootstrap_iterations=args.bootstrap,
        random_seed=args.seed,
        full_grid_size=args.full_grid_size,
        bootstrap_grid_size=args.bootstrap_grid_size,
    )
    run_analysis(config, args.output_dir)


if __name__ == "__main__":
    main()
