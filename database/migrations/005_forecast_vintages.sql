begin;

-- Forecast publications are immutable.  They deliberately do not reference the
-- mutable branch/SKU dimensions: a frozen publication must remain readable even
-- after a master-data refresh changes a branch or SKU status.
create table if not exists analytics.forecast_vintage (
  id uuid primary key default gen_random_uuid(),
  vintage_key text not null unique,
  status text not null check (status in ('draft', 'validated', 'promoted', 'superseded', 'rejected')) default 'draft',
  primary_signal text not null,
  forecast_origin date not null,
  target_start_month date not null,
  target_end_month date not null,
  horizon_count smallint not null check (horizon_count between 1 and 12),
  unit text not null default 'm²',
  source_file_name text not null,
  source_sha256 text not null unique,
  source_row_count integer not null check (source_row_count > 0),
  validation_summary jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  promoted_at timestamptz,
  check (date_trunc('month', forecast_origin)::date = forecast_origin),
  check (date_trunc('month', target_start_month)::date = target_start_month),
  check (date_trunc('month', target_end_month)::date = target_end_month)
);

create unique index if not exists forecast_vintage_one_promoted_idx
  on analytics.forecast_vintage ((status)) where status = 'promoted';

create table if not exists analytics.forecast_pair_month (
  vintage_id uuid not null references analytics.forecast_vintage(id) on delete restrict,
  base_sku text not null,
  branch_code text not null,
  target_month date not null,
  horizon smallint not null check (horizon between 1 and 12),
  forecast_m2 numeric(18,3) not null check (forecast_m2 >= 0),
  forecast_m2_original numeric(18,3),
  bottom_up_pair_m2 numeric(18,3),
  direct_branch_m2 numeric(18,3),
  scale_factor numeric(18,8),
  behavior_route text,
  lifecycle_state text,
  method text,
  is_forecasted boolean not null default true,
  cap_binding text,
  reconciliation_method text not null,
  primary key (vintage_id, base_sku, branch_code, target_month),
  check (date_trunc('month', target_month)::date = target_month),
  check (base_sku <> ''),
  check (branch_code <> '')
);

create index if not exists forecast_pair_month_vintage_branch_idx
  on analytics.forecast_pair_month (vintage_id, branch_code, target_month, base_sku);
create index if not exists forecast_pair_month_vintage_sku_idx
  on analytics.forecast_pair_month (vintage_id, base_sku, target_month, branch_code);

create table if not exists analytics.forecast_branch_month (
  vintage_id uuid not null references analytics.forecast_vintage(id) on delete restrict,
  branch_code text not null,
  target_month date not null,
  forecast_m2 numeric(18,3) not null check (forecast_m2 >= 0),
  forecast_m2_original numeric(18,3),
  direct_branch_m2 numeric(18,3),
  base_sku_count integer not null check (base_sku_count >= 0),
  pair_count integer not null check (pair_count >= 0),
  forecasted_pair_count integer not null check (forecasted_pair_count >= 0),
  cap_bound_pair_months integer not null check (cap_bound_pair_months >= 0),
  primary key (vintage_id, branch_code, target_month),
  check (date_trunc('month', target_month)::date = target_month)
);

create index if not exists forecast_branch_month_vintage_month_idx
  on analytics.forecast_branch_month (vintage_id, target_month, branch_code);

create table if not exists analytics.forecast_base_sku_month (
  vintage_id uuid not null references analytics.forecast_vintage(id) on delete restrict,
  base_sku text not null,
  target_month date not null,
  forecast_m2 numeric(18,3) not null check (forecast_m2 >= 0),
  branch_count integer not null check (branch_count >= 0),
  pair_count integer not null check (pair_count >= 0),
  primary key (vintage_id, base_sku, target_month),
  check (date_trunc('month', target_month)::date = target_month)
);

create index if not exists forecast_base_sku_month_vintage_month_idx
  on analytics.forecast_base_sku_month (vintage_id, target_month, base_sku);

create table if not exists analytics.forecast_portfolio_month (
  vintage_id uuid not null references analytics.forecast_vintage(id) on delete restrict,
  target_month date not null,
  forecast_m2 numeric(18,3) not null check (forecast_m2 >= 0),
  forecast_m2_original numeric(18,3),
  direct_branch_m2 numeric(18,3),
  branch_count integer not null check (branch_count >= 0),
  base_sku_count integer not null check (base_sku_count >= 0),
  pair_count integer not null check (pair_count >= 0),
  primary key (vintage_id, target_month),
  check (date_trunc('month', target_month)::date = target_month)
);

alter table analytics.forecast_vintage enable row level security;
alter table analytics.forecast_pair_month enable row level security;
alter table analytics.forecast_branch_month enable row level security;
alter table analytics.forecast_base_sku_month enable row level security;
alter table analytics.forecast_portfolio_month enable row level security;

commit;
