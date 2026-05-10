-- ==========================================================================
-- 原価計算機能 テーブル定義
-- ==========================================================================

-- 月次報告テーブル（シーシャ販売数・炭消費量・定数を保持）
CREATE TABLE IF NOT EXISTS cost_reports (
  id bigserial PRIMARY KEY,
  store_id bigint NOT NULL REFERENCES stores(id),
  period_key int NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  -- [2] シーシャ販売数（Airレジから入力）
  hookahs_first int NOT NULL DEFAULT 0,     -- 1本目
  hookahs_charge int NOT NULL DEFAULT 0,    -- チャージ
  hookahs_refill int NOT NULL DEFAULT 0,    -- おかわり
  hookahs_staff int NOT NULL DEFAULT 0,     -- スタッフ
  hookahs_event int NOT NULL DEFAULT 0,     -- イベント等
  -- [4] 炭消費量（kg単位）
  charcoal_nyanco_flat_serve numeric NOT NULL DEFAULT 0,
  charcoal_nyanco_flat_merch numeric NOT NULL DEFAULT 0,
  charcoal_nyanco_cube_merch numeric NOT NULL DEFAULT 0,
  charcoal_kingco_flat_serve numeric NOT NULL DEFAULT 0,
  charcoal_kingco_flat_merch numeric NOT NULL DEFAULT 0,
  charcoal_kingco_cube_merch numeric NOT NULL DEFAULT 0,
  -- [0] 定数（価格改定に対応するため保存）
  price_flavor_per_g numeric NOT NULL DEFAULT 40,
  price_charcoal_per_kg numeric NOT NULL DEFAULT 600,
  price_hookah_first int NOT NULL DEFAULT 1900,
  price_hookah_refill int NOT NULL DEFAULT 1800,
  price_hookah_staff int NOT NULL DEFAULT 1800,
  price_charge int NOT NULL DEFAULT 900,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamp WITHOUT TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tokyo'),
  UNIQUE(store_id, period_key)
);

-- ドリンク発注記録テーブル（随時入力）
CREATE TABLE IF NOT EXISTS drink_orders (
  id bigserial PRIMARY KEY,
  store_id bigint NOT NULL REFERENCES stores(id),
  period_key int NOT NULL,
  order_date date NOT NULL,
  amount int NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ブランド別フレーバー消費量・物販数テーブル
CREATE TABLE IF NOT EXISTS flavor_brand_sales (
  id bigserial PRIMARY KEY,
  report_id bigint NOT NULL REFERENCES cost_reports(id) ON DELETE CASCADE,
  brand_id bigint NOT NULL REFERENCES brands(id),
  total_consumption_g int NOT NULL DEFAULT 0,  -- 総消費量（提供+物販）
  merch_count int NOT NULL DEFAULT 0,           -- 物販個数
  grams_per_pack numeric NOT NULL DEFAULT 50,  -- 1パケあたりグラム数
  UNIQUE(report_id, brand_id)
);

-- RLS は既存テーブルと同じポリシーに従い、必要に応じて別途設定すること
