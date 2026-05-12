-- ============================================================
-- transfer_logs のみ: stg_transfer_logs → transfer_logs
-- ============================================================
-- 前提:
--   - `stg_transfer_logs` に取り込む CSV を既に投入済み
--   - 差し替え時は先に本番 `transfer_logs` から対象 `period_key` を DELETE 済み
--   - `brands` / `flavors` / `stores` は既存マスタのまま（本スクリプトでは触らない）
-- ============================================================

with resolved_transfer as (
  select
    s.*,
    b.id as brand_id
  from stg_transfer_logs s
  join brands b
    on b.name = coalesce(
      nullif(btrim(substring(s.brand_name from '\(([^)]*)\)')), ''),
      btrim(s.brand_name)
    )
    or (
      b.short_name is not null
      and btrim(b.short_name) <> ''
      and b.short_name = coalesce(
        nullif(btrim(substring(s.brand_name from '\(([^)]*)\)')), ''),
        btrim(s.brand_name)
      )
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
