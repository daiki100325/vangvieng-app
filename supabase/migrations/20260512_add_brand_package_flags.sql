-- brandsテーブルにパッケージサイズフラグを追加
alter table brands
  add column if not exists has_pkg_50          boolean not null default false,
  add column if not exists has_pkg_100         boolean not null default false,
  add column if not exists has_pkg_125         boolean not null default false,
  add column if not exists has_pkg_200         boolean not null default false,
  add column if not exists has_pkg_250         boolean not null default false,
  add column if not exists has_pkg_1kg         boolean not null default false,
  add column if not exists packages_configured boolean not null default false;

-- 既存ブランドのバックフィル（nameカラムは正式名称のみ）
update brands set packages_configured=true, has_pkg_50=true,  has_pkg_250=true  where name = 'Al Fakher';
update brands set packages_configured=true, has_pkg_50=true,  has_pkg_250=true  where name = 'Afzal';
update brands set packages_configured=true, has_pkg_100=true                    where name = 'Azure Gold Line';
update brands set packages_configured=true, has_pkg_100=true                    where name = 'Azure Black Line';
update brands set packages_configured=true, has_pkg_50=true                     where name = 'Debaj';
update brands set packages_configured=true, has_pkg_100=true                    where name = 'Fumari';
update brands set packages_configured=true, has_pkg_100=true                    where name = 'Hookafina';
update brands set packages_configured=true                                       where name = 'Musthave';
update brands set packages_configured=true, has_pkg_100=true, has_pkg_250=true  where name = 'Starbuzz/Bold';
update brands set packages_configured=true, has_pkg_100=true, has_pkg_250=true, has_pkg_1kg=true where name = 'Social Smoke';
update brands set packages_configured=true, has_pkg_100=true, has_pkg_250=true  where name = 'Trifecta';
update brands set packages_configured=true, has_pkg_100=true, has_pkg_250=true  where name = 'Tangiers Noir';
update brands set packages_configured=true, has_pkg_100=true, has_pkg_250=true  where name = 'Tangiers Burley';
update brands set packages_configured=true, has_pkg_100=true, has_pkg_250=true  where name = 'Tangiers Birquq';
update brands set packages_configured=true, has_pkg_100=true, has_pkg_250=true  where name = 'Tangiers F-Line';
update brands set packages_configured=true, has_pkg_50=true                     where name = 'Al Waha Elite Edition';
update brands set packages_configured=true, has_pkg_50=true                     where name = 'Dozaj';
update brands set packages_configured=true, has_pkg_50=true                     where name = 'Gixom';
update brands set packages_configured=true, has_pkg_50=true                     where name = 'Revoshi';
update brands set packages_configured=true, has_pkg_50=true, has_pkg_200=true   where name = 'Fantasia';
update brands set packages_configured=true, has_pkg_50=true, has_pkg_250=true   where name = 'Mazaya';
