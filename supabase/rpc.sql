drop function if exists fetch_transfer_flavors(integer);
drop function if exists fetch_request_inventory_data(integer);
drop function if exists fetch_stock_overview(integer);
drop function if exists fetch_dashboard_stock_overview(integer);
drop function if exists fetch_inventory_result_details(integer, bigint);
drop function if exists fetch_inventory_sheet_data(bigint, integer);
drop function if exists fetch_all_transfer_records(integer);
drop function if exists fetch_pending_transfer_records(integer, bigint);
drop function if exists fetch_transfer_record_detail(integer, bigint, bigint);
drop function if exists fetch_dispose_record_detail(integer, bigint, bigint);
drop function if exists complete_transfer_inspection(integer, bigint, bigint, bigint, jsonb);
drop function if exists amend_transfer_record(integer, bigint, jsonb);
drop function if exists delete_transfer_record_block(integer, bigint);

create or replace function fetch_transfer_flavors(p_period_key int)
returns table (
  rowIndex bigint,
  id bigint,
  flavorId bigint,
  brand text,
  flavorName text,
  appDisplay boolean,
  stock jsonb
)
language sql
as $$
with target_period as (
  select
    p_period_key as period_key,
    case
      when mod(p_period_key, 100) = 1 then ((p_period_key / 100) - 1) * 100 + 12
      else p_period_key - 1
    end as prev_period_key
),
latest_inventory as (
  select distinct on (il.store_id, il.flavor_id)
    il.id,
    il.store_id,
    il.flavor_id
  from inventory_logs il
  join target_period tp on tp.prev_period_key = il.period_key
  order by il.store_id, il.flavor_id, il.created_at desc, il.id desc
),
period_inventory as (
  select
    il.store_id,
    il.flavor_id,
    coalesce(il.tupper_basic, 0) + coalesce(il.tupper_reserve, 0)
      + coalesce(il.merch_pkg_50, 0) * 50
      + coalesce(il.merch_pkg_100, 0) * 100
      + coalesce(il.merch_pkg_125, 0) * 125
      + coalesce(il.merch_pkg_200, 0) * 200
      + coalesce(il.merch_pkg_250, 0) * 250
      + coalesce(il.merch_pkg_1kg, 0) * 1000
      + coalesce(il.stock_pkg_50, 0) * 50
      + coalesce(il.stock_pkg_100, 0) * 100
      + coalesce(il.stock_pkg_125, 0) * 125
      + coalesce(il.stock_pkg_200, 0) * 200
      + coalesce(il.stock_pkg_250, 0) * 250
      + coalesce(il.stock_pkg_1kg, 0) * 1000
      + coalesce(il.stock_other, 0) as base_stock
  from inventory_logs il
  join latest_inventory li
    on li.id = il.id
),
period_transfer as (
  select
    x.store_id,
    x.flavor_id,
    sum(x.delta) as transfer_delta
  from (
    select
      t.dest_store_id as store_id,
      t.flavor_id,
      t.quantity as delta
    from transfer_logs t
    where t.period_key = p_period_key
      and t.status = 'completed'
      and t.dest_store_id is not null
    union all
    select
      t.from_store_id as store_id,
      t.flavor_id,
      -t.quantity as delta
    from transfer_logs t
    where t.period_key = p_period_key
      and t.status = 'completed'
      and t.from_store_id is not null
  ) x
  group by x.store_id, x.flavor_id
),
store_flavor_grid as (
  select
    s.id as store_id,
    f.id as flavor_id
  from stores s
  cross join flavors f
  where f.is_active = true
),
period_stock as (
  select
    g.store_id,
    g.flavor_id,
    coalesce(pi.base_stock, 0) + coalesce(pt.transfer_delta, 0) as current_stock
  from store_flavor_grid g
  left join period_inventory pi on pi.store_id = g.store_id and pi.flavor_id = g.flavor_id
  left join period_transfer pt on pt.store_id = g.store_id and pt.flavor_id = g.flavor_id
)
select
  f.id as rowIndex,
  f.id as id,
  f.id as flavorId,
  b.name as brand,
  f.name as flavorName,
  true as appDisplay,
  jsonb_build_object(
    'office', coalesce(max(case when s.store_key = 'office' then ps.current_stock end), 0),
    'baba_main', coalesce(max(case when s.store_key = 'baba_main' then ps.current_stock end), 0),
    'nakano', coalesce(max(case when s.store_key = 'nakano' then ps.current_stock end), 0),
    'baba_2nd', coalesce(max(case when s.store_key = 'baba_2nd' then ps.current_stock end), 0)
  ) as stock
from flavors f
join brands b on b.id = f.brand_id
left join period_stock ps on ps.flavor_id = f.id
left join stores s on s.id = ps.store_id
where f.is_active = true
group by f.id, b.name, f.name
order by b.name, f.name;
$$;

create or replace function fetch_request_inventory_data(p_period_key int)
returns table (
  id bigint,
  brand text,
  flavor text,
  stock jsonb
)
language sql
as $$
with target_period as (
  select
    p_period_key as period_key,
    case
      when mod(p_period_key, 100) = 1 then ((p_period_key / 100) - 1) * 100 + 12
      else p_period_key - 1
    end as prev_period_key
),
latest_inventory as (
  select distinct on (il.store_id, il.flavor_id)
    il.id,
    il.store_id,
    il.flavor_id
  from inventory_logs il
  join target_period tp on tp.prev_period_key = il.period_key
  order by il.store_id, il.flavor_id, il.created_at desc, il.id desc
),
period_inventory as (
  select
    il.store_id,
    il.flavor_id,
    coalesce(il.tupper_basic, 0) + coalesce(il.tupper_reserve, 0)
      + coalesce(il.merch_pkg_50, 0) * 50
      + coalesce(il.merch_pkg_100, 0) * 100
      + coalesce(il.merch_pkg_125, 0) * 125
      + coalesce(il.merch_pkg_200, 0) * 200
      + coalesce(il.merch_pkg_250, 0) * 250
      + coalesce(il.merch_pkg_1kg, 0) * 1000
      + coalesce(il.stock_pkg_50, 0) * 50
      + coalesce(il.stock_pkg_100, 0) * 100
      + coalesce(il.stock_pkg_125, 0) * 125
      + coalesce(il.stock_pkg_200, 0) * 200
      + coalesce(il.stock_pkg_250, 0) * 250
      + coalesce(il.stock_pkg_1kg, 0) * 1000
      + coalesce(il.stock_other, 0) as base_stock
  from inventory_logs il
  join latest_inventory li
    on li.id = il.id
),
period_transfer as (
  select
    x.store_id,
    x.flavor_id,
    sum(x.delta) as transfer_delta
  from (
    select
      t.dest_store_id as store_id,
      t.flavor_id,
      t.quantity as delta
    from transfer_logs t
    where t.period_key = p_period_key
      and t.status = 'completed'
      and t.dest_store_id is not null
    union all
    select
      t.from_store_id as store_id,
      t.flavor_id,
      -t.quantity as delta
    from transfer_logs t
    where t.period_key = p_period_key
      and t.status = 'completed'
      and t.from_store_id is not null
  ) x
  group by x.store_id, x.flavor_id
),
store_flavor_grid as (
  select
    s.id as store_id,
    f.id as flavor_id
  from stores s
  cross join flavors f
  where f.is_active = true
),
period_stock as (
  select
    g.store_id,
    g.flavor_id,
    coalesce(pi.base_stock, 0) + coalesce(pt.transfer_delta, 0) as current_stock
  from store_flavor_grid g
  left join period_inventory pi on pi.store_id = g.store_id and pi.flavor_id = g.flavor_id
  left join period_transfer pt on pt.store_id = g.store_id and pt.flavor_id = g.flavor_id
)
select
  f.id,
  b.name as brand,
  f.name as flavor,
  jsonb_build_object(
    'office', coalesce(max(case when s.store_key = 'office' then ps.current_stock end), 0),
    'baba_main', coalesce(max(case when s.store_key = 'baba_main' then ps.current_stock end), 0),
    'nakano', coalesce(max(case when s.store_key = 'nakano' then ps.current_stock end), 0),
    'baba_2nd', coalesce(max(case when s.store_key = 'baba_2nd' then ps.current_stock end), 0)
  ) as stock
from flavors f
join brands b on b.id = f.brand_id
left join period_stock ps on ps.flavor_id = f.id
left join stores s on s.id = ps.store_id
where f.is_active = true
group by f.id, b.name, f.name
order by b.name, f.name;
$$;

create or replace function fetch_stock_overview(p_period_key int)
returns table (
  rowIndex bigint,
  brand text,
  flavorName text,
  totalStock numeric,
  prevConsumption numeric,
  appDisplay boolean
)
language sql
as $$
with target_period as (
  select
    p_period_key as period_key,
    case
      when mod(p_period_key, 100) = 1 then ((p_period_key / 100) - 1) * 100 + 12
      else p_period_key - 1
    end as prev_period_key,
    case
      when mod(p_period_key, 100) = 1 then ((p_period_key / 100) - 1) * 100 + 11
      when mod(p_period_key, 100) = 2 then ((p_period_key / 100) - 1) * 100 + 12
      else p_period_key - 2
    end as prev_prev_period_key
),
store_flavor_grid as (
  select
    s.id as store_id,
    f.id as flavor_id
  from stores s
  cross join flavors f
  where f.is_active = true
),
latest_inventory_prev as (
  select distinct on (il.store_id, il.flavor_id)
    il.id,
    il.store_id,
    il.flavor_id
  from inventory_logs il
  join target_period tp on tp.prev_period_key = il.period_key
  order by il.store_id, il.flavor_id, il.created_at desc, il.id desc
),
inventory_prev as (
  select
    il.store_id,
    il.flavor_id,
    coalesce(il.tupper_basic, 0) + coalesce(il.tupper_reserve, 0)
      + coalesce(il.merch_pkg_50, 0) * 50
      + coalesce(il.merch_pkg_100, 0) * 100
      + coalesce(il.merch_pkg_125, 0) * 125
      + coalesce(il.merch_pkg_200, 0) * 200
      + coalesce(il.merch_pkg_250, 0) * 250
      + coalesce(il.merch_pkg_1kg, 0) * 1000
      + coalesce(il.stock_pkg_50, 0) * 50
      + coalesce(il.stock_pkg_100, 0) * 100
      + coalesce(il.stock_pkg_125, 0) * 125
      + coalesce(il.stock_pkg_200, 0) * 200
      + coalesce(il.stock_pkg_250, 0) * 250
      + coalesce(il.stock_pkg_1kg, 0) * 1000
      + coalesce(il.stock_other, 0) as stock_grams
  from inventory_logs il
  join latest_inventory_prev li on li.id = il.id
),
latest_inventory_prev_prev as (
  select distinct on (il.store_id, il.flavor_id)
    il.id,
    il.store_id,
    il.flavor_id
  from inventory_logs il
  join target_period tp on tp.prev_prev_period_key = il.period_key
  order by il.store_id, il.flavor_id, il.created_at desc, il.id desc
),
inventory_prev_prev as (
  select
    il.store_id,
    il.flavor_id,
    coalesce(il.tupper_basic, 0) + coalesce(il.tupper_reserve, 0)
      + coalesce(il.merch_pkg_50, 0) * 50
      + coalesce(il.merch_pkg_100, 0) * 100
      + coalesce(il.merch_pkg_125, 0) * 125
      + coalesce(il.merch_pkg_200, 0) * 200
      + coalesce(il.merch_pkg_250, 0) * 250
      + coalesce(il.merch_pkg_1kg, 0) * 1000
      + coalesce(il.stock_pkg_50, 0) * 50
      + coalesce(il.stock_pkg_100, 0) * 100
      + coalesce(il.stock_pkg_125, 0) * 125
      + coalesce(il.stock_pkg_200, 0) * 200
      + coalesce(il.stock_pkg_250, 0) * 250
      + coalesce(il.stock_pkg_1kg, 0) * 1000
      + coalesce(il.stock_other, 0) as stock_grams
  from inventory_logs il
  join latest_inventory_prev_prev li on li.id = il.id
),
transfer_delta_current as (
  select
    x.store_id,
    x.flavor_id,
    sum(x.delta) as transfer_delta
  from (
    select t.dest_store_id as store_id, t.flavor_id, t.quantity as delta
    from transfer_logs t
    where t.period_key = p_period_key
      and t.status = 'completed'
      and t.dest_store_id is not null
    union all
    select t.from_store_id as store_id, t.flavor_id, -t.quantity as delta
    from transfer_logs t
    where t.period_key = p_period_key
      and t.status = 'completed'
      and t.from_store_id is not null
  ) x
  group by x.store_id, x.flavor_id
),
transfer_delta_prev as (
  select
    x.store_id,
    x.flavor_id,
    sum(x.delta) as transfer_delta
  from (
    select t.dest_store_id as store_id, t.flavor_id, t.quantity as delta
    from transfer_logs t
    join target_period tp on tp.prev_period_key = t.period_key
    where t.status = 'completed'
      and t.dest_store_id is not null
    union all
    select t.from_store_id as store_id, t.flavor_id, -t.quantity as delta
    from transfer_logs t
    join target_period tp on tp.prev_period_key = t.period_key
    where t.status = 'completed'
      and t.from_store_id is not null
  ) x
  group by x.store_id, x.flavor_id
),
current_period_stock as (
  select
    g.store_id,
    g.flavor_id,
    coalesce(ip.stock_grams, 0) + coalesce(tc.transfer_delta, 0) as current_stock
  from store_flavor_grid g
  left join inventory_prev ip on ip.store_id = g.store_id and ip.flavor_id = g.flavor_id
  left join transfer_delta_current tc on tc.store_id = g.store_id and tc.flavor_id = g.flavor_id
),
prev_month_consumption_by_flavor as (
  select
    g.flavor_id,
    sum(coalesce(ipp.stock_grams, 0) + coalesce(tp.transfer_delta, 0) - coalesce(ip.stock_grams, 0)) as prev_consumption
  from store_flavor_grid g
  left join inventory_prev_prev ipp on ipp.store_id = g.store_id and ipp.flavor_id = g.flavor_id
  left join transfer_delta_prev tp on tp.store_id = g.store_id and tp.flavor_id = g.flavor_id
  left join inventory_prev ip on ip.store_id = g.store_id and ip.flavor_id = g.flavor_id
  group by g.flavor_id
)
select
  row_number() over(order by b.name, f.name) as rowIndex,
  b.name as brand,
  f.name as flavorName,
  coalesce(sum(cps.current_stock), 0) as totalStock,
  coalesce(pmc.prev_consumption, 0)::numeric as prevConsumption,
  true as appDisplay
from flavors f
join brands b on b.id = f.brand_id
left join current_period_stock cps on cps.flavor_id = f.id
left join prev_month_consumption_by_flavor pmc on pmc.flavor_id = f.id
where f.is_active = true
group by f.id, b.name, f.name, pmc.prev_consumption
order by b.name, f.name;
$$;

create or replace function fetch_dashboard_stock_overview(p_period_key int)
returns table (
  rowIndex bigint,
  brand text,
  flavorName text,
  totalStock numeric,
  prevConsumption numeric,
  officeStock numeric,
  babaMainStock numeric,
  nakanoStock numeric,
  baba2ndStock numeric,
  appDisplay boolean
)
language sql
as $$
with target_period as (
  select
    p_period_key as period_key,
    case
      when mod(p_period_key, 100) = 1 then ((p_period_key / 100) - 1) * 100 + 12
      else p_period_key - 1
    end as prev_period_key,
    case
      when mod(p_period_key, 100) = 1 then ((p_period_key / 100) - 1) * 100 + 11
      when mod(p_period_key, 100) = 2 then ((p_period_key / 100) - 1) * 100 + 12
      else p_period_key - 2
    end as prev_prev_period_key
),
store_flavor_grid as (
  select
    s.id as store_id,
    s.store_key,
    f.id as flavor_id
  from stores s
  cross join flavors f
  where f.is_active = true
),
latest_inventory_prev as (
  select distinct on (il.store_id, il.flavor_id)
    il.id,
    il.store_id,
    il.flavor_id
  from inventory_logs il
  join target_period tp on tp.prev_period_key = il.period_key
  order by il.store_id, il.flavor_id, il.created_at desc, il.id desc
),
inventory_prev as (
  select
    il.store_id,
    il.flavor_id,
    coalesce(il.tupper_basic, 0) + coalesce(il.tupper_reserve, 0)
      + coalesce(il.merch_pkg_50, 0) * 50
      + coalesce(il.merch_pkg_100, 0) * 100
      + coalesce(il.merch_pkg_125, 0) * 125
      + coalesce(il.merch_pkg_200, 0) * 200
      + coalesce(il.merch_pkg_250, 0) * 250
      + coalesce(il.merch_pkg_1kg, 0) * 1000
      + coalesce(il.stock_pkg_50, 0) * 50
      + coalesce(il.stock_pkg_100, 0) * 100
      + coalesce(il.stock_pkg_125, 0) * 125
      + coalesce(il.stock_pkg_200, 0) * 200
      + coalesce(il.stock_pkg_250, 0) * 250
      + coalesce(il.stock_pkg_1kg, 0) * 1000
      + coalesce(il.stock_other, 0) as stock_grams
  from inventory_logs il
  join latest_inventory_prev li on li.id = il.id
),
latest_inventory_prev_prev as (
  select distinct on (il.store_id, il.flavor_id)
    il.id,
    il.store_id,
    il.flavor_id
  from inventory_logs il
  join target_period tp on tp.prev_prev_period_key = il.period_key
  order by il.store_id, il.flavor_id, il.created_at desc, il.id desc
),
inventory_prev_prev as (
  select
    il.store_id,
    il.flavor_id,
    coalesce(il.tupper_basic, 0) + coalesce(il.tupper_reserve, 0)
      + coalesce(il.merch_pkg_50, 0) * 50
      + coalesce(il.merch_pkg_100, 0) * 100
      + coalesce(il.merch_pkg_125, 0) * 125
      + coalesce(il.merch_pkg_200, 0) * 200
      + coalesce(il.merch_pkg_250, 0) * 250
      + coalesce(il.merch_pkg_1kg, 0) * 1000
      + coalesce(il.stock_pkg_50, 0) * 50
      + coalesce(il.stock_pkg_100, 0) * 100
      + coalesce(il.stock_pkg_125, 0) * 125
      + coalesce(il.stock_pkg_200, 0) * 200
      + coalesce(il.stock_pkg_250, 0) * 250
      + coalesce(il.stock_pkg_1kg, 0) * 1000
      + coalesce(il.stock_other, 0) as stock_grams
  from inventory_logs il
  join latest_inventory_prev_prev li on li.id = il.id
),
transfer_delta_current as (
  select
    x.store_id,
    x.flavor_id,
    sum(x.delta) as transfer_delta
  from (
    select t.dest_store_id as store_id, t.flavor_id, t.quantity as delta
    from transfer_logs t
    where t.period_key = p_period_key
      and t.status = 'completed'
      and t.dest_store_id is not null
    union all
    select t.from_store_id as store_id, t.flavor_id, -t.quantity as delta
    from transfer_logs t
    where t.period_key = p_period_key
      and t.status = 'completed'
      and t.from_store_id is not null
  ) x
  group by x.store_id, x.flavor_id
),
transfer_delta_prev as (
  select
    x.store_id,
    x.flavor_id,
    sum(x.delta) as transfer_delta
  from (
    select t.dest_store_id as store_id, t.flavor_id, t.quantity as delta
    from transfer_logs t
    join target_period tp on tp.prev_period_key = t.period_key
    where t.status = 'completed'
      and t.dest_store_id is not null
    union all
    select t.from_store_id as store_id, t.flavor_id, -t.quantity as delta
    from transfer_logs t
    join target_period tp on tp.prev_period_key = t.period_key
    where t.status = 'completed'
      and t.from_store_id is not null
  ) x
  group by x.store_id, x.flavor_id
),
current_period_stock as (
  select
    g.store_id,
    g.store_key,
    g.flavor_id,
    coalesce(ip.stock_grams, 0) + coalesce(tc.transfer_delta, 0) as current_stock
  from store_flavor_grid g
  left join inventory_prev ip on ip.store_id = g.store_id and ip.flavor_id = g.flavor_id
  left join transfer_delta_current tc on tc.store_id = g.store_id and tc.flavor_id = g.flavor_id
),
prev_month_consumption_by_flavor as (
  select
    g.flavor_id,
    sum(coalesce(ipp.stock_grams, 0) + coalesce(tp.transfer_delta, 0) - coalesce(ip.stock_grams, 0)) as prev_consumption
  from store_flavor_grid g
  left join inventory_prev_prev ipp on ipp.store_id = g.store_id and ipp.flavor_id = g.flavor_id
  left join transfer_delta_prev tp on tp.store_id = g.store_id and tp.flavor_id = g.flavor_id
  left join inventory_prev ip on ip.store_id = g.store_id and ip.flavor_id = g.flavor_id
  group by g.flavor_id
)
select
  row_number() over(order by b.name, f.name) as rowIndex,
  b.name as brand,
  f.name as flavorName,
  coalesce(sum(cps.current_stock), 0) as totalStock,
  coalesce(pmc.prev_consumption, 0)::numeric as prevConsumption,
  coalesce(max(case when cps.store_key = 'office' then cps.current_stock end), 0)::numeric as officeStock,
  coalesce(max(case when cps.store_key = 'baba_main' then cps.current_stock end), 0)::numeric as babaMainStock,
  coalesce(max(case when cps.store_key = 'nakano' then cps.current_stock end), 0)::numeric as nakanoStock,
  coalesce(max(case when cps.store_key = 'baba_2nd' then cps.current_stock end), 0)::numeric as baba2ndStock,
  true as appDisplay
from flavors f
join brands b on b.id = f.brand_id
left join current_period_stock cps on cps.flavor_id = f.id
left join prev_month_consumption_by_flavor pmc on pmc.flavor_id = f.id
where f.is_active = true
group by f.id, b.name, f.name, pmc.prev_consumption
order by b.name, f.name;
$$;

create or replace function fetch_inventory_result_details(p_period_key int, p_store_id bigint)
returns table (
  rowIndex bigint,
  brand text,
  flavorName text,
  tupperBasicStock numeric,
  tupperReserveStock numeric,
  merchStock numeric,
  inventoryStock numeric,
  currentTotal numeric,
  prevTotal numeric,
  prevConsumption numeric,
  transferAmount numeric,
  currentConsumption numeric
)
language sql
as $$
with target_period as (
  select
    p_period_key as period_key,
    case
      when mod(p_period_key, 100) = 1 then ((p_period_key / 100) - 1) * 100 + 12
      else p_period_key - 1
    end as prev_period_key,
    case
      when mod(p_period_key, 100) = 1 then ((p_period_key / 100) - 1) * 100 + 11
      when mod(p_period_key, 100) = 2 then ((p_period_key / 100) - 1) * 100 + 12
      else p_period_key - 2
    end as prev_prev_period_key
),
latest_current as (
  select distinct on (il.flavor_id)
    il.id,
    il.flavor_id
  from inventory_logs il
  join target_period tp on tp.period_key = il.period_key
  where il.store_id = p_store_id
  order by il.flavor_id, il.created_at desc, il.id desc
),
current_inventory as (
  select
    il.flavor_id,
    coalesce(il.tupper_basic, 0) as tupper_basic_stock,
    coalesce(il.tupper_reserve, 0) as tupper_reserve_stock,
    coalesce(il.merch_pkg_50, 0) * 50
      + coalesce(il.merch_pkg_100, 0) * 100
      + coalesce(il.merch_pkg_125, 0) * 125
      + coalesce(il.merch_pkg_200, 0) * 200
      + coalesce(il.merch_pkg_250, 0) * 250
      + coalesce(il.merch_pkg_1kg, 0) * 1000 as merch_stock,
    coalesce(il.stock_pkg_50, 0) * 50
      + coalesce(il.stock_pkg_100, 0) * 100
      + coalesce(il.stock_pkg_125, 0) * 125
      + coalesce(il.stock_pkg_200, 0) * 200
      + coalesce(il.stock_pkg_250, 0) * 250
      + coalesce(il.stock_pkg_1kg, 0) * 1000
      + coalesce(il.stock_other, 0) as inventory_stock
  from inventory_logs il
  join latest_current lc on lc.id = il.id
),
latest_prev as (
  select distinct on (il.flavor_id)
    il.id,
    il.flavor_id
  from inventory_logs il
  join target_period tp on tp.prev_period_key = il.period_key
  where il.store_id = p_store_id
  order by il.flavor_id, il.created_at desc, il.id desc
),
prev_inventory as (
  select
    il.flavor_id,
    coalesce(il.tupper_basic, 0) + coalesce(il.tupper_reserve, 0)
      + coalesce(il.merch_pkg_50, 0) * 50
      + coalesce(il.merch_pkg_100, 0) * 100
      + coalesce(il.merch_pkg_125, 0) * 125
      + coalesce(il.merch_pkg_200, 0) * 200
      + coalesce(il.merch_pkg_250, 0) * 250
      + coalesce(il.merch_pkg_1kg, 0) * 1000
      + coalesce(il.stock_pkg_50, 0) * 50
      + coalesce(il.stock_pkg_100, 0) * 100
      + coalesce(il.stock_pkg_125, 0) * 125
      + coalesce(il.stock_pkg_200, 0) * 200
      + coalesce(il.stock_pkg_250, 0) * 250
      + coalesce(il.stock_pkg_1kg, 0) * 1000
      + coalesce(il.stock_other, 0) as prev_total
  from inventory_logs il
  join latest_prev lp on lp.id = il.id
),
latest_prev_prev as (
  select distinct on (il.flavor_id)
    il.id,
    il.flavor_id
  from inventory_logs il
  join target_period tp on tp.prev_prev_period_key = il.period_key
  where il.store_id = p_store_id
  order by il.flavor_id, il.created_at desc, il.id desc
),
prev_prev_inventory as (
  select
    il.flavor_id,
    coalesce(il.tupper_basic, 0) + coalesce(il.tupper_reserve, 0)
      + coalesce(il.merch_pkg_50, 0) * 50
      + coalesce(il.merch_pkg_100, 0) * 100
      + coalesce(il.merch_pkg_125, 0) * 125
      + coalesce(il.merch_pkg_200, 0) * 200
      + coalesce(il.merch_pkg_250, 0) * 250
      + coalesce(il.merch_pkg_1kg, 0) * 1000
      + coalesce(il.stock_pkg_50, 0) * 50
      + coalesce(il.stock_pkg_100, 0) * 100
      + coalesce(il.stock_pkg_125, 0) * 125
      + coalesce(il.stock_pkg_200, 0) * 200
      + coalesce(il.stock_pkg_250, 0) * 250
      + coalesce(il.stock_pkg_1kg, 0) * 1000
      + coalesce(il.stock_other, 0) as prev_prev_total
  from inventory_logs il
  join latest_prev_prev lpp on lpp.id = il.id
),
current_transfer as (
  select
    x.flavor_id,
    sum(x.delta) as transfer_amount
  from (
    select t.flavor_id, t.quantity as delta
    from transfer_logs t
    where t.period_key = p_period_key
      and t.status = 'completed'
      and t.dest_store_id = p_store_id
    union all
    select t.flavor_id, -t.quantity as delta
    from transfer_logs t
    where t.period_key = p_period_key
      and t.status = 'completed'
      and t.from_store_id = p_store_id
  ) x
  group by x.flavor_id
),
prev_transfer as (
  select
    x.flavor_id,
    sum(x.delta) as transfer_amount
  from (
    select t.flavor_id, t.quantity as delta
    from transfer_logs t
    join target_period tp on tp.prev_period_key = t.period_key
    where t.status = 'completed'
      and t.dest_store_id = p_store_id
    union all
    select t.flavor_id, -t.quantity as delta
    from transfer_logs t
    join target_period tp on tp.prev_period_key = t.period_key
    where t.status = 'completed'
      and t.from_store_id = p_store_id
  ) x
  group by x.flavor_id
)
select
  row_number() over(order by b.name, f.name) as rowIndex,
  b.name as brand,
  f.name as flavorName,
  coalesce(ci.tupper_basic_stock, 0)::numeric as tupperBasicStock,
  coalesce(ci.tupper_reserve_stock, 0)::numeric as tupperReserveStock,
  coalesce(ci.merch_stock, 0)::numeric as merchStock,
  coalesce(ci.inventory_stock, 0)::numeric as inventoryStock,
  coalesce(ci.tupper_basic_stock, 0)::numeric + coalesce(ci.tupper_reserve_stock, 0)::numeric + coalesce(ci.merch_stock, 0)::numeric + coalesce(ci.inventory_stock, 0)::numeric as currentTotal,
  coalesce(pi.prev_total, 0)::numeric as prevTotal,
  (coalesce(ppi.prev_prev_total, 0) + coalesce(pt.transfer_amount, 0) - coalesce(pi.prev_total, 0))::numeric as prevConsumption,
  coalesce(ct.transfer_amount, 0)::numeric as transferAmount,
  (coalesce(pi.prev_total, 0) + coalesce(ct.transfer_amount, 0) - (coalesce(ci.tupper_basic_stock, 0) + coalesce(ci.tupper_reserve_stock, 0) + coalesce(ci.merch_stock, 0) + coalesce(ci.inventory_stock, 0)))::numeric as currentConsumption
from flavors f
join brands b on b.id = f.brand_id
left join current_inventory ci on ci.flavor_id = f.id
left join prev_inventory pi on pi.flavor_id = f.id
left join prev_prev_inventory ppi on ppi.flavor_id = f.id
left join current_transfer ct on ct.flavor_id = f.id
left join prev_transfer pt on pt.flavor_id = f.id
where f.is_active = true
order by b.name, f.name;
$$;

create or replace function fetch_inventory_sheet_data(p_store_id bigint, p_period_key int)
returns table (
  flavor_id bigint,
  brand_name text,
  flavor_name text,
  tupper_basic_enabled boolean,
  tupper_reserve_enabled boolean,
  tupper_basic numeric,
  tupper_reserve numeric,
  merch_pkg_50 numeric,
  merch_pkg_100 numeric,
  merch_pkg_125 numeric,
  merch_pkg_200 numeric,
  merch_pkg_250 numeric,
  merch_pkg_1kg numeric,
  stock_pkg_50 numeric,
  stock_pkg_100 numeric,
  stock_pkg_125 numeric,
  stock_pkg_200 numeric,
  stock_pkg_250 numeric,
  stock_pkg_1kg numeric,
  stock_other numeric,
  recorded_at date
)
language sql
as $$
with target_period as (
  select
    p_period_key as period_key,
    case
      when mod(p_period_key, 100) = 1 then ((p_period_key / 100) - 1) * 100 + 12
      else p_period_key - 1
    end as prev_period_key
),
latest as (
  select distinct on (il.flavor_id)
    il.id,
    il.flavor_id
  from inventory_logs il
  join target_period tp on tp.period_key = il.period_key
  where il.store_id = p_store_id
  order by il.flavor_id, il.created_at desc, il.id desc
),
prev_latest as (
  select distinct on (il.flavor_id)
    il.id,
    il.flavor_id
  from inventory_logs il
  join target_period tp on tp.prev_period_key = il.period_key
  where il.store_id = p_store_id
  order by il.flavor_id, il.created_at desc, il.id desc
)
select
  f.id as flavor_id,
  case
    when b.short_name is not null and btrim(b.short_name) <> '' then b.short_name || ' (' || b.name || ')'
    else b.name
  end as brand_name,
  f.name as flavor_name,
  case
    when l.flavor_id is not null then il.tupper_basic is not null
    when pl.flavor_id is not null then pil.tupper_basic is not null
    else false
  end as tupper_basic_enabled,
  case
    when l.flavor_id is not null then il.tupper_reserve is not null
    when pl.flavor_id is not null then pil.tupper_reserve is not null
    else false
  end as tupper_reserve_enabled,
  il.tupper_basic,
  il.tupper_reserve,
  il.merch_pkg_50,
  il.merch_pkg_100,
  il.merch_pkg_125,
  il.merch_pkg_200,
  il.merch_pkg_250,
  il.merch_pkg_1kg,
  il.stock_pkg_50,
  il.stock_pkg_100,
  il.stock_pkg_125,
  il.stock_pkg_200,
  il.stock_pkg_250,
  il.stock_pkg_1kg,
  il.stock_other,
  il.recorded_at
from flavors f
join brands b on b.id = f.brand_id
left join latest l on l.flavor_id = f.id
left join inventory_logs il on
  il.id = l.id
left join prev_latest pl on pl.flavor_id = f.id
left join inventory_logs pil on
  pil.id = pl.id
where f.is_active = true
order by b.name, f.name;
$$;

create or replace function fetch_all_transfer_records(p_period_key int)
returns table (
  blockIndex bigint,
  date date,
  fromStoreKey text,
  destStoreKey text,
  recordType text,
  inspected boolean,
  comment text
)
language sql
as $$
with grouped as (
  select
    min(t.block_index) as block_index,
    t.period_key,
    t.month_num,
    t.recorded_at,
    t.from_store_id,
    t.dest_store_id,
    t.status,
    t.created_at,
    max(t.comment) as comment
  from transfer_logs t
  where t.period_key = p_period_key
  group by
    t.period_key,
    t.month_num,
    t.recorded_at,
    t.from_store_id,
    t.dest_store_id,
    t.status,
    t.created_at
)
select
  g.block_index as blockIndex,
  g.recorded_at as date,
  fs.store_key as fromStoreKey,
  ds.store_key as destStoreKey,
  case
    when g.from_store_id is null and g.dest_store_id is not null then 'arrival'
    when g.from_store_id is not null and g.dest_store_id is null then 'dispose'
    else 'issue'
  end as recordType,
  (g.status = 'completed') as inspected,
  g.comment
from grouped g
left join stores fs on fs.id = g.from_store_id
left join stores ds on ds.id = g.dest_store_id
order by g.recorded_at desc, g.block_index desc;
$$;

create or replace function fetch_pending_transfer_records(p_period_key int, p_dest_store_id bigint)
returns table (
  blockIndex bigint,
  date date,
  fromStoreKey text
)
language sql
as $$
with grouped as (
  select
    min(t.block_index) as block_index,
    t.period_key,
    t.month_num,
    t.recorded_at,
    t.from_store_id,
    t.dest_store_id,
    t.status,
    t.comment,
    t.created_at
  from transfer_logs t
  where t.period_key = p_period_key
    and t.dest_store_id = p_dest_store_id
    and t.status = 'pending'
  group by
    t.period_key,
    t.month_num,
    t.recorded_at,
    t.from_store_id,
    t.dest_store_id,
    t.status,
    t.comment,
    t.created_at
)
select
  g.block_index as blockIndex,
  g.recorded_at as date,
  fs.store_key as fromStoreKey
from grouped g
left join stores fs on fs.id = g.from_store_id
order by g.recorded_at desc, g.block_index desc;
$$;

create or replace function fetch_transfer_record_detail(p_period_key int, p_block_index bigint, p_store_id bigint)
returns table (
  rowIndex bigint,
  brand text,
  flavorName text,
  qty numeric
)
language sql
as $$
with target_group as (
  select
    t.period_key,
    t.month_num,
    t.recorded_at,
    t.from_store_id,
    t.dest_store_id,
    t.status,
    t.comment,
    t.created_at
  from transfer_logs t
  where t.period_key = p_period_key
  group by
    t.period_key,
    t.month_num,
    t.recorded_at,
    t.from_store_id,
    t.dest_store_id,
    t.status,
    t.comment,
    t.created_at
  having min(t.block_index) = p_block_index
  limit 1
)
select
  f.id as rowIndex,
  b.name as brand,
  f.name as flavorName,
  sum(t.quantity)::numeric as qty
from transfer_logs t
join target_group g on
  g.period_key = t.period_key
  and g.month_num = t.month_num
  and g.recorded_at = t.recorded_at
  and g.created_at = t.created_at
  and g.status = t.status
  and coalesce(g.comment, '') = coalesce(t.comment, '')
  and coalesce(g.from_store_id, -1) = coalesce(t.from_store_id, -1)
  and coalesce(g.dest_store_id, -1) = coalesce(t.dest_store_id, -1)
join flavors f on f.id = t.flavor_id
join brands b on b.id = f.brand_id
where t.period_key = p_period_key
  and (t.dest_store_id = p_store_id or t.from_store_id = p_store_id)
group by f.id, b.name, f.name
order by b.name, f.name;
$$;

create or replace function fetch_dispose_record_detail(p_period_key int, p_block_index bigint, p_store_id bigint)
returns table (
  rowIndex bigint,
  brand text,
  flavorName text,
  qty numeric
)
language sql
as $$
with target_group as (
  select
    t.period_key,
    t.month_num,
    t.recorded_at,
    t.from_store_id,
    t.dest_store_id,
    t.status,
    t.comment,
    t.created_at
  from transfer_logs t
  where t.period_key = p_period_key
    and t.dest_store_id is null
  group by
    t.period_key,
    t.month_num,
    t.recorded_at,
    t.from_store_id,
    t.dest_store_id,
    t.status,
    t.comment,
    t.created_at
  having min(t.block_index) = p_block_index
  limit 1
)
select
  f.id as rowIndex,
  b.name as brand,
  f.name as flavorName,
  sum(t.quantity)::numeric as qty
from transfer_logs t
join target_group g on
  g.period_key = t.period_key
  and g.month_num = t.month_num
  and g.recorded_at = t.recorded_at
  and g.created_at = t.created_at
  and g.status = t.status
  and coalesce(g.comment, '') = coalesce(t.comment, '')
  and coalesce(g.from_store_id, -1) = coalesce(t.from_store_id, -1)
join flavors f on f.id = t.flavor_id
join brands b on b.id = f.brand_id
where t.period_key = p_period_key
  and t.from_store_id = p_store_id
  and t.dest_store_id is null
group by f.id, b.name, f.name
order by b.name, f.name;
$$;

create or replace function complete_transfer_inspection(
  p_period_key int,
  p_block_index bigint,
  p_from_store_id bigint,
  p_dest_store_id bigint,
  p_items jsonb
)
returns table (
  success boolean
)
language plpgsql
as $$
declare
  target_recorded_at date;
  target_comment text;
  target_created_at timestamptz;
  current_status text;
begin
  select
    t.recorded_at,
    t.comment,
    t.created_at,
    t.status
  into
    target_recorded_at,
    target_comment,
    target_created_at,
    current_status
  from transfer_logs t
  where t.period_key = p_period_key
    and coalesce(t.from_store_id, -1) = coalesce(p_from_store_id, -1)
    and coalesce(t.dest_store_id, -1) = coalesce(p_dest_store_id, -1)
  group by t.recorded_at, t.comment, t.created_at, t.status
  having min(t.block_index) = p_block_index
  limit 1;

  if target_recorded_at is null then
    return query select false as success;
    return;
  end if;

  update transfer_logs t
  set status = 'completed'
  where t.period_key = p_period_key
    and t.recorded_at = target_recorded_at
    and t.created_at = target_created_at
    and coalesce(t.comment, '') = coalesce(target_comment, '')
    and coalesce(t.from_store_id, -1) = coalesce(p_from_store_id, -1)
    and coalesce(t.dest_store_id, -1) = coalesce(p_dest_store_id, -1)
    and t.status = current_status;

  with input_rows as (
    select
      (x->>'rowIndex')::bigint as flavor_id,
      coalesce((x->>'qty')::numeric, 0)::numeric as qty
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) x
  )
  update transfer_logs t
  set quantity = i.qty
  from input_rows i
  where t.period_key = p_period_key
    and t.recorded_at = target_recorded_at
    and t.created_at = target_created_at
    and coalesce(t.comment, '') = coalesce(target_comment, '')
    and coalesce(t.from_store_id, -1) = coalesce(p_from_store_id, -1)
    and coalesce(t.dest_store_id, -1) = coalesce(p_dest_store_id, -1)
    and t.flavor_id = i.flavor_id;

  with input_rows as (
    select
      (x->>'rowIndex')::bigint as flavor_id,
      coalesce((x->>'qty')::numeric, 0)::numeric as qty
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) x
  )
  insert into transfer_logs (period_key, month_num, recorded_at, from_store_id, dest_store_id, flavor_id, quantity, status, comment, created_at)
  select
    p_period_key,
    mod(p_period_key, 100),
    target_recorded_at,
    p_from_store_id,
    p_dest_store_id,
    i.flavor_id,
    i.qty,
    'completed',
    target_comment,
    target_created_at
  from input_rows i
  left join transfer_logs t on
    t.period_key = p_period_key
    and t.recorded_at = target_recorded_at
    and t.created_at = target_created_at
    and coalesce(t.comment, '') = coalesce(target_comment, '')
    and coalesce(t.from_store_id, -1) = coalesce(p_from_store_id, -1)
    and coalesce(t.dest_store_id, -1) = coalesce(p_dest_store_id, -1)
    and t.flavor_id = i.flavor_id
  where i.qty > 0
    and t.id is null;

  return query select true as success;
end;
$$;

create or replace function amend_transfer_record(
  p_period_key int,
  p_block_index bigint,
  p_items jsonb,
  p_comment text default null
)
returns table (
  success boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_month_num int;
  target_recorded_at date;
  target_comment text;
  target_created_at timestamptz;
  target_status text;
  target_from_store_id bigint;
  target_dest_store_id bigint;
  final_comment text;
  item_count int;
begin
  select
    t.month_num,
    t.recorded_at,
    t.comment,
    t.created_at,
    t.status,
    t.from_store_id,
    t.dest_store_id
  into
    target_month_num,
    target_recorded_at,
    target_comment,
    target_created_at,
    target_status,
    target_from_store_id,
    target_dest_store_id
  from transfer_logs t
  where t.period_key = p_period_key
    and t.block_index = p_block_index
  limit 1;

  if target_recorded_at is null then
    return query select false as success;
    return;
  end if;

  -- p_comment = null → 既存コメントを維持 / p_comment = '' → コメント削除
  final_comment := case
    when p_comment is null then target_comment
    when p_comment = '' then null
    else p_comment
  end;

  with input_rows as (
    select
      coalesce((x->>'flavorId')::bigint, (x->>'rowIndex')::bigint) as flavor_id,
      coalesce((x->>'qty')::numeric, 0)::numeric as qty
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) x
  )
  select count(*)::int into item_count
  from input_rows
  where flavor_id is not null and qty > 0;

  if item_count <= 0 then
    -- 全銘柄削除：ブロックに属する全行を削除して終了
    delete from transfer_logs t
    where t.period_key = p_period_key
      and t.recorded_at = target_recorded_at
      and t.created_at = target_created_at
      and t.status = target_status
      and coalesce(t.from_store_id, -1) = coalesce(target_from_store_id, -1)
      and coalesce(t.dest_store_id, -1) = coalesce(target_dest_store_id, -1);
    return query select true as success;
    return;
  end if;

  -- input_rows に qty > 0 で存在しない銘柄を削除（コメント条件を除去して確実に特定）
  with input_rows as (
    select
      coalesce((x->>'flavorId')::bigint, (x->>'rowIndex')::bigint) as flavor_id,
      coalesce((x->>'qty')::numeric, 0)::numeric as qty
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) x
  )
  delete from transfer_logs t
  where t.period_key = p_period_key
    and t.recorded_at = target_recorded_at
    and t.created_at = target_created_at
    and t.status = target_status
    and coalesce(t.from_store_id, -1) = coalesce(target_from_store_id, -1)
    and coalesce(t.dest_store_id, -1) = coalesce(target_dest_store_id, -1)
    and not exists (
      select 1
      from input_rows i
      where i.flavor_id = t.flavor_id
        and i.qty > 0
    );

  -- 既存銘柄の数量とコメントを更新
  with input_rows as (
    select
      coalesce((x->>'flavorId')::bigint, (x->>'rowIndex')::bigint) as flavor_id,
      coalesce((x->>'qty')::numeric, 0)::numeric as qty
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) x
  )
  update transfer_logs t
  set quantity = i.qty,
      comment = final_comment
  from input_rows i
  where t.period_key = p_period_key
    and t.recorded_at = target_recorded_at
    and t.created_at = target_created_at
    and t.status = target_status
    and coalesce(t.from_store_id, -1) = coalesce(target_from_store_id, -1)
    and coalesce(t.dest_store_id, -1) = coalesce(target_dest_store_id, -1)
    and t.flavor_id = i.flavor_id
    and i.qty > 0;

  -- 新規追加銘柄をINSERT
  with input_rows as (
    select
      coalesce((x->>'flavorId')::bigint, (x->>'rowIndex')::bigint) as flavor_id,
      coalesce((x->>'qty')::numeric, 0)::numeric as qty
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) x
  )
  insert into transfer_logs (period_key, month_num, recorded_at, from_store_id, dest_store_id, flavor_id, quantity, status, comment, created_at)
  select
    p_period_key,
    coalesce(target_month_num, mod(p_period_key, 100)),
    target_recorded_at,
    target_from_store_id,
    target_dest_store_id,
    i.flavor_id,
    i.qty,
    target_status,
    final_comment,
    target_created_at
  from input_rows i
  left join transfer_logs t on
    t.period_key = p_period_key
    and t.recorded_at = target_recorded_at
    and t.created_at = target_created_at
    and t.status = target_status
    and coalesce(t.from_store_id, -1) = coalesce(target_from_store_id, -1)
    and coalesce(t.dest_store_id, -1) = coalesce(target_dest_store_id, -1)
    and t.flavor_id = i.flavor_id
  where i.flavor_id is not null
    and i.qty > 0
    and t.id is null;

  return query select true as success;
end;
$$;

-- 移動記録ブロック自体を削除する専用RPC（全銘柄削除時に使用）
create or replace function delete_transfer_record_block(
  p_period_key int,
  p_block_index bigint
)
returns table (
  success boolean,
  deleted_count int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_recorded_at date;
  target_created_at timestamptz;
  target_status text;
  target_from_store_id bigint;
  target_dest_store_id bigint;
  rows_deleted int := 0;
begin
  select
    t.recorded_at,
    t.created_at,
    t.status,
    t.from_store_id,
    t.dest_store_id
  into
    target_recorded_at,
    target_created_at,
    target_status,
    target_from_store_id,
    target_dest_store_id
  from transfer_logs t
  where t.period_key = p_period_key
    and t.block_index = p_block_index
  limit 1;

  if target_recorded_at is null then
    return query select false as success, 0 as deleted_count;
    return;
  end if;

  with deleted as (
    delete from transfer_logs t
    where t.period_key = p_period_key
      and t.recorded_at = target_recorded_at
      and t.created_at = target_created_at
      and t.status = target_status
      and coalesce(t.from_store_id, -1) = coalesce(target_from_store_id, -1)
      and coalesce(t.dest_store_id, -1) = coalesce(target_dest_store_id, -1)
    returning 1
  )
  select count(*)::int into rows_deleted from deleted;

  return query select true as success, rows_deleted as deleted_count;
end;
$$;
