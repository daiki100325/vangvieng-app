---
tags: [project/v-mint2, type/note]
parent: [[V-MINT2.0/notes/_index]]
created: 2026-05-09
---

# テーブル設計 Q&A（2026-05-09 上司レビュー回答）

現行スキーマ（`supabase/schema.sql`, `supabase/cost_calculation.sql`）を基に各質問に回答する。

---

## BRANDS テーブル

### Q. 同ブランドの別ラインも別の name にするか？

**A. 現状どおり別行で管理する。ただし集約は `cost_group_id` で対応済み。**

現在の brands テーブルには Azure Gold Line / Azure Black Line、Tangiers Noir / Birquq / Burley / F-Line がそれぞれ個別行として存在する。これは棚卸し・移動記録・補充依頼で「銘柄単位の区別が必要」なためである。

一方、エアレジでは Azure 2種・Tangiers 4種を区別せず集計するため、原価計算では別ラインを1つに束ねる必要がある。これに対応するため `is_cost_group`（集約ブランドフラグ）と `cost_group_id`（集約先ブランドへの自己参照 FK）を既に追加済みで、原価計算モードでは個別ブランドの代わりに集約ブランド行を使う。

```
brands
  id | name                  | is_cost_group | cost_group_id
  -- | --------------------- | ------------- | -------------
  10 | Azure Gold Line        | FALSE         | 20   ← 集約先 id
  11 | Azure Black Line       | FALSE         | 20
  20 | Azure Gold/Black       | TRUE          | NULL ← 集約ブランド
  30 | Tangiers Noir          | FALSE         | 40
  31 | Tangiers Birquq        | FALSE         | 40
  ...
  40 | Tangiers               | TRUE          | NULL
```

→ 別の中間テーブル（brand_lines 等）は現時点では不要。将来的に集約パターンが複雑化した場合（例: 3段階の階層）に検討する。

---

### Q. サポートするパッケージ（50g / 100g / 250g 等）を BRANDS に入れるべきか？

**A. DB に入れることを推奨する。現状はフロントエンドの定数ファイルで管理しており、将来的に Admin 画面から操作できるようにするには DB 管理が適切。**

現状の実装は `src/constants/inventoryPackageRules.js` でブランドごとの許容サイズを配列定義しており、画面側でその定義に基づいて入力欄を表示・非表示している。

```js
// 現状（フロント定数）
'TG NOIR (Tangiers Noir)': { merchSizes: ['100', '250'], stockGramSizes: ['100', '250'] }
```

これを `brands` テーブルに持たせる場合の案：

```sql
ALTER TABLE brands
  ADD COLUMN supported_pkg_sizes text[] DEFAULT '{}';
  -- 例: '{50,100,250}', '{100}', '{50,250,1000}'
```

**メリット**
- Admin 画面からブランドごとのサイズを変更できる（コード変更不要）
- `merch_pkg_*` / `stock_pkg_*` の NULL vs 0 の意味を「非サポートサイズは NULL」と明確に分離できる
- 将来的に新ブランドを追加した際に定数ファイルのコード変更が不要

**デメリット**
- フロント側のフィルタロジックを定数参照から DB 参照に変更する必要がある
- 現状の運用規模では変更頻度が低く、オーバーエンジニアリングになる可能性

**推奨**: 近い将来 Admin 画面でブランドマスタを管理する可能性があるなら **今のうちに `brands` にカラム追加しておく**のが合理的。FLAVORS 単位の差異（同ブランド内でサイズが異なるフレーバーが存在するか）を確認した上で最終判断。現状は**ブランド単位で統一**されているため BRANDS が適切。

> **実装後追記（2026-05-12）**: 上記方針に基づき `brands` に追加したが、`text[]` 配列ではなく **サイズごとの boolean フラグ**（`has_pkg_50` / `has_pkg_100` / `has_pkg_125` / `has_pkg_200` / `has_pkg_250` / `has_pkg_1kg`）+ 設定完了マーカー（`packages_configured`）として実装した。理由は、UI 側で個別フラグを直接バインドできて Admin 画面の実装が単純になるため。migration: `20260512_add_brand_package_flags.sql`

---

## FLAVORS テーブル

### Q. サポートするパッケージはここに入れるべきか？

**A. BRANDS が適切。FLAVORS への配置は推奨しない。**

現状、同一ブランド内の全フレーバーは同じパッケージサイズを使う運用であり、フレーバー単位でサイズを個別管理する必要性は確認されていない。もしフレーバーごとに異なるサイズが発生するなら FLAVORS にカラムを追加する余地はあるが、その場合でも「BRANDS のデフォルト値を FLAVORS 側でオーバーライドする」構造にすると管理コストを下げられる。

現時点では **BRANDS にのみ追加し、FLAVORS は現状維持** を推奨する。

---

## INVENTORY_LOGS テーブル

### Q. `recorded_at` は何のデータか？

**A. 棚卸しを物理的に実施した日付（date 型）。**

入力画面で「実施日」として入力する値。`period_key` が「業務上どの月の計上か」を示すのに対し、`recorded_at` は「実際にいつ数えたか」を示す。例えば 1/1 に実施した棚卸しが 12 月分として計上される場合、`recorded_at = 2026-01-01`、`period_key = 202512` となる。

---

### Q. `period_key` は何のデータか？ `month_num` と重複しているか？

**A. 年込みの業務月キー（YYYYMM の整数）。`month_num` と意味が重複する部分はあるが役割が異なる。**

| カラム | 型 | 例 | 役割 |
|---|---|---|---|
| `period_key` | int | `202512` | UQ 制約の一部。年をまたいだ一意性を保証する主キー的な業務月。 |
| `month_num` | int | `12` | 月番号のみ（1〜12）。旧クエリとの互換のために残存。 |

`period_key` があれば `month_num` の情報は導出可能（`period_key % 100`）。将来的に `month_num` は廃止候補。現状は既存クエリへの影響が大きいため互換維持中。

---

### Q. `tupper_basic`, `tupper_reserve` はフィールドを増やすか？

**A. タッパーの種類が確定しているなら「フィールド追加」で対応。配列・別テーブル化は現状オーバースペック。**

現状は 2 フィールド（通常タッパー / 予備タッパー）。上司コメントのとおり 3 フィールドまで増やすことで「特別保管」「イベント用」等の将来ニーズに備えられる。

```sql
-- 追加案
ALTER TABLE inventory_logs ADD COLUMN tupper_extra numeric null;
```

**配列・別テーブルによる EAV 構造について（下の質問と合わせて）**：タッパーの上限が業務上ほぼ 2〜3 種で固定されているなら、固定カラムの方が集計クエリが単純で VIEW の維持コストも低い。EAV は将来的に「タッパー種別がユーザー定義で増える」場合に有効だが、現状の業務要件ではメリットが薄い。

---

### Q. `merch_pkg_*`, `stock_pkg_*` はここでいいか？

**A. データ（実際の数）はここに残す。「どのサイズをサポートするか」の定義だけ BRANDS に移す。**

`merch_pkg_50`, `stock_pkg_100` 等は棚卸し時の実測値であるため、`inventory_logs` に保持するのが自然。BRANDS / FLAVORS に置くべきなのは「このブランドは 50g と 250g しか扱わない」という**メタデータ**であり、両者は別の関心事。

整理すると：

| 何を | どこで |
|---|---|
| 実際の在庫数（何個あるか） | `inventory_logs` の `merch_pkg_*`, `stock_pkg_*` |
| そのブランドが扱うサイズ | `brands.supported_pkg_sizes`（追加推奨） |

---

### Q. `created_at` と `updated_at` は？

**A. `created_at` は行の初回挿入時刻（UTC timestamptz）。`updated_at` は直近の更新時刻（JST の timestamp without timezone）。**

`updated_at` のみ JST 固定なのは、画面上に「最終保存: xx時xx分」と表示する際に変換コストなく使えるようにしているため。`created_at` は Supabase 標準の UTC timestamptz。

---

### Q. EAV 的な別構成（tupper/merch/stock を別エントリで表現）について

**A. 現状の固定カラム方式を維持することを推奨する。**

EAV（1フレーバーあたり複数行にする構成）にした場合の得失：

| 観点 | EAV 構成 | 現状（固定カラム） |
|---|---|---|
| タッパー種類の追加 | DDL 変更不要（データ追加のみ） | DDL 変更が必要 |
| 棚卸し時のトランザクション数 | フレーバー × エントリ種類数 | フレーバー数（1行で済む） |
| 集計クエリの複雑さ | GROUP BY + CASE が必要 | 単純な SUM / COALESCE |
| UQ 制約 | `period_key + store_id + flavor_id + entry_type` | `period_key + store_id + flavor_id` |
| 現行 VIEW への影響 | `v_current_stock` の全面書き直し | 変更なし |

タッパー種類・パッケージ区分が業務上ほぼ固定されており、予見可能な拡張もせいぜいフィールド追加 1〜2 本なら **固定カラム方式が最適**。

---

## TRANSFER_LOGS テーブル

### Q. `block_index` は何のデータか？

**A. 同一移動伝票（1回の起票操作）に属する行をまとめる識別子。**

1 回の移動起票では「A ブランド X フレーバー 100g, B ブランド Y フレーバー 200g」のように複数フレーバーを一括記録するが、これらは同一の伝票として扱う必要がある。`block_index` はその伝票単位を示す IDENTITY 値で、`amend_transfer_record` RPC が同一ブロックの行をまとめて UPDATE / DELETE / INSERT するために使う。

---

### Q. `quantity` はグラム数のみでよいか？パッケージ単位に分けるべきか？

**A. グラム（g 換算）のままを推奨する。**

棚卸し・補充依頼・ダッシュボードなど下流のすべての計算がグラム単位で統一されている。パッケージ単位で記録すると「50g × 3 袋 = 150g」への変換が各所で必要になり、また将来的なパッケージ定義の変更時に過去データとの整合が取れなくなる。現場でパッケージ単位のままメモしたいなら `comment` カラムへの入力で補完可能。

---

## 全体構成について

### Q. BRANDS から引くラインテーブルは要るか？

**A. 現時点では不要。自己参照（`cost_group_id`）で十分。**

現状、「Azure Gold Line → Azure Gold/Black へ集約」という 2 段階の関係しか存在しない。この程度なら自己参照 FK（`cost_group_id`）で表現でき、JOIN が 1 本で済む。将来的に「ブランドファミリー → ライン → 個別ブランド」のような 3 段階以上の階層が必要になったら別テーブル化を検討する。

---

## 今後の展開：メニュー機能

### Q. フレーバーマスタを活用してメニューを作れるか？

**A. はい。段階的に対応できる。**

**シンプル案（フラグだけ追加）：**
```sql
ALTER TABLE flavors
  ADD COLUMN is_on_menu boolean NOT NULL DEFAULT false,
  ADD COLUMN menu_image_url text NULL;  -- Supabase Storage の公開 URL
```

`is_on_menu = true` のフレーバーをフィルタして表示するだけでメニュー画面が作れる。画像は Supabase Storage に保存し URL を格納する運用が最もシンプル。

**本格的なメニュー管理が必要な場合：**
```
menus          (id, name, store_id, published_at, …)
  └─ menu_items (id, menu_id, flavor_id, price, sort_order, image_url, …)
```

フレーバーは複数のメニューに登場し得る（通常メニュー / 季節限定 等）ため、多対多で管理できる `menu_items` テーブルで分離する構成が拡張性が高い。

**推奨フェーズ：**
1. まず `flavors.is_on_menu` + `menu_image_url` を追加してシンプルに表示
2. 複数メニュー・バージョン管理が必要になったら `menus` / `menu_items` に移行

---

## まとめ：優先度の高いスキーマ変更案

| 優先度 | 変更内容 | 影響範囲 | 実装ステータス（2026-05時点） |
|---|---|---|---|
| 高 | `brands` に `supported_pkg_sizes text[]` を追加 | Admin 画面・棚卸し入力画面のフィルタロジック | ✅ **実装済（仕様変更）** — `text[]` ではなく、サイズごとの boolean フラグ `has_pkg_50/100/125/200/250/1kg` + `packages_configured` として実装（migration `20260512_add_brand_package_flags.sql`）。Admin の `パッケージサイズ設定` サブモードから編集可能 |
| 中 | `inventory_logs` に `tupper_extra numeric` を追加（3本目タッパー） | 棚卸し入力画面 | ⬜ 未着手（業務要件未発生のため保留） |
| 中 | `flavors` に `is_on_menu boolean`, `menu_image_url text` を追加 | メニュー表示機能（新規） | ⬜ 未着手 |
| 低 | `month_num` 廃止（`period_key` へ完全移行） | 既存クエリの影響調査が必要 | ⬜ 未着手（互換維持中） |

## 2026-05 以降の関連スキーマ変更

本 Q&A 後に追加された主なスキーマ変更:

| 日付 | 変更 | マイグレーション |
|---|---|---|
| 2026-05-12 | `brands` にパッケージサイズフラグ列追加（上記 #1 の実装） | `20260512_add_brand_package_flags.sql` |
| 2026-05-13 | `cost_price_masters` テーブル新設（単位原価マスタ） | `20260513_add_cost_price_masters.sql` |
| 2026-05-14 | 補充依頼の前月消費量参照 RPC 更新 | `20260514_request_prev_month_consumption.sql` |
| 2026-05-17 | 全テーブルで RLS 有効化（anon 全許可） | `20260517_enable_rls_option_a.sql` |
| 2026-05-23 | `cost_reports` の価格6カラムを DROP（マスタ参照型へ刷新） | `20260523_drop_legacy_price_columns_from_cost_reports.sql` |

Source: [[V-MINT2.0/notes/V-MINT2.0_architecture]], [[V-MINT2.0/notes/V-MINT2.0_supabase-er-diagram]]
