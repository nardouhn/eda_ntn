begin;

create schema if not exists source;
create schema if not exists analytics;

revoke all on schema source from public;
revoke all on schema analytics from public;

create table if not exists source.branches (
  branch_code text primary key,
  branch_name text not null,
  region text,
  brand text,
  source_status text not null,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  loaded_at timestamptz not null default now()
);

create table if not exists source.disabled_skus (
  bravo_sku text primary key,
  base_sku text not null,
  sku_name text,
  uom text,
  product_group text,
  brand text,
  pattern_set text,
  sample_role text,
  branch_channel text,
  shipping_size text,
  price_group text,
  abc_class text,
  model_age_months numeric,
  launch_date date,
  factory_code text,
  factory_sku text,
  sale_sku text,
  pull_source text,
  moq numeric,
  source_status text not null,
  replacement_sku text,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  loaded_at timestamptz not null default now(),
  check (bravo_sku <> ''),
  check (base_sku <> '')
);

create table if not exists source.sales_monthly (
  bravo_sku text not null,
  sku_name text,
  branch_code text not null references source.branches(branch_code),
  unit text,
  month date not null,
  total_quantity numeric(18,3),
  total_amount numeric(20,2),
  line_count integer,
  loaded_at timestamptz not null default now(),
  primary key (bravo_sku, branch_code, month),
  check (date_trunc('month', month)::date = month)
);

create index if not exists sales_monthly_branch_month_idx
  on source.sales_monthly (branch_code, month desc);
create index if not exists sales_monthly_month_idx
  on source.sales_monthly (month desc);
create index if not exists disabled_skus_base_idx
  on source.disabled_skus (base_sku);

create table if not exists analytics.pipeline_run (
  id uuid primary key default gen_random_uuid(),
  run_type text not null check (run_type in ('refresh', 'forecast')),
  status text not null check (status in ('running', 'failed', 'published')),
  source_max_month date,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  row_counts jsonb not null default '{}'::jsonb,
  error_message text
);

create table if not exists analytics.dim_branch (
  branch_code text primary key,
  branch_name text not null,
  region text,
  brand text,
  status text not null check (status in ('active', 'inactive')),
  refreshed_at timestamptz not null default now()
);

create table if not exists analytics.dim_base_sku (
  base_sku text primary key,
  factory_code text,
  product_type text,
  size_code text,
  product_code text,
  sku_name text,
  status text not null check (status in ('active', 'inactive')),
  active_variant_count integer not null,
  inactive_variant_count integer not null,
  variant_count integer not null,
  refreshed_at timestamptz not null default now()
);

create table if not exists analytics.dim_bravo_sku (
  bravo_sku text primary key,
  base_sku text not null references analytics.dim_base_sku(base_sku),
  sku_name text,
  color_suffix text,
  has_color_suffix boolean not null,
  status text not null check (status in ('active', 'inactive')),
  in_disabled_master boolean not null,
  first_observed_month date,
  last_observed_month date,
  last_positive_sale_month date,
  refreshed_at timestamptz not null default now()
);

create table if not exists analytics.mart_item_branch_month (
  base_sku text not null references analytics.dim_base_sku(base_sku),
  branch_code text not null references analytics.dim_branch(branch_code),
  month date not null,
  gross_positive_qty numeric(18,3) not null,
  return_qty numeric(18,3) not null,
  net_qty numeric(18,3) not null,
  total_amount numeric(20,2) not null,
  line_count bigint not null,
  observed_variant_count integer not null,
  primary key (base_sku, branch_code, month)
);

create index if not exists mart_item_branch_month_branch_idx
  on analytics.mart_item_branch_month (branch_code, month desc, base_sku);
create index if not exists mart_item_branch_month_month_idx
  on analytics.mart_item_branch_month (month desc);

create table if not exists analytics.mart_item_summary (
  base_sku text not null references analytics.dim_base_sku(base_sku),
  branch_code text not null,
  first_observed_month date,
  last_observed_month date,
  last_positive_sale_month date,
  gross_qty_3m numeric(18,3) not null default 0,
  gross_qty_6m numeric(18,3) not null default 0,
  gross_qty_12m numeric(18,3) not null default 0,
  return_qty_12m numeric(18,3) not null default 0,
  net_qty_12m numeric(18,3) not null default 0,
  positive_months_12m integer not null default 0,
  primary key (base_sku, branch_code)
);

create index if not exists mart_item_summary_branch_qty_idx
  on analytics.mart_item_summary (branch_code, gross_qty_12m desc);

create table if not exists analytics.data_quality_issue (
  id bigint generated always as identity primary key,
  pipeline_run_id uuid references analytics.pipeline_run(id),
  rule_code text not null,
  severity text not null check (severity in ('warning', 'critical')),
  source_key text,
  details jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now()
);

create table if not exists analytics.forecast_run (
  id uuid primary key default gen_random_uuid(),
  origin_month date not null,
  horizon integer not null check (horizon between 1 and 24),
  target_measure text not null,
  status text not null check (status in ('running', 'failed', 'published')),
  config jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists analytics.forecast_value (
  forecast_run_id uuid not null references analytics.forecast_run(id) on delete cascade,
  base_sku text not null references analytics.dim_base_sku(base_sku),
  branch_code text not null references analytics.dim_branch(branch_code),
  origin_month date not null,
  target_month date not null,
  horizon integer not null,
  method text not null,
  forecast_qty numeric(18,3),
  lower_qty numeric(18,3),
  upper_qty numeric(18,3),
  actual_qty numeric(18,3),
  primary key (forecast_run_id, base_sku, branch_code, target_month)
);

create table if not exists analytics.backtest_metric (
  forecast_run_id uuid not null references analytics.forecast_run(id) on delete cascade,
  base_sku text not null,
  branch_code text not null,
  horizon integer not null,
  method text not null,
  origin_count integer not null,
  wape numeric,
  mae numeric,
  rmse numeric,
  bias numeric,
  primary key (forecast_run_id, base_sku, branch_code, horizon, method)
);

alter table analytics.dim_branch enable row level security;
alter table analytics.dim_base_sku enable row level security;
alter table analytics.dim_bravo_sku enable row level security;
alter table analytics.mart_item_branch_month enable row level security;
alter table analytics.mart_item_summary enable row level security;
alter table analytics.pipeline_run enable row level security;
alter table analytics.data_quality_issue enable row level security;
alter table analytics.forecast_run enable row level security;
alter table analytics.forecast_value enable row level security;
alter table analytics.backtest_metric enable row level security;

commit;
