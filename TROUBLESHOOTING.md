# TROUBLESHOOTING

## Case: <issue-title>
- Date: YYYY-MM-DD
- Severity: Low | Medium | High
- Owner:

### Symptoms
- 

### Cause
- 

### Fix
- 

### Prevention
- 

### Links
- Dev log: [[V-MINT2.0/CHANGELOG_DEV]]
- Decision: [[V-MINT2.0/DECISIONS]]

## Case: 未実施月の棚卸しで商品カードが0件になる
- Date: 2026-04-16
- Severity: High
- Owner: V-MINT2.0 migration team

### Symptoms
- まだ `inventory_logs` が存在しない月を選ぶと、棚卸し入力で商品カードが表示されない
- 既に記録済みの月だけカードが表示される

### Cause
- `fetch_inventory_sheet_data` が `inventory_logs` の既存行だけを返しており、`flavors` マスタを基準にしていなかった

### Fix
- `supabase/rpc.sql` の `fetch_inventory_sheet_data` を `flavors` 基準へ変更
- 既存ログがある場合だけその値を重ね、未実施月でも全アクティブフレーバーを返すようにした

### Prevention
- 初期表示系 RPC は「既存トランザクションが0件でも必要マスタを返すか」を確認する
- ゴールデンテストに「未実施月で棚卸し開始できること」を追加する

### Links
- Dev log: [[V-MINT2.0/CHANGELOG_DEV]]
- Decision: [[V-MINT2.0/DECISIONS]]

## Case: 新規月の棚卸しでタッパートグルが全てOFFになる
- Date: 2026-04-16
- Severity: Medium
- Owner: V-MINT2.0 migration team

### Symptoms
- まだ `inventory_logs` が存在しない月を選ぶと、棚卸し入力のタッパー存在トグルが全銘柄で OFF になる
- 値欄は空でよいが、前月に存在していたタッパーまで OFF から手で戻す必要がある

### Cause
- 当月の `inventory_logs` が未作成だと、`fetch_inventory_sheet_data` がトグル初期値も `NULL` 扱いにしていた

### Fix
- 当月レコードがない場合のみ、前月の `tupper_basic` / `tupper_reserve` の `NULL` 判定をトグル初期値として返す
- 数値本体は空のままにして、新規入力のしやすさを維持する

### Prevention
- 未実施月の初期表示では「値」と「存在フラグ」を別扱いにする
- ゴールデンテストに「前月トグル引き継ぎ」を追加する

### Links
- Dev log: [[V-MINT2.0/CHANGELOG_DEV]]
- Decision: [[V-MINT2.0/DECISIONS]]

## Case: 棚卸し画面で商品カードが0件になる
- Date: 2026-04-16
- Severity: Medium
- Owner: V-MINT2.0 migration team

### Symptoms
- 棚卸し入力モードへ入ると商品カードが表示されない
- 補充依頼や在庫量確認で選んだブランドフィルタが残っている時だけ再現する

### Cause
- `App.vue` の共通ブランドフィルタ状態が棚卸しモード遷移時に初期化されず、存在しないブランドで `filteredItems` が空になっていた

### Fix
- 棚卸しモード開始時に `selectedBrand` をクリア
- 現在モードのブランド一覧に存在しない選択値は自動で解除

### Prevention
- モード共通 UI 状態を使い回す時は、遷移時に有効値かどうかを検証する
- 受け入れテストに「別モードでブランド選択後、棚卸しへ遷移」を追加する

### Links
- Dev log: [[V-MINT2.0/CHANGELOG_DEV]]
- Decision: [[V-MINT2.0/DECISIONS]]

## Case: Supabase 接続環境変数不足
- Date: 2026-04-14
- Severity: High
- Owner: V-MINT2.0 migration team

### Symptoms
- 起動後に `Supabase client is not configured` エラー
- API 呼び出しが全て失敗

### Cause
- `.env` に `VITE_SUPABASE_URL` または `VITE_SUPABASE_ANON_KEY` が未設定

### Fix
- `V-MINT2.0/.env.local` に必要値を設定
- 必要なら `VITE_DATA_BACKEND=gas` で一時退避

### Prevention
- 新規開発端末では `.env.example` からコピーして値を先に投入
- CI で最低限の env 存在チェックを行う

### Links
- Dev log: [[V-MINT2.0/CHANGELOG_DEV]]
- Decision: [[V-MINT2.0/DECISIONS]]

## Case: inventory_logs 列不一致（merch_/stock_）
- Date: 2026-04-14
- Severity: High
- Owner: V-MINT2.0 migration team

### Symptoms
- `column "merch_pkg_50" does not exist` などのSQLエラー
- 保存時に inventory API が失敗

### Cause
- DBが旧スキーマ（`pkg_*`, `val_other`）のままで、分離カラムが未作成

### Fix
- `supabase/migrations/20260414_split_merch_stock.sql` を実行
- 必要に応じて `supabase/rpc.sql` を再実行して関数定義を更新

### Prevention
- 環境立ち上げ時は `schema.sql` / `rpc.sql` と migration 適用順をチェックリスト化

### Links
- Dev log: [[V-MINT2.0/CHANGELOG_DEV]]
- Decision: [[V-MINT2.0/DECISIONS]]

## Case: transfer正規化で `dest_store_key` が NULL になる
- Date: 2026-04-15
- Severity: High
- Owner: V-MINT2.0 migration team

### Symptoms
- `transfer_logs` で出庫側だけ入り、入庫側が `NULL_STORE` 扱いになる
- `march_net_transfer_grams` が片側のみ計上され、`consumption_from_prev_month_grams` が負側にずれる

### Cause
- 生CSVの移動ログ領域（CW〜HL）で、ヘッダ1行目が「イベント名/空欄/TRUE」の混在になるパターンがある
- 旧変換ロジックがヘッダ文字列一致に依存しており、4列目（馬場2号店）をイベント列から取りこぼした

### Fix
- `convert_transfer_raw_to_normalized.py` を修正し、CW〜HL を 4列1ブロック（事務所/本店/中野店/馬場2号店）で固定解釈
- 対象月の `transfer_logs_*.normalized.csv` を再生成し、staging→`transfer_logs` を再インポート

### Prevention
- 変換後CSVに対して `dest_store_key is null` 件数を月次で検証する
- 代表銘柄（例: AF Cardamom）で from/dest の両側が出ているかをゴールデンテストに追加する

### Links
- Dev log: [[V-MINT2.0/CHANGELOG_DEV]]
- Decision: [[V-MINT2.0/DECISIONS]]

## Case: Supabase 版の棚卸し Step4 で消費量警告が出ない
- Date: 2026-04-16
- Severity: High
- Owner: V-MINT2.0 migration team

### Symptoms
- `Inventory` の Step4 へ進んでも、マイナス消費や事務所の異常消費に対する警告が表示されない
- GAS 版では出る警告が Supabase 版では常に空になる

### Cause
- `src/api.js` の Supabase `checkNegativeConsumption` が空実装で、常に空配列を返していた

### Fix
- 前月の最新 `inventory_logs` と前月の完了済み `transfer_logs` を取得し、未送信の入力値に対する消費量をドライラン計算するよう実装
- 異常値警告と `500g` 超の確認促しを Step4 で別バナー表示に分離

### Prevention
- GAS/Supabase 切替 API は、UI が依存する action ごとに「未実装のダミー返却」が残っていないか確認する
- ゴールデンテストで Step4 警告の表示有無だけでなく、警告種別も確認する

### Links
- Dev log: [[V-MINT2.0/CHANGELOG_DEV]]
- Decision: [[V-MINT2.0/DECISIONS]]

## Case: transfer正規化で右端の廃棄補正列が欠落する
- Date: 2026-04-28
- Severity: High
- Owner: V-MINT2.0 migration team

### Symptoms
- `transfer_logs_2026-03.normalized.csv` に廃棄行が出ず、`dispose_rows=0` になる
- ゴールデン照合で 3月純移動が正本 `+12400g` ではなく `+13000g` になる

### Cause
- `convert_transfer_raw_to_normalized.py` が `(n)` 形式のイベントヘッダだけを移動列として検出していた
- 右端にある番号なし4列ブロック（補正/廃棄列）が検出対象外になっていた

### Fix
- 末尾の `(C)` 集計列より左で、最後の番号イベント以降にある非ゼロ4列ブロックをフォールバック検出するよう変換ロジックを拡張
- 変換CSVに `period_key` 列を含めて再生成し、3月データの廃棄2件（合計 `-600g`）を反映

### Prevention
- 変換後CSVで `dest_store_key='' and from_store_key!=''`（dispose）件数を月次確認する
- 月次照合で純移動総量が正本と一致すること（例: 2026-03 は `+12400g`）を必須チェックにする

### Links
- Dev log: [[V-MINT2.0/CHANGELOG_DEV]]
- Decision: [[V-MINT2.0/DECISIONS]]

## Case: transfer正規化で `MM/DD` 見出し月のイベント列を誤検出する
- Date: 2026-04-28
- Severity: High
- Owner: V-MINT2.0 migration team

### Symptoms
- 4月形式の生CSVを変換すると `transfer_logs_2026-04.normalized.csv` の件数が異常に膨らむ
- `recorded_at` 空欄や `ambiguous:(A) 前月棚卸し` のような不要行が大量に出る

### Cause
- 旧ロジックは `(n)` 形式のイベント見出しを前提にしており、`03/30` のような日付見出しだけの月ではイベント領域の開始位置を正しく特定できなかった
- さらに同じ日付見出しを辞書キーで保持していたため、`03/30` が複数回出る月では後勝ち上書きで earlier block が消えていた

### Fix
- `MM/DD` 形式もイベント開始列として扱うよう変換ロジックを拡張
- フォールバック検出の開始位置を `(B)` セクション以降に制限し、前月棚卸し列を移動イベントとして誤検出しないよう修正
- イベントブロックの保持構造を辞書から配列へ変更し、重複日付ラベルをそのまま複数イベントとして扱うよう修正

### Prevention
- 月次変換後に `blank_date` / `pending_rows` / 異常件数を確認する
- 4月形式と3月形式の両方で `transfer_logs_*.normalized.csv` のサンプル目視確認を行う

### Links
- Dev log: [[V-MINT2.0/CHANGELOG_DEV]]
- Decision: [[V-MINT2.0/DECISIONS]]

## Case: 棚卸しの途中保存で未変更フレーバーまで重複計上し得る
- Date: 2026-04-16
- Severity: Medium
- Owner: V-MINT2.0 migration team

### Symptoms
- `途中保存` や `完了` を複数回押すと、未変更の在庫値まで再計上される恐れがある
- 同一日の複数保存で、どの行が最新か SQL が安定して選べない

### Cause
- `submitData()` が毎回全フレーバーを書き込み、同一フレーバーの最新値を上書きせず追記していた

### Fix
- `inventory_logs` に `period_key + store_id + flavor_id` の一意制約を追加
- `submitData()` は同キーで `UPSERT` するよう修正
- 未入力の空行は保存対象から除外し、入力済み/変更済みフレーバーだけを送るよう修正
- 保存確認用に `updated_at`（JST）を追加し、以後の更新時刻はそちらで確認する
- `途中保存` は Supabase 保存と `localStorage` 下書き保存を同時に行うよう整理

### Prevention
- ゴールデンテストで「途中保存2回 + 完了」で同一フレーバーが1レコードのまま更新されることを確認する
- 最新状態テーブルは、履歴用途と混在させず `UPSERT` 前提のキー制約を持たせる

### Links
- Dev log: [[V-MINT2.0/CHANGELOG_DEV]]
- Decision: [[V-MINT2.0/DECISIONS]]

## Case: ダッシュボード在庫・消費が正本とずれる（移動の period_key 誤り）
- Date: 2026-04-30
- Severity: Medium
- Owner: V-MINT2.0 migration team

### Symptoms
- `在庫量` の総在庫・拠点別在庫、`前月消費量` が正本と一致しない
- RPC の式は正しく見えるが、特定の月だけ数値が跳ねる

### Cause
- `transfer_logs` に **照合対象月と異なる `period_key`**（例: 4月照合中に 5月分として登録したテスト移動）が残っている
- ダッシュボードは対象月の completed 移動と前後月の棚卸しを組み合わせるため、誤った月ラベルの移動が在庫推定・消費計算の両方に入り込む

### Fix
- 誤った `period_key` の行を `transfer_logs` から削除または正しい月へ修正する
- 正本と再度突き合わせて整合を確認する

### Prevention
- テスト用移動は **本番と同じ照合月の `period_key`** で入れるか、検証後に必ず削除する
- 照合前に `transfer_logs` を対象 `period_key` でフィルタし、意図しない月の行がないか確認する

### Links
- Dev log: [[V-MINT2.0/CHANGELOG_DEV]]
- Decision: [[V-MINT2.0/DECISIONS]]
- Checklist: [[V-MINT2.0/notes/V-MINT2.0_dashboard-data-verification]]

## Case: 原価計算の Azure Gold/Black 総消費だけダッシュボードの銘柄別合計と食い違う
- Date: 2026-05-11
- Severity: Medium
- Owner: V-MINT2.0 ops

### Symptoms
- ダッシュボード「棚卸し結果」では店舗×月の銘柄別当月消費が妥当に見える
- 原価計算 Step3 の「Azure Gold/Black」行の総消費量(g)だけ、Gold/Black 各銘柄のダッシュボード値を足した期待より小さい（例: 合計がちょうど数千 g 欠ける）

### Cause
- 原価計算の自動集計は `getBrandConsumptionForCost`（`src/api.js`）が **フレーバーごとの `prev + transfer - current` を `brands.cost_group_id ?? brands.id` に加算**し、画面は `getBrandsForCost` が返す **集約ブランド行（`is_cost_group`）と `cost_group_id` が NULL のみ**に `consumptionMap.get(brand_id)` で表示する
- 一部フレーバーの `brands.cost_group_id` が未設定・別ブランド誤紐付け・重複ブランド行のどれかだと、消費が **集約キー `Azure Gold/Black` の id に乗らず**、画面上はどの行にも出ない（合計だけ欠ける）

### Fix
- Supabase で Azure系ブランドの `cost_group_id` を確認し、`Azure Gold Line` / `Azure Black Line` がすべて **同一の `Azure Gold/Black` 行 id** を指すよう修正する
- 問題フレーバーは `flavors.brand_id` が意図しないブランド（別名の重複行など）を指していないか確認する

### Prevention
- マスタ追加・CSV 取込後に `SELECT id, name, cost_group_id FROM brands WHERE name ILIKE '%azure%'` を定例確認する
- 原価計算を開く前に、ダッシュボードで Azure 系銘柄の行数と原価の1行が整合するかスポット比較する

### Links
- Dev log: [[V-MINT2.0/CHANGELOG_DEV]]
- Architecture: [[V-MINT2.0/notes/V-MINT2.0_architecture]]
