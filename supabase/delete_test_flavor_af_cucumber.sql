-- Test data cleanup: remove test flavor like "AF (Al Fakher) Cucumber"
-- Safe to re-run: delete is idempotent.

begin;

with target_flavor as (
  select f.id
  from flavors f
  join brands b on b.id = f.brand_id
  where (
    b.name ilike 'Al Fakher'
    or b.name ilike 'AF (Al Fakher)'
    or b.short_name ilike 'AF'
  )
    and (
      f.name ilike 'Cucumber'
      or f.name ilike 'AF (Al Fakher) Cucumber'
      or f.name ilike '%Cucumber%'
    )
)
delete from inventory_logs il
where il.flavor_id in (select id from target_flavor);

with target_flavor as (
  select f.id
  from flavors f
  join brands b on b.id = f.brand_id
  where (
    b.name ilike 'Al Fakher'
    or b.name ilike 'AF (Al Fakher)'
    or b.short_name ilike 'AF'
  )
    and (
      f.name ilike 'Cucumber'
      or f.name ilike 'AF (Al Fakher) Cucumber'
      or f.name ilike '%Cucumber%'
    )
)
delete from transfer_logs tl
where tl.flavor_id in (select id from target_flavor);

with target_flavor as (
  select f.id
  from flavors f
  join brands b on b.id = f.brand_id
  where (
    b.name ilike 'Al Fakher'
    or b.name ilike 'AF (Al Fakher)'
    or b.short_name ilike 'AF'
  )
    and (
      f.name ilike 'Cucumber'
      or f.name ilike 'AF (Al Fakher) Cucumber'
      or f.name ilike '%Cucumber%'
    )
)
delete from flavors f
where f.id in (select id from target_flavor);

-- Optional: if brand has no remaining flavors, remove it too.
delete from brands b
where (
    b.name ilike 'Al Fakher'
    or b.name ilike 'AF (Al Fakher)'
    or b.short_name ilike 'AF'
  )
  and not exists (
    select 1
    from flavors f
    where f.brand_id = b.id
  );

-- Verification query (run after COMMIT if needed):
-- select b.name as brand, b.short_name, f.name as flavor
-- from flavors f
-- join brands b on b.id = f.brand_id
-- where (b.name ilike '%fakher%' or b.short_name ilike 'AF')
-- order by b.name, f.name;

commit;
