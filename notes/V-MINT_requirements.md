---
tags: [project/v-mint, type/note]
parent: [[V-MINT/notes/_index]]
---

# V-MINT — Requirements

## Summary
- 現場業務で使う 4 モード中心の操作性と、低遅延での入力・送信を必須要件とする。
- リリース後フィードバックを取り込みながら、段階的に機能拡張する。

## Context
- 要件の一次情報は `docs/現場向け操作マニュアル.md` と `docs/詳細仕様書.md`。
- 成果物・残課題は `docs/プロジェクト最終報告書.md` を参照。

## Details
- 表示・ブランディング:
  - ポータル（トップ）および PIN 画面では、主見出しに「V-MINT」、副見出しに「店舗業務ポータル」（小さめ）を表示する
- 機能要件:
  - 在庫確認・棚卸・補充依頼・移動記録の各業務フローを提供
  - 店舗選択やブランド絞り込みなど、現場運用に必要な導線を維持
- 非機能要件:
  - 初期表示と操作レスポンスの体感改善
  - モバイル利用時の描画負荷を抑制
  - 将来的な同時利用・データ量増加に備えた移行可能性
- 運用要件:
  - 開発時の変更履歴を `CHANGELOG_DEV.md` に記録
  - 重要判断は `DECISIONS.md` に ADR として残す

## Related
- [[V-MINT/DECISIONS]]
- [[V-MINT/CHANGELOG_DEV]]
- Source: [[V-MINT/docs/現場向け操作マニュアル]]
- Source: [[V-MINT/docs/詳細仕様書]]
- Source: [[V-MINT/docs/プロジェクト最終報告書]]
