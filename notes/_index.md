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
- [[V-MINT2.0/notes/V-MINT2.0_architecture]]
- [[V-MINT2.0/notes/V-MINT2.0_supabase-er-diagram]]
- [[V-MINT2.0/notes/V-MINT2.0_requirements]]
- [[V-MINT2.0/notes/V-MINT2.0_reuquirements_cost_calculation]]
- [[V-MINT2.0/notes/V-MINT2.0_release-plan]]
- [[V-MINT2.0/notes/V-MINT2.0_golden-test-checklist]]
- [[V-MINT2.0/notes/V-MINT2.0_dashboard-data-verification]]
- [[V-MINT2.0/notes/V-MINT2.0_test-plan_cost_calculation]]
- [[V-MINT2.0/notes/V-MINT2.0_additional-implementation-plan]]
- [[V-MINT2.0/notes/V-MINT2.0_post-migration-feature-memo]]
- [[V-MINT2.0/notes/schema-review-QA_20260509]] — テーブル設計 Q&A（上司レビュー回答）
- [[V-MINT2.0/notes/V-MINT2.0_migration-procedure]] — 正式リリース移行手順（Cloudflare 切替 + シニマネ招待）
- [[V-MINT2.0/notes/V-MINT2.0_user-manual]] — 現場スタッフ向け取扱説明書（棚卸し・移動記録・補充依頼・原価計算）

## Weekly Review
- Wins: 6アプリ本番運用継続中。Admin に `パッケージサイズ設定` / `単位原価・販売値設定` サブモードと管理者専用 PIN 認証を追加、価格改定を `cost_price_masters` で DB 管理する構成へ移行
- Risks: `cost_price_masters` 初期レコードは削除不可のため、誤挿入時は修正 SQL が必要。また `VITE_ADMIN_PIN_SHA256` 未設定時は管理者画面に入室不可
- Next Actions: 価格改定マスタの初期運用結果確認、パッケージサイズ設定の全ブランド反映確認
