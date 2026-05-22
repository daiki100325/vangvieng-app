-- RLS 有効化（Option A: anon に全操作を許可）
-- URL非公開・信頼ユーザー前提の内部ツール向け設定
-- すべてのテーブルで警告を解消しつつ既存動作を維持する

-- stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON stores FOR ALL TO anon USING (true) WITH CHECK (true);

-- brands
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON brands FOR ALL TO anon USING (true) WITH CHECK (true);

-- flavors
ALTER TABLE flavors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON flavors FOR ALL TO anon USING (true) WITH CHECK (true);

-- inventory_logs
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON inventory_logs FOR ALL TO anon USING (true) WITH CHECK (true);

-- transfer_logs
ALTER TABLE transfer_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON transfer_logs FOR ALL TO anon USING (true) WITH CHECK (true);

-- cost_reports
ALTER TABLE cost_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON cost_reports FOR ALL TO anon USING (true) WITH CHECK (true);

-- drink_orders
ALTER TABLE drink_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON drink_orders FOR ALL TO anon USING (true) WITH CHECK (true);

-- flavor_brand_sales
ALTER TABLE flavor_brand_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON flavor_brand_sales FOR ALL TO anon USING (true) WITH CHECK (true);

-- cost_price_masters
ALTER TABLE cost_price_masters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON cost_price_masters FOR ALL TO anon USING (true) WITH CHECK (true);
