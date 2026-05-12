create table if not exists stores (
  id bigserial primary key,
  store_key text unique not null,
  name text not null
);

create table if not exists brands (
  id bigserial primary key,
  name text unique not null,
  short_name text,
  has_pkg_50          boolean not null default false,
  has_pkg_100         boolean not null default false,
  has_pkg_125         boolean not null default false,
  has_pkg_200         boolean not null default false,
  has_pkg_250         boolean not null default false,
  has_pkg_1kg         boolean not null default false,
  packages_configured boolean not null default false
);

create table if not exists flavors (
  id bigserial primary key,
  brand_id bigint not null references brands(id),
  name text not null,
  is_active boolean not null default true,
  unique (brand_id, name)
);

create table if not exists inventory_logs (
  id bigserial primary key,
  recorded_at date not null,
  period_key int null,
  month_num int not null,
  store_id bigint not null references stores(id),
  flavor_id bigint not null references flavors(id),
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
  stock_other numeric null,
  created_at timestamptz not null default now(),
  updated_at timestamp without time zone not null default (now() at time zone 'Asia/Tokyo'),
  unique (period_key, store_id, flavor_id)
);

create table if not exists transfer_logs (
  id bigserial primary key,
  period_key int null,
  month_num int not null,
  recorded_at date not null,
  block_index bigint generated always as identity,
  from_store_id bigint null references stores(id),
  dest_store_id bigint null references stores(id),
  flavor_id bigint not null references flavors(id),
  quantity numeric not null default 0,
  status text not null check (status in ('pending', 'completed')),
  comment text null,
  created_at timestamptz not null default now()
);

create or replace view v_current_stock as
with inv as (
  select distinct on (il.store_id, il.flavor_id)
    il.id,
    il.store_id,
    il.flavor_id
  from inventory_logs il
  order by il.store_id, il.flavor_id, il.recorded_at desc, il.created_at desc, il.id desc
),
latest as (
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
  join inv on inv.id = il.id
),
tr as (
  select
    coalesce(dest_store_id, from_store_id) as store_id,
    flavor_id,
    sum(
      case
        when dest_store_id is not null then quantity
        when from_store_id is not null then -quantity
        else 0
      end
    ) as transfer_delta
  from transfer_logs
  where status = 'completed'
  group by coalesce(dest_store_id, from_store_id), flavor_id
)
select
  l.store_id,
  l.flavor_id,
  l.base_stock + coalesce(t.transfer_delta, 0) as current_stock
from latest l
left join tr t on t.store_id = l.store_id and t.flavor_id = l.flavor_id;

create or replace view v_monthly_summary as
select
  period_key,
  month_num,
  store_id,
  flavor_id,
  count(*) as log_count,
  max(recorded_at) as last_recorded_at
from inventory_logs
group by period_key, month_num, store_id, flavor_id;
