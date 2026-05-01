---
tags: [project/project-slug, type/hub]
---

# PROJECT Hub

## Overview
- Goal: GAS運用を維持しつつ Supabase 移行版を独立開発する
- Scope: API切替基盤、Transfer/Inventory/Request/Stock の Supabase 接続、移行手順
- Owner: V-MINT2.0 migration team

## Key Links
- Decisions: [[PROJECT/DECISIONS]]
- Dev Log: [[PROJECT/CHANGELOG_DEV]]
- Troubleshooting: [[PROJECT/TROUBLESHOOTING]]

## Notes
- [[PROJECT/notes/PROJECT_architecture]]
- [[PROJECT/notes/PROJECT_supabase-er-diagram]]
- [[PROJECT/notes/PROJECT_requirements]]
- [[PROJECT/notes/PROJECT_release-plan]]
- [[PROJECT/notes/PROJECT_golden-test-checklist]]
- [[PROJECT/notes/PROJECT_dashboard-data-verification]]
- [[PROJECT/notes/PROJECT_additional-implementation-plan]]
- [[PROJECT/notes/PROJECT_post-migration-feature-memo]]

## Weekly Review
- Wins: UI/機能の現行パリティ実装を完了し、Transfer 系 RPC まで Supabase 側で接続
- Risks: 本番切替前の並走受け入れ検証（GAS比較）と運用手順最終化が残る
- Next Actions: ローカルで受け入れチェックリストを消化し、Git 反映後に Cloudflare 切替判断
