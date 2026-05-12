---
tags: [project/v-mint2, type/plan]
parent: [[V-MINT2.0/notes/_index]]
status: draft
created: 2026-05-12
---

# V-MINT2.0 — 実装計画: 単位原価・販売値制御

## 概要

管理者画面に **「単位原価・販売値制御」サブモード** を新設し、原価計算で使用するフレーバー単価・炭単価・販売値（シーシャ料金・チャージ料金）を `period_key` 単位で管理可能にする。改定前の履歴は変更せず、改定以降の新規レコードに新しい価格が自動適用される。

---

## 背景と現状の問題点

### 現状

`cost_reports` テーブルは以下の価格カラムを持ち、レコード作成時に DB の DEFAULT 値で固定される：

| カラム | DEFAULT | 意味 |
|---|---|---|
| `price_flavor_per_g` | `40` | フレーバー1gあたり原価（円） |
| `price_charcoal_per_kg` | `600` | 炭1kgあたり原価（円） |
| `price_hookah_first` | `1900` | 1本目料金（円） |
| `price_hookah_refill` | `1800` | おかわり料金（円） |
| `price_hookah_staff` | `1800` | スタッフ料金（円） |
| `price_charge` | `900` | チャージ料金（円） |

`upsertCostReport` はフロントエンドから `price_*` を渡さないため、新規レコードは常に上記のハードコード値がそのまま保存される。

ER 図注記には「価格定数は価格改定に対応するためスナップショット保存」と書かれているが、**実際には全期間で同じ値が入り続けており、改定に対応できていない。**

### 問題の具体例

- 2026年4月まで炭1kgあたり600円だったが、2026年5月から700円に値上がりしたケースを考える(実際にはそのような予定は現状無い)
- 現状では `cost_reports` に5月分を新規保存しても炭原価は600円のまま
- 手動で SQL を叩かない限り正しい価格に更新できない

---

## 設計方針

1. **`cost_price_masters` テーブル新設** — 価格改定の有効開始月（`effective_from: YYYYMM`）と各価格を保持。店舗横断で一律（店舗ごとの価格差は現時点で不要）。
2. **前方踏襲ロジック** — 指定 `period_key` に対して `effective_from <= period_key` のうち最大の `effective_from` を持つレコードを使用。改定がない月は前回の価格を自動継承。
3. **スナップショット保存を完成させる** — `CostApp.vue` で新規 `cost_reports` 作成時に `cost_price_masters` から解決した価格を `price_*` フィールドとして明示的に渡す。
4. **既存レコードは変更しない** — 保存済み `cost_reports` の `price_*` カラムはそのまま（DB DEFAULT のスナップショット）。履歴として参照可能。
5. **管理者画面で改定管理** — AdminApp.vue にサブモード追加。改定追加・削除・履歴確認が可能。

---

## DB 設計

### 新テーブル: `cost_price_masters`

```sql
CREATE TABLE cost_price_masters (
  id bigserial PRIMARY KEY,
  effective_from int NOT NULL,              -- YYYYMM (適用開始月)
  price_flavor_per_g numeric NOT NULL,     -- フレーバー原価 (円/g)
  price_charcoal_per_kg numeric NOT NULL,  -- 炭原価 (円/kg)
  price_hookah_first int NOT NULL,         -- 1本目料金 (円)
  price_hookah_refill int NOT NULL,        -- おかわり料金 (円)
  price_hookah_staff int NOT NULL,         -- スタッフ料金 (円)
  price_charge int NOT NULL,               -- チャージ料金 (円)
  note text,                               -- 改定理由メモ
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(effective_from)
);
```

### 初期データ（マイグレーション時に挿入）

```sql
-- 運用開始時の初期価格（既存 cost_reports の DEFAULT 値と一致させる）
INSERT INTO cost_price_masters
  (effective_from, price_flavor_per_g, price_charcoal_per_kg,
   price_hookah_first, price_hookah_refill, price_hookah_staff, price_charge, note)
VALUES
  (202501, 40, 600, 1900, 1800, 1800, 900, '運用開始時の初期設定');
```

> **NOTE:** `effective_from` の最小値 `202501` は既存 `cost_reports` の最小 `period_key` 以前に設定し、全過去レコードに対して整合性を持たせる。実際の運用開始月が異なる場合は調整する。

### マイグレーションファイル

`supabase/migrations/20260512_add_cost_price_masters.sql`

---

## 価格解決ロジック

### Supabase クエリ（`api.js` 側で実装）

```js
// 指定 period_key に適用される価格マスタを1件取得
async function getActiveCostPrice(periodKey) {
  const pk = normalizePeriodKey(periodKey)
  const { data, error } = await supabase
    .from('cost_price_masters')
    .select('*')
    .lte('effective_from', pk)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single()
  if (error) throw error
  return data
}
```

- `effective_from <= period_key` を満たす中で最新のレコードを返す
- レコードが0件の場合（将来的なエラー防止）はエラーをスローし、UI 側でフォールバック値（DB DEFAULT と同じ値）を使用する

---

## api.js への追加関数

| 関数名 | 用途 |
|---|---|
| `getActiveCostPrice(periodKey)` | 指定期間に適用される価格1件を取得 |
| `getCostPriceMasters()` | 全改定履歴を `effective_from DESC` 順で取得 |
| `addCostPriceMaster(row)` | 新規改定を追加（`effective_from` の重複は Supabase UNIQUE 制約でエラー） |
| `deleteCostPriceMaster(id)` | 改定を削除（最後の1件は削除不可をフロント側で制御） |

---

## CostApp.vue の変更

### `startCostEntry()` の変更箇所

新規レコード作成パス（`if (!existing)` ブロック）で `getActiveCostPrice(periodKey)` を呼び出し、価格を取得して `form.prices` に保持する。

```js
// 変更前: price_* は DB DEFAULT まかせ
// 変更後: 取得した価格をフォームステートに保持

const [existing, brands, consumptionMap, prevReport, activePrices] = await Promise.all([
  getCostReport(this.selectedStoreKey, this.periodKey),
  getBrandsForCost(),
  getBrandConsumptionForCost(this.selectedStoreKey, this.periodKey),
  prevPeriodKey ? getCostReport(this.selectedStoreKey, prevPeriodKey).catch(() => null) : Promise.resolve(null),
  getActiveCostPrice(this.periodKey).catch(() => null)   // 追加
])
```

既存レコードがある場合は `cost_reports` の `price_*` をそのまま使い（スナップショット保存済み）、新規の場合は `activePrices` から価格を取得する。

### `saveCostReport()` の変更箇所（`upsertCostReport` 呼び出し）

`price_*` フィールドを明示的に渡すよう変更する：

```js
const reportId = await upsertCostReport(this.selectedStoreKey, this.periodKey, {
  // ...既存フィールド...
  price_flavor_per_g: this.form.prices.priceFlavorPerG,
  price_charcoal_per_kg: this.form.prices.priceCharcoalPerKg,
  price_hookah_first: this.form.prices.priceHookahFirst,
  price_hookah_refill: this.form.prices.priceHookahRefill,
  price_hookah_staff: this.form.prices.priceHookahStaff,
  price_charge: this.form.prices.priceCharge
})
```

既存レコードを再保存する場合もスナップショット時の `price_*` を引き継いで渡す（変更しない）。

---

## AdminApp.vue の変更

### 新サブモード: `unit-price-control`

#### メニュー追加

管理メニュー選択画面に以下のボタンを追加：

```
💴  単位原価・販売値設定
    各期間に適用されるフレーバー原価・炭原価・販売値を管理します
```

#### サブモード UI 構成

※改定履歴はあくまでイメージ。実際には2026年5月からの原価改定の事実はない。

```
[管理メニューへ戻る]

単位原価・販売値設定
各期間の価格改定を管理します。改定後の期間には新しい価格が自動適用されます。

━━ 改定履歴 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────────────────────────────────────────────┐
│ 2026年5月〜          [最新]                      [削除]  │
│ フレーバー: 40円/g   炭: 700円/kg                        │
│ 1本目: 1,900円   おかわり: 1,800円   スタッフ: 1,800円  │
│ チャージ: 900円                                          │
│ メモ: 炭原価値上がりのため                               │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ 2025年1月〜 ～ 2026年4月まで           [削除不可]        │
│ フレーバー: 40円/g   炭: 600円/kg                        │
│ 1本目: 1,900円   おかわり: 1,800円   スタッフ: 1,800円  │
│ チャージ: 900円                                          │
│ メモ: 運用開始時の初期設定                               │
└──────────────────────────────────────────────────────────┘

━━ 新しい改定を追加 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

適用開始月:  [年セレクト▼] [月セレクト▼]
フレーバー原価:   [  40  ] 円/g
炭原価:           [ 700  ] 円/kg
1本目料金:        [1,900 ] 円
おかわり料金:     [1,800 ] 円
スタッフ料金:     [1,800 ] 円
チャージ料金:     [  900 ] 円
メモ（任意）:     [              ]

[追加する]
```

#### 改定履歴の表示ルール

- `effective_from` 降順で表示
- 各レコードに「〇〇年〇月〜」の適用開始月を表示
- 次のレコードが存在する場合は「〜〇〇年〇月まで」の終了月も表示（次レコードの `effective_from` の前月）
- 最初（最古）の1件は削除不可（削除ボタンをグレーアウト）
- 削除時は確認ダイアログを表示

#### フォームの初期値

「新しい改定を追加」フォームは、最新改定レコードの価格を初期値として自動プリフィル（前回値のコピー）。

---

## データ整合性・移行方針

### 既存 `cost_reports` レコードへの影響

**変更なし。** 既存レコードはすべて `price_* = DB DEFAULT` で保存されているため、`cost_price_masters` の初期レコードと同一の価格が記録されていることになる。

管理画面の「改定履歴」で「2025年1月〜 ～ 2026年4月まで: 各種価格(DEFAULT)」が表示され、過去の計算根拠として参照できる。

### 既存 `cost_reports` の `price_*` カラムの DEFAULT 廃止

マイグレーション後は DB DEFAULT は残しても問題ないが、フロントエンドから明示的に `price_*` を渡すため、DEFAULT が実際に使われるケースはなくなる。将来的には DEFAULT を削除してもよい（今回は変更しない）。

### RLS

`cost_price_masters` は既存の `cost_reports` と同様のポリシーを適用する（読み取り open、書き込みは認証済みユーザーのみ、または既存の anon key ポリシーに準拠）。

---

## 実装順序

### Phase 1: DB・バックエンド

1. `supabase/migrations/20260512_add_cost_price_masters.sql` 作成・適用
   - テーブル DDL
   - 初期レコード INSERT（`effective_from = 202501`、既存 DEFAULT 値を使用）
   - RLS 設定
2. `api.js` に4関数追加
   - `getActiveCostPrice(periodKey)`
   - `getCostPriceMasters()`
   - `addCostPriceMaster(row)`
   - `deleteCostPriceMaster(id)`
3. `supabase/cost_calculation.sql` に `cost_price_masters` DDL を追記（ドキュメント整合）
4. ER 図（`V-MINT2.0_supabase-er-diagram.md`）更新

### Phase 2: CostApp.vue 修正

5. `form` ステートに `prices` オブジェクトを追加
6. `startCostEntry()` で `getActiveCostPrice()` を呼び出し、新規レコード作成時の価格を設定（既存レコードは `cost_reports.price_*` から取得）
7. `saveCostReport()` で `price_*` を明示的に `upsertCostReport` に渡す

### Phase 3: AdminApp.vue 新サブモード

8. 管理メニューに「単位原価・販売設定」ボタン追加
9. `unit-price-control` サブモードの実装
   - 改定履歴一覧表示
   - 削除（最古1件を除く）
   - 新規改定追加フォーム

---

## 未解決の検討事項（実装前に確認すること）

| 項目                       | 検討ポイント                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| 店舗別価格の将来対応               | 現在は全店舗一律。将来的に店舗ごとに炭原価が異なるケースが生じた場合、`cost_price_masters` に `store_id` カラムを追加する拡張を検討。今回は対応しない。             |
| 初期レコードの `effective_from` | `202501` を仮置きしているが、実際の運用開始 `period_key` に合わせる。既存 `cost_reports` の最小 `period_key` 以前に設定すること。→202501で問題なし。 |
| 既存レコードの `price_*` 補正     | 現在すべて DEFAULT 値。将来的に「あの月は実は炭が650円だった」とわかった場合の修正フローは今回スコープ外。                                              |
| `effective_from` の重複制御   | DB UNIQUE 制約でエラーになる。フロント側でも「同月の改定は既存を上書き？ or エラー？」を決定する。現時点は別月のみ追加可能（同月はエラー表示）とする。                       |

---

## 関連ファイル

- `supabase/cost_calculation.sql` — 既存 DDL（`cost_price_masters` 追記予定）
- `supabase/migrations/20260512_add_cost_price_masters.sql` — 新規マイグレーション（Phase 1）
- `src/api.js` — 追加関数（Phase 1）
- `src/components/apps/CostApp.vue` — 修正（Phase 2）
- `src/components/apps/AdminApp.vue` — サブモード追加（Phase 3）
- [[V-MINT2.0/notes/V-MINT2.0_architecture]]
- [[V-MINT2.0/notes/V-MINT2.0_supabase-er-diagram]]
- [[V-MINT2.0/DECISIONS]]
