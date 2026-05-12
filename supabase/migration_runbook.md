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

## 2.1) 単月 `transfer_logs` の差し替え（正規化CSVの再生成 → DB再投入）

生シートを直したあと **特定月の移動だけ**入れ直すときの流れ（例: 2026年3月 = `period_key = 202603`）。

### A. 正規化CSVの再生成

プロジェクトルートで（パスに空白がある場合は引用符で囲む）:

```powershell
python data-migration/convert_transfer_raw_to_normalized.py `
  --input "data-migration/csv/raw/棚卸しまとめ_2026年 - 3月.csv" `
  --output "data-migration/csv/normalized/transfer_logs_2026-03.normalized.csv" `
  --month-num 3 `
  --base-year 2026
```

- 成功時、コンソールに `Events detected:` / `Converted rows:` / `Output:` が出る。
- 既に `transfer_logs_2026-03.normalized.csv` を Excel 等で開いていると **上書き Permission denied** になることがある。その場合は別名で出力してから、エディタを閉じて差し替える（例: `_regenerated` → 本番ファイル名へリネーム）。

### B. Supabase（本番）での差し替え手順

**影響範囲:** `DELETE` は **`period_key = 202603` の移動行を全店舗分**削除する（3月シート由来の移動を月単位で張り直す前提）。

1. **バックアップ（推奨）**  
   SQL Editor で結果をエクスポートするか、例:
   `select * from transfer_logs where period_key = 202603 order by id;`

2. **本番の3月分のみ削除**

```sql
begin;
delete from transfer_logs where period_key = 202603;
commit;
```

3. **staging を空にする**

```sql
truncate table stg_transfer_logs;
```

4. **`transfer_logs_2026-03.normalized.csv` を `stg_transfer_logs` に取り込む**  
   - Supabase Table Editor の **Import** で `stg_transfer_logs` を選び、CSVの列順が `import_normalized_csv.sql` の `stg_transfer_logs` 定義と一致することを確認する。

5. **`import_transfer_logs_from_staging_only.sql` を実行する**（`import_normalized_csv.sql` の **4-2) transfer_logs** と同等）  
   - リポジトリ: `supabase/import_transfer_logs_from_staging_only.sql` を SQL Editor に貼り付けて実行してもよい。  
   - **手前の 3) マスタ upsert は実行しない**（既存 `brands` / `flavors` のまま）。

6. **検証**

```sql
select period_key, count(*) from transfer_logs where period_key = 202603 group by period_key;

-- 事務所 → 馬場2号店（件数の目安用）
select count(*) from transfer_logs t
join stores fs on fs.id = t.from_store_id
join stores ds on ds.id = t.dest_store_id
where t.period_key = 202603 and fs.store_key = 'office' and ds.store_key = 'baba_2nd';
```

7. アプリの **移動記録（3月）** と、必要なら **`fetch_inventory_result_details(202603, 4)` の `transferamount`** を再確認する。

### C. 注意

- `transfer_logs` は **`inventory_logs` と独立**なので、移動だけ差し替えても棚卸し行は触れない。
- `resolved_transfer` の `join brands` / `join flavors` に失敗すると **その行は挿入されない**。取り込み後、正規化CSVに `ambiguous:` が残っていないか・ブランド名が DB の `brands.name` / `short_name` と解決できるかを確認する。

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
