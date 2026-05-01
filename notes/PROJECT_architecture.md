---
tags: [project/project-slug, type/note]
parent: [[PROJECT/notes/_index]]
---

# PROJECT — Architecture

## Summary
- `src/api.js` は Supabase RPC / query を呼ぶフロント API 層として整理する。
- Supabase 側は SQL（table/view/rpc）を `supabase/` 配下で管理する。

## Context
- 既存フロントは API 関数名（`getSheetData` 等）への依存が強い。
- UI回帰を最小化するため API名互換を維持しつつ、バックエンド抽象化は撤廃する。

## Details
- フロント構成:
  - `src/App.vue`: 最小ポータル；棚卸し入室時は `fetchLatestTransferPeriodKey()` で既定の対象月をセット（補充・移動・ダッシュボードは各アプリで `inventory_logs` 起点の既定を適用）
  - 月選択UIは「年」「月」の2プルダウンに分離し、年は `2025年` から「現在年 + 1年」までを動的生成する
  - `src/components/apps/InventoryApp.vue`: タッパー enabled/disabled と NULL マップ、Step4 の消費量警告バナー表示、途中保存は Supabase `UPSERT` + `localStorage` 下書き保存、入力停止30秒で自動保存
  - `src/components/apps/TransferApp.vue`: 入荷時新規銘柄追加（重複検知）と、既存移動記録を同一ブロック単位で編集する `修正` サブモード
  - `src/components/apps/RequestApp.vue`: 4拠点横並び在庫表示
  - `src/components/apps/DashboardApp.vue`: 月選択・サブモード切替・ブランドフィルタ連携を持つダッシュボード親コンテナ
  - ダッシュボード配下の `在庫量確認` は拠点別在庫 + 総在庫 + 前月消費量を表示し、`棚卸し結果確認` は拠点別の棚卸し結果詳細を表示する
- データ層:
  - `supabase/schema.sql` でテーブル + View
  - `supabase/rpc.sql` で UI用 RPC
  - `amend_transfer_record` RPC は、既存ブロックを自然キーで解決し、明細行の更新・削除・追加を1トランザクションで反映する
  - `fetch_dashboard_stock_overview` が在庫量確認の拡張集計を返し、`fetch_inventory_result_details` が棚卸し結果確認の詳細指標を返す
  - `inventory_logs` は `merch_*`（物販）と `stock_*`（在庫）を分離し、在庫計算は両方を合算して使用
  - 業務月キーは `period_key`（`YYYYMM`）を追加し、暦月と計上月がずれる運用を表現する（`month_num` は互換のため併存）
  - `src/api.js` の保存系 API は、選択月と実施日から `period_key` を導出して `inventory_logs` / `transfer_logs` に保存する
  - 棚卸し保存時の空入力は、タッパートグル OFF 項目のみ `NULL`、それ以外は `0` に正規化して `inventory_logs` へ書き込む
  - `submitData` は `period_key + store_id + flavor_id` を衝突キーに `UPSERT` し、未入力の空行は除外、入力済み/変更済みフレーバーだけを上書き更新する
  - `inventory_logs` は `period_key + store_id + flavor_id` の一意制約で最新スナップショットを保持する
  - 人が確認する保存時刻は `inventory_logs.updated_at` を用い、JST の `timestamp without time zone` で保持する
  - `src/api.js` の `checkNegativeConsumption` は、前月の最新棚卸し行と前月の完了済み移動ログを取得し、未送信の入力値に対して消費量警告をドライラン計算する
  - 参照系 API / RPC も `period_key` を引数とし、トップ画面の月選択は `yyyy年mm月` ラベルで統一する
  - 棚卸し入力のタッパー存在トグルは、当月レコードが未作成の場合に限り前月の ON/OFF 状態を引き継ぐ
  - `supabase/import_normalized_csv.sql` で `brands.csv` / `flavors.csv` を staging 経由で先行 upsert し、実態マスタを優先投入する
  - `data-migration/convert_transfer_raw_to_normalized.py` は移動ログ領域（CW〜HL）を「4列1ブロック（事務所/本店/中野店/馬場2号店）」として解析し、ヘッダ行の空欄/TRUE混在でも固定順で `from_store_key`/`dest_store_key` を復元する
- Source: [[PROJECT/notes/PROJECT_requirements]]

## Related
- [[PROJECT/DECISIONS]]
- [[PROJECT/CHANGELOG_DEV]]
