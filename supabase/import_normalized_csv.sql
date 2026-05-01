-- ============================================================
-- Import normalized CSV data into Supabase
-- Target files (example):
--   data-migration/csv/normalized/brands.csv
--   data-migration/csv/normalized/flavors.csv
--   data-migration/csv/normalized/inventory_logs_2025-12.normalized.csv
--   data-migration/csv/normalized/inventory_logs_2026-01.normalized.csv
--   data-migration/csv/normalized/inventory_logs_2026-02.normalized.csv
--   data-migration/csv/normalized/inventory_logs_2026-03.normalized.csv
--   data-migration/csv/normalized/transfer_logs_2025-12.normalized.csv
--   data-migration/csv/normalized/transfer_logs_2026-01.normalized.csv
--   data-migration/csv/normalized/transfer_logs_2026-02.normalized.csv
--   data-migration/csv/normalized/transfer_logs_2026-03.normalized.csv
--
-- Flow:
-- 1) Run this file once to create staging tables.
-- 2) Import CSVs into staging tables using Supabase Table Editor "Import data".
-- 3) Run sections 3 and 4 (upsert + insert).
-- 4) Run section 5 verification queries and compare with spreadsheet aggregates.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Staging tables (raw normalized CSV)
-- ------------------------------------------------------------
create table if not exists stg_inventory_logs (
  recorded_at date not null,
  period_key int null,
  month_num int null,
  store_key text not null,
  brand_name text not null,
  flavor_name text not null,
  tupper_basic numeric null,
  tupper_reserve numeric null,
  merch_pkg_50 numeric null,
  merch_pkg_100 numeric null,
  merch_pkg_125 numeric null,
  merch_pkg_200 numeric null,
  merch_pkg_250 numeric null,
  merch_pkg_1kg numeric null,
  stock_pkg_50 numeric null,
  stock_pkg_100 numeric null,
  stock_pkg_125 numeric null,
  stock_pkg_200 numeric null,
  stock_pkg_250 numeric null,
  stock_pkg_1kg numeric null,
  stock_other numeric null
);

create table if not exists stg_transfer_logs (
  recorded_at date not null,
  period_key int null,
  month_num int null,
  from_store_key text null,
  dest_store_key text null,
  brand_name text not null,
  flavor_name text not null,
  quantity numeric not null,
  status text not null,
  comment text null
);

create table if not exists stg_brands (
  name text not null,
  short_name text null
);

create table if not exists stg_flavors (
  brand_name text not null,
  flavor_name text not null,
  is_active boolean null
);

-- Optional reset staging before each fresh import:
-- truncate table stg_inventory_logs;
-- truncate table stg_transfer_logs;
-- truncate table stg_brands;
-- truncate table stg_flavors;

-- Optional full reset before reimport (master + logs):
-- truncate table transfer_logs restart identity;
-- truncate table inventory_logs restart identity;
-- truncate table flavors restart identity cascade;
-- truncate table brands restart identity cascade;

-- ------------------------------------------------------------
-- 2) Quick staging checks
-- ------------------------------------------------------------
-- select coalesce(period_key, month_num), count(*) from stg_inventory_logs group by coalesce(period_key, month_num) order by coalesce(period_key, month_num);
-- select coalesce(period_key, month_num), count(*) from stg_transfer_logs group by coalesce(period_key, month_num) order by coalesce(period_key, month_num);
-- select * from stg_transfer_logs where comment like 'ambiguous:%' limit 50;

-- ------------------------------------------------------------
-- 3) Master upsert from staging
-- ------------------------------------------------------------
insert into brands (name, short_name)
select distinct
  btrim(s.name) as name,
  nullif(btrim(s.short_name), '') as short_name
from stg_brands s
where btrim(s.name) <> ''
on conflict (name) do update
set short_name = coalesce(excluded.short_name, brands.short_name);

insert into flavors (brand_id, name, is_active)
select distinct
  b.id as brand_id,
  s.flavor_name as name,
  coalesce(s.is_active, true) as is_active
from stg_flavors s
join brands b on b.name = s.brand_name
where s.flavor_name is not null and btrim(s.flavor_name) <> ''
on conflict (brand_id, name) do update
set is_active = excluded.is_active;

-- ------------------------------------------------------------
-- 4) Insert transactional logs
-- ------------------------------------------------------------
-- 4-1) inventory_logs
with resolved_inventory as (
  select
    s.*,
    b.id as brand_id
  from stg_inventory_logs s
  join brands b
    on b.name = s.brand_name
    or (
      b.short_name is not null
      and btrim(b.short_name) <> ''
      and (b.short_name || ' (' || b.name || ')') = s.brand_name
    )
)
insert into inventory_logs (
  recorded_at,
  period_key,
  month_num,
  store_id,
  flavor_id,
  tupper_basic,
  tupper_reserve,
  merch_pkg_50,
  merch_pkg_100,
  merch_pkg_125,
  merch_pkg_200,
  merch_pkg_250,
  merch_pkg_1kg,
  stock_pkg_50,
  stock_pkg_100,
  stock_pkg_125,
  stock_pkg_200,
  stock_pkg_250,
  stock_pkg_1kg,
  stock_other
)
select
  s.recorded_at,
  coalesce(
    s.period_key,
    (extract(year from s.recorded_at)::int * 100) + coalesce(s.month_num, extract(month from s.recorded_at)::int)
  ) as period_key,
  coalesce(
    s.month_num,
    mod(
      coalesce(
        s.period_key,
        (extract(year from s.recorded_at)::int * 100) + extract(month from s.recorded_at)::int
      ),
      100
    )
  ) as month_num,
  st.id as store_id,
  f.id as flavor_id,
  s.tupper_basic,
  s.tupper_reserve,
  s.merch_pkg_50,
  s.merch_pkg_100,
  s.merch_pkg_125,
  s.merch_pkg_200,
  s.merch_pkg_250,
  s.merch_pkg_1kg,
  s.stock_pkg_50,
  s.stock_pkg_100,
  s.stock_pkg_125,
  s.stock_pkg_200,
  s.stock_pkg_250,
  s.stock_pkg_1kg,
  s.stock_other
from resolved_inventory s
join stores st on st.store_key = s.store_key
join flavors f on f.brand_id = s.brand_id and f.name = s.flavor_name;

-- 4-2) transfer_logs
with resolved_transfer as (
  select
    s.*,
    b.id as brand_id
  from stg_transfer_logs s
  join brands b
    on b.name = s.brand_name
    or (
      b.short_name is not null
      and btrim(b.short_name) <> ''
      and (b.short_name || ' (' || b.name || ')') = s.brand_name
    )
)
insert into transfer_logs (
  period_key,
  month_num,
  recorded_at,
  from_store_id,
  dest_store_id,
  flavor_id,
  quantity,
  status,
  comment
)
select
  coalesce(
    s.period_key,
    (extract(year from s.recorded_at)::int * 100) + coalesce(s.month_num, extract(month from s.recorded_at)::int)
  ) as period_key,
  coalesce(
    s.month_num,
    mod(
      coalesce(
        s.period_key,
        (extract(year from s.recorded_at)::int * 100) + extract(month from s.recorded_at)::int
      ),
      100
    )
  ) as month_num,
  s.recorded_at,
  fs.id as from_store_id,
  ds.id as dest_store_id,
  f.id as flavor_id,
  s.quantity,
  case when s.status in ('pending', 'completed') then s.status else 'completed' end as status,
  s.comment
from resolved_transfer s
left join stores fs on fs.store_key = nullif(s.from_store_key, '')
left join stores ds on ds.store_key = nullif(s.dest_store_key, '')
join flavors f on f.brand_id = s.brand_id and f.name = s.flavor_name;

-- ------------------------------------------------------------
-- 5) Verification queries (compare with spreadsheet aggregates)
-- ------------------------------------------------------------

-- 5-1) monthly row counts
select period_key, month_num, count(*) as inventory_rows
from inventory_logs
where period_key in (202512, 202601, 202602, 202603)
group by period_key, month_num
order by period_key;

select period_key, month_num, count(*) as transfer_rows
from transfer_logs
where period_key in (202512, 202601, 202602, 202603)
group by period_key, month_num
order by period_key;

-- 5-2) store-month total (physical stock at inventory time)
-- This should be compared against each sheet's store total cells.
select
  il.month_num,
  il.period_key,
  s.store_key,
  sum(
    coalesce(il.tupper_basic, 0)
    + coalesce(il.tupper_reserve, 0)
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
    + coalesce(il.stock_other, 0)
  ) as total_grams
from inventory_logs il
join stores s on s.id = il.store_id
where il.period_key in (202512, 202601, 202602, 202603)
group by il.period_key, il.month_num, s.store_key
order by il.period_key, s.store_key;

-- 5-3) transfer net delta by store-month (sanity check)
select
  t.period_key,
  t.month_num,
  s.store_key,
  sum(
    case
      when t.dest_store_id = s.id then t.quantity
      when t.from_store_id = s.id then -t.quantity
      else 0
    end
  ) as net_transfer_grams
from transfer_logs t
join stores s on s.id in (t.from_store_id, t.dest_store_id)
where t.period_key in (202512, 202601, 202602, 202603)
group by t.period_key, t.month_num, s.store_key
order by t.period_key, s.store_key;

-- 5-4) unresolved transfer patterns from conversion
select *
from stg_transfer_logs
where comment like 'ambiguous:%'
order by period_key, month_num, recorded_at
limit 200;
