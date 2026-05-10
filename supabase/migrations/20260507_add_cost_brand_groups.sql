-- ================================================================
-- 原価計算ブランド集約グループ追加
--
-- 背景:
--   エアレジ上では Azure Gold Line / Azure Black Line を区別せず、
--   また Tangiers 4種（Noir / Birquq / Burley / F-Line）も区別せず
--   販売集計しているため、原価計算モードおよびダッシュボードの
--   「実質原価」サブモードではこれらをグループとして扱う。
--   一方、棚卸し入力・補充依頼・移動記録では引き続き個別ブランドを使用する。
--
-- 方針:
--   brands テーブルに is_cost_group / cost_group_id を追加。
--   is_cost_group = TRUE な行が原価計算用の集約ブランド。
--   cost_group_id が設定された個別ブランドは原価計算では非表示となり、
--   集約ブランドの行として集計される。
-- ================================================================

BEGIN;

-- ─── スキーマ変更 ────────────────────────────────────────────────

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS is_cost_group BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS cost_group_id BIGINT REFERENCES brands(id);

-- ─── 集約ブランドを挿入 ────────────────────────────────────────

INSERT INTO brands (name, short_name, is_cost_group)
VALUES ('Azure Gold/Black', 'Azure', TRUE)
ON CONFLICT (name) DO UPDATE SET is_cost_group = TRUE;

INSERT INTO brands (name, short_name, is_cost_group)
VALUES ('Tangiers', 'Tangiers', TRUE)
ON CONFLICT (name) DO UPDATE SET is_cost_group = TRUE;

-- ─── 個別ブランドに cost_group_id を設定 ─────────────────────

UPDATE brands
SET cost_group_id = (SELECT id FROM brands WHERE name = 'Azure Gold/Black')
WHERE name IN ('Azure Gold Line', 'Azure Black Line');

UPDATE brands
SET cost_group_id = (SELECT id FROM brands WHERE name = 'Tangiers')
WHERE name IN ('Tangiers Noir', 'Tangiers Birquq', 'Tangiers Burley', 'Tangiers F-Line');

-- ─── 既存の flavor_brand_sales データを集約ブランドIDへ移行 ──

-- 同一レポート内に複数の個別ブランド行がある場合は合算して挿入
WITH grouped AS (
  SELECT
    fbs.report_id,
    b.cost_group_id AS brand_id,
    SUM(fbs.total_consumption_g) AS total_consumption_g,
    SUM(fbs.merch_count)         AS merch_count,
    MAX(fbs.grams_per_pack)      AS grams_per_pack
  FROM flavor_brand_sales fbs
  JOIN brands b ON fbs.brand_id = b.id
  WHERE b.cost_group_id IS NOT NULL
  GROUP BY fbs.report_id, b.cost_group_id
)
INSERT INTO flavor_brand_sales (report_id, brand_id, total_consumption_g, merch_count, grams_per_pack)
SELECT * FROM grouped
ON CONFLICT (report_id, brand_id) DO UPDATE SET
  total_consumption_g = flavor_brand_sales.total_consumption_g + EXCLUDED.total_consumption_g,
  merch_count         = flavor_brand_sales.merch_count         + EXCLUDED.merch_count;

-- 旧個別ブランドIDで保存されていた行を削除
DELETE FROM flavor_brand_sales fbs
USING brands b
WHERE fbs.brand_id = b.id
  AND b.cost_group_id IS NOT NULL;

COMMIT;
