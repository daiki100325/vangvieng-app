---
tags: [project/project-slug, type/note]
parent: [[PROJECT/notes/_index]]
---

# PROJECT — Release plan

## Summary
- Phase 1: 開発環境（V-MINT2.0）で Supabase 接続を成立
- Phase 2: 重点機能と Dashboard モードの挙動を検証
- Phase 3: CSV移行リハーサル後に段階的切替判断
- Phase 4: V-MINT と同一のアプリシェル/UI（PIN・ポータル・ヘッダー/フッター・ブランドシート）を実装
- Phase 5: 4アプリ + Dashboard を Supabase RPC で完結
- Phase 6: Supabase 前提の受け入れ確認を完了し、本番切替可否を判定

## Context
- 現行運用版は `V-MINT` のまま維持する必要がある
- 先に環境分離と回帰検証を固定しないと業務影響リスクが高い

## Details
- **ローカル優先の開発フロー（本番・Git 反映前）**
  - 接続: `.env.example` をコピーして **プロジェクト直下のファイル** `.env.local` を作成し（フォルダ `.env.local/` ではない）、Supabase の接続値を設定する
  - 開発サーバー: `npm run dev` で動作確認（本番切替・Cloudflare は後フェーズ）
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
- Source: [[PROJECT/notes/PROJECT_requirements]]

## Related
- [[PROJECT/DECISIONS]]
- [[PROJECT/CHANGELOG_DEV]]
