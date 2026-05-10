---
tags: [project/v-mint2, type/hub]
---

# V-MINT2.0 Hub

## Overview
- Goal: GAS運用を廃止し Supabase 専用バックエンドで V-MINT2.0 として完全移行する
- Scope: Inventory / Transfer / Request / Dashboard / Cost App の Supabase 接続、原価計算機能
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

## Weekly Review
- Wins: 5アプリ（Inventory/Transfer/Request/Dashboard/Cost）Supabase 完全接続、Cost App 原価計算・ドリンク発注・ブランドグループ集約まで実装完了
- Risks: ダッシュボード「実質原価」サブモード（推移グラフ）が未実装
- Next Actions: 実質原価ダッシュボードサブモード実装 → 受け入れチェック → Cloudflare 本番切替
