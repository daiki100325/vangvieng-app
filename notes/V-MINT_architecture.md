---
tags: [project/v-mint, type/note]
parent: [[V-MINT/notes/_index]]
---

# V-MINT — Architecture

## Summary
- 現在は Vue + Vite フロントエンド構成で、業務モードをコンポーネント分割して運用する方針。
- データ連携は GAS / Spreadsheet を前提にしつつ、将来的な API 化とホスティング分離を視野に入れている。

## Context
- `handoff_report.md` で `App.vue` からの分割進行状況を引き継ぎ。
- `migration_plan.md` で GAS 継続運用から段階移行するロードマップを定義。
- 詳細仕様は `docs/詳細仕様書.md` に集約。

## Details
- 主要分割済みコンポーネント:
  - `PinAuth.vue`
  - `LoadingOverlay.vue`
  - `AppHeader.vue`
  - `AppFooter.vue`
  - `PortalMenu.vue`
  - `BrandFilterSheet.vue`
  - `StockApp.vue`
  - `InventoryApp.vue`
  - `RequestApp.vue`
- 未完了タスク:
  - `TransferApp.vue` の生成と接続確認（`src/refactor_transfer.cjs`）。
- アーキ移行フェーズ:
  - Phase 1: GAS 運用で検証
  - Phase 2: バックエンド統合 + 新機能
  - Phase 3: フロントを Cloudflare Pages 等へ移行
  - Phase 4: RDB への完全移行を検討

## Related
- [[V-MINT/DECISIONS]]
- [[V-MINT/CHANGELOG_DEV]]
- Source: [[V-MINT/handoff_report]]
- Source: [[V-MINT/migration_plan]]
- Source: [[V-MINT/docs/詳細仕様書]]
