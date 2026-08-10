"""Create and refresh the central Base SKU x Branch x Episode mart."""

from __future__ import annotations

import os
from collections import defaultdict

import psycopg
from dotenv import load_dotenv

from app.demand_pattern import ADI_THRESHOLD, CV2_THRESHOLD
from app.services.demand_pattern_episode import (
    MART_DDL,
    MART_TABLE,
    MonthlyDemand,
    build_pair_episodes,
)


SOURCE_TABLE = "source.mart_sku_branch_month"
ACTIVE_SQL = """(
    LOWER(BTRIM(COALESCE(sku_status, ''))) = 'hoạt động'
    AND LOWER(BTRIM(COALESCE(branch_status, ''))) = 'hoạt động'
)"""


def load_database_url() -> str:
    load_dotenv()
    value = os.getenv("DATABASE_URL", "").strip()
    if not value:
        raise RuntimeError("DATABASE_URL is required")
    return value


def refresh(database_url: str) -> tuple[int, int]:
    query = f"""
        SELECT base_sku, branch, month,
               COALESCE(MAX(NULLIF(BTRIM(region), '')), 'Chưa xác định') AS region,
               MAX(branch_name) AS branch_name, MAX(sku_name) AS sku_name,
               COALESCE(SUM(quantity), 0)::double precision AS net_quantity,
               COALESCE(SUM(quantity) FILTER (WHERE {ACTIVE_SQL}), 0)::double precision AS active_net_quantity,
               BOOL_OR({ACTIVE_SQL}) AS has_active_variant
        FROM {SOURCE_TABLE}
        WHERE base_sku IS NOT NULL AND branch IS NOT NULL AND month IS NOT NULL
        GROUP BY base_sku, branch, month
        ORDER BY base_sku, branch, month
    """
    grouped: dict[tuple[str, str], list[MonthlyDemand]] = defaultdict(list)
    metadata: dict[tuple[str, str], dict] = {}
    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query)
            for row in cursor:
                key = (str(row[0]).strip(), str(row[1]).strip())
                grouped[key].append(MonthlyDemand(row[2], float(row[6]), float(row[7]), bool(row[8])))
                metadata[key] = {"region": row[3], "branch_name": row[4], "sku_name": row[5]}
        source_end = max(item.month for rows in grouped.values() for item in rows)
        records: list[tuple] = []
        for (base_sku, branch), monthly in grouped.items():
            for episode in build_pair_episodes(monthly, source_end):
                meta = metadata[(base_sku, branch)]
                records.append((
                    base_sku, branch, episode["episode_id"], meta["region"], meta["branch_name"],
                    meta["sku_name"], episode["status"], episode["series_scope"],
                    episode["episode_start_month"], episode["episode_end_month"],
                    episode["last_positive_month"], source_end, episode["history_months"],
                    episode["positive_months"], episode["zero_months"], episode["negative_net_months"],
                    episode["net_quantity_sum"], episode["gross_quantity"], episode["adi"], episode["cv2"],
                    episode["demand_pattern"], episode["series_weight"], episode["is_latest_episode"],
                    episode["is_excluded"], episode["exclusion_reason"], ADI_THRESHOLD, CV2_THRESHOLD,
                ))
        with connection.cursor() as cursor:
            cursor.execute(MART_DDL)
            cursor.execute(f"TRUNCATE TABLE {MART_TABLE}")
            cursor.executemany(
                f"""INSERT INTO {MART_TABLE} (
                    base_sku, branch, episode_id, region, branch_name, sku_name, status, series_scope,
                    episode_start_month, episode_end_month, last_positive_month, source_end_month,
                    history_months, positive_months, zero_months, negative_net_months,
                    net_quantity_sum, gross_quantity, adi, cv2, demand_pattern, series_weight,
                    is_latest_episode, is_excluded, exclusion_reason, threshold_adi, threshold_cv2
                ) VALUES ({', '.join(['%s'] * 27)})""",
                records,
            )
        connection.commit()
    return len(grouped), len(records)


if __name__ == "__main__":
    pair_count, episode_count = refresh(load_database_url())
    print(f"Refreshed {MART_TABLE}: {pair_count:,} pairs, {episode_count:,} episodes")
