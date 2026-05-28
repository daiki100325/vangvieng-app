---
tags: [project/v-mint2, type/note]
parent: [[V-MINT2.0/notes/_index]]
---

# V-MINT2.0 — Release plan

## Summary
- Phase 1〜6: **完了** — Supabase 接続確立 → UIパリティ → 基本アプリ実装 → 受け入れ確認
- Phase 7: **完了** — Cost App（`cost_reports` / `flavor_brand_sales` / `drink_orders`）とブランドグループ集約対応
- Phase 8: **完了** — ダッシュボード「実質原価」サブモード実装、Cloudflare 本番切替、既存URLで運用開始

## Context
- 現在は `V-MINT2.0` が本番運用中で、既存 URL で稼働している
- 現フェーズは「移行」ではなく「運用安定化と継続改善」が中心

## Details
- **ローカル優先の開発フロー（本番・Git 反映前）**
  - 接続: `.env.example` をコピーして **プロジェクト直下のファイル** `.env.local` を作成し（フォルダ `.env.local/` ではない）、Supabase の接続値を設定する
  - 開発サーバー: `npm run dev` で動作確認し、修正内容をローカルで検証する
  - プッシュ前ゲート: `npm run build` が通ること、Transfer / Inventory / Request / Dashboard の手動スモークをローカルで済ませてから Git にプッシュする
- 準備:
  - `.env` 設定と Supabase SQL 適用
  - `npm run build` 成功確認
  - `supabase/import_normalized_csv.sql` を使い、`brands.csv` / `flavors.csv` / normalized logs を staging import して再投入できる状態にする
- **完了定義（移行クローズ条件）**
  - エンドユーザー視点で `V-MINT2.0` の UI/操作手順/文言が業務要件どおりである
  - バックエンドは `Supabase` のみで完結し、`src/api.js` は Supabase 専用 API 層として整理されている
  - 主要シナリオの結果（在庫/移動/消費量）が Supabase 上で一貫している
- 機能検証:
  - Transfer 新規銘柄追加（重複チェック・並び順）
  - Inventory タッパー OFF -> DB `NULL`、その他の空入力 -> DB `0`
  - Inventory 途中保存は、入力済み/変更済みフレーバーだけを `inventory_logs` へ `UPSERT` し、同時にブラウザ下書きとしても復元できる
  - Inventory は入力停止後30秒で自動保存され、長時間放置時の欠損を防げる
  - Inventory 未実施月でも `flavors` マスタ基準で全カードが表示される
  - Inventory Step4 の消費量チェックが Supabase でも動作し、マイナス/事務所0以外/500g超を区別して警告する
  - 全モードの対象月プルダウンが「年」「月」に分離され、年は `2025年` から「現在年 + 1年」まで動的表示される
  - 参照・保存は内部的に `period_key` を使い、表示ラベルは `yyyy年mm月` 相当で一貫する
  - Request 全拠点横並び表示
  - Dashboard モードで `在庫量確認` と `棚卸し結果確認` の両サブモードが利用できる
- 移行検証:
  - 2026/04までの CSV 取込（`period_key=YYYYMM` 優先、未設定時は `recorded_at` と `month_num` から補完）
  - normalized CSV はファイル名末尾の `YYYY-MM` を事業月度として解釈し、事前に `period_key=YYYYMM` を列追加してから staging import する
  - `brand_name` は `brands.name` と `short_name + ' (' + name + ')'` の両形式で import SQL 側が解決できる状態を保つ
  - transfer 生CSVでは `(n)` イベント番号が無い右端補正列（廃棄を含む）が存在し得るため、正規化時は右端4列ブロックの非ゼロ値も抽出対象にする
  - transfer 生CSVでは月によってイベント見出しが `MM/DD` のみになるため、正規化時は `(n)` 形式と `MM/DD` 形式の両方をイベント開始列として扱う
  - 件数一致 + 主要銘柄サンプル照合
- **Phase 4〜6 実施内容（2026-04-15 更新）**
  - Phase 4:
    - `src/App.vue` を現行相当に揃える（PIN/Portal/History/Confirm/BrandFilter/Footer）
    - `src/components/common/*` と `src/components/PortalMenu.vue` を移植
    - `index.html` / `src/style.css` / `favicon.png` を現行同等に同期
  - Phase 5:
    - `src/components/apps/*.vue`（Inventory/Transfer/Request/Dashboard）を Supabase 前提で整備
    - `supabase/rpc.sql` に Transfer 一覧/未検品/明細/廃棄明細/検品完了 RPC を追加
    - `src/api.js` で Transfer 系レスポンス整形、検品完了 RPC 呼び出し、`flavor_id` マッピングを整合
    - Dashboard 向け RPC を追加し、拠点別在庫と棚卸し結果詳細を参照できるようにする
  - Phase 6:
    - ローカルで Supabase 前提の受け入れ確認を完了する
    - 受け入れチェックリスト完了後に Git へ反映し、Cloudflare 切替判断へ進む
- **受け入れチェックリスト（切替前ゲート）**
  - Portal → 各アプリ遷移（戻る/ブラウザバック/確認ダイアログ）が現行同等
  - Transfer: 入荷・移動・廃棄・検品・履歴展開（コメント含む）が再現
  - Inventory: 保存・再読込・`NULL` タッパー挙動・消費量確認（マイナス/事務所0以外/500g超）が一致
  - Request/Dashboard: ブランドフィルタ・数量表示・並び順が一致
  - ゴールデンテストSQLで `prev_month_stock_grams / march_net_transfer_grams / march_stock_grams / consumption_from_prev_month_grams` が一貫する
- **Phase 7 実施内容（2026-05）**
  - `cost_reports` / `flavor_brand_sales` / `drink_orders` テーブル作成（`supabase/cost_calculation.sql`）
  - `brands` テーブルへ `is_cost_group` / `cost_group_id` 追加（migration 20260507）
  - `flavor_brand_sales` へ `merch_count_secondary` 追加（migration 20260507）
  - `CostApp.vue` 実装: シーシャ入力・ドリンク随時入力・原価計算プレビュー・保存
  - `src/api.js` に Cost App API 群追加（`getBrandsForCost` / `getCostReport` / `upsertCostReport` / `saveBrandSales` / `getBrandConsumptionForCost` / `addDrinkOrder` 等）
- **Phase 8 完了チェックリスト（実績）**
  - [x] ダッシュボード「実質原価」サブモード（推移グラフ・サマリーテーブル）
  - [x] `getCostReportHistory` を Dashboard に接続
  - [x] 受け入れチェックリスト完了（`V-MINT2.0_test-plan_cost_calculation.md`）
  - [x] `npm run build` 成功確認
  - [x] Cloudflare 切替判断・本番反映
- **運用フェーズ実績（2026-05）**
  - 2026-05-12: `AdminApp` に `パッケージサイズ設定` サブモード追加、管理者専用 PIN 認証（`AdminPinAuth.vue`）導入
  - 2026-05-13: `cost_price_masters` 導入（単位原価・販売値の単一情報源化）
  - 2026-05-17: 全テーブル RLS 有効化（Option A: anon 全許可）、`AdminApp` の単位原価セクションのレイアウト改善
  - 2026-05-23: `cost_reports` の価格6カラムを DROP（snapshot → マスタ参照型への完全移行）
  - 2026-05-25: 棚卸し入力モードの消費量チェックを `pk` 基準に修正、シーシャ販売数項目に ①〜⑤ 付番と算式 UI 表示
  - 2026-05-28: 原価計算モードの対象月デフォルトを店舗別 `cost_reports` 最新 period_key 翌月に変更（自動セット中ロック付き）、ドリンク発注の前月期間チェック導入
- **運用フェーズの次アクション**
  - [ ] 月次運用レビュー（在庫・移動・実質原価の整合）を定例化
  - [ ] 現場向けマニュアルの更新差分を月次で反映
  - [ ] 原価ダッシュボードの表示改善要望を優先度付けしてバックログ化
  - [ ] 店舗別デフォルト月セットの現場運用フィードバック収集
- Source: [[V-MINT2.0/notes/V-MINT2.0_requirements]]

## Related
- [[V-MINT2.0/DECISIONS]]
- [[V-MINT2.0/CHANGELOG_DEV]]
