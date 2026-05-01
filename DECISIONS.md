# DECISIONS

## ADR-YYYYMMDD-01: <decision-title>
- Status: Proposed | Accepted | Deprecated
- Date: YYYY-MM-DD
- Owners:

### Context
- 

### Decision
- 

### Alternatives
- Option A:
- Option B:

### Consequences
- Positive:
- Negative:

### Links
- Related note: [[PROJECT/notes/<related-note>]]

## ADR-20260414-01: API互換アダプタでSupabase移行
- Status: Deprecated
- Date: 2026-04-14
- Owners: V-MINT2.0 migration team

### Context
- 現行 Vue コンポーネントは `src/api.js` の関数名に強く依存している。
- UI を全面改修すると、移行コストと回帰リスクが増える。

### Decision
- `src/api.js` の公開関数名は維持し、内部実装を GAS/Supabase で切替する。
- 切替条件は `VITE_DATA_BACKEND` で制御する。

### Alternatives
- Option A: 画面側を全面 Supabase 専用に書き直す（不採用）
- Option B: API 互換レイヤを設ける（採用）

### Consequences
- Positive:
  - 画面差分を最小化し段階移行がしやすい
  - GAS比較テストが容易
- Negative:
  - API層が一時的に複雑になる
  - RPC/戻り値形の整合管理が必要

### Links
- Related note: [[PROJECT/notes/PROJECT_architecture]]

## ADR-20260428-01: V-MINT2.0はSupabase専用で運用する
- Status: Accepted
- Date: 2026-04-28
- Owners: V-MINT2.0 migration team

### Context
- `V-MINT2.0` は独立した Supabase 移行版として運用する方針へ切り替わった。
- GAS/Supabase 並走を前提にした `src/api.js` の二重分岐は、Dashboard 実装以降の保守コストを増やしていた。

### Decision
- `V-MINT2.0` のバックエンドは Supabase のみとする。
- `src/api.js` は公開 API 名を維持しつつ、内部実装を Supabase RPC / query 専用へ整理する。
- Dashboard モード向けの参照系は、既存 `fetch_stock_overview` を残しつつ専用 RPC を追加して段階拡張する。

### Alternatives
- Option A: GAS/Supabase 切替アダプタを維持する（不採用）
- Option B: Supabase 専用実装へ寄せ、不要な分岐を削除する（採用）

### Consequences
- Positive:
  - Dashboard / Inventory / Transfer / Request のデータ取得経路が単純化する
  - `src/api.js` と `supabase/rpc.sql` の責務が明確になる
- Negative:
  - `V-MINT2.0` 単体では GAS 比較のためのランタイム切替ができなくなる
  - 既存メモや手順の GAS 前提記述を順次更新する必要がある

### Links
- Related note: [[PROJECT/notes/PROJECT_architecture]]

## ADR-20260414-02: inventory_logsの物販/在庫分離
- Status: Accepted
- Date: 2026-04-14
- Owners: V-MINT2.0 migration team

### Context
- 従来の `pkg_*` 単一列では物販と在庫の意味が混在し、移行CSVと集計で不整合が発生しやすい。

### Decision
- `inventory_logs` に `merch_*` と `stock_*` を分離して保持する。
- 在庫算出の View/RPC は `stock_*` を参照する。

### Alternatives
- Option A: 単一 `pkg_*` を維持しアプリ側で解釈（不採用）
- Option B: DB列を分離して意味を固定（採用）

### Consequences
- Positive:
  - CSV定義が明確化し、データ品質を維持しやすい
  - 在庫計算と売上/物販集計の責務分離ができる
- Negative:
  - マイグレーションSQLが必要
  - APIマッピング修正が必要

### Links
- Related note: [[PROJECT/notes/PROJECT_requirements]]

## ADR-20260416-03: 棚卸し保存は UPSERT で最新スナップショットを維持
- Status: Accepted
- Date: 2026-04-16
- Owners: V-MINT2.0 migration team

### Context
- 途中保存も Supabase に書き込む要件がある。
- 差分追記方式は集計上は吸収できても、`inventory_logs` のレコード数が膨らみやすい。
- 履歴保持は必須ではなく、最新状態を軽く扱える方が運用に合う。

### Decision
- `inventory_logs` は `period_key + store_id + flavor_id` の一意制約を持つ最新スナップショットテーブルとして扱う。
- `submitData` は上記キーで `UPSERT` し、途中保存/完了とも同一フレーバーを上書き更新する。

### Alternatives
- Option A: 差分追記で履歴を残し、読込側で最新行を選ぶ（不採用）
- Option B: `UPSERT` で常に1フレーバー1行へ保つ（採用）

### Consequences
- Positive:
  - `inventory_logs` のレコード数増加を抑えられる
  - 途中保存と完了を何度行っても、同一フレーバーの二重計上を防げる
- Negative:
  - 棚卸しの保存履歴は別途残らない

### Links
- Related note: [[PROJECT/notes/PROJECT_architecture]]

## ADR-20260415-01: UI完全パリティはコピー移植で達成
- Status: Accepted
- Date: 2026-04-15
- Owners: V-MINT2.0 migration team

### Context
- 移行完了条件は「エンドユーザー視点で現行 `V-MINT` と差がない UI/操作」である。
- 部分実装のまま差分修正を積むと、見た目と遷移ロジックの抜け漏れが増える。

### Decision
- `V-MINT` の `App.vue`、`components/common/*`、`PortalMenu.vue`、`components/apps/*` を `V-MINT2.0` にコピー移植し、UI/遷移ロジックを先に一致させる。
- バックエンド差分は `src/api.js` と `supabase/*.sql` に限定し、同一UI上で Supabase 化を完了させる。

### Alternatives
- Option A: 既存の簡易 UI を段階的に拡張する（不採用）
- Option B: 現行 UI を丸ごと移植し、差分を API 層へ集約する（採用）

### Consequences
- Positive:
  - 画面回帰を最短で潰せる
  - QA 観点を「見た目/操作一致 + データ一致」に単純化できる
- Negative:
  - 初回 diff が大きくなる
  - Transfer 系 RPC の補完実装が必須になる

### Links
- Related note: [[PROJECT/notes/PROJECT_release-plan]]

## ADR-20260416-01: 月次キーを `period_key(YYYYMM)` へ拡張
- Status: Accepted
- Date: 2026-04-16
- Owners: V-MINT2.0 migration team

### Context
- 棚卸し月度は暦月と常に一致せず、「棚卸し締め後は翌月計上」という運用がある。
- `month_num(1-12)` 単独では年跨ぎ時に同月データが衝突し、履歴比較の軸として不十分。

### Decision
- ログ系テーブル（`inventory_logs`, `transfer_logs`）に `period_key int`（`YYYYMM`）を追加し、業務月の主キーとして保持する。
- 既存アプリ互換のため `month_num` は当面併存し、`period_key % 100` で整合を取る。
- マスタ投入は `brands.csv` / `flavors.csv` を正本として、CSV staging 経由で upsert する。

### Alternatives
- Option A: `month_num` を継続利用し、年は `recorded_at` から補完（不採用）
- Option B: `period_key` を追加し業務月を明示管理（採用）

### Consequences
- Positive:
  - 2026-03 など年度付きで一意に管理できる
  - 「暦上3月だが4月計上」の運用をデータで表現可能
  - CSV でマスタ・トランザクションを再投入しやすい
- Negative:
  - `rpc.sql` / `src/api.js` の完全 `period_key` 化は別途段階移行が必要
  - 旧CSV（`month_num` のみ）利用時は補完ロジックに依存する

### Links
- Related note: [[PROJECT/notes/PROJECT_architecture]]

## ADR-20260416-02: 棚卸し消費量警告は Step4 で二段階表示する
- Status: Accepted
- Date: 2026-04-16
- Owners: V-MINT2.0 migration team

### Context
- Supabase 版では `checkNegativeConsumption` が未実装で、Step4 の警告が表示されなかった。
- 業務上は「明らかな異常値」と「大量消費だが正しい可能性がある値」を同じ強さで扱わない方が確認しやすい。

### Decision
- 棚卸し Step4 の消費量チェックは `前月棚卸し結果 + 前月移動量 - 当月入力在庫` で計算する。
- 全店舗で消費量マイナスを警告し、`office` だけは消費量が 0 以外なら警告する。
- 消費量が 500g を超えるケースは別バナーで「念のため確認」に留める。

### Alternatives
- Option A: マイナス/事務所0以外/500g超をすべて同一警告に混ぜる（不採用）
- Option B: 異常値警告と大量消費の確認促しを分離する（採用）

### Consequences
- Positive:
  - 現場が即修正すべきケースと確認だけでよいケースを見分けやすい
  - GAS 版の主要ルールを維持しつつ、Supabase 版の未実装差分を解消できる
- Negative:
  - Step4 UI と API の戻り値が少し複雑になる

### Links
- Related note: [[PROJECT/notes/PROJECT_requirements]]

## ADR-20260430-04: 移動記録修正はRPCでブロック単位更新する
- Status: Accepted
- Date: 2026-04-30
- Owners: V-MINT2.0 migration team

### Context
- 移動記録の「修正」では、既存記録の明細行（銘柄・数量）を追加/削除/更新できる必要がある。
- クライアントから `transfer_logs` を直接複数操作すると、同一ブロックの整合性維持と RLS 制御が複雑になる。

### Decision
- `amend_transfer_record` RPC を追加し、`block_index` から解決した同一記録ブロックを1トランザクションで更新する。
- 明細の差分反映（UPDATE/DELETE/INSERT）は RPC 側で完結させ、クライアントは編集後の明細配列を渡すだけにする。

### Alternatives
- Option A: クライアントから `transfer_logs` を直接更新する（不採用）
- Option B: RPC に集約してブロック単位で更新する（採用）

### Consequences
- Positive:
  - ブロック整合性を DB 側で保証しやすい
  - UI は修正入力に集中できる
- Negative:
  - RPC 保守コストが増える
  - SQL のテスト観点が増える

### Links
- Related note: [[PROJECT/notes/PROJECT_requirements]]

## ADR-20260428-02: PIN認証はハッシュ照合 + キーボード入力対応に統一する
- Status: Accepted
- Date: 2026-04-28
- Owners: V-MINT2.0 migration team

### Context
- `PinAuth.vue` に4桁PIN（`4646`）が平文でハードコードされており、コード閲覧時に即時漏えいする状態だった。
- 現場運用ではタブレットだけでなくPC利用もあり、ソフトウェアテンキーのみだと入力性が低い。

### Decision
- PIN認証は `VITE_PIN_SHA256` と `VITE_PIN_SALT` を使い、`SHA-256(${salt}${入力PIN})` の一致で判定する。
- UIレイアウトは変更せず、既存テンキー入力を維持する。
- 追加で物理キーボード（`0-9`, `Numpad0-9`, `Backspace/Delete`）を同じ入力ハンドラへ接続する。

### Alternatives
- Option A: 平文PINを環境変数へ移すだけにする（不採用）
- Option B: クライアント側はハッシュ照合のみ持ち、平文を残さない（採用）

### Consequences
- Positive:
  - リポジトリに平文PINを残さず、露出リスクを下げられる
  - PC環境でのPIN入力が高速化し、操作ミスを減らせる
- Negative:
  - フロント単体のため、完全な秘匿はできずサーバー側認証よりは防御が弱い
  - 環境変数未設定時に認証失敗となるため、初期セットアップ手順の明記が必須

### Links
- Related note: [[PROJECT/notes/PROJECT_requirements]]
