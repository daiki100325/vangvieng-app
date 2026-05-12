---
tags: [v-mint2.0, plan, supabase, inventory]
created: 2026-05-12
status: 実行済み
---

# パッケージサイズ表示ルール DB化 実装計画

## 背景・問題

棚卸し入力モードでは、ブランドごとに存在しないパッケージサイズの入力欄を非表示にする仕様がある。
現在このロジックは `src/constants/inventoryPackageRules.js` にブランド名文字列でハードコードされており、
ブランドを追加・変更するたびにソースコードの修正とデプロイが必要な状態。

---

## 現状の残存コード確認

### ハードコード箇所

**`src/constants/inventoryPackageRules.js`**（全体がハードコード）

```js
const BRAND_RULES = {
  'AF (Al Fakher)':          { merchSizes: ['50', '250'],          stockGramSizes: ['50', '250'] },
  'AZ (Afzal)':              { merchSizes: ['50', '250'],          stockGramSizes: ['50', '250'] },
  'AZR GOLD (Azure Gold Line)': { merchSizes: ['100'],             stockGramSizes: ['100'] },
  'AZR BLACK (Azure Black Line)': { merchSizes: ['100'],           stockGramSizes: ['100'] },
  'DBJ (Debaj)':             { merchSizes: ['50'],                 stockGramSizes: ['50'] },
  'FM (Fumari)':             { merchSizes: ['100'],                stockGramSizes: ['100'] },
  'HF (Hookafina)':          { merchSizes: ['100'],                stockGramSizes: ['100'] },
  'MH (Musthave)':           { merchSizes: [],                     stockGramSizes: [] },  // パッケージなし
  'SB (Starbuzz/Bold)':      { merchSizes: ['100', '250'],         stockGramSizes: ['100', '250'] },
  'SS (Social Smoke)':       { merchSizes: ['100', '250', '1kg'],  stockGramSizes: ['100', '250', '1kg'] },
  'TF (Trifecta)':           { merchSizes: ['100', '250'],         stockGramSizes: ['100', '250'] },
  'TG NOIR (Tangiers Noir)': { merchSizes: ['100', '250'],         stockGramSizes: ['100', '250'] },
  'TG BURLEY (Tangiers Burley)': { merchSizes: ['100', '250'],     stockGramSizes: ['100', '250'] },
  'TG BIRQUQ (Tangiers Birquq)': { merchSizes: ['100', '250'],     stockGramSizes: ['100', '250'] },
  'TG F-LINE (Tangiers F-Line)': { merchSizes: ['100', '250'],     stockGramSizes: ['100', '250'] },
}
```

### 呼び出し箇所

| ファイル | 行 | 内容 |
|---|---|---|
| `InventoryApp.vue` | ~807 | `visibleMerchSizes(item)` computed |
| `InventoryApp.vue` | ~810 | `visibleStockGramSizes(item)` computed |
| `InventoryApp.vue` | ~183-191 | Step2 物販入力フォーム（`v-for="size in visibleMerchSizes(item)"`） |
| `InventoryApp.vue` | ~226-234 | Step3 在庫入力フォーム（`v-for="size in visibleStockGramSizes(item)"`） |
| `InventoryApp.vue` | ~820-836 | 確認テーブル用プレビューフォーマット |

### 現在のフォールバック動作

- `BRAND_RULES` に存在しないブランド → 全サイズ `['50','100','125','200','250','1kg']` を表示
- `MH (Musthave)` のみ空配列（パッケージ入力欄ゼロ）

---

## 設計方針

### DB スキーマ変更

`brands` テーブルに以下の7カラムを追加する。

```
has_pkg_50           boolean NOT NULL DEFAULT false
has_pkg_100          boolean NOT NULL DEFAULT false
has_pkg_125          boolean NOT NULL DEFAULT false
has_pkg_200          boolean NOT NULL DEFAULT false
has_pkg_250          boolean NOT NULL DEFAULT false
has_pkg_1kg          boolean NOT NULL DEFAULT false
packages_configured  boolean NOT NULL DEFAULT false
```

#### `packages_configured` フラグを設ける理由

| 状態 | 意味 | 表示挙動 |
|---|---|---|
| `packages_configured = false` | 未設定（新規ブランドのデフォルト） | 全サイズ表示（現行フォールバックと同じ、安全） |
| `packages_configured = true` + 一部 `has_pkg_* = true` | 有パッケージブランド | `true` のサイズのみ表示 |
| `packages_configured = true` + 全 `has_pkg_* = false` | パッケージなしブランド（MH 等） | 入力欄ゼロ（タッパーのみ） |

`packages_configured` なしで「全 false = フォールバック」とすると、
Musthave のような「意図的にゼロ」と「未設定」が区別できなくなる。

### アプリ側の変更

- `api.js` の `getSheetData` で brands から上記7カラムも取得し、`item.brandData` として各 item に載せる
- `inventoryPackageRules.js` を `item.brandData` のフラグを参照するよう書き替え、`BRAND_RULES` 辞書を削除
- `InventoryApp.vue` の変更は不要（`visibleMerchSizes` / `visibleStockGramSizes` の呼び出し形式は変わらない）

---

## 実装手順

### Step 1 — Migration SQL の作成・適用

ファイル: `supabase/migrations/20260512_add_brand_package_flags.sql`

```sql
-- 1. カラム追加
alter table brands
  add column if not exists has_pkg_50          boolean not null default false,
  add column if not exists has_pkg_100         boolean not null default false,
  add column if not exists has_pkg_125         boolean not null default false,
  add column if not exists has_pkg_200         boolean not null default false,
  add column if not exists has_pkg_250         boolean not null default false,
  add column if not exists has_pkg_1kg         boolean not null default false,
  add column if not exists packages_configured boolean not null default false;

-- 2. 既存ブランドのバックフィル
update brands set packages_configured=true, has_pkg_50=true,  has_pkg_250=true  where name = 'Al Fakher';
update brands set packages_configured=true, has_pkg_50=true,  has_pkg_250=true  where name = 'Afza)';
update brands set packages_configured=true, has_pkg_100=true                    where name = 'Azure Gold Line';
update brands set packages_configured=true, has_pkg_100=true                    where name = 'Azure Black Line';
update brands set packages_configured=true, has_pkg_50=true                     where name = 'Debaj';
update brands set packages_configured=true, has_pkg_100=true                    where name = 'Fumari';
update brands set packages_configured=true, has_pkg_100=true                    where name = 'Hookafina';
update brands set packages_configured=true                                       where name = 'Musthave';  -- 全パッケージなし
update brands set packages_configured=true, has_pkg_100=true, has_pkg_250=true  where name = 'Starbuzz/Bold';
update brands set packages_configured=true, has_pkg_100=true, has_pkg_250=true, has_pkg_1kg=true where name = 'Social Smoke';
update brands set packages_configured=true, has_pkg_100=true, has_pkg_250=true  where name = 'Trifecta';
update brands set packages_configured=true, has_pkg_100=true, has_pkg_250=true  where name = 'Tangiers Noir';
update brands set packages_configured=true, has_pkg_100=true, has_pkg_250=true  where name = 'Tangiers Burley';
update brands set packages_configured=true, has_pkg_100=true, has_pkg_250=true  where name = 'Tangiers Birquq';
update brands set packages_configured=true, has_pkg_100=true, has_pkg_250=true  where name = 'Tangiers F-Line';

-- 追加ブランド（後日適用分）
update brands set packages_configured=true, has_pkg_50=true                               where name = 'Al Waha Elite Edition';
update brands set packages_configured=true, has_pkg_50=true                               where name = 'Dozaj';
update brands set packages_configured=true, has_pkg_50=true                               where name = 'Gixom';
update brands set packages_configured=true, has_pkg_50=true                               where name = 'Revoshi';
update brands set packages_configured=true, has_pkg_50=true,  has_pkg_200=true            where name = 'Fantasia';
update brands set packages_configured=true, has_pkg_50=true,  has_pkg_250=true            where name = 'Mazaya';
```

### Step 2 — `api.js` の修正

**対象:** `getSheetData` 内のフレーバー取得クエリ（現行 line ~741）

```js
// 変更前
.select('id,name,is_active,brands(name)')

// 変更後
.select('id,name,is_active,brands(name,short_name,packages_configured,has_pkg_50,has_pkg_100,has_pkg_125,has_pkg_200,has_pkg_250,has_pkg_1kg)')
```

item マッピング部分（現行 line ~825）に `brandData` を追加:

```js
// 変更前
brand: flavor.brands?.name || '',

// 変更後
brand: flavor.brands?.name || '',
brandData: flavor.brands || null,
```

### Step 3 — `inventoryPackageRules.js` の書き替え

`BRAND_RULES` 辞書を丸ごと削除し、`brandData` のフラグを参照する形に変更。

```js
export const ALL_INVENTORY_PACKAGE_SIZES = ['50', '100', '125', '200', '250', '1kg']

// サイズ文字列 → DB カラム名のマッピング
const SIZE_TO_COLUMN = {
  '50':  'has_pkg_50',
  '100': 'has_pkg_100',
  '125': 'has_pkg_125',
  '200': 'has_pkg_200',
  '250': 'has_pkg_250',
  '1kg': 'has_pkg_1kg',
}

function resolveVisibleSizes(item) {
  const bd = item?.brandData
  // packages_configured が false（未設定）の場合は全サイズを返す（フォールバック）
  if (!bd || !bd.packages_configured) return ALL_INVENTORY_PACKAGE_SIZES.slice()
  return ALL_INVENTORY_PACKAGE_SIZES.filter(size => bd[SIZE_TO_COLUMN[size]] === true)
}

export function getVisibleMerchSizes(item) {
  return resolveVisibleSizes(item)
}

export function getVisibleStockGramSizes(item) {
  return resolveVisibleSizes(item)
}
```

> **注:** 現在 merch と stock のサイズは全ブランドで同一のため、共通関数に統合。
> 将来的に merch/stock で異なるサイズが必要になった場合は、
> `has_merch_pkg_*` / `has_stock_pkg_*` のカラム分割で対応可能。

### Step 4 — InventoryApp.vue の確認（修正不要）

`visibleMerchSizes(item)` と `visibleStockGramSizes(item)` の呼び出し形式は変わらないため、
`InventoryApp.vue` 本体の修正は**不要**。

ただし、`loadInventoryData` でローカルストレージから復元したアイテムには
`brandData` が含まれない可能性があるため、復元時に再付与するか、
`resolveVisibleSizes` のフォールバック（全サイズ表示）に委ねる。
→ 後者（フォールバックに委ねる）で十分。ローカルドラフトは短命データのため問題なし。

### Step 5 — AdminApp での設定 UI（将来対応・任意）

新ブランド追加時に `packages_configured` と `has_pkg_*` を設定できる UI を AdminApp に追加することで、
今後は Supabase の管理コンソールを使わずに設定変更が完結する。
ただし現時点ではブランド追加頻度が低いため、Supabase ダッシュボード直編集で代替可能。

---

## 影響範囲の整理

| ファイル | 変更 | 備考 |
|---|---|---|
| `supabase/migrations/20260512_...sql` | 新規作成 | Supabase で実行 |
| `src/api.js` | 約2行変更 | select クエリ + item マッピング |
| `src/constants/inventoryPackageRules.js` | 全面書き替え | BRAND_RULES 削除、brandData 参照に変更 |
| `src/components/apps/InventoryApp.vue` | **変更なし** | 呼び出しインターフェース不変 |

---

## リスクと注意点

1. **Supabase への migration 適用は本番データに影響する**
   - `add column if not exists` + `default false` のため、既存データへの破壊的影響なし
   - バックフィルの UPDATE は WHERE 条件が brand.name の完全一致なので、
     名前の揺れがある場合は反映されない → 事前に `select name from brands` で確認推奨

2. **`schema.sql` との整合**
   - migration を適用後、`schema.sql` にもカラム定義を追記しておくこと

3. **ローカルドラフト復元時の挙動**
   - `brandData` なしでフォールバック（全サイズ表示）になるが、
     ドラフトはタッパー・個数入力の途中保存が目的であり、許容範囲内

---

## 作業チェックリスト

- [x] `select name from brands` で現行ブランド名を確認し、BRAND_RULES のキーと一致するかチェック
- [x] `supabase/migrations/20260512_add_brand_package_flags.sql` を作成
- [x] Supabase ダッシュボード（または CLI）でマイグレーション実行
- [x] `schema.sql` にカラム定義を追記
- [x] `src/api.js` の select クエリと item マッピングを修正
- [x] `src/constants/inventoryPackageRules.js` を書き替え
- [x] ローカル開発環境で棚卸し入力モードを開き、各ブランドのパッケージ表示を目視確認
- [x] `MH (Musthave)` のフレーバーで入力欄がゼロになることを確認
- [x] 未設定ブランドがあれば全サイズ表示になることを確認
- [x] 追加ブランド（Al Waha Elite Edition / Dozaj / Gixom / Revoshi / Fantasia / Mazaya）のパッケージルールを適用
