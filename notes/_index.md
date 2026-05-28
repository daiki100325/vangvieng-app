---
tags: [project/v-mint2, type/hub]
---

# V-MINT2.0 Hub

## Overview
- Goal: GAS運用を廃止し Supabase 専用バックエンドで V-MINT2.0 として完全移行する
- Scope: Inventory / Transfer / Request / Dashboard / Cost / Admin の Supabase 接続と本番運用
- Owner: つーくん

## Key Links
- Decisions: [[V-MINT2.0/DECISIONS]]
- Dev Log: [[V-MINT2.0/CHANGELOG_DEV]]
- Troubleshooting: [[V-MINT2.0/TROUBLESHOOTING]]

## Notes
- [[V-MINT2.0/notes/V-MINT2.0_architecture]] — 現行アーキテクチャ
- [[V-MINT2.0/notes/V-MINT2.0_supabase-er-diagram]] — Supabase ER 図とマイグレーション履歴
- [[V-MINT2.0/notes/V-MINT2.0_requirements]] — 要件定義
- [[V-MINT2.0/notes/V-MINT2.0_release-plan]] — リリース計画と運用フェーズ
- [[V-MINT2.0/notes/V-MINT2.0_history]] — V-MINT 開発史（無印 → 2.0）
- [[V-MINT2.0/notes/V-MINT2.0_user-manual]] — 現場スタッフ向け取扱説明書（棚卸し・移動記録・補充依頼・原価計算）
- [[V-MINT2.0/notes/schema-review-QA_20260509]] — テーブル設計 Q&A（上司レビュー回答）

### Archived
- `notes/old/` — リリース前の検証計画・移行手順・初期実装メモ等は archive 済み

## Weekly Review
- Wins: 6アプリ本番運用継続中。原価計算モードの対象月デフォルトを店舗別 `cost_reports` 最新 period_key の翌月に変更、自動セット中のロック UI を追加。ドリンク発注の前月期間チェックで誤月登録を防止。シーシャ販売数の項目に ①〜⑤ を付番し算式を UI に表示
- Risks: `cost_price_masters` の最新レコード以外を削除しても運用上問題ないが、誤って全件削除すると参照不可。`VITE_ADMIN_PIN_SHA256` 未設定時は管理者画面に入室不可
- Next Actions: 店舗別デフォルト月セットの現場運用フィードバック収集、ドリンク日付チェック発火頻度の確認、原価ダッシュボードの表示改善要望のバックログ化
