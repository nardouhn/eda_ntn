begin;

create index if not exists data_quality_issue_pipeline_run_idx
  on analytics.data_quality_issue (pipeline_run_id);

create index if not exists dim_bravo_sku_base_sku_idx
  on analytics.dim_bravo_sku (base_sku);

create index if not exists forecast_value_base_sku_idx
  on analytics.forecast_value (base_sku);

create index if not exists forecast_value_branch_code_idx
  on analytics.forecast_value (branch_code);

commit;
