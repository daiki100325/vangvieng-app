---
tags: [project/project-slug, type/note]
parent: [[PROJECT/notes/_index]]
---

# PROJECT — Requirements

## Summary
- 現行 `V-MINT` の運用知見を踏まえつつ、`V-MINT2.0` は Supabase 専用バックエンドで実装する。
- フロントの公開 API 名は維持するが、内部実装は Supabase RPC / query のみを前提とする。
- 重点実装は Transfer新規銘柄追加、Inventory タッパーNULL対応、Request の全拠点横並び表示、Dashboard モード追加。

## Context
- `V-MINT/src/api.js` の既存インターフェースに依存した Vue コンポーネントが稼働中。
- Supabase はアカウント取得済みだが、テーブル・View・RPC は未作成。
- 本番運用影響回避のため、作業は `V-MINT2.0` ディレクトリのみで実施。

## Details
- **対象月のデフォルト（初期選択）** — DB に該当データがない場合はカレンダー当月／翌月でフォールバックする。
  - 棚卸し入力: `transfer_logs` の **最大** `period_key` と同じ月
  - 補充依頼・移動記録・ダッシュボード「在庫量」: `inventory_logs` の **最大** `period_key` の **翌月**
  - ダッシュボード「棚卸し結果」: `inventory_logs` の **最大** `period_key` と同じ月
- `V-MINT` は本番維持、`V-MINT2.0` は Supabase 専用の独立実装として進める。
- 環境変数:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - `VITE_PIN_SHA256`, `VITE_PIN_SALT`
- DB要件:
  - `stores`, `brands`, `flavors`, `inventory_logs`, `transfer_logs`
  - `v_current_stock`, `v_monthly_summary`
  - 店舗キーは `baba` を `baba_main` に統一
  - `inventory_logs` のパッケージ数量は物販 (`merch_*`) と在庫 (`stock_*`) を分離保持（`merch_other` は持たない）
  - 在庫算出は物販と在庫を合算して扱う
- ダッシュボード要件:
  - ポータルの `在庫量確認` 導線は `ダッシュボードモード` に置き換える
  - ダッシュボードは `在庫量確認` と `棚卸し結果確認` の2サブモードを持つ
  - `在庫量確認` サブモードは、銘柄ごとに `総在庫量`、`各拠点在庫`、`前月消費量` を表示する
  - `各拠点在庫` と `総在庫量` は UI 上のチェックボックスで表示/非表示を切り替えられる
  - `棚卸し結果確認` サブモードは、対象月 + 拠点ごとに `当月タッパー`、`当月物販`、`当月在庫`、`当月トータル棚卸し結果`、`前月棚卸し結果`、`前月消費量`、`当月移動量`、`当月消費量` を参照できる
  - `棚卸し結果確認` の `当月消費量` は拠点別に強調表示条件を変える（`office`: 0以外は赤、`office` 以外: マイナスは赤、500以上は黄）
- 移動記録要件:
  - `移動記録` は `起票` / `検品` / `入荷` / `廃棄` に加えて `修正` サブモードを持つ
  - `修正` サブモードでは、対象月の既存記録から修正対象を選択し、対象銘柄と数量を更新できる
  - 修正画面では行削除と銘柄追加を許可し、保存時は `transfer_logs` の同一記録ブロックを上書きする
  - 数量変更・行削除・最終保存は確認ポップアップを表示する
- 棚卸し確認要件:
  - 途中保存は `inventory_logs` へ Supabase 書き込みし、同時に `inventory_draft_{store}_{month}` へブラウザ下書きも保存する
  - 途中保存・完了とも、入力済みまたは変更済みのフレーバーだけを `period_key + store_id + flavor_id` 単位で `UPSERT` し、同一フレーバーは常に1レコードへ上書き保存する
  - 棚卸しの保存時刻確認は `inventory_logs.updated_at` を使い、JST で記録する
  - 入力停止後30秒で自動保存し、手動の途中保存と同じく Supabase + `localStorage` へ保存する
  - Step4 の消費量チェックは、`前月棚卸し結果 + 前月移動量 - 当月入力在庫` で判定する
  - 全店舗で消費量がマイナスの銘柄は警告対象とする
  - `office` は消費量が 0 以外の銘柄を警告対象とする
  - 全店舗で消費量が 500g を超える銘柄は、別枠の「念のため確認」警告を表示する
  - `500g超` 判定は銘柄単位・g単位で行う
  - 空入力は、タッパートグルが OFF の項目だけ `NULL`、それ以外は `0` として保存する
- PIN認証要件:
  - ロック解除PINの平文をフロントコードへハードコードしない
  - `VITE_PIN_SHA256`（`SHA-256(${VITE_PIN_SALT}<4桁PIN>)`）との照合で認証する
  - PIN入力UIは現状のテンキーを維持し、PCでは物理キーボード（`0-9`, `Numpad0-9`, `Backspace/Delete`）でも同じ入力操作を受け付ける
- Source: [[_LINEmemo/2026-04-14]]

## Related
- [[PROJECT/DECISIONS]]
- [[PROJECT/CHANGELOG_DEV]]
