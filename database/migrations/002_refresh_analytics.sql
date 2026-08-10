do $$
declare
  v_run_id uuid;
  v_max_month date;
begin
  select max(month) into v_max_month from source.sales_monthly;

  insert into analytics.pipeline_run(run_type, status, source_max_month)
  values ('refresh', 'running', v_max_month)
  returning id into v_run_id;

  delete from analytics.mart_item_summary;
  delete from analytics.mart_item_branch_month;
  delete from analytics.dim_bravo_sku;
  delete from analytics.dim_base_sku;
  delete from analytics.dim_branch;

  insert into analytics.dim_branch(branch_code, branch_name, region, brand, status)
  select
    trim(branch_code),
    branch_name,
    region,
    brand,
    case when source_status ilike 'Hoạt%' then 'active' else 'inactive' end
  from source.branches;

  create temporary table tmp_variants on commit drop as
  with latest_sales_name as (
    select distinct on (bravo_sku)
      bravo_sku,
      sku_name
    from source.sales_monthly
    where sku_name is not null
    order by bravo_sku, month desc
  ),
  sales_lifecycle as (
    select
      bravo_sku,
      min(month) as first_observed_month,
      max(month) as last_observed_month,
      max(month) filter (where total_quantity > 0) as last_positive_sale_month
    from source.sales_monthly
    group by bravo_sku
  ),
  known as (
    select
      d.bravo_sku,
      d.base_sku,
      coalesce(d.sku_name, n.sku_name) as sku_name,
      true as in_disabled_master
    from source.disabled_skus d
    left join latest_sales_name n using (bravo_sku)

    union all

    select
      s.bravo_sku,
      concat_ws('.',
        split_part(s.bravo_sku, '.', 1),
        split_part(s.bravo_sku, '.', 2),
        split_part(s.bravo_sku, '.', 3),
        split_part(s.bravo_sku, '.', 4)
      ) as base_sku,
      n.sku_name,
      false as in_disabled_master
    from (select distinct bravo_sku from source.sales_monthly) s
    left join latest_sales_name n using (bravo_sku)
    where not exists (
      select 1 from source.disabled_skus d where d.bravo_sku = s.bravo_sku
    )
      and array_length(string_to_array(s.bravo_sku, '.'), 1) >= 4
  )
  select
    k.bravo_sku,
    k.base_sku,
    k.sku_name,
    case
      when array_length(string_to_array(k.bravo_sku, '.'), 1) >= 5
        then split_part(k.bravo_sku, '.', 5)
      else null
    end as color_suffix,
    array_length(string_to_array(k.bravo_sku, '.'), 1) >= 5 as has_color_suffix,
    case when k.in_disabled_master then 'inactive' else 'active' end as status,
    k.in_disabled_master,
    l.first_observed_month,
    l.last_observed_month,
    l.last_positive_sale_month
  from known k
  left join sales_lifecycle l using (bravo_sku);

  insert into analytics.dim_base_sku(
    base_sku, factory_code, product_type, size_code, product_code,
    sku_name, status, active_variant_count, inactive_variant_count, variant_count
  )
  select
    base_sku,
    split_part(base_sku, '.', 1),
    split_part(base_sku, '.', 2),
    split_part(base_sku, '.', 3),
    split_part(base_sku, '.', 4),
    max(sku_name) filter (where sku_name is not null),
    case when count(*) filter (where status = 'active') > 0 then 'active' else 'inactive' end,
    count(*) filter (where status = 'active')::integer,
    count(*) filter (where status = 'inactive')::integer,
    count(*)::integer
  from tmp_variants
  group by base_sku;

  insert into analytics.dim_bravo_sku(
    bravo_sku, base_sku, sku_name, color_suffix, has_color_suffix,
    status, in_disabled_master, first_observed_month,
    last_observed_month, last_positive_sale_month
  )
  select
    bravo_sku, base_sku, sku_name, color_suffix, has_color_suffix,
    status, in_disabled_master, first_observed_month,
    last_observed_month, last_positive_sale_month
  from tmp_variants;

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
  group by v.base_sku, s.branch_code, s.month;

  insert into analytics.mart_item_summary(
    base_sku, branch_code, first_observed_month, last_observed_month,
    last_positive_sale_month, gross_qty_3m, gross_qty_6m, gross_qty_12m,
    return_qty_12m, net_qty_12m, positive_months_12m
  )
  select
    base_sku,
    branch_code,
    min(month),
    max(month),
    max(month) filter (where gross_positive_qty > 0),
    sum(gross_positive_qty) filter (where month >= v_max_month - interval '2 months'),
    sum(gross_positive_qty) filter (where month >= v_max_month - interval '5 months'),
    sum(gross_positive_qty) filter (where month >= v_max_month - interval '11 months'),
    sum(return_qty) filter (where month >= v_max_month - interval '11 months'),
    sum(net_qty) filter (where month >= v_max_month - interval '11 months'),
    count(*) filter (
      where month >= v_max_month - interval '11 months' and gross_positive_qty > 0
    )::integer
  from analytics.mart_item_branch_month
  group by base_sku, branch_code;

  insert into analytics.mart_item_summary(
    base_sku, branch_code, first_observed_month, last_observed_month,
    last_positive_sale_month, gross_qty_3m, gross_qty_6m, gross_qty_12m,
    return_qty_12m, net_qty_12m, positive_months_12m
  )
  select
    base_sku,
    '__ALL__',
    min(month),
    max(month),
    max(month) filter (where gross_positive_qty > 0),
    sum(gross_positive_qty) filter (where month >= v_max_month - interval '2 months'),
    sum(gross_positive_qty) filter (where month >= v_max_month - interval '5 months'),
    sum(gross_positive_qty) filter (where month >= v_max_month - interval '11 months'),
    sum(return_qty) filter (where month >= v_max_month - interval '11 months'),
    sum(net_qty) filter (where month >= v_max_month - interval '11 months'),
    count(distinct month) filter (
      where month >= v_max_month - interval '11 months' and gross_positive_qty > 0
    )::integer
  from analytics.mart_item_branch_month
  group by base_sku;

  insert into analytics.data_quality_issue(pipeline_run_id, rule_code, severity, source_key, details)
  select
    v_run_id,
    'SKU_GROUP_COUNT',
    'warning',
    bravo_sku,
    jsonb_build_object('group_count', array_length(string_to_array(bravo_sku, '.'), 1))
  from (
    select distinct bravo_sku from source.sales_monthly
  ) s
  where array_length(string_to_array(bravo_sku, '.'), 1) not between 4 and 5;

  update analytics.pipeline_run
  set
    status = 'published',
    finished_at = now(),
    row_counts = jsonb_build_object(
      'source_branches', (select count(*) from source.branches),
      'source_disabled_skus', (select count(*) from source.disabled_skus),
      'source_sales_monthly', (select count(*) from source.sales_monthly),
      'dim_base_sku', (select count(*) from analytics.dim_base_sku),
      'dim_bravo_sku', (select count(*) from analytics.dim_bravo_sku),
      'mart_item_branch_month', (select count(*) from analytics.mart_item_branch_month),
      'mart_item_summary', (select count(*) from analytics.mart_item_summary)
    )
  where id = v_run_id;
exception
  when others then
    if v_run_id is not null then
      update analytics.pipeline_run
      set status = 'failed', finished_at = now(), error_message = sqlerrm
      where id = v_run_id;
    end if;
    raise;
end $$;
