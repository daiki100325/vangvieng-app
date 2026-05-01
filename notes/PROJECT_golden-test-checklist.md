---
tags: [project/project-slug, type/note, type/checklist]
parent: [[PROJECT/notes/_index]]
---

# PROJECT — Golden Test Checklist

## Purpose
- `V-MINT2.0` が `V-MINT` と同一 UI/同一挙動であることを、Supabase バックエンドで検証する。
- 仕様の正本は `V-MINT/docs/PRODUCT_SPEC.md` とし、本ノートはテスト実施記録用のチェックシートとして使う。
- Source: [[V-MINT/docs/PRODUCT_SPEC]]

## Test Session Meta
- Date: 2026-04-28
- Tester:
- Environment: Local / Staging
- Backend: `Supabase`
- UI Label Override: `V-MINT test`（lock/top header）
- Target month: 2026-03（追加照合: 2025-12 / 2026-01 / 2026-02）
- Compared baseline: `V-MINT` (GAS)

## Exit Criteria
- P0 項目（App shell / Inventory / Transfer / Request / Stock）がすべて `PASS`
- ゴールデンSQLの差分が 0（または許容範囲内で理由記録済み）
- ブロッカー不具合が 0

## Result Legend
- `PASS`: 仕様どおり
- `FAIL`: 不一致あり（Issue化必須）
- `N/A`: 対象外

---

## P0-1 App Shell / Navigation

| ID | Check | Expected | Result | Evidence | Note |
|---|---|---|---|---|---|
| SHELL-01 | PIN 認証（正しい4桁） | ロック解除されポータル表示 | PASS | ロック解除後にポータル表示を確認 |  |
| SHELL-02 | PIN 認証（誤った4桁） | エラーメッセージ表示・再入力要求 | PASS | エラーメッセージ表示と再入力要求を確認 |  |
| SHELL-03 | ポータル4カード遷移 | 棚卸し/補充依頼/移動記録/ダッシュボードモードへ遷移 | PASS | 4カード全てで遷移可能を確認 |  |
| SHELL-04 | ヘッダー戻るとブラウザバック | 同一挙動（確認ダイアログ含む） | PASS | 戻る操作とブラウザバックで確認ダイアログを含め同一挙動を確認 |  |
| SHELL-05 | フッター表示条件 | `PRODUCT_SPEC` 記載条件どおり | PASS | 仕様どおりの表示条件を確認 |  |
| SHELL-06 | BrandFilterSheet 表示 | モード別表示条件・ブランド選択が正しい | PASS | 補充依頼・移動記録・棚卸し入力モードで商品カード表示と絞り込み正常を確認 | 棚卸し入力モードを含め全モードで検証完了 |
| SHELL-07 | ConfirmDialog 統一 | `window.confirm` でなく共通ダイアログ | PASS | 共通ダイアログ表示と文言修正後の再確認を実施 | `window.confirm` 不使用、表記も `データベース` に統一済み |
| SHELL-08 | モバイルレイアウト | sticky 要素重なりなし、入力欄が隠れない | PASS | sticky 要素重なりなし・入力欄非遮蔽を確認 |  |
| SHELL-09 | デスクトップレイアウト | 4モードとも崩れなし | PASS | 4モードでレイアウト崩れなしを確認 |  |

## P0-2 Inventory

| ID | Check | Expected | Result | Evidence | Note |
|---|---|---|---|---|---|
| INV-01 | Step 構成（通常店舗） | `1 -> 2 -> 3 -> 4` | PASS | 通常店舗で Step1→2→3→4 の順に遷移することを確認 |  |
| INV-02 | Step 構成（事務所） | `3 -> 4`（2ステップ） | PASS | 事務所で Step3→4 の2ステップ構成であることを確認 |  |
| INV-03 | `getSheetData` 読込 | 品目・値・日付が表示一致 | PASS | `getSheetData` 読込後、品目・値・日付が比較元と一致することを確認 |  |
| INV-04 | タッパー1/2 ありトグルOFF | OFF時に入力欄 disabled + 確認画面 `-` 表示 | PASS | タッパーありトグルをOFFにした際、入力欄 disabled と確認画面の `-` 表示を確認 | トグルONは「あり」を意味する実装・要件で一致 |
| INV-05 | 途中保存 | `inventory_draft_{store}_{month}` 保存 | PASS | 途中保存（手動/自動30秒）で Supabase `UPSERT` + `localStorage` 保存、更新時の上書き動作を確認 | 途中保存ロジックのテストPASS |
| INV-06 | 復元確認 | 再入場時の復元ダイアログ表示 | PASS | 再入場時に復元ダイアログが表示され、途中入力値が復元されることを確認 |  |
| INV-07 | マイナス消費確認 | Step4 遷移時に警告表示（送信可能） | PASS | マイナス消費警告と `500g超` 警告の表示、および送信継続可能を確認 |  |
| INV-08 | submitData | 送信成功後に再読込で値一致 | PASS | 棚卸し Step4 送信後に同月・同店舗を再読込し、入力値との一致を確認 |  |
| INV-09 | 店舗キー `baba` | DBでは `baba_main` と整合 | PASS | UI で `baba` 選択時の保存データが DB 上で `baba_main` として整合することを確認 |  |

## P0-3 Request

| ID | Check | Expected | Result | Evidence | Note |
|---|---|---|---|---|---|
| REQ-01 | 対象店舗選択 | `baba_main` / `nakano` / `baba_2nd` のみ | PASS | 対象店舗選択肢が `baba_main` / `nakano` / `baba_2nd` のみであることを確認 |  |
| REQ-02 | 在庫表示 | 自店舗大表示 + 他3拠点カード表示 | PASS | 自店舗が大表示、他3拠点がカード表示されることを確認 |  |
| REQ-03 | 在庫閾値アラート | `<500` 警告、`<1000` 注意色 | PASS | `<500` の警告表示と `<1000` の注意色表示を確認 |  |
| REQ-04 | 最大在庫ハイライト | 他店舗カードで最大値を強調 | PASS | 他店舗カード内で最大在庫値が強調表示されることを確認 |  |
| REQ-05 | ゼロ非表示 | 全店舗0行のみ非表示 | PASS | 全店舗在庫が0の行のみ非表示となり、いずれか在庫がある行は表示されることを確認 |  |
| REQ-06 | 内容確認モーダル | 文面生成・コピーが現行同等 | PASS | 内容確認モーダルの文面生成とコピー結果が現行同等であることを確認 |  |

## P0-4 Transfer

| ID | Check | Expected | Result | Evidence | Note |
|---|---|---|---|---|---|
| TR-01 | サブモード切替 | issue/inspect/arrival/dispose すべて動作 | PASS | issue/inspect/arrival/dispose の全サブモードで切替と操作が正常であることを確認 |  |
| TR-02 | issue Step遷移 | `0 -> 1a -> 2a` | PASS | issue モードで `0 -> 1a -> 2a` のStep遷移を確認 |  |
| TR-03 | arrival Step遷移 | `0 -> 1a -> 2a`, `autoInspect=true` | PASS | arrival モードで `0 -> 1a -> 2a` と `autoInspect=true` 挙動を確認 |  |
| TR-04 | dispose Step遷移 | `0 -> 1a -> 2a`, `autoInspect=true` | PASS | dispose モードで `0 -> 1a -> 2a` と `autoInspect=true` 挙動を確認 |  |
| TR-05 | inspect Step遷移 | `0 -> 1b`（未検品選択後） | PASS | inspect モードで未検品選択後に `0 -> 1b` 遷移することを確認 |  |
| TR-06 | 新規銘柄追加（arrival） | 入力規則・重複拒否・追加反映 | PASS | ブランド「その他」で略称/正式名称分離入力、入力規則・重複拒否・追加反映および表示整合を再確認 | GT-2026-04-20-TR-BRAND-01 再テストPASS |
| TR-07 | submitTransferRecord(issue) | from/dest 両方あり、pending 起票 | PASS | issue 送信で from/dest 両方ありの pending 起票となり、移動履歴・在庫反映要件を含め再テストで一致を確認 | GT-2026-04-20-TR-ISSUE-REFLECT-01 再テストPASS |
| TR-08 | submitTransferRecord(arrival) | from null / destあり / completed | PASS | arrival 送信で from null / dest あり / completed 保存を確認 |  |
| TR-09 | submitTransferRecord(dispose) | fromあり / dest null / completed | PASS | dispose 送信で from あり / dest null / completed 保存を確認 |  |
| TR-10 | 未検品一覧取得 | 対象店舗の pending のみ表示 | PASS | 対象店舗に紐づく pending のみ未検品一覧へ表示されることを確認 |  |
| TR-11 | 明細取得（移動） | blockIndex 対応明細表示 | PASS | 移動レコードの blockIndex 対応で明細取得・表示が一致することを確認 |  |
| TR-12 | 明細取得（廃棄） | dispose明細表示 | PASS | 廃棄レコードで dispose 明細が正しく表示されることを確認 |  |
| TR-13 | 検品数量修正 | 確認ダイアログ後に更新 | PASS | 数量修正時に確認ダイアログを経由し、更新が反映されることを確認 |  |
| TR-14 | 検品完了 | status=completed、履歴に検品済表示 | PASS | 検品完了後に status=completed となり履歴上で検品済み表示を確認 |  |
| TR-15 | 履歴展開 | route/date/comment/明細が正しい | PASS | route/date/comment/明細の表示整合を再確認し、`baba_main` 表記不具合修正後の店舗名表示を含め一致を確認 | GT-2026-04-21-TR-ROUTE-LABEL-01 再テストPASS |

## P0-5 Dashboard

| ID | Check | Expected | Result | Evidence | Note |
|---|---|---|---|---|---|
| DASH-01 | 在庫量確認取得 | `fetch_dashboard_stock_overview` が取得成功 | PASS | 対象月選択後に在庫量確認サブモードが表示されること | [[PROJECT/notes/PROJECT_dashboard-data-verification]] A章 2026-04-30 |
| DASH-02 | 在庫量確認表示 | 総在庫量 / 各拠点在庫 / 前月消費量が表示 | PASS | 正本と数値整合を確認 | 同上 |
| DASH-03 | 表示切替 | 総在庫 / 各拠点在庫を表示切替できる | PASS | チェックボックスON/OFFで対応列の表示が切り替わること | 同上 |
| DASH-04 | 0以下ハイライト | `totalStock <= 0` 行を強調 | PASS | `totalStock <= 0` の行が強調表示されること | 同上 |
| DASH-05 | ブランドフィルタ | BrandFilterSheet と連動 | PASS | BrandFilterSheet の選択内容に応じて一覧が連動すること | 同上 |
| DASH-06 | 棚卸し結果確認取得 | `fetch_inventory_result_details` が取得成功 | PASS | 対象月 + 拠点選択後に一覧が表示されること | [[PROJECT/notes/PROJECT_dashboard-data-verification]] B章 2026-04-30 |
| DASH-07 | 棚卸し結果確認詳細 | 指標8項目が確認できる | PASS | 正本と数値整合（タッパー / 物販 / 在庫 / 各種集計列） | 同上 |
| DASH-08 | 棚卸し結果 当月消費ハイライト | 拠点別に当月消費量セルを強調 | PASS | `office`: 0以外は赤／その他: マイナスは赤・500以上は黄 | [[PROJECT/notes/PROJECT_dashboard-data-verification]] B章 step6 2026-04-30 |

---

## Data/DB Golden Checks (Supabase)

### D1. Store Key Mapping
- [x] UIの `baba` が DB `baba_main` と一致する
- [x] `stores` に `office` / `baba_main` / `nakano` / `baba_2nd` が存在する

### D2. Transfer Integrity
- [x] `dest_store_id is null` の内訳が dispose のみ
- [x] `from_store_id is null` の内訳が arrival のみ
- [x] inspect 完了後に pending が正しく減る

### D3. Monthly Reconciliation
- [x] `prev_month_stock_grams` 一致
- [x] `march_net_transfer_grams` 一致（`12400`）
- [x] `march_stock_grams` 一致
- [x] `consumption_from_prev_month_grams` 一致（3月消費量 `40126`）
- [x] 追加月（2025-12 / 2026-01 / 2026-02）でも同一ロジックで一致確認

---

## Defect Log

| Ticket | Severity | Scope | Repro Steps | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| GT-2026-04-16-INV-CARD-01 | P1 | Inventory / BrandFilterSheet | 棚卸し入力モードを開き BrandFilterSheet を表示 | 商品カードが表示されブランド絞り込みを検証可能 | 棚卸し入力モードで商品カードが表示されず同モードのみ未検証 | Closed (retest PASS) |
| GT-2026-04-16-DIALOG-COPY-01 | P2 | ConfirmDialog / Loading Message | 移動記録・棚卸しで送信/検品系ダイアログを表示 | 実態に即した「データベース」関連文言で表示 | 「スプレッドシート」文言が残存していたため実態と乖離 | Closed (retest PASS) |
| GT-2026-04-16-INV-CONSUME-01 | P1 | Inventory / Consumption Check | 棚卸し Step4 に進み、マイナス消費または事務所 0 以外を作る | Step4 で警告表示され、送信可のまま確認できる | Supabase 版ではチェック処理が未実装で警告が出ない | Closed (retest PASS) |
| GT-2026-04-20-TR-BRAND-01 | P1 | Transfer / Arrival 新規銘柄追加 | Arrival でブランド「その他」を選択し新規銘柄を追加 | ブランドは既存マスタ形式（略称と正式名称を分離保持）で保存され、一覧表示は正式名称で統一 | ブランド名が「略称 + (正式名称)」文字列として保存され表示不整合が発生 | Closed (retest PASS) |
| GT-2026-04-20-TR-ISSUE-REFLECT-01 | P1 | Transfer / Request 在庫反映・履歴表示 | 4月を選択して issue を起票後、Transfer一覧とRequest在庫を確認 | Request は「前月棚卸し + 当月暫定移動」、Transfer一覧は当月 transfer_logs を即時表示 | pending は未検品候補に出るが、Transfer一覧とRequest在庫への反映が欠落 | Closed (retest PASS) |
| GT-2026-04-21-TR-ROUTE-LABEL-01 | P2 | Transfer / 履歴展開 route表示 | Transfer 履歴一覧で馬場本店を含むルートを表示 | route はユーザー向け店舗名（馬場本店）で表示される | `baba_main` がID文字列のまま表示される | Closed (retest PASS) |
| GT-2026-04-21-STK-OVERVIEW-01 | P1 | Stock / 在庫一覧集計表示 | 在庫量確認で対象月を選択し一覧表示を確認 | 銘柄ごとに「前月棚卸し ± 当月completed移動」の全拠点合算値が表示される | 一覧が表示されず、期待集計値を確認できない | Closed (retest PASS) |
| GT-2026-04-21-STK-PREV-CONSUME-01 | P1 | Stock / 前月消費量表示 | 在庫量確認で対象月を選択し前月消費量列を確認 | 対象月の前月消費量が銘柄ごとに表示される | 前月消費量が全銘柄で0表示となる | Closed (retest PASS) |
| GT-2026-04-28-TR-DISPOSE-01 | P1 | Data Migration / transfer_logs 正規化 | 3月生CSVを変換して `transfer_logs_2026-03.normalized.csv` を投入 | 右端補正列の廃棄2件（合計 `-600g`）が取り込まれ、3月純移動が正本 `+12400g` と一致 | 旧変換ロジックで番号なし右端4列ブロックを取りこぼし、廃棄が欠落して `+13000g` になっていた | Closed (fixed + reimport PASS) |

## Sign-off
- QA lead: Cursor QA session (2026-04-28)
- Dev lead: V-MINT2.0 migration team
- Decision: GO
