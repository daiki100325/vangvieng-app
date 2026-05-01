-- Split inventory package columns into merch_* and stock_*.
-- Run this only if your database was created from the old schema.

alter table inventory_logs
  add column if not exists merch_pkg_50 numeric null,
  add column if not exists merch_pkg_100 numeric null,
  add column if not exists merch_pkg_125 numeric null,
  add column if not exists merch_pkg_200 numeric null,
  add column if not exists merch_pkg_250 numeric null,
  add column if not exists merch_pkg_1kg numeric null,
  add column if not exists stock_pkg_50 numeric null,
  add column if not exists stock_pkg_100 numeric null,
  add column if not exists stock_pkg_125 numeric null,
  add column if not exists stock_pkg_200 numeric null,
  add column if not exists stock_pkg_250 numeric null,
  add column if not exists stock_pkg_1kg numeric null,
  add column if not exists stock_other numeric null;

-- Backfill from old columns if they exist.
do $$
begin
  if exists (select 1 from information_schema.columns where table_name='inventory_logs' and column_name='pkg_50') then
    execute '
      update inventory_logs
      set
        merch_pkg_50 = coalesce(merch_pkg_50, pkg_50),
        merch_pkg_100 = coalesce(merch_pkg_100, pkg_100),
        merch_pkg_125 = coalesce(merch_pkg_125, pkg_125),
        merch_pkg_200 = coalesce(merch_pkg_200, pkg_200),
        merch_pkg_250 = coalesce(merch_pkg_250, pkg_250),
        merch_pkg_1kg = coalesce(merch_pkg_1kg, pkg_1kg),
        stock_pkg_50 = coalesce(stock_pkg_50, pkg_50),
        stock_pkg_100 = coalesce(stock_pkg_100, pkg_100),
        stock_pkg_125 = coalesce(stock_pkg_125, pkg_125),
        stock_pkg_200 = coalesce(stock_pkg_200, pkg_200),
        stock_pkg_250 = coalesce(stock_pkg_250, pkg_250),
        stock_pkg_1kg = coalesce(stock_pkg_1kg, pkg_1kg),
        stock_other = coalesce(stock_other, val_other)
    ';
  end if;
end $$;

-- Optional cleanup after full migration:
-- alter table inventory_logs
--   drop column if exists pkg_50,
--   drop column if exists pkg_100,
--   drop column if exists pkg_125,
--   drop column if exists pkg_200,
--   drop column if exists pkg_250,
--   drop column if exists pkg_1kg,
--   drop column if exists val_other;
--
-- If merch_other exists in an intermediate environment:
-- alter table inventory_logs drop column if exists merch_other;
