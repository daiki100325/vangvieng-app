-- Tangiers 250g パッケージの物販数を保存するカラムを追加
-- Tangiers は 100g / 250g の2パターンが存在するため、物販数を別々に記録する
ALTER TABLE flavor_brand_sales
  ADD COLUMN IF NOT EXISTS merch_count_secondary INT NOT NULL DEFAULT 0;
