# TROUBLESHOOTING

## Case: 入荷で新規銘柄追加に失敗する
- Date: 2026-04-13
- Severity: Medium
- Owner: (project)

### Symptoms
- 入荷画面の「この銘柄を追加」でエラーが表示される
- 「この銘柄は既に登録済みです。」または「現在ほかのユーザーが書き込み中です。」が出る

### Cause
- 既に同じ A列ブランド + B列フレーバーが存在する
- 別ユーザーの同時更新により `LockService` が取得できない

### Fix
- 重複の場合は既存銘柄をそのまま選択して入荷入力する
- 競合の場合は数秒待って再実行する

### Prevention
- 新規追加前に対象月の銘柄名を確認し、表記ゆれ（空白・記号違い）を避ける
- 同時操作が多い時間帯は連続追加を避ける

### Links
- Dev log: [[V-MINT/CHANGELOG_DEV]]
- Decision: [[V-MINT/DECISIONS]]

## Case: <issue-title>
- Date: YYYY-MM-DD
- Severity: Low | Medium | High
- Owner:

### Symptoms
- 

### Cause
- 

### Fix
- 

### Prevention
- 

### Links
- Dev log: [[V-MINT/CHANGELOG_DEV]]
- Decision: [[V-MINT/DECISIONS]]
