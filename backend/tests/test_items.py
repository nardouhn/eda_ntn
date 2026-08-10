from app.routes.items import (
    ACTIVE_STATUS_LABELS,
    BRANCH_IS_ACTIVE_SQL,
    ITEM_IS_ACTIVE_SQL,
    ITEM_SOURCE_CTE_SQL,
    SKU_IS_ACTIVE_SQL,
    active_status_sql,
    grouped_status_having_sql,
    item_status_filter_sql,
)


def test_active_status_sql_supports_source_mart_labels() -> None:
    expression = active_status_sql("sku_status")

    assert ACTIVE_STATUS_LABELS == ("hoạt động",)
    for label in ACTIVE_STATUS_LABELS:
        assert f"'{label}'" in expression
    assert "LOWER(BTRIM(COALESCE(sku_status, '')))" in expression


def test_item_is_active_only_when_sku_and_branch_are_active() -> None:
    assert SKU_IS_ACTIVE_SQL in ITEM_IS_ACTIVE_SQL
    assert BRANCH_IS_ACTIVE_SQL in ITEM_IS_ACTIVE_SQL
    assert " AND " in ITEM_IS_ACTIVE_SQL


def test_status_filter_is_applied_at_variant_grain() -> None:
    assert item_status_filter_sql("all") is None
    assert item_status_filter_sql("active") == ITEM_IS_ACTIVE_SQL
    assert item_status_filter_sql("inactive") == f"NOT ({ITEM_IS_ACTIVE_SQL})"
    assert item_status_filter_sql("active", "item_is_active") == "item_is_active"
    assert item_status_filter_sql("inactive", "item_is_active") == "NOT (item_is_active)"


def test_rows_are_filtered_after_grouping_by_base_sku_and_branch() -> None:
    assert grouped_status_having_sql("all") == ""
    assert grouped_status_having_sql("active") == "HAVING BOOL_OR(base_is_active) IS TRUE"
    assert grouped_status_having_sql("inactive") == "HAVING BOOL_OR(base_is_active) IS NOT TRUE"


def test_base_status_is_computed_before_variant_filtering() -> None:
    assert "BOOL_OR" in ITEM_SOURCE_CTE_SQL
    assert "PARTITION BY base_sku, branch" in ITEM_SOURCE_CTE_SQL
    assert "AS base_is_active" in ITEM_SOURCE_CTE_SQL
