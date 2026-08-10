begin;

alter table analytics.dim_bravo_sku
  add column if not exists is_valid_structure boolean not null default false;

update analytics.dim_bravo_sku
set is_valid_structure =
  array_length(string_to_array(bravo_sku, '.'), 1) between 4 and 5
  and base_sku = concat_ws(
    '.',
    split_part(bravo_sku, '.', 1),
    split_part(bravo_sku, '.', 2),
    split_part(bravo_sku, '.', 3),
    split_part(bravo_sku, '.', 4)
  );

delete from analytics.mart_item_summary;
delete from analytics.mart_item_branch_month;

insert into analytics.mart_item_branch_month(
  base_sku, branch_code, month, gross_positive_qty, return_qty,
  net_qty, total_amount, line_count, observed_variant_count
)
select
  v.base_sku,
  s.branch_code,
  s.month,
  sum(greatest(coalesce(s.total_quantity, 0), 0)),
  sum(abs(least(coalesce(s.total_quantity, 0), 0))),
  sum(coalesce(s.total_quantity, 0)),
  sum(coalesce(s.total_amount, 0)),
  sum(coalesce(s.line_count, 0)),
  count(distinct s.bravo_sku)::integer
from source.sales_monthly s
join analytics.dim_bravo_sku v using (bravo_sku)
join analytics.dim_base_sku b on b.base_sku = v.base_sku
join analytics.dim_branch c on c.branch_code = s.branch_code
where upper(trim(s.unit)) = 'M2'
  and upper(b.product_type) = 'L1'
  and c.status = 'active'
  and v.is_valid_structure
group by v.base_sku, s.branch_code, s.month;

with bounds as (
  select max(month) as max_month from analytics.mart_item_branch_month
)
insert into analytics.mart_item_summary(
  base_sku, branch_code, first_observed_month, last_observed_month,
  last_positive_sale_month, gross_qty_3m, gross_qty_6m, gross_qty_12m,
  return_qty_12m, net_qty_12m, positive_months_12m
)
select
  m.base_sku,
  m.branch_code,
  min(m.month),
  max(m.month),
  max(m.month) filter (where m.gross_positive_qty > 0),
  coalesce(sum(m.gross_positive_qty) filter (where m.month >= b.max_month - interval '2 months'), 0),
  coalesce(sum(m.gross_positive_qty) filter (where m.month >= b.max_month - interval '5 months'), 0),
  coalesce(sum(m.gross_positive_qty) filter (where m.month >= b.max_month - interval '11 months'), 0),
  coalesce(sum(m.return_qty) filter (where m.month >= b.max_month - interval '11 months'), 0),
  coalesce(sum(m.net_qty) filter (where m.month >= b.max_month - interval '11 months'), 0),
  count(*) filter (
    where m.month >= b.max_month - interval '11 months' and m.gross_positive_qty > 0
  )::integer
from analytics.mart_item_branch_month m
cross join bounds b
group by m.base_sku, m.branch_code;

with bounds as (
  select max(month) as max_month from analytics.mart_item_branch_month
)
insert into analytics.mart_item_summary(
  base_sku, branch_code, first_observed_month, last_observed_month,
  last_positive_sale_month, gross_qty_3m, gross_qty_6m, gross_qty_12m,
  return_qty_12m, net_qty_12m, positive_months_12m
)
select
  m.base_sku,
  '__ALL__',
  min(m.month),
  max(m.month),
  max(m.month) filter (where m.gross_positive_qty > 0),
  coalesce(sum(m.gross_positive_qty) filter (where m.month >= b.max_month - interval '2 months'), 0),
  coalesce(sum(m.gross_positive_qty) filter (where m.month >= b.max_month - interval '5 months'), 0),
  coalesce(sum(m.gross_positive_qty) filter (where m.month >= b.max_month - interval '11 months'), 0),
  coalesce(sum(m.return_qty) filter (where m.month >= b.max_month - interval '11 months'), 0),
  coalesce(sum(m.net_qty) filter (where m.month >= b.max_month - interval '11 months'), 0),
  count(distinct m.month) filter (
    where m.month >= b.max_month - interval '11 months' and m.gross_positive_qty > 0
  )::integer
from analytics.mart_item_branch_month m
cross join bounds b
group by m.base_sku;

commit;
