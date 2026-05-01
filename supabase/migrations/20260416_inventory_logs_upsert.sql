alter table inventory_logs
  add column if not exists updated_at timestamp without time zone;

update inventory_logs
set updated_at = created_at at time zone 'Asia/Tokyo'
where updated_at is null;

delete from inventory_logs a
using inventory_logs b
where a.period_key = b.period_key
  and a.store_id = b.store_id
  and a.flavor_id = b.flavor_id
  and (
    a.created_at < b.created_at
    or (a.created_at = b.created_at and a.id < b.id)
  );

create unique index if not exists inventory_logs_period_store_flavor_uidx
  on inventory_logs (period_key, store_id, flavor_id);

alter table inventory_logs
  alter column updated_at set default (now() at time zone 'Asia/Tokyo');

alter table inventory_logs
  alter column updated_at set not null;
