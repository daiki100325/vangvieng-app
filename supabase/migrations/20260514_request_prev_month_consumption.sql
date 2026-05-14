-- 補充依頼モードの前月消費量フィールドを fetch_request_inventory_data RPC に追加
-- 消費量 = 2ヶ月前棚卸し在庫 + 1ヶ月前移動量 - 1ヶ月前棚卸し在庫

drop function if exists fetch_request_inventory_data(integer);

create or replace function fetch_request_inventory_data(p_period_key int)
returns table (
  id bigint,
  brand text,
  flavor text,
  stock jsonb,
  "prevMonthConsumption" jsonb
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
target_period_ext as (
  select
    tp.period_key,
    tp.prev_period_key,
    case
      when mod(tp.prev_period_key, 100) = 1 then ((tp.prev_period_key / 100) - 1) * 100 + 12
      else tp.prev_period_key - 1
    end as prev_prev_period_key
  from target_period tp
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
  join latest_inventory li on li.id = il.id
),
prev_latest_inventory as (
  select distinct on (il.store_id, il.flavor_id)
    il.id,
    il.store_id,
    il.flavor_id
  from inventory_logs il
  join target_period_ext tpe on tpe.prev_prev_period_key = il.period_key
  order by il.store_id, il.flavor_id, il.created_at desc, il.id desc
),
prev_period_inventory as (
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
  join prev_latest_inventory pli on pli.id = il.id
),
period_transfer as (
  select
    x.store_id,
    x.flavor_id,
    sum(x.delta) as transfer_delta
  from (
    select t.dest_store_id as store_id, t.flavor_id, t.quantity as delta
    from transfer_logs t
    where t.period_key = p_period_key and t.status = 'completed' and t.dest_store_id is not null
    union all
    select t.from_store_id as store_id, t.flavor_id, -t.quantity as delta
    from transfer_logs t
    where t.period_key = p_period_key and t.status = 'completed' and t.from_store_id is not null
  ) x
  group by x.store_id, x.flavor_id
),
prev_period_transfer as (
  select
    x.store_id,
    x.flavor_id,
    sum(x.delta) as transfer_delta
  from (
    select t.dest_store_id as store_id, t.flavor_id, t.quantity as delta
    from transfer_logs t
    join target_period tp on tp.prev_period_key = t.period_key
    where t.status = 'completed' and t.dest_store_id is not null
    union all
    select t.from_store_id as store_id, t.flavor_id, -t.quantity as delta
    from transfer_logs t
    join target_period tp on tp.prev_period_key = t.period_key
    where t.status = 'completed' and t.from_store_id is not null
  ) x
  group by x.store_id, x.flavor_id
),
store_flavor_grid as (
  select s.id as store_id, f.id as flavor_id
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
),
prev_consumption as (
  select
    g.store_id,
    g.flavor_id,
    coalesce(ppi.base_stock, 0) + coalesce(ppt.transfer_delta, 0) - coalesce(pi.base_stock, 0) as consumption
  from store_flavor_grid g
  left join prev_period_inventory ppi on ppi.store_id = g.store_id and ppi.flavor_id = g.flavor_id
  left join prev_period_transfer ppt on ppt.store_id = g.store_id and ppt.flavor_id = g.flavor_id
  left join period_inventory pi on pi.store_id = g.store_id and pi.flavor_id = g.flavor_id
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
  ) as stock,
  jsonb_build_object(
    'office', coalesce(max(case when s.store_key = 'office' then pc.consumption end), 0),
    'baba_main', coalesce(max(case when s.store_key = 'baba_main' then pc.consumption end), 0),
    'nakano', coalesce(max(case when s.store_key = 'nakano' then pc.consumption end), 0),
    'baba_2nd', coalesce(max(case when s.store_key = 'baba_2nd' then pc.consumption end), 0)
  ) as "prevMonthConsumption"
from flavors f
join brands b on b.id = f.brand_id
left join period_stock ps on ps.flavor_id = f.id
left join stores s on s.id = ps.store_id
left join prev_consumption pc on pc.flavor_id = f.id and pc.store_id = ps.store_id
where f.is_active = true
group by f.id, b.name, f.name
order by b.name, f.name;
$$;
