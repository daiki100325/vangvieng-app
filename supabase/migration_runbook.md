# Supabase Migration Runbook

## 1) 手作業セットアップ
- Supabase プロジェクト作成
- SQL Editor で `supabase/schema.sql` → `supabase/rpc.sql` の順に実行
- 既存環境を更新する場合は `supabase/migrations/20260414_split_merch_stock.sql` を実行
- 既存環境で移動記録「修正」機能を有効化する場合は、最新の `supabase/rpc.sql` を再実行して `amend_transfer_record` を反映
- `stores` 初期値を投入
  - `office`, `baba_main`, `nakano`, `baba_2nd`
- RLS を有効化し、開発時は anon role に select/insert/update を付与

## 2) 既存データ（〜2026/04）移行
- スプレッドシートから CSV エクスポート
- 店舗キー `baba` を `baba_main` に変換
- `brands` と `flavors` を先に投入し、`inventory_logs` を後投入
- `transfer_logs` は pending/completed を保持したまま投入
- `inventory_logs.csv` は物販と在庫を分離して準備
  - 物販: `merch_pkg_50, merch_pkg_100, merch_pkg_125, merch_pkg_200, merch_pkg_250, merch_pkg_1kg`
  - 在庫: `stock_pkg_50, stock_pkg_100, stock_pkg_125, stock_pkg_200, stock_pkg_250, stock_pkg_1kg, stock_other`
- 生CSV（棚卸しまとめ）からの変換:
  - `python data-migration/convert_inventory_raw_to_normalized.py --input <raw.csv> --output <normalized.csv> --recorded-at YYYY-MM-DD --month-num M`
  - `recorded_at` は棚卸し完了日列（IH〜IK、店舗別）を優先し、空欄行は `--recorded-at` を使用
  - ブランド名は `AZR GOLD (Azure Gold Line)` のような表記から、`Azure Gold Line`（括弧内の正式名称）を `brand_name` に採用
- `transfer_logs` 生CSV変換:
  - `python data-migration/convert_transfer_raw_to_normalized.py --input <raw.csv> --output <normalized.csv> --month-num M --base-year YYYY`
  - 移動記録列（CW〜HL, 120列）を 4列1ブロック（事務所/本店/中野店/馬場2）として解析し、from/dest/quantity を推定
  - 各ブロックのコメントは「左から3列目の1行目」セル値を `comment` に採用
- Supabase取り込み:
  - `supabase/import_normalized_csv.sql` を使用
  - staging (`stg_brands`, `stg_flavors`, `stg_inventory_logs`, `stg_transfer_logs`) にCSVをImport後、master upsert + transactional insertを実行
  - マスタは `data-migration/csv/normalized/brands.csv` / `data-migration/csv/normalized/flavors.csv` を正本として取り込む
  - ログCSVは `period_key (YYYYMM)` 列を優先し、未指定時は `recorded_at` と `month_num` から補完される
  - 同ファイル末尾の検証クエリでスプレッドシート集計セルと照合

## 3) 検証チェックリスト
- 件数一致
  - 月別・店舗別 `inventory_logs` 件数
  - `transfer_logs` 件数
- サンプル比較
  - 主要3銘柄で在庫量と直近棚卸し値を GAS と比較
- 動作確認
  - Transfer: 新規銘柄追加の重複チェック
  - Inventory: タッパー「なし(-)」→ DB `NULL`
  - Request: 4拠点横並び表示
  - Inventory: `20260416_inventory_logs_upsert.sql` を適用し、重複行を整理して `(period_key, store_id, flavor_id)` の一意インデックスを作成する
