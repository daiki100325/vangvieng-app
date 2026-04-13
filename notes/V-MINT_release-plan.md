---
tags: [project/v-mint, type/note]
parent: [[V-MINT/notes/_index]]
---

# V-MINT — Release plan

## Summary
- 現行運用を維持しつつ、段階移行で性能・拡張性を上げる。
- フェーズ進行は現場フィードバックと実負荷を基準に判断する。

## Context
- 基本計画は `migration_plan.md` の 4 フェーズ。
- 現在の実装状況と技術課題は `handoff_report.md` を参照。

## Details
- Phase 1（現在）:
  - 現仕様でテスト・リリースし運用課題を収集
- Phase 2（次段階）:
  - 帳票統合で通信時間を削減
  - 移動記録モードを実装
- Phase 3（負荷増加時）:
  - フロントエンドを静的ホスティングへ移行
  - GAS を外部 JSON API として利用
- Phase 4（将来）:
  - DB を RDB へ移行し堅牢性・拡張性を強化
- 直近チェック項目:
  - 入荷画面の新規銘柄追加（重複・並び順・列初期化ルール）を実機で確認
  - `addFlavorForArrival` の競合時リトライ運用（ロック取得失敗時）を周知
  - 主要業務フローの実機検証

## Related
- [[V-MINT/DECISIONS]]
- [[V-MINT/CHANGELOG_DEV]]
- Source: [[V-MINT/migration_plan]]
- Source: [[V-MINT/handoff_report]]
