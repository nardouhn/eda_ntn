"""Nguồn sự thật duy nhất cho Demand Pattern ở grain Base SKU × Branch × Episode."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from math import sqrt
from statistics import fmean, stdev

from app.demand_pattern import (
    ADI_THRESHOLD,
    CV2_THRESHOLD,
    INACTIVE_RECENT_MONTHS,
    MIN_HISTORY_MONTHS,
    MIN_POSITIVE_MONTHS,
    RELAUNCH_GAP_MONTHS,
)


DEMAND_EPSILON = 1e-9
HISTORY_WEIGHT_CAP_MONTHS = 36
HISTORY_WEIGHT_POWER = 0.5
EPISODE_VIEW = "analytics.v_demand_pattern_episode"
MART_TABLE = "analytics.mart_demand_pattern_episode"

MART_DDL = f"""
CREATE TABLE IF NOT EXISTS {MART_TABLE} (
    base_sku text NOT NULL,
    branch text NOT NULL,
    episode_id integer NOT NULL,
    region text NOT NULL,
    branch_name text,
    sku_name text,
    status text NOT NULL,
    series_scope text NOT NULL,
    episode_start_month date NOT NULL,
    episode_end_month date NOT NULL,
    last_positive_month date,
    source_end_month date NOT NULL,
    history_months integer NOT NULL,
    positive_months integer NOT NULL,
    zero_months integer NOT NULL,
    negative_net_months integer NOT NULL,
    net_quantity_sum double precision NOT NULL,
    gross_quantity double precision NOT NULL,
    adi double precision,
    cv2 double precision,
    demand_pattern text NOT NULL,
    series_weight double precision NOT NULL,
    is_latest_episode boolean NOT NULL,
    is_excluded boolean NOT NULL,
    exclusion_reason text NOT NULL DEFAULT '',
    threshold_adi double precision NOT NULL,
    threshold_cv2 double precision NOT NULL,
    calculated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (base_sku, branch, episode_id)
);
CREATE INDEX IF NOT EXISTS mart_demand_pattern_episode_latest_idx
    ON {MART_TABLE} (region, demand_pattern, base_sku, branch)
    WHERE is_latest_episode;
"""


@dataclass(frozen=True)
class MonthlyDemand:
    month: date
    net_quantity: float
    active_net_quantity: float
    has_active_variant: bool


def add_months(value: date, offset: int) -> date:
    index = value.year * 12 + value.month - 1 + offset
    return date(index // 12, index % 12 + 1, 1)


def month_distance(start: date, end: date) -> int:
    return (end.year - start.year) * 12 + end.month - start.month


def month_range(start: date, end: date) -> list[date]:
    values: list[date] = []
    current = start
    while current <= end:
        values.append(current)
        current = add_months(current, 1)
    return values


def classify_pattern(
    adi: float | None,
    cv2: float | None,
    history_months: int,
    positive_months: int,
) -> str:
    if (
        history_months < MIN_HISTORY_MONTHS
        or positive_months < MIN_POSITIVE_MONTHS
        or adi is None
        or cv2 is None
    ):
        return "Insufficient-New"
    if adi < ADI_THRESHOLD and cv2 < CV2_THRESHOLD:
        return "Smooth"
    if adi < ADI_THRESHOLD and cv2 >= CV2_THRESHOLD:
        return "Erratic"
    if adi >= ADI_THRESHOLD and cv2 < CV2_THRESHOLD:
        return "Intermittent"
    return "Lumpy"


def build_pair_episodes(
    monthly_rows: list[MonthlyDemand],
    data_as_of: date,
) -> list[dict]:
    """Dựng episode đúng policy đã dùng để calibrate ngưỡng ADI/CV²."""
    if not monthly_rows:
        return []
    observed_rows = sorted(monthly_rows, key=lambda row: row.month)
    is_active = any(row.has_active_variant for row in observed_rows)
    selected = {
        row.month: row.active_net_quantity if is_active else row.net_quantity
        for row in observed_rows
    }
    positive_observed = [month for month, value in selected.items() if value > DEMAND_EPSILON]
    status = "Hoạt động" if is_active else "Vô hiệu hóa"
    if not positive_observed:
        return [{
            "episode_id": 0,
            "episode_start_month": observed_rows[0].month,
            "episode_end_month": observed_rows[-1].month,
            "last_positive_month": None,
            "history_months": 0,
            "positive_months": 0,
            "zero_months": 0,
            "negative_net_months": sum(value < -DEMAND_EPSILON for value in selected.values()),
            "net_quantity_sum": float(sum(selected.values())),
            "gross_quantity": 0.0,
            "adi": None,
            "cv2": None,
            "demand_pattern": "Insufficient-New" if is_active else "Excluded-Inactive",
            "series_weight": 0.0,
            "is_latest_episode": True,
            "is_excluded": not is_active,
            "exclusion_reason": "no_positive_monthly_net_demand",
            "status": status,
            "series_scope": "active" if is_active else "inactive",
        }]

    first_positive = min(positive_observed)
    last_positive = max(positive_observed)
    recency = month_distance(last_positive, data_as_of)
    series_end = data_as_of if is_active else last_positive
    months = month_range(first_positive, series_end)
    net = {month: float(selected.get(month, 0.0)) for month in months}
    positives = [month for month in months if net[month] > DEMAND_EPSILON]

    groups: list[list[date]] = [[positives[0]]]
    for month in positives[1:]:
        if month_distance(groups[-1][-1], month) - 1 >= RELAUNCH_GAP_MONTHS:
            groups.append([month])
        else:
            groups[-1].append(month)

    episodes: list[dict] = []
    inactive_too_old = not is_active and recency > INACTIVE_RECENT_MONTHS
    for index, group in enumerate(groups, start=1):
        is_latest = index == len(groups)
        start = group[0]
        end = series_end if is_latest else group[-1]
        episode_months = month_range(start, end)
        episode_net = [net[month] for month in episode_months]
        positive_values = [value for value in episode_net if value > DEMAND_EPSILON]
        history_months = len(episode_months)
        positive_months = len(positive_values)
        adi = history_months / positive_months if positive_months else None
        cv2 = (
            (stdev(positive_values) / fmean(positive_values)) ** 2
            if positive_months >= 2 and fmean(positive_values) > 0
            else None
        )
        pattern = classify_pattern(adi, cv2, history_months, positive_months)
        excluded = inactive_too_old or (not is_active and not is_latest)
        reason = ""
        if inactive_too_old:
            reason = "permanently_inactive_outside_recent_window"
        elif not is_active and not is_latest:
            reason = "historical_episode_of_recent_inactive"
        if is_latest and inactive_too_old:
            pattern = "Excluded-Inactive"
        weight = (
            min(history_months, HISTORY_WEIGHT_CAP_MONTHS) / max(MIN_HISTORY_MONTHS, 1)
        ) ** HISTORY_WEIGHT_POWER
        episodes.append({
            "episode_id": index,
            "episode_start_month": start,
            "episode_end_month": end,
            "last_positive_month": group[-1],
            "history_months": history_months,
            "positive_months": positive_months,
            "zero_months": history_months - positive_months,
            "negative_net_months": sum(value < -DEMAND_EPSILON for value in episode_net),
            "net_quantity_sum": float(sum(episode_net)),
            "gross_quantity": float(sum(max(value, 0.0) for value in episode_net)),
            "adi": adi,
            "cv2": cv2,
            "demand_pattern": pattern,
            "series_weight": float(weight),
            "is_latest_episode": is_latest,
            "is_excluded": excluded,
            "exclusion_reason": reason,
            "status": status,
            "series_scope": "active" if is_active else "recent_inactive_window",
        })
    return episodes


VIEW_DDL = f"""
CREATE SCHEMA IF NOT EXISTS analytics;
DROP TABLE IF EXISTS analytics.mart_demand_pattern_episode;
CREATE OR REPLACE VIEW {EPISODE_VIEW} AS
WITH monthly_source AS (
    SELECT base_sku, branch, month::date AS month,
           COALESCE(MAX(NULLIF(BTRIM(region), '')), 'Chưa xác định') AS region,
           MAX(branch_name) AS branch_name, MAX(sku_name) AS sku_name,
           COALESCE(SUM(quantity), 0)::double precision AS net_quantity,
           COALESCE(SUM(quantity) FILTER (WHERE
               LOWER(BTRIM(COALESCE(sku_status, ''))) = 'hoạt động'
               AND LOWER(BTRIM(COALESCE(branch_status, ''))) = 'hoạt động'
           ), 0)::double precision AS active_net_quantity,
           BOOL_OR(
               LOWER(BTRIM(COALESCE(sku_status, ''))) = 'hoạt động'
               AND LOWER(BTRIM(COALESCE(branch_status, ''))) = 'hoạt động'
           ) AS has_active_variant
    FROM source.mart_sku_branch_month
    WHERE base_sku IS NOT NULL AND branch IS NOT NULL AND month IS NOT NULL
    GROUP BY base_sku, branch, month
), source_bound AS (
    SELECT MAX(month)::date AS source_end_month FROM monthly_source
), pair_state AS (
    SELECT base_sku, branch,
           (ARRAY_AGG(region ORDER BY month DESC))[1] AS region,
           (ARRAY_AGG(branch_name ORDER BY month DESC))[1] AS branch_name,
           (ARRAY_AGG(sku_name ORDER BY month DESC))[1] AS sku_name,
           BOOL_OR(has_active_variant) AS is_active,
           MIN(month)::date AS first_observed_month, MAX(month)::date AS last_observed_month
    FROM monthly_source GROUP BY base_sku, branch
), selected_monthly AS (
    SELECT source.*, state.is_active,
           CASE WHEN state.is_active THEN source.active_net_quantity ELSE source.net_quantity END AS selected_net
    FROM monthly_source source JOIN pair_state state USING (base_sku, branch)
), pair_positive_bounds AS (
    SELECT selected.base_sku, selected.branch,
           MIN(month) FILTER (WHERE selected_net > {DEMAND_EPSILON})::date AS first_positive_month,
           MAX(month) FILTER (WHERE selected_net > {DEMAND_EPSILON})::date AS last_positive_month
    FROM selected_monthly selected GROUP BY selected.base_sku, selected.branch
), pair_bounds AS (
    SELECT state.*, positive.first_positive_month, positive.last_positive_month,
           bound.source_end_month,
           CASE WHEN state.is_active THEN bound.source_end_month ELSE positive.last_positive_month END AS series_end_month,
           CASE WHEN positive.last_positive_month IS NULL THEN NULL ELSE
             ((EXTRACT(YEAR FROM bound.source_end_month)-EXTRACT(YEAR FROM positive.last_positive_month))*12
             +EXTRACT(MONTH FROM bound.source_end_month)-EXTRACT(MONTH FROM positive.last_positive_month))::integer END AS recency_months
    FROM pair_state state JOIN pair_positive_bounds positive USING(base_sku, branch)
    CROSS JOIN source_bound bound
), calendar AS (
    SELECT bounds.base_sku, bounds.branch, month_value::date AS month,
           COALESCE(selected.selected_net, 0)::double precision AS selected_net
    FROM pair_bounds bounds
    CROSS JOIN LATERAL generate_series(bounds.first_positive_month, bounds.series_end_month, interval '1 month') month_value
    LEFT JOIN selected_monthly selected
      ON selected.base_sku=bounds.base_sku AND selected.branch=bounds.branch AND selected.month=month_value::date
    WHERE bounds.first_positive_month IS NOT NULL
), positive_gaps AS (
    SELECT calendar.*,
           LAG(month) OVER(PARTITION BY base_sku,branch ORDER BY month) AS previous_positive_month
    FROM calendar WHERE selected_net > {DEMAND_EPSILON}
), positive_groups AS (
    SELECT gaps.*,
           SUM(CASE WHEN previous_positive_month IS NULL OR
             ((EXTRACT(YEAR FROM month)-EXTRACT(YEAR FROM previous_positive_month))*12
             +EXTRACT(MONTH FROM month)-EXTRACT(MONTH FROM previous_positive_month)-1) >= {RELAUNCH_GAP_MONTHS}
             THEN 1 ELSE 0 END)
           OVER(PARTITION BY base_sku,branch ORDER BY month)::integer AS episode_id
    FROM positive_gaps gaps
), episode_bounds AS (
    SELECT groups.base_sku, groups.branch, groups.episode_id,
           MIN(groups.month)::date AS episode_start_month,
           MAX(groups.month)::date AS last_positive_month,
           MAX(groups.episode_id) OVER(PARTITION BY groups.base_sku,groups.branch) AS max_episode_id
    FROM positive_groups groups GROUP BY groups.base_sku, groups.branch, groups.episode_id
), episode_windows AS (
    SELECT episode.base_sku, episode.branch, episode.episode_id,
           episode.episode_start_month, episode.last_positive_month, episode.max_episode_id,
           pair.region, pair.branch_name, pair.sku_name, pair.is_active,
           pair.source_end_month, pair.recency_months, pair.series_end_month,
           CASE WHEN episode.episode_id=episode.max_episode_id THEN pair.series_end_month
                ELSE episode.last_positive_month END::date AS episode_end_month
    FROM episode_bounds episode JOIN pair_bounds pair USING(base_sku,branch)
), episode_stats AS (
    SELECT episode_window.base_sku, episode_window.branch, episode_window.episode_id,
           episode_window.region, episode_window.branch_name, episode_window.sku_name, episode_window.is_active,
           episode_window.source_end_month, episode_window.recency_months,
           episode_window.episode_start_month, episode_window.episode_end_month, episode_window.last_positive_month,
           episode_window.max_episode_id,
           COUNT(*)::integer AS history_months,
           COUNT(*) FILTER(WHERE calendar.selected_net > {DEMAND_EPSILON})::integer AS positive_months,
           COUNT(*) FILTER(WHERE calendar.selected_net <= {DEMAND_EPSILON})::integer AS zero_months,
           COUNT(*) FILTER(WHERE calendar.selected_net < -{DEMAND_EPSILON})::integer AS negative_net_months,
           SUM(calendar.selected_net)::double precision AS net_quantity_sum,
           SUM(GREATEST(calendar.selected_net,0))::double precision AS gross_quantity,
           (COUNT(*)::double precision / NULLIF(COUNT(*) FILTER(WHERE calendar.selected_net > {DEMAND_EPSILON}),0))::double precision AS adi,
           (VAR_SAMP(calendar.selected_net) FILTER(WHERE calendar.selected_net > {DEMAND_EPSILON}) /
             NULLIF(POWER(AVG(calendar.selected_net) FILTER(WHERE calendar.selected_net > {DEMAND_EPSILON}),2),0))::double precision AS cv2
    FROM episode_windows episode_window JOIN calendar
      ON calendar.base_sku=episode_window.base_sku AND calendar.branch=episode_window.branch
     AND calendar.month BETWEEN episode_window.episode_start_month AND episode_window.episode_end_month
    GROUP BY episode_window.base_sku, episode_window.branch, episode_window.episode_id,
      episode_window.region, episode_window.branch_name, episode_window.sku_name,
      episode_window.is_active, episode_window.source_end_month, episode_window.recency_months,
      episode_window.episode_start_month, episode_window.episode_end_month,
      episode_window.last_positive_month, episode_window.max_episode_id
), classified AS (
    SELECT stats.*,
           stats.episode_id=stats.max_episode_id AS is_latest_episode,
           ((NOT stats.is_active AND stats.recency_months>{INACTIVE_RECENT_MONTHS})
             OR (NOT stats.is_active AND stats.episode_id<>stats.max_episode_id)) AS is_excluded
    FROM episode_stats stats
), positive_result AS (
    SELECT base_sku,branch,episode_id,region,branch_name,sku_name,
           CASE WHEN is_active THEN 'Hoạt động' ELSE 'Vô hiệu hóa' END AS status,
           CASE WHEN is_active THEN 'active' ELSE 'recent_inactive_window' END AS series_scope,
           episode_start_month,episode_end_month,last_positive_month,source_end_month,
           history_months,positive_months,zero_months,negative_net_months,net_quantity_sum,gross_quantity,adi,cv2,
           CASE
             WHEN is_latest_episode AND NOT is_active AND recency_months>{INACTIVE_RECENT_MONTHS} THEN 'Excluded-Inactive'
             WHEN history_months<{MIN_HISTORY_MONTHS} OR positive_months<{MIN_POSITIVE_MONTHS} OR adi IS NULL OR cv2 IS NULL THEN 'Insufficient-New'
             WHEN adi<{ADI_THRESHOLD} AND cv2<{CV2_THRESHOLD} THEN 'Smooth'
             WHEN adi<{ADI_THRESHOLD} AND cv2>={CV2_THRESHOLD} THEN 'Erratic'
             WHEN adi>={ADI_THRESHOLD} AND cv2<{CV2_THRESHOLD} THEN 'Intermittent'
             ELSE 'Lumpy' END AS demand_pattern,
           POWER(LEAST(history_months,{HISTORY_WEIGHT_CAP_MONTHS})::double precision/{MIN_HISTORY_MONTHS},{HISTORY_WEIGHT_POWER}) AS series_weight,
           is_latest_episode,is_excluded,
           CASE WHEN NOT is_active AND recency_months>{INACTIVE_RECENT_MONTHS} THEN 'permanently_inactive_outside_recent_window'
                WHEN NOT is_active AND NOT is_latest_episode THEN 'historical_episode_of_recent_inactive' ELSE '' END AS exclusion_reason
    FROM classified
), no_positive_result AS (
    SELECT pair.base_sku,pair.branch,0 AS episode_id,pair.region,pair.branch_name,pair.sku_name,
           CASE WHEN pair.is_active THEN 'Hoạt động' ELSE 'Vô hiệu hóa' END AS status,
           CASE WHEN pair.is_active THEN 'active' ELSE 'inactive' END AS series_scope,
           pair.first_observed_month AS episode_start_month,pair.last_observed_month AS episode_end_month,
           NULL::date AS last_positive_month,pair.source_end_month,
           0 AS history_months,0 AS positive_months,0 AS zero_months,
           COUNT(*) FILTER(WHERE selected.selected_net < -{DEMAND_EPSILON})::integer AS negative_net_months,
           COALESCE(SUM(selected.selected_net),0)::double precision AS net_quantity_sum,0::double precision AS gross_quantity,
           NULL::double precision AS adi,NULL::double precision AS cv2,
           CASE WHEN pair.is_active THEN 'Insufficient-New' ELSE 'Excluded-Inactive' END AS demand_pattern,
           0::double precision AS series_weight,TRUE AS is_latest_episode,NOT pair.is_active AS is_excluded,
           'no_positive_monthly_net_demand'::text AS exclusion_reason
    FROM pair_bounds pair LEFT JOIN selected_monthly selected USING(base_sku,branch)
    WHERE pair.first_positive_month IS NULL
    GROUP BY pair.base_sku,pair.branch,pair.region,pair.branch_name,pair.sku_name,pair.is_active,
      pair.first_observed_month,pair.last_observed_month,pair.source_end_month
)
SELECT * FROM positive_result
UNION ALL
SELECT * FROM no_positive_result;
"""
