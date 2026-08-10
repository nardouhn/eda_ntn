from datetime import date
from pathlib import Path

from app.services.demand_pattern_episode import (
    MART_DDL,
    MART_TABLE,
    MonthlyDemand,
    build_pair_episodes,
)


def test_mart_is_the_only_shared_source_for_the_three_tabs() -> None:
    routes = Path(__file__).parents[1] / "app" / "routes"
    for filename in ("eda_branch_sku.py", "eda_region.py", "eda_pattern_set.py"):
        source = (routes / filename).read_text(encoding="utf-8")
        assert "MART_TABLE" in source
        assert "EPISODE_VIEW" not in source
        assert "jsonb_to_recordset" not in source


def test_mart_ddl_targets_only_the_central_episode_table() -> None:
    normalized = MART_DDL.upper()
    assert MART_TABLE in MART_DDL
    assert "CREATE TABLE IF NOT EXISTS" in normalized
    assert "CREATE OR REPLACE VIEW" not in normalized


def test_application_startup_never_runs_database_ddl() -> None:
    main_source = (Path(__file__).parents[1] / "app" / "main.py").read_text(encoding="utf-8")
    assert "VIEW_DDL" not in main_source
    assert "CREATE VIEW" not in main_source.upper()
    assert "DROP TABLE" not in main_source.upper()


def test_branch_sku_trends_do_not_bind_anonymous_composite_arrays() -> None:
    route_source = (
        Path(__file__).parents[1] / "app" / "routes" / "eda_branch_sku.py"
    ).read_text(encoding="utf-8")
    assert "(base_sku,branch)=ANY(%s)" not in route_source
    assert "unnest(%s::text[], %s::text[])" in route_source


def test_episode_policy_splits_relaunch_and_keeps_negative_net() -> None:
    rows = [
        MonthlyDemand(date(2024, 1, 1), 10, 10, True),
        MonthlyDemand(date(2024, 2, 1), -3, -3, True),
        MonthlyDemand(date(2024, 8, 1), 8, 8, True),
        MonthlyDemand(date(2024, 9, 1), -2, -2, True),
    ]
    episodes = build_pair_episodes(rows, date(2024, 9, 1))
    assert len(episodes) == 2
    assert episodes[1]["negative_net_months"] == 1
    assert episodes[1]["episode_start_month"] == date(2024, 8, 1)


def test_inactive_series_stops_at_last_positive_month() -> None:
    rows = [
        MonthlyDemand(date(2024, 1, 1), 10, 0, False),
        MonthlyDemand(date(2024, 2, 1), 6, 0, False),
    ]
    episode = build_pair_episodes(rows, date(2024, 6, 1))[-1]
    assert episode["episode_end_month"] == date(2024, 2, 1)
    assert episode["history_months"] == 2
