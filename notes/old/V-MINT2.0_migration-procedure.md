---
tags: [project/v-mint2, type/note]
parent: [[V-MINT2.0/notes/_index]]
---

# V-MINT2.0 — 正式リリース移行手順

## ステータス

- 2026-05-11 時点で本手順による本番切替は完了
- 現在は運用フェーズのため、本ドキュメントは「再実施時の手順書・ロールバック参照」として保持

---

## 概要

V-MINT2.0 の正式リリースにあたり、以下の2点を実施する。

1. 既存の V-MINT の URL をそのまま引き継いで V-MINT2.0 を公開する（Cloudflare デプロイ先ブランチの切り替え）
2. シニマネを共同開発者として Git に招待し、複数人開発の基盤を整える

---

## (1) URL 引き継ぎ — Cloudflare デプロイブランチの切り替え

### 前提

- 現行 V-MINT は既存 Git リポジトリ（`daiki100325/vangvieng-app`）の `main` ブランチを Cloudflare Pages に接続してデプロイされている
- V-MINT2.0 のコードは同リポジトリに新規ブランチとして追加し、そのブランチを Cloudflare の接続先に切り替えることで同一 URL を維持する

### 手順

#### Step 1: ローカルで V-MINT2.0 用ブランチを作成する

```bash
# 現行リポジトリに移動（V-MINT のローカルフォルダ）
cd path/to/V-MINT

# 最新の main を取得
git fetch origin
git checkout main
git pull origin main

# 2.0 用ブランチを作成
git checkout -b v2
```

#### Step 2: V-MINT2.0 のコードを v2 ブランチにコピーする

`C:\Obsidian Vault\V-MINT2.0\` 配下の以下のファイル群を、V-MINT リポジトリのルートに上書きコピーする。

```
src/
public/
index.html
package.json
package-lock.json
vite.config.js
tailwind.config.js（存在する場合）
.env.example
```

> **注意:** `.env.local` はコピーしない。本番環境変数は Cloudflare の環境変数設定で管理する（後述）。

#### Step 3: ビルド確認してからプッシュする

```bash
# 依存関係をインストール
npm install

# ビルドが通ることを確認
npm run build

# v2 ブランチをリモートへプッシュ
git add .
git commit -m "feat: V-MINT2.0 — Supabase + Vue3 SPA への移行"
git push origin v2
```

#### Step 4: Cloudflare Pages のデプロイブランチを切り替える

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログインする
2. **Workers & Pages** → 対象プロジェクト（V-MINT）を選択
3. **設定（Settings）** → **Builds & deployments** を開く
4. **Production branch** の現在値（`main`）を **`v2`** に変更して保存する
5. Cloudflare が自動でビルドを開始するのを待ち、デプロイ完了を確認する

#### Step 5: 本番環境変数を設定する

Cloudflare Pages の環境変数に Supabase の接続情報を追加する。

1. **Settings** → **Environment variables** を開く
2. **Production** 環境に以下を追加する：

| 変数名 | 値 |
|---|---|
| `VITE_SUPABASE_URL` | SupabaseプロジェクトのURL |
| `VITE_SUPABASE_ANON_KEY` | Supabaseの anon/public key |

3. 保存後、Cloudflare が再デプロイを実行するのを待つ

#### Step 6: 動作確認

- 既存の V-MINT URL にアクセスし、V-MINT2.0 の画面が表示されることを確認する
- PIN 認証 → ポータル → 各アプリ（棚卸し / 移動記録 / 補充依頼 / ダッシュボード / 原価計算）の基本動作をスモークテストする

> **ロールバック:** 問題が発生した場合は、Cloudflare の **Production branch** を `main` に戻すだけで即時切り戻しができる。

---

## (2) 共同開発の基盤整備 — シニマネの招待

### 前提

- GitHub リポジトリを使用している（`github.com/daiki100325/vangvieng-app`）
- 招待するシニマネの GitHub アカウントが存在する（アカウントが未作成の場合は事前に作成してもらう）

### 手順

#### Step 1: リポジトリに Collaborator として招待する

1. [GitHub](https://github.com/) にオーナーアカウントでログインする
2. 対象リポジトリ（`vangvieng-app`）を開く
3. **Settings** → **Collaborators** を開く
4. **Add people** ボタンをクリックする
5. シニマネの GitHub ユーザー名またはメールアドレスを入力し、**Add [username] to this repository** をクリックする
6. シニマネに招待メールが届くので、承認してもらう（承認前はコードの push 不可）

#### Step 2: 招待の承認（シニマネ側の作業）

シニマネはメール内の **Accept invitation** リンクをクリックするか、以下の URL から承認する：

```
https://github.com/daiki100325/vangvieng-app/invitations
```

#### Step 3: ローカル環境のセットアップ（シニマネ側の作業）

```bash
# リポジトリをクローン
git clone https://github.com/daiki100325/vangvieng-app.git
cd vangvieng-app

# v2 ブランチに切り替え
git checkout v2

# 依存関係をインストール
npm install

# .env.local を作成（.env.example をコピーして Supabase 接続値を記入）
cp .env.example .env.local
# → .env.local に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定

# 開発サーバー起動
npm run dev
```

#### Step 4: 開発フローの共通ルール（任意）

複数人開発での混乱を防ぐため、以下のルールを共有しておくことを推奨する。

| ルール | 内容 |
|---|---|
| 作業ブランチ | `v2` を直接触らず、`feature/xxx` ブランチを切って作業する |
| マージ方法 | Pull Request を通じてレビュー後に `v2` へマージする |
| プッシュ前ゲート | `npm run build` が通ることを確認してからプッシュする |
| `.env.local` | `.gitignore` 対象のため、各自でローカルに作成する（コミット不可） |

---

## 更新履歴

| 日付 | 内容 |
|---|---|
| 2026-05-10 | 初版作成 — Cloudflare ブランチ切替手順 + シニマネ招待手順 |
| 2026-05-11 | 本番切替完了ステータスを追記、運用フェーズ向け参照手順として明確化 |
