# CHANGELOG_DEV

## 2026-04-13
- What: 棚卸し Step1 タッパー1・2 に行末トグル（既定オン）を追加。オフ時は入力無効・スプレッドシートには半角 `-` を書き込み、読み取り時は `-` のセルでトグルオフを復元。Step4 確認表は `基:-` / `予:-` で表示
- Why: 該当タッパーがない行を数式・運用と整合する形で明示するため
- Files: `Code.gs`, `src/components/apps/InventoryApp.vue`, `docs/詳細仕様書.md`, `notes/V-MINT_architecture.md`, `notes/_index.md`, `CHANGELOG_DEV.md`
- Related: [[V-MINT/docs/詳細仕様書]]

## 2026-04-12
- What:
  - 棚卸しパッケージ表示の **正本ノート**（UTF-8）を `notes/inventory_package_visibility_plan.md` に追加し `_index.md` からリンク。`.cursor/plans` は正本参照に差し替え
  - 棚卸し Step2/3 で `src/constants/inventoryPackageRules.js` の静的マスタにより A 列 `brand` に応じたグラム入力のみ表示。確認画面は表示列に合わせたプレビュー
- Why: 仕様の文字化け防止と確定、およびブランドごとの実パッケージに合わせた入力負荷の削減
- Files: `notes/inventory_package_visibility_plan.md`, `notes/_index.md`, `src/constants/inventoryPackageRules.js`, `src/components/apps/InventoryApp.vue`, `docs/詳細仕様書.md`, `notes/V-MINT_architecture.md`, `DECISIONS.md`, `CHANGELOG_DEV.md`
- Related: [[V-MINT/notes/inventory_package_visibility_plan]]

## 2026-04-11
- What: ヘッダー・PIN 画面・`index.html` のタイトルでプロダクト名「V-MINT」を主表示にし、「店舗業務ポータル」を小さめの併記に変更
- Why: 現場で製品名を即座に認識できるようにするため
- Files: `src/components/common/AppHeader.vue`, `src/components/common/PinAuth.vue`, `index.html`, `notes/V-MINT_requirements.md`
- Related: [[V-MINT/notes/_index]]

## 2026-04-07
- What: Obsidian 連携用の V-MINT ノート群を実運用向けに更新（architecture/requirements/release-plan を具体化）
- Why: Graph 上でプロジェクト知識をハブ中心に接続し、引き継ぎと日次運用を開始するため
- Files: `notes/_index.md`, `notes/V-MINT_architecture.md`, `notes/V-MINT_requirements.md`, `notes/V-MINT_release-plan.md`
- Related: [[V-MINT/notes/_index]]

## YYYY-MM-DD
- What:
- Why:
- Files:
- Related:
