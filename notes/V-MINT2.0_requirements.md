---
tags: [project/v-mint2, type/note]
parent: [[V-MINT2.0/notes/_index]]
---

# V-MINT2.0 — Requirements

## Summary
- `V-MINT2.0` は Supabase 専用バックエンドで実装した完全移行版。GAS依存なし。
- フロントの公開 API 名は維持し、内部実装は Supabase RPC / query のみ。
- 6アプリ運用中: Transfer（新規銘柄追加・修正サブモード）、Inventory（タッパーNULL対応・消費量警告）、Request（全拠点横並び）、Dashboard（在庫量・棚卸し結果・実質原価）、Cost（原価計算）、Admin（フレーバー表示設定・パッケージサイズ設定・新規登録）。

## Context
- `V-MINT/src/api.js` の既存インターフェースに依存した Vue コンポーネントが稼働中。
- Supabase のテーブル・View・RPC は本番運用前提で作成済み、`V-MINT2.0` は Cloudflare Pages 本番環境にデプロイ済み。
- 既存 URL を維持したまま `V-MINT2.0` を本番運用し、継続改善は `V-MINT2.0` ディレクトリを起点に行う。

## Details
- **対象月のデフォルト（初期選択）** — DB に該当データがない場合はカレンダー当月／翌月でフォールバックする。
  - 棚卸し入力: `transfer_logs` の **最大** `period_key` と同じ月
  - 補充依頼・移動記録・ダッシュボード「在庫量」: `inventory_logs` の **最大** `period_key` の **翌月**
  - ダッシュボード「棚卸し結果」: `inventory_logs` の **最大** `period_key` と同じ月
- `V-MINT` は本番維持、`V-MINT2.0` は Supabase 専用の独立実装として進める。
- 環境変数:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - `VITE_PIN_SHA256`, `VITE_PIN_SALT`
  - `VITE_ADMIN_PIN_SHA256`（管理者画面専用 PIN のハッシュ。`SHA-256(${VITE_PIN_SALT}<4桁PIN>)` 形式）
- DB要件:
  - `stores`, `brands`, `flavors`, `inventory_logs`, `transfer_logs`
  - `v_current_stock`, `v_monthly_summary`
  - 店舗キーは `baba` を `baba_main` に統一
  - `inventory_logs` のパッケージ数量は物販 (`merch_*`) と在庫 (`stock_*`) を分離保持（`merch_other` は持たない）
  - 在庫算出は物販と在庫を合算して扱う
  - `brands` テーブルはパッケージサイズフラグ（`has_pkg_50/100/125/200/250/1kg`, `packages_configured`）を持ち、棚卸し入力画面の入力欄表示制御に使用
  - `cost_price_masters` テーブルで単位原価・販売値の価格改定を `effective_from`（YYYYMM）単位で管理。原価計算時は該当月以前の最新レコードを自動適用。価格は `cost_reports` に snapshot されず、集計のたびにマスタを参照する（migration 20260523 で snapshot 廃止）
- ダッシュボード要件:
  - ポータルの `在庫量確認` 導線は `ダッシュボードモード` に置き換える
  - ダッシュボードは `在庫量確認` / `棚卸し結果確認` / `実質原価` の3サブモードを持つ
  - `在庫量確認` サブモードは、銘柄ごとに `総在庫量`、`各拠点在庫`、`前月消費量` を表示する
  - `各拠点在庫` と `総在庫量` は UI 上のチェックボックスで表示/非表示を切り替えられる
  - `棚卸し結果確認` サブモードは、対象月 + 拠点ごとに `当月タッパー`、`当月物販`、`当月在庫`、`当月トータル棚卸し結果`、`前月棚卸し結果`、`前月消費量`、`当月移動量`、`当月消費量` を参照できる
  - `棚卸し結果確認` の `当月消費量` は拠点別に強調表示条件を変える（`office`: 0以外は赤、`office` 以外: マイナスは赤、500以上は黄）
  - `実質原価` サブモードは、店舗別に `getCostReportHistory` を参照し、月次推移グラフとサマリーテーブルを表示する
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
  - 管理者画面（`AdminApp`）には別途管理者PIN認証（`AdminPinAuth.vue`）が必要。`VITE_ADMIN_PIN_SHA256` で照合し、セッション中は再入力不要
- 原価計算要件:
  - 対象店舗は馬場本店・中野店・馬場2号店（事務所は除外）
  - `シーシャ` サブモード: 集計期間（開始日・終了日）、フック本数（初回/おかわり/スタッフ/イベント/チャージ）、ブランド別物販個数（`brands.is_cost_group=true` または `cost_group_id IS NULL` のブランドのみ）、炭種別消費量入力
  - `ドリンク` サブモード: 発注日・金額・備考の随時追加・編集・削除（月内複数件可）
  - 計算指標 A〜G: 1本あたりフレーバー使用量(g) / 原価(¥) / 炭使用量(g) / 炭原価(¥) / 1人あたりドリンク代(¥) / 1人あたりシーシャ本数 / 1人あたり実質原価(¥)
  - ブランドグループ集約: Azure Gold/Black Line は1ブランドに、Tangiers各種は1ブランドに集約して物販管理
  - `merch_count_secondary`: 250g袋など2種類目の物販個数を別途保持（グラム/パック計算で利用）
  - 単位原価（フレーバー原価・炭原価）と販売値（1本目・おかわり・スタッフ・チャージ）は `cost_price_masters` から `effective_from <= period_key` の最新レコードを自動取得して計算に使用する。`cost_reports` は価格カラムを持たないため、マスタを編集すれば過去月の集計結果にも即座に反映される
  - 詳細要件: [[V-MINT2.0/notes/V-MINT2.0_reuquirements_cost_calculation]]
- 管理者画面要件:
  - `フレーバー表示設定` サブモード: `flavors.is_active` を一括 toggle・保存
  - `新フレーバー追加` サブモード: 新規ブランド（略称 + 正式名称）と銘柄名を `brands` + `flavors` テーブルへ登録
  - `パッケージサイズ設定` サブモード: ブランドごとに `packages_configured` フラグと `has_pkg_*` フラグを設定・保存（棚卸し入力欄の出し分けに反映）
  - `単位原価・販売値設定` サブモード: `cost_price_masters` の価格改定レコードを追加・削除。レコードが1件のみの場合は削除不可（必ず1件は残す）。改定内容はノートに記録可。マスタ編集は集計時の価格参照に即座に反映されるため、別途レコード書き換えは不要
  - 管理者画面への入室には `AdminPinAuth.vue` による別途 PIN 認証が必要（`VITE_ADMIN_PIN_SHA256` で照合）
- 本番運用要件:
  - 配信基盤は Cloudflare Pages を使用し、Production branch を `v2` とする
  - 本番環境変数は Cloudflare 側で `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `VITE_PIN_SHA256` / `VITE_PIN_SALT` / `VITE_ADMIN_PIN_SHA256` を管理し、ローカル `.env.local` はコミットしない
  - 本番切替後のロールバックは Production branch を `main` に戻して実施できる
- Source: [[_LINEmemo/2026-04-14]]

## Related
- [[V-MINT2.0/DECISIONS]]
- [[V-MINT2.0/CHANGELOG_DEV]]
