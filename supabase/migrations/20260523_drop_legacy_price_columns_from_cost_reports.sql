-- ==========================================================================
-- cost_reports の価格カラム（レガシー snapshot）を削除
-- ==========================================================================
-- 案A 採用により、価格は cost_price_masters を effective_from で参照する方式に統一。
-- cost_reports 側の価格カラムは参照されなくなるため削除する。
-- 事前条件: アプリ側で price_* カラムの read/write が全廃済みであること。

ALTER TABLE cost_reports
  DROP COLUMN IF EXISTS price_flavor_per_g,
  DROP COLUMN IF EXISTS price_charcoal_per_kg,
  DROP COLUMN IF EXISTS price_hookah_first,
  DROP COLUMN IF EXISTS price_hookah_refill,
  DROP COLUMN IF EXISTS price_hookah_staff,
  DROP COLUMN IF EXISTS price_charge;
