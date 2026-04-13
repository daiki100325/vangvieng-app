# DECISIONS

## ADR-20260413-01: 入荷時の新規銘柄はGASで行追加・列別初期化する
- Status: Accepted
- Date: 2026-04-13
- Owners: (project)

### Context
- 入荷時に新規銘柄が必要な場合、従来はスプレッドシートを直接編集する運用だった
- 新規行には集計数式を引き継ぎたい一方で、棚卸し結果・移動実績などは複製してはいけない

### Decision
- `addFlavorForArrival` API を `Code.gs` に追加し、入荷画面から A/B 列の新規銘柄を追加可能にする
- 重複判定は A+B 完全一致（trim後）で行い、挿入位置はブランド/フレーバーのアルファベット順を採用する
- 行初期化は列ごとに制御し、コピー禁止列は値を持ち越さず、`IP` 列はチェックボックス維持 + `TRUE`、その他列は近傍行の数式をコピーする
- 初期化途中で失敗した場合は挿入行を削除してロールバックする

### Alternatives
- フロント側で行挿入位置や列コピーを計算: クライアント差異や再現性の担保が難しいため不採用
- 追加時に全列コピーしてから上書き: 実績値の混入リスクが高く不採用

### Consequences
- Positive: 現場が入荷画面だけで新規銘柄を追加でき、シート整合性ルールも一元化される
- Negative: `Code.gs` の列定義依存が増えるため、シート構造変更時はメンテナンスが必要

### Links
- Related note: [[V-MINT/notes/V-MINT_requirements]]

## ADR-20260412-01: 棚卸しパッケージ列はフロントの静的マスタで制御する
- Status: Accepted
- Date: 2026-04-12
- Owners: (project)

### Context
- 棚卸しの物販・在庫ステップで、ブランドごとに実在しないグラム列の入力を減らしたい
- スプレッドシートや GAS にマスタを置くと運用は柔軟だが、往復・実装コストが増える

### Decision
- A 列 `brand` 全文をキーにしたマップを `src/constants/inventoryPackageRules.js` に置き、ビルドに同梱する
- 未登録ブランドは従来どおり全列表示（後方互換）

### Alternatives
- GAS `getSheetData` で行ごとに許可列を返す: 往復は増やさず載せられるが今回は見送り
- 別シートマスタ＋ GAS 読み込み: 運用変更が容易だが今回の要件では過剰

### Consequences
- Positive: 追加 API なし、オフラインに近い確実性
- Negative: パッケージ構成変更時はデプロイが必要

### Links
- Related note: [[V-MINT/notes/inventory_package_visibility_plan]]

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
- Related note: [[V-MINT/notes/<related-note>]]
