# CHANGELOG_DEV

## 2026-05-10（data-migration: 5月CSVの変換仕様を修正）

- What:
  - `convert_transfer_raw_to_normalized.py` を修正し、移動記録列 `CW〜HL` を 4列1ブロックで固定解釈。各ブロックの **左から3列目・1行目** の値を `comment` として出力するよう変更
  - `convert_inventory_raw_to_normalized.py` / `convert_transfer_raw_to_normalized.py` にブランド名抽出を追加し、`AZR GOLD (Azure Gold Line)` のような値を `Azure Gold Line` に正規化
  - `supabase/import_normalized_csv.sql` のブランド解決を更新し、括弧内正式名称（および短縮名）を解決可能にして CSV 正規化ルールと整合
  - 上記修正で `inventory_logs_2026-05.normalized.csv` / `transfer_logs_2026-05.normalized.csv` を再生成
- Why: 5月の raw 仕様（4列ブロックコメント）と Supabase のブランド管理（正式名称 + short_name）に合わせて、変換結果と取り込みSQLの不整合を解消するため
- Files:
  - `data-migration/convert_inventory_raw_to_normalized.py`
  - `data-migration/convert_transfer_raw_to_normalized.py`
  - `data-migration/csv/normalized/inventory_logs_2026-05.normalized.csv`
  - `data-migration/csv/normalized/transfer_logs_2026-05.normalized.csv`
  - `supabase/import_normalized_csv.sql`
  - `supabase/migration_runbook.md`
  - `notes/V-MINT2.0_architecture.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_architecture]]

## 2026-05-10（docs: 基本ノートファイル名を V-MINT2.0_ プレフィックスに統一）

- What: `notes/PROJECT_*.md` を `notes/V-MINT2.0_*.md` にリネームし、Vault 内リンク・見出し・フロントマタ（tags/parent）・`TROUBLESHOOTING` の `[[PROJECT/...]]` を `V-MINT2.0` パスに合わせて更新した
- Why: プロジェクト識別子をファイル名とタイトルで一貫させ、Obsidian のリンク切れとテンプレート用 `PROJECT` 残りを解消するため
- Files:
  - `notes/V-MINT2.0_*.md`（旧 `PROJECT_*.md` 全13件）
  - `notes/_index.md`, `DECISIONS.md`, `TROUBLESHOOTING.md`, `CHANGELOG_DEV.md`, `notes/schema-review-QA_20260509.md`
  - ノートのフロントマタ（`project/v-mint2` / `parent`）を更新した各 `notes/V-MINT2.0_*.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_architecture]]

## 2026-05-09（docs: テーブル設計 Q&A ドキュメント作成）

- What: 上司からのテーブル設計レビューコメントに対する回答ドキュメントを作成
- Why: BRANDS パッケージサイズ管理・period_key の役割・tupper フィールド増設・EAV 構成比較・メニュー機能追加案など、今後の実装判断に影響する論点を整理・記録するため
- Files:
  - `notes/schema-review-QA_20260509.md` — 新規作成
  - `notes/_index.md` — リンク追加
- Related: [[V-MINT2.0/notes/V-MINT2.0_architecture]], [[V-MINT2.0/notes/schema-review-QA_20260509]]

## 2026-05-09（docs: architecture.md を現行実装に同期・可読性改善）

- What: `notes/V-MINT2.0_architecture.md` を現行実装と照合し、抜け漏れ修正と読みやすさ向上
- Why:
  - AdminApp（管理者画面）が実装済みだがドキュメントに未記載だった
  - アプリ数が「5つ」と誤記されており、実際は6つ（Admin追加後）
  - Dashboard の3つ目のサブモード「実質原価（cost）」が未記載だった
  - `src/utils/periods.js`, `src/constants/inventoryPackageRules.js` が未記載だった
  - 共通コンポーネント群（PinAuth / AppFooter / BrandFilterSheet / ConfirmDialog / LoadingOverlay）が未記載だった
  - `StockApp.vue` の未使用状態を明記した
  - 全体を表・セクション分けで読みやすく再構成
- Files:
  - `notes/V-MINT2.0_architecture.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_architecture]]

## 2026-05-08（docs: notes更新 — Cost App反映・PLACEHOLDERクリーンアップ）

- What: notes配下ドキュメントを現行実装に合わせて一括更新
- Why:
  - Cost App（原価計算）が実装済みだが notes に記載がなかった
  - `PROJECT` プレースホルダが tags・見出し・内部リンクに残っており Obsidian リンクが機能していなかった
- Files:
  - `notes/_index.md` — タグ/タイトル/リンクを `V-MINT2.0` に修正、Cost App関連notesリンク追加、Weekly Review更新
  - `notes/V-MINT2.0_architecture.md` — タグ/見出し/リンク修正、CostApp.vue コンポーネント記述追加、`cost_reports`/`flavor_brand_sales`/`drink_orders` テーブル記述追加、`brands.is_cost_group`/`cost_group_id` 追加、Cost App API一覧追加
  - `notes/V-MINT2.0_requirements.md` — タグ/見出し/リンク修正、原価計算要件セクション追加
  - `notes/V-MINT2.0_release-plan.md` — タグ/見出し/リンク修正、Phase 7（Cost App）を完了記録、Phase 8（実質原価ダッシュボード等）を次フェーズとして追加
- Related: [[V-MINT2.0/notes/V-MINT2.0_architecture]]

## 2026-04-30（移動記録「修正」サブモード追加）
- What:
  - 移動記録トップに `修正` サブモードを追加し、対象月の既存記録から修正対象を選択できるようにした
  - 修正画面（`transferStep = '1c'`）を追加し、数量変更・行削除・銘柄追加を実装した
  - 保存処理を `amend_transfer_record` RPC に集約し、同一記録ブロックを UPDATE/DELETE/INSERT で上書き可能にした
  - フッターに `修正を保存` アクションを追加し、`App.vue` の遷移制御と連携した
- Why:
  - 既に記録済みの移動記録を、安全に確認ダイアログ付きで訂正できるようにするため
- Files:
  - `supabase/rpc.sql`
  - `supabase/migration_runbook.md`
  - `src/api.js`
  - `src/components/apps/TransferApp.vue`
  - `src/components/common/AppFooter.vue`
  - `src/App.vue`
  - `notes/V-MINT2.0_requirements.md`
  - `notes/V-MINT2.0_architecture.md`
  - `DECISIONS.md`
  - `CHANGELOG_DEV.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_requirements]]

## 2026-04-30（全モードの対象月デフォルト）
- What:
  - 棚卸し入力は `transfer_logs` 最新 `period_key` と同月を初期選択
  - 補充依頼・移動記録・ダッシュボード「在庫量」は `inventory_logs` 最新 `period_key` の翌月を初期選択
  - ダッシュボード「棚卸し結果」は `inventory_logs` 最新 `period_key` と同月を初期選択
  - `periods.js` に `getCurrentPeriodKey` / `getNextPeriodKey`、`api.js` に `fetchLatestTransferPeriodKey` / `fetchLatestInventoryPeriodKey` を追加
- Why:
  - 運用上の「いつを見る／入力するか」をポータル入室時に自動で寄せるため
- Files:
  - `src/utils/periods.js`
  - `src/api.js`
  - `src/App.vue`
  - `src/components/apps/TransferApp.vue`
  - `src/components/apps/RequestApp.vue`
  - `src/components/apps/DashboardApp.vue`
  - `notes/V-MINT2.0_requirements.md`
  - `CHANGELOG_DEV.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_requirements]]

## 2026-04-30（棚卸し結果 全体 PASS 記録）
- What:
  - `notes/V-MINT2.0_dashboard-data-verification.md` の B章・Sampling・Record DDV-06〜10・Exit を棚卸し結果 PASS に更新
  - `notes/V-MINT2.0_golden-test-checklist.md` の DASH-06 / DASH-07 を PASS に更新
- Why:
  - 棚卸し結果が正本と整合したことを帳票で完了状態にするため
- Files:
  - `notes/V-MINT2.0_dashboard-data-verification.md`
  - `notes/V-MINT2.0_golden-test-checklist.md`
  - `CHANGELOG_DEV.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_dashboard-data-verification]]

## 2026-04-30（当月消費ハイライトのテスト項目 PASS 記録）
- What:
  - `notes/V-MINT2.0_dashboard-data-verification.md` に B章 step6（拠点別色分け）を追記しチェック済み
  - Record Sheet に DDV-11 を追加し PASS
  - Exit に色分け確認済みを追記
  - `notes/V-MINT2.0_golden-test-checklist.md` に DASH-08 を追加し PASS
- Why:
  - 色分け仕様の検証完了を帳票に残すため
- Files:
  - `notes/V-MINT2.0_dashboard-data-verification.md`
  - `notes/V-MINT2.0_golden-test-checklist.md`
  - `CHANGELOG_DEV.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_dashboard-data-verification]]

## 2026-04-30（棚卸し結果 当月消費量ハイライト追加）
- What:
  - `src/components/apps/DashboardApp.vue` の `棚卸し結果` テーブルで、`当月消費量` のハイライト条件を拠点別に追加
  - `office`: 0以外を赤ハイライト、`office` 以外: マイナスを赤ハイライト、500以上を黄ハイライト
  - `notes/V-MINT2.0_requirements.md` に表示ルールを追記
- Why:
  - 事務所と店舗で異なる異常検知ルールを視覚的に判別しやすくするため
- Files:
  - `src/components/apps/DashboardApp.vue`
  - `notes/V-MINT2.0_requirements.md`
  - `CHANGELOG_DEV.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_requirements]]

## 2026-04-30（在庫量確認 PASS 記録）
- What:
  - `notes/V-MINT2.0_dashboard-data-verification.md` の A章チェック・記録表 DDV-01〜05・Exit の在庫量項目を PASS に更新
  - `notes/V-MINT2.0_golden-test-checklist.md` の DASH-01〜05 を PASS に更新
- Why:
  - 在庫量確認が正本と整合したことを帳票に残し、次工程（棚卸し結果）へ進むため
- Files:
  - `notes/V-MINT2.0_dashboard-data-verification.md`
  - `notes/V-MINT2.0_golden-test-checklist.md`
  - `CHANGELOG_DEV.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_dashboard-data-verification]]

## 2026-04-30
- What:
  - ダッシュボード数値と正本の不一致原因が `transfer_logs` のテストデータ（照合月と異なる `period_key` の移動）であったことを記録
  - `TROUBLESHOOTING.md` に再発防止を追記
- Why:
  - 同種の齟齬を「RPC のバグ」と誤診しないため、データ起因ケースを残すため
- Files:
  - `TROUBLESHOOTING.md`
  - `CHANGELOG_DEV.md`
  - `notes/V-MINT2.0_dashboard-data-verification.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_dashboard-data-verification]]

## 2026-04-28
- What:
  - 移行テスト完了後の機能追加メモとして `notes/V-MINT2.0_post-migration-feature-memo.md` を新規作成
  - 追加予定3機能（`原価入力モード` / ダッシュボード `実質原価` / ダッシュボード `消費量推移`）の草案を記録
  - `notes/_index.md` に新規メモへのリンクを追加
- Why:
  - 移行後の実装着手前に、要件定義の起点となるメモを残して認識齟齬を防ぐため
- Files:
  - `notes/V-MINT2.0_post-migration-feature-memo.md`
  - `notes/_index.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_release-plan]]

- What:
  - 明日移行時の数値照合用に `notes/V-MINT2.0_dashboard-data-verification.md` を新規追加
  - ダッシュボードモードの `在庫量` / `棚卸し結果` を正本データと照合するための事前条件、期待ロジック、確認手順、記録欄を整理
  - `notes/_index.md` に検証ノートへのリンクを追加
- Why:
  - 移行当日にダッシュボード表示値の妥当性を短時間で確認できる、実施用チェックシートを用意するため
- Files:
  - `notes/V-MINT2.0_dashboard-data-verification.md`
  - `notes/_index.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_release-plan]]

- What:
  - `src/components/common/PinAuth.vue` のPIN照合を平文比較から `VITE_PIN_SHA256`（+ `VITE_PIN_SALT`）による SHA-256 照合へ変更
  - PIN認証画面の UI は維持したまま、PC物理キーボード（`0-9`, `Numpad0-9`, `Backspace/Delete`）入力を追加
  - `.env.example` に `VITE_PIN_SHA256` / `VITE_PIN_SALT` を追記
  - `notes/V-MINT2.0_requirements.md` と `DECISIONS.md` をPIN認証方針へ同期
- Why:
  - ロック解除PINの平文ハードコードを除去し、漏えいリスクを下げるため
  - タブレット・PCの両運用で同じPIN入力体験を提供するため
- Files:
  - `src/components/common/PinAuth.vue`
  - `.env.example`
  - `notes/V-MINT2.0_requirements.md`
  - `DECISIONS.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_requirements]]

- What:
  - `在庫量確認` 導線を `ダッシュボードモード` へ置き換え、`DashboardApp.vue` を追加
  - ダッシュボードに `在庫量確認` / `棚卸し結果確認` の2サブモードを実装
  - 在庫量確認サブモードで `総在庫量` / `各拠点在庫` / `前月消費量` の表示と切替チェックボックスを追加
  - 棚卸し結果確認サブモードで、対象月 + 拠点ごとの棚卸し結果一覧と詳細パネルを追加
  - `src/api.js` から `GAS/Supabase` 切替分岐を除去し、Supabase 専用 API 層へ整理
  - `supabase/rpc.sql` に `fetch_dashboard_stock_overview` / `fetch_inventory_result_details` を追加
  - `notes/V-MINT2.0_requirements.md`, `notes/V-MINT2.0_architecture.md`, `notes/V-MINT2.0_release-plan.md`, `notes/V-MINT2.0_golden-test-checklist.md`, `DECISIONS.md` をダッシュボードモード + Supabase 専用前提で更新
  - Dashboard テーブルの sticky ヘッダー位置を調整し、先頭行がヘッダー上部にチラ見えする表示崩れを修正
  - サブモード名を `在庫量` / `棚卸し結果` へ変更
  - `getDashboardStockOverview` / `getInventoryResultDetails` に RPC 未反映環境向けフォールバックを追加
  - `棚卸し結果` テーブルに `タッパー1` / `タッパー2` / `物販` / `在庫` / `前月棚卸し` / `当月移動量` を追加し、`前月消費量` を最右列へ移動
- Why:
  - `V-MINT2.0` を Supabase 専用で運用する前提に合わせ、参照系 UI を単一のダッシュボードへ再編しつつ、API 層の不要な抽象化を解消するため
- Files:
  - `src/App.vue`
  - `src/components/apps/DashboardApp.vue`
  - `src/components/PortalMenu.vue`
  - `src/components/common/AppHeader.vue`
  - `src/components/common/AppFooter.vue`
  - `src/components/common/BrandFilterSheet.vue`
  - `src/api.js`
  - `supabase/rpc.sql`
  - `notes/V-MINT2.0_requirements.md`
  - `notes/V-MINT2.0_architecture.md`
  - `notes/V-MINT2.0_release-plan.md`
  - `notes/V-MINT2.0_golden-test-checklist.md`
  - `DECISIONS.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_architecture]]

## 2026-04-14
- What:
  - `V-MINT2.0` に Vue+Vite の実行骨格を追加
  - `src/api.js` を GAS/Supabase 切替アダプタとして実装
  - Transfer/Inventory/Request/Stock の Supabase 対応最小画面を実装
  - `supabase/schema.sql`, `supabase/rpc.sql`, `supabase/migration_runbook.md` を追加
  - `inventory_logs` のパッケージ列を `merch_*` と `stock_*` に分離し、API/Inventory画面を更新
  - `merch_other` 列を廃止し、`v_current_stock` は `merch_* + stock_* + tupper` 合算へ変更
  - 生CSV（棚卸しまとめ）を `inventory_logs` 正規化形式へ変換するスクリプトを追加（IH〜IK 店舗別完了日対応）
  - 生CSV（棚卸しまとめ）から `transfer_logs` 正規化形式へ変換するスクリプトを追加（CW〜HL対応）
  - 正規化CSVをSupabaseへ投入し、集計照合まで行う `supabase/import_normalized_csv.sql` を追加
  - 既存環境向け `supabase/migrations/20260414_split_merch_stock.sql` を追加
- Why:
  - 現行運用版へ影響を与えず、Supabase 移行を段階実施するため
- Files:
  - `package.json`, `index.html`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`
  - `src/App.vue`, `src/main.js`, `src/style.css`, `src/api.js`
  - `src/components/apps/TransferApp.vue`
  - `src/components/apps/InventoryApp.vue`
  - `src/components/apps/RequestApp.vue`
  - `src/components/apps/StockApp.vue`
  - `src/constants/inventoryPackageRules.js`
  - `supabase/schema.sql`, `supabase/rpc.sql`, `supabase/migration_runbook.md`
  - `supabase/migrations/20260414_split_merch_stock.sql`
  - `src/components/apps/InventoryApp.vue` (物販/在庫分離入力)
  - `src/api.js` (merch/stock分離マッピング)
  - `data-migration/convert_inventory_raw_to_normalized.py`
  - `data-migration/convert_transfer_raw_to_normalized.py`
  - `supabase/import_normalized_csv.sql`
- Related: [[V-MINT2.0/notes/V-MINT2.0_architecture]]

## 2026-04-15
- What:
  - `data-migration/convert_transfer_raw_to_normalized.py` の移動ログ列解析を修正
  - CW〜HL を 4列1ブロック（`office`, `baba_main`, `nakano`, `baba_2nd`）として固定解釈するよう変更
  - ヘッダ1行目の空欄/TRUE混在により `baba_2nd` が欠落するケースを解消
  - `transfer_logs_2025-12.normalized.csv` / `transfer_logs_2026-01.normalized.csv` / `transfer_logs_2026-02.normalized.csv` / `transfer_logs_2026-03.normalized.csv` を再生成
- Why:
  - 一部銘柄で `dest_store_key` が NULL となり、移動量集計と前月消費量検証がずれる不具合を解消するため
- Files:
  - `data-migration/convert_transfer_raw_to_normalized.py`
  - `data-migration/csv/normalized/transfer_logs_2025-12.normalized.csv`
  - `data-migration/csv/normalized/transfer_logs_2026-01.normalized.csv`
  - `data-migration/csv/normalized/transfer_logs_2026-02.normalized.csv`
  - `data-migration/csv/normalized/transfer_logs_2026-03.normalized.csv`
  - `notes/V-MINT2.0_architecture.md`
  - `TROUBLESHOOTING.md`
  - `notes/V-MINT2.0_release-plan.md`（ローカル検証→Git 反映の運用を追記）
  - `.env.local/` フォルダ＋`template.env` を廃止し、Vite が読む **ルートの `.env.local` ファイル**へ移行（手元で実施）
  - `.gitignore` を追加し `.env.local` をコミット対象外に固定
  - `.env.example` に「`.env.local` はプロジェクト直下のファイル」と明記
- Files (追記):
  - `.gitignore`
  - `.env.example`
  - `notes/V-MINT2.0_release-plan.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_architecture]]

## 2026-04-15 (UI parity implementation)
- What:
  - `V-MINT` と同一のアプリシェルへ置換（`src/App.vue`, `components/common/*`, `components/PortalMenu.vue`）
  - 4アプリ（Inventory/Transfer/Request/Stock）を現行同等実装へ移植
  - `index.html` / `src/style.css` / `favicon.png` を現行同等に同期
  - Transfer フロー向け RPC を追加（一覧・未検品一覧・明細・廃棄明細・検品完了）
  - `src/api.js` を補強（Transfer レスポンス整形、検品完了 RPC 呼び出し、`flavor_id` マッピング修正）
  - `notes/V-MINT2.0_release-plan.md` を Phase 4〜6 と受け入れゲートで更新
  - `notes/V-MINT2.0_golden-test-checklist.md` を新規作成（PRODUCT_SPEC準拠の実施チェックシート）
  - `DECISIONS.md` に UI パリティ方針 ADR を追記
- Why:
  - ユーザー体験を現行 `V-MINT` と一致させたまま Supabase へ移行完了するため
- Files:
  - `src/App.vue`, `src/style.css`, `index.html`, `favicon.png`
  - `src/components/common/AppFooter.vue`
  - `src/components/common/AppHeader.vue`
  - `src/components/common/BrandFilterSheet.vue`
  - `src/components/common/ConfirmDialog.vue`
  - `src/components/common/LoadingOverlay.vue`
  - `src/components/common/PinAuth.vue`
  - `src/components/PortalMenu.vue`
  - `src/components/apps/InventoryApp.vue`
  - `src/components/apps/TransferApp.vue`
  - `src/components/apps/RequestApp.vue`
  - `src/components/apps/StockApp.vue`
  - `src/api.js`
  - `supabase/rpc.sql`
  - `notes/V-MINT2.0_release-plan.md`
  - `notes/V-MINT2.0_golden-test-checklist.md`
  - `notes/_index.md`
  - `DECISIONS.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_release-plan]]

## 2026-04-16
- What:
  - ゴールデンテスト識別のため、ロック画面とポータルヘッダーの製品名表示を `V-MINT test` に変更
  - `notes/V-MINT2.0_golden-test-checklist.md` のセッションメタに UI ラベル上書き条件を追記
  - ゴールデンテスト結果として `SHELL-04` / `SHELL-05` / `SHELL-06` を記録し、棚卸し入力モードの商品カード非表示を Defect Log に起票
  - `InventoryApp` / `TransferApp` の送信・確認文言に残っていた `スプレッドシート` 表記を `データベース` 表記へ統一
  - `SHELL-07` を FAIL（文言不一致）で記録し、修正後の再確認待ちとして Defect Log 更新
  - `supabase/schema.sql` に `period_key (YYYYMM)` を追加（`inventory_logs`, `transfer_logs`）
  - `supabase/import_normalized_csv.sql` を更新し、`stg_brands` / `stg_flavors` を追加して `brands.csv` / `flavors.csv` を正本として upsert
  - normalized logs 取込時に `period_key` 優先、未指定時は `recorded_at` + `month_num` から補完するロジックを追加
  - normalized 配下の `inventory_logs_*.normalized.csv` / `transfer_logs_*.normalized.csv` に `period_key` 列を追加し、ファイル名末尾の `YYYY-MM` から `YYYYMM` を事前付与
  - `inventory_logs.template.csv` / `transfer_logs.template.csv` のヘッダも `period_key` を含む形式へ更新
  - `App.vue` でモード遷移時のブランドフィルタ残留を解消し、棚卸し画面で商品カードが0件になる不具合を修正
  - `src/api.js` の保存系処理で `period_key` を導出し、新規 `inventory_logs` / `transfer_logs` 書き込み時にも業務月を保持
  - `supabase/rpc.sql` の `fetch_inventory_sheet_data` を `flavors` マスタ基準へ変更し、未実施月でも棚卸しカードが表示されるよう修正
  - 全モードの対象月選択を `period_key` ベースへ変更し、プルダウン表示を `yyyy年mm月` に統一
  - `supabase/rpc.sql` の参照系関数を `period_key` 引数へ切り替え、Transfer/Request/Stock でも選択月でデータを参照するよう修正
  - 月選択UIを「年」「月」の2プルダウンへ変更し、年は `2025年` から「現在年 + 1年」までを動的表示
  - 棚卸し未実施月では、タッパー存在トグルだけ前月の ON/OFF 状態を引き継ぐよう `fetch_inventory_sheet_data` と `src/api.js` を修正
  - 前月タッパー引き継ぎ判定のSQLを修正し、当月レコードが無い場合に正しく前月の ON/OFF を参照するよう更新
  - Supabase 版 `checkNegativeConsumption` を実装し、Step4 の消費量警告を復旧
  - 消費量警告を「異常値」と「500g超の念のため確認」に分離し、事務所は `0` 以外で警告するルールを明文化
  - 棚卸し保存時の空入力を、タッパーOFFのみ `NULL`・それ以外は `0` として保存するよう `src/api.js` を修正
  - `inventory_logs` を `period_key + store_id + flavor_id` の `UPSERT` 方式へ変更
  - `submitData()` を `upsert(..., { onConflict: 'period_key,store_id,flavor_id' })` に切り替え
  - 未入力の空行は保存対象から除外し、入力済み/変更済みフレーバーだけを `UPSERT` するよう修正
  - `InventoryApp` の途中保存を、Supabase `UPSERT` + `localStorage` 下書き保存の併用に整理
  - `InventoryApp` に入力停止後30秒の自動保存を追加
  - `inventory_logs.updated_at` を追加し、JST で最新保存時刻を確認できるよう修正
  - `TROUBLESHOOTING.md` に重複計上リスクと `UPSERT` 対応を追記
  - `TROUBLESHOOTING.md` に棚卸し画面のブランドフィルタ残留ケースを追加
  - `TROUBLESHOOTING.md` に未実施月の棚卸し0件表示ケースを追加
  - `TROUBLESHOOTING.md` に新規月のタッパートグル全OFFケースを追加
  - `TROUBLESHOOTING.md` に Supabase 版の消費量警告未表示ケースを追加
  - `notes/V-MINT2.0_architecture.md` / `notes/V-MINT2.0_release-plan.md` / `supabase/migration_runbook.md` / `DECISIONS.md` を新方針に同期
- Why:
  - 現行 `V-MINT` と並行検証時に、テスト対象（`V-MINT2.0`）の画面を誤認しないため
  - テスト進捗と未検証理由を同一ドキュメントで追跡できるようにするため
  - Supabase 移行版の実態と UI 文言を一致させ、誤認を防ぐため
  - 業務月が暦月と一致しない運用でも年跨ぎ衝突なくデータを管理するため
  - ゴールデンテストで見つかった Step4 消費量警告の未実装差分を埋めるため
  - 途中保存も Supabase に書き込む要件を満たしつつ、`inventory_logs` のレコード増加と二重計上を抑え、長時間放置時の欠損も防ぐため
- Files:
  - `src/components/common/PinAuth.vue`
  - `src/components/common/AppHeader.vue`
  - `notes/V-MINT2.0_golden-test-checklist.md`
  - `src/components/apps/InventoryApp.vue`
  - `src/components/apps/TransferApp.vue`
  - `supabase/schema.sql`
  - `supabase/import_normalized_csv.sql`
  - `supabase/migration_runbook.md`
  - `data-migration/csv/normalized/inventory_logs_2025-12.normalized.csv`
  - `data-migration/csv/normalized/inventory_logs_2026-01.normalized.csv`
  - `data-migration/csv/normalized/inventory_logs_2026-02.normalized.csv`
  - `data-migration/csv/normalized/inventory_logs_2026-03.normalized.csv`
  - `data-migration/csv/normalized/transfer_logs_2025-12.normalized.csv`
  - `data-migration/csv/normalized/transfer_logs_2026-01.normalized.csv`
  - `data-migration/csv/normalized/transfer_logs_2026-02.normalized.csv`
  - `data-migration/csv/normalized/transfer_logs_2026-03.normalized.csv`
  - `data-migration/csv/normalized/inventory_logs.template.csv`
  - `data-migration/csv/normalized/transfer_logs.template.csv`
  - `src/App.vue`
  - `src/api.js`
  - `src/components/apps/RequestApp.vue`
  - `src/components/apps/TransferApp.vue`
  - `src/components/apps/StockApp.vue`
  - `src/components/apps/InventoryApp.vue`
  - `src/utils/periods.js`
  - `supabase/rpc.sql`
  - `TROUBLESHOOTING.md`
  - `notes/V-MINT2.0_architecture.md`
  - `notes/V-MINT2.0_release-plan.md`
  - `DECISIONS.md`
  - `src/api.js`
  - `src/components/apps/InventoryApp.vue`
  - `notes/V-MINT2.0_requirements.md`
  - `notes/V-MINT2.0_architecture.md`
  - `notes/V-MINT2.0_release-plan.md`
  - `TROUBLESHOOTING.md`
  - `supabase/schema.sql`
  - `DECISIONS.md`
  - `supabase/migrations/20260416_inventory_logs_upsert.sql`
  - `supabase/migration_runbook.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_golden-test-checklist]]

## YYYY-MM-DD
- What:
- Why:
- Files:
- Related: [[V-MINT2.0/notes/<related-note>]]

## 2026-04-28
- What:
  - `data-migration/convert_transfer_raw_to_normalized.py` にフォールバック検出を追加し、`(n)` 番号ヘッダが無い右端4列ブロックも移動イベントとして正規化できるよう修正
  - 補正イベントラベルが `YYYY-MM-DD` 形式のみを持つ場合にも `recorded_at` を正しく埋めるよう日付パーサーを修正（空日付の取込エラー回避）
  - `data-migration/convert_transfer_raw_to_normalized.py` の出力列に `period_key` を追加（`YYYYMM` 固定生成）
  - `data-migration/convert_inventory_raw_to_normalized.py` の出力列にも `period_key` を追加し、4月以降の staging import 形式を `inventory_logs.template.csv` と一致させた
  - `data-migration/convert_transfer_raw_to_normalized.py` を4月形式の生CSV（イベント見出しが `(n)` でなく `MM/DD` のみ）にも対応させた
  - 同日付見出し（例: `03/30`）が複数回出る月でも、各4列ブロックを上書きせず独立イベントとして保持するよう `convert_transfer_raw_to_normalized.py` を修正
  - `supabase/import_normalized_csv.sql` の inventory/transfer insert を更新し、`AF (Al Fakher)` 形式の `brand_name` を `brands.short_name + ' (' + brands.name + ')'` でも解決できるよう修正
  - `data-migration/csv/normalized/inventory_logs_2026-04.normalized.csv` / `transfer_logs_2026-04.normalized.csv` を生成
  - `data-migration/csv/normalized/transfer_logs_2026-03.normalized.csv` を正本CSVから再生成し、右端2件の廃棄（合計 `-600g`）を反映
  - 再生成後の 2026-03 純移動を `+12400g` で確認
- Why:
  - 3月シート右端の補正/廃棄列が旧ロジックで取りこぼされ、`transfer_logs` の純移動が `+13000g` へ過大計上されていたため
  - 4月シートは移動イベント見出しの形式が異なり、既存ロジックでは transfer 正規化が崩れるため
  - 同じ日付ラベルが複数ブロックある4月シートで、辞書キー上書きにより一部 dispose が欠落していたため
  - inventory 側もテンプレートどおり `period_key` を持たせ、月次 import 手順を固定化するため
  - staging CSV の `brand_name` が `短縮名 (正式名)` 形式でも、そのまま本テーブルへ投入できるようにするため
- Files:
  - `data-migration/convert_inventory_raw_to_normalized.py`
  - `data-migration/convert_transfer_raw_to_normalized.py`
  - `supabase/import_normalized_csv.sql`
  - `data-migration/csv/normalized/inventory_logs_2026-04.normalized.csv`
  - `data-migration/csv/normalized/transfer_logs_2026-04.normalized.csv`
  - `data-migration/csv/normalized/transfer_logs_2026-03.normalized.csv`
  - `notes/V-MINT2.0_release-plan.md`
  - `TROUBLESHOOTING.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_golden-test-checklist]]

## 2026-04-20
- What:
  - `TransferApp` の Arrival「新規銘柄を追加」UIで、ブランド「その他」選択時の入力欄を1つから2つに分割（`ブランド略称` / `ブランド正式名称`）
  - 入力規則を分離し、略称は「大文字アルファベット + 半角スペース」、正式名称は「各単語の頭文字のみ大文字 + 半角スペース」にバリデーションを変更
  - `addFlavorForArrival` 呼び出し時に `brandShortName` / `brandFormalName` をAPIへ渡すよう更新
  - `src/api.js` の Supabase 保存処理を更新し、`brands.name` に正式名称、`brands.short_name` に略称を保存するよう修正
  - `fetch_request_inventory_data` を要件どおり「前月棚卸し + 当月移動（status=completed のみ）」計算へ調整
  - `fetch_transfer_flavors` も同一ルールに統一し、移動記録（起票/入荷/廃棄）入力画面の各拠点在庫を「前月棚卸し + 当月移動（status=completed のみ）」で表示するよう変更
  - `fetch_transfer_flavors` / `fetch_request_inventory_data` の移動反映ロジックを修正し、移動先・移動元を別行で集計するよう変更（同時に全店舗×全フレーバーを基底にして、前月在庫0店舗にも completed 移動を反映）
  - `fetch_stock_overview` も同一ロジックへ統一し、在庫量確認の集計を「前月棚卸し + 当月completed移動（全拠点合算）」に変更
  - `src/api.js` の `getStockOverview` で RPC レスポンスのキー整形を追加（`rowindex/totalstock` などを UI 期待の `rowIndex/totalStock` へマッピング）
  - `fetch_stock_overview` に前月消費量算出ロジックを追加（対象月の前月について、`前々月棚卸し + 前月completed移動 - 前月棚卸し` を全拠点合算）
  - `TransferApp` の履歴ルート表示で `baba_main` を `馬場本店` として表示するよう店舗名マッピングを補正
  - `RequestApp` / `TransferApp` の在庫カード内拠点ラベルを正式表記に統一（`本店`→`馬場本店`, `2号店`→`馬場2号店`, `中野`→`中野店`）
  - `TransferApp` の送信後処理を調整し、同月選択を維持したまま移動記録一覧を再取得するよう修正
- Why:
  - Arrival の新規ブランド追加でブランド名が「略称 + (正式名称)」文字列として保存され、既存ブランド表示（正式名称）と不整合になる不具合を解消するため
  - Request/Transfer 在庫表示を「pending を除外し completed のみ反映」という最終要件に合わせ、起票直後の在庫表示が変わらない仕様へ統一するため
  - 前月在庫が0の店舗へ移動したケースで在庫が更新されない不具合（例: Earlgrey 事務所→本店 2000g）を解消するため
  - Stock 一覧が期待在庫で表示されない不具合を解消し、Request/Transfer/Stock の在庫計算基準を一致させるため
  - Stock 画面で一覧が空白表示になるケースを防ぎ、Supabase RPC 応答を UI 表示フォーマットに揃えるため
  - Stock 画面の前月消費量が全0表示となる不具合を解消し、期待する月次推移確認を可能にするため
  - 履歴展開で DBキーが露出する表示不整合（`baba_main`）を解消し、店舗名表記を UI 要件に合わせるため
  - 補充依頼モードおよび移動記録モード（起票/入荷/廃棄）の在庫表示ラベルをユーザー向け正式名称に統一するため
- Files:
  - `src/components/apps/TransferApp.vue`
  - `src/components/apps/RequestApp.vue`
  - `src/api.js`
  - `src/api.js`
  - `supabase/rpc.sql`
  - `src/components/apps/TransferApp.vue`
  - `notes/V-MINT2.0_golden-test-checklist.md`
- Related: [[V-MINT2.0/notes/V-MINT2.0_golden-test-checklist]]

## YYYY-MM-DD
- What:
- Why:
- Files:
- Related:
