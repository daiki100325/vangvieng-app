-- ==========================================================================
-- 単位原価・販売値マスタテーブルの追加
-- ==========================================================================
-- 価格改定を effective_from (YYYYMM) で管理するテーブル。
-- 指定 period_key に対して effective_from <= period_key の最大レコードを適用する。

CREATE TABLE IF NOT EXISTS cost_price_masters (
  id bigserial PRIMARY KEY,
  effective_from int NOT NULL,              -- YYYYMM (適用開始月)
  price_flavor_per_g numeric NOT NULL,     -- フレーバー原価 (円/g)
  price_charcoal_per_kg numeric NOT NULL,  -- 炭原価 (円/kg)
  price_hookah_first int NOT NULL,         -- 1本目料金 (円)
  price_hookah_refill int NOT NULL,        -- おかわり料金 (円)
  price_hookah_staff int NOT NULL,         -- スタッフ料金 (円)
  price_charge int NOT NULL,               -- チャージ料金 (円)
  note text,                               -- 改定理由メモ
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(effective_from)
);

-- 運用開始時の初期価格（既存 cost_reports の DEFAULT 値と一致）
-- effective_from = 202501 は全過去レコードをカバーする最小値として設定
INSERT INTO cost_price_masters
  (effective_from, price_flavor_per_g, price_charcoal_per_kg,
   price_hookah_first, price_hookah_refill, price_hookah_staff, price_charge, note)
VALUES
  (202501, 40, 600, 1900, 1800, 1800, 900, '運用開始時の初期設定')
ON CONFLICT (effective_from) DO NOTHING;
