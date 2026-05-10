---
tags: [project/v-mint2, type/note]
parent: [[V-MINT2.0/notes/_index]]
---

# V-MINT2.0 — アーキテクチャ

## 概要

Vue 3 SPA（Vite + Tailwind CSS）と Supabase を組み合わせたフルスタック構成。GAS 依存はなく、すべての API 呼び出しは `src/api.js` 経由で Supabase RPC / クエリに直結している。

ポータル画面から **6つのアプリ** を起動できる。

| アプリ | ルートキー | 概要 |
|---|---|---|
| 棚卸し入力 | `inventory` | 月末棚卸し結果の入力・途中保存・送信 |
| 移動記録 | `transfer` | 店舗間移動の起票・検品・修正 |
| 補充依頼 | `request` | 4拠点横並び在庫確認 + 依頼作成 |
| ダッシュボード | `dashboard` | 在庫量 / 棚卸し結果 / 実質原価の月次確認 |
| 原価計算 | `cost` | シーシャ提供数・物販数・炭消費量・ドリンク発注額の月次入力と計算 |
| 管理者画面 | `admin` | フレーバーマスタの表示制御、新規ブランド・銘柄の登録 |

---

## フロント構成

### エントリポイント

- **`src/App.vue`** — ポータル + 全アプリのシェル。`appMode` ステート切り替えで各アプリを `v-if` マウント。棚卸し入室時は `fetchLatestTransferPeriodKey()` で既定の対象月をセットし、フォールバックは `getCurrentPeriodKey()`（当月）。
- **`src/main.js`** — Vite エントリ。

### アプリコンポーネント（`src/components/apps/`）

- **`InventoryApp.vue`** — タッパー enabled/disabled と NULL マップ、Step4 の消費量警告バナー、途中保存は Supabase UPSERT + `localStorage` 下書き、入力停止30秒で自動保存。事務所は2ステップ（Step 3 → 4）、他店舗は4ステップ。
- **`TransferApp.vue`** — 入荷時の新規銘柄追加（重複検知）と、既存移動記録を同一ブロック単位で編集する `修正` サブモード。
- **`RequestApp.vue`** — 4拠点横並び在庫表示。
- **`DashboardApp.vue`** — サブモード選択 → 対象月選択 → データ表示の親コンテナ。サブモードは以下の3つ:
  - `overview`（在庫量）: 拠点別在庫 + 総在庫 + 前月消費量
  - `results`（棚卸し結果）: 拠点別の棚卸し結果詳細
  - `cost`（実質原価）: 月次原価指標の推移確認
- **`CostApp.vue`** — Step 0（店舗・対象月・サブモード選択）→ Step 1（シーシャ: ブランド別物販個数・フック本数・炭消費量入力 / ドリンク: 発注日・金額・備考の随時追加）→ 計算結果プレビュー・保存。
- **`AdminApp.vue`** — サブモード `flavor-visibility`（フレーバーの表示/非表示を一括 toggle・保存）と `add-flavor`（新規ブランド / 銘柄を `brands` + `flavors` テーブルへ登録）の2メニュー。

> **注意:** `src/components/apps/StockApp.vue` はファイルとして存在するが、現時点で `App.vue` / `DashboardApp.vue` いずれからもインポートされていない未使用コンポーネント。

### 共通コンポーネント（`src/components/common/`）

- **`PinAuth.vue`** — 起動時の PIN 認証オーバーレイ。認証完了まで全画面をブロック。
- **`AppHeader.vue`** — ヘッダー。アプリモード・ステップ・店舗名・対象月を表示し、戻るボタンで `returnToPortal` を呼ぶ。
- **`AppFooter.vue`** — フッターナビゲーション。アプリ・ステップに応じて「前へ / 次へ / 送信」ボタンを切り替え表示。
- **`BrandFilterSheet.vue`** — 画面下部からせり上がるブランドフィルター FAB + シート。棚卸し / 補充依頼 / 移動記録 / ダッシュボードのデータ絞り込みに共用。
- **`ConfirmDialog.vue`** — グローバルな確認ダイアログ。`App.vue` が `provide` で `requestConfirm` を注入し、子コンポーネントから `inject` して呼ぶ。
- **`LoadingOverlay.vue`** — 全画面ローディングオーバーレイ。

### ユーティリティ・定数

- **`src/utils/periods.js`** — `period_key`（`YYYYMM` の数値文字列）に関するユーティリティ群。`parsePeriodKey`, `formatPeriodLabel`, `buildYearOptions`, `buildMonthOptions`, `composePeriodKey`, `getCurrentPeriodKey`, `getNextPeriodKey`, `buildPeriodOptions` を提供。年プルダウンは 2025 年〜現在年+1年を動的生成。
- **`src/constants/inventoryPackageRules.js`** — ブランドごとの物販・在庫グラム区分（50g / 100g / 125g / 200g / 250g / 1kg）を定義。棚卸し入力画面でブランドに合わせた入力欄を出し分けるために使用。

---

## データ層（Supabase）

### 主要テーブル

| テーブル | 役割 |
|---|---|
| `inventory_logs` | 棚卸しスナップショット。`period_key + store_id + flavor_id` で UPSERT。`merch_*`（物販）と `stock_*`（在庫グラム）を分離、計算時は合算。 |
| `transfer_logs` | 店舗間移動記録。`amend_transfer_record` RPC で明細の更新・削除・追加を1トランザクション処理。 |
| `brands` | ブランドマスタ。`is_cost_group`（原価集約フラグ）と `cost_group_id`（集約先ブランドFK）を持つ。Azure Gold / Black Line・Tangiers 各種は各集約ブランドに紐付く。 |
| `flavors` | フレーバーマスタ。`is_active` で表示/非表示を制御。 |
| `cost_reports` | 月次原価計算の本体（`store_id, period_key, start_date, end_date, hookahs_*, charcoal_*, price_*` 等）。 |
| `flavor_brand_sales` | `cost_reports` に紐づくブランド別物販実績。`merch_count`（主サイズ）と `merch_count_secondary`（250g 袋などの2種目）を持つ。 |
| `drink_orders` | 月内複数回のドリンク発注記録（`store_id, period_key, order_date, amount, description`）。 |

### 業務月キー

- `period_key`（`YYYYMM`）で暦月と計上月のずれを表現。`month_num` は互換目的で併存。
- `src/api.js` の保存系 API は選択月と実施日から `period_key` を導出して各テーブルへ書き込む。

### 主要 RPC / View

- `fetch_dashboard_stock_overview` — 在庫量確認の拡張集計
- `fetch_inventory_result_details` — 棚卸し結果確認の詳細指標
- `amend_transfer_record` — 移動記録の修正（自然キーでブロック解決）

### マイグレーション管理

| ファイル | 内容 |
|---|---|
| `supabase/cost_calculation.sql` | `cost_reports`, `flavor_brand_sales`, `drink_orders` の DDL |
| `supabase/migrations/20260507_add_cost_brand_groups.sql` | `brands` への `is_cost_group` / `cost_group_id` カラム追加 |
| `supabase/migrations/20260507_add_merch_count_secondary.sql` | `flavor_brand_sales` への `merch_count_secondary` カラム追加 |
| `supabase/import_normalized_csv.sql` | `brands.csv` / `flavors.csv` を staging 経由でマスタ先行 upsert。`brand_name` は括弧内正式名称を優先して解決（例: `AZR GOLD (Azure Gold Line)` → `Azure Gold Line`）。 |

---

## API 層（`src/api.js`）

Supabase クライアントを直接ラップする関数群。GAS 由来の関数名（`getSheetData` 等）は UI 互換のため維持している。

**Cost App 関連:** `getBrandsForCost`, `getCostReport`, `upsertCostReport`, `saveBrandSales`, `getBrandConsumptionForCost`, `addDrinkOrder`, `updateDrinkOrder`, `deleteDrinkOrder`, `getDrinkOrders`, `getCostReportHistory`

**Admin App 関連:** `getAllFlavorsWithBrand`, `batchUpdateFlavorIsActive`, `addFlavorForArrival`, `listTransferBrandsOrdered`

---

## 主な実装ルール

- 棚卸し空入力の正規化: タッパートグル OFF の項目のみ `NULL`、それ以外は `0` で書き込む
- 棚卸し UPSERT 衝突キー: `period_key + store_id + flavor_id`
- タッパートグルの初期値: 当月レコード未作成の場合のみ前月の ON/OFF を引き継ぐ
- 消費量警告: `checkNegativeConsumption` が前月棚卸し行 + 完了済み移動ログを取得し、未送信の入力値でドライラン計算
- 保存時刻表示: `inventory_logs.updated_at`（JST、`timestamp without time zone`）
- ブラウザバック: `popstate` イベントをインターセプトし「戻るボタン押下」と同等の確認ダイアログを表示

---

## 関連

- Source: [[V-MINT2.0/notes/V-MINT2.0_requirements]]
- [[V-MINT2.0/DECISIONS]]
- [[V-MINT2.0/CHANGELOG_DEV]]
