# 管理者画面 実装計画

## 目的

V-MINT2.0 に `admin` モードを追加し、配下に2つのサブモードを持つ「管理者画面」を実装する。

- **(1) フレーバー表示制御**: flavors テーブルの `is_active` カラムをUI上で切り替え、各フレーバーのアプリ内表示/非表示を管理者が操作できるようにする。
- **(2) 新フレーバー追加**: 移動記録モード「入荷」サブモードにある新フレーバー追加UIと同等の機能を管理者画面からも実行できるようにする。

---

## 前提・現状把握

### モード管理 (`App.vue`)
- `appMode` を文字列で切り替え: `null | 'inventory' | 'transfer' | 'request' | 'dashboard' | 'cost'`
- 各モードは `<main v-if="appMode === 'xxx'">` でマウント/アンマウント
- `openXxxApp()` メソッドで `appMode` を設定

### PortalMenu (`PortalMenu.vue`)
- カード型ボタン（grid-cols-1 md:grid-cols-2）が5枚
- 各カードから `open-xxx` イベントを emit し App.vue がハンドル

### AppHeader (`AppHeader.vue`)
- `appMode` 値をそのまま三項演算子の連鎖で日本語タイトルに変換（行 22-23）
- `admin` モードを追加する際にここも更新が必要

### フレーバーマスタ (`supabase/schema.sql`)
```sql
create table if not exists flavors (
  id         bigserial primary key,
  brand_id   bigint not null references brands(id),
  name       text not null,
  is_active  boolean not null default true,
  unique (brand_id, name)
);
```
- `is_active = true` のフレーバーのみを全モード（棚卸し・移動記録・補充依頼・ダッシュボード）で使用
- `is_active = false` にしてもデータは残る（過去の記録を破壊しない設計）

### ダッシュボードでの is_active 扱い
- `DashboardApp.vue` には `is_active` の直接参照なし
- RPC（`rpc.sql`）内の `fetch_transfer_flavors` 等で `where f.is_active = true` のフィルタが掛かっている
- **フレーバーを非表示にすると、そのフレーバーはダッシュボードの集計グリッドからも除外される**（既存の RPC 設計による）

### 既存 API (`api.js`)
| 関数 | 状態 | 概要 |
|---|---|---|
| `getOrderedFlavorsWithBrand()` | プライベート | 全フレーバー（is_active問わず）+ ブランド情報を取得 |
| `addFlavorForArrival(payload)` | export 済 | ブランド検索/作成 → フレーバー重複チェック → `is_active: true` で insert |
| is_active の一括 update | **未実装** | 新規追加が必要 |

### 新フレーバー追加UI (`TransferApp.vue` 行 112-132)
移植対象のUI要素とロジック:
- `arrivalSelectedBrand` / `arrivalNewBrandShortName` / `arrivalNewBrandFormalName` / `arrivalNewFlavorName` (data)
- `arrivalBrandOptions` / `arrivalResolvedBrand` / `arrivalBrandValidationMessage` / `arrivalFlavorValidationMessage` / `arrivalAddDisabled` (computed)
- `addArrivalFlavor()` (methods) → `addFlavorForArrival()` API を呼ぶ

---

## 手順案

### Step 1: api.js 更新

**1-1. `getOrderedFlavorsWithBrand()` を public export に変更**

現状プライベートな内部関数を export 化（または同等の `getAllFlavorsWithBrand()` を追加）。
全フレーバー（is_activeに関係なく）をブランド情報付きで返す。

```js
// 変更前
async function getOrderedFlavorsWithBrand() { ... }

// 変更後
export async function getAllFlavorsWithBrand() { ... }
```

**1-2. `batchUpdateFlavorIsActive(updates)` を追加**

```js
// updates: [{ id: number, is_active: boolean }, ...]
export async function batchUpdateFlavorIsActive(updates) {
  // supabase.from('flavors').upsert([...]) または
  // 変更分のみ Promise.all で update
}
```

変更があった行のみ（差分検出はコンポーネント側）を受け取り、1件ずつ update する方式が安全。

---

### Step 2: AdminApp.vue 新規作成

**ファイル**: `src/components/apps/AdminApp.vue`

#### 画面フロー

```
[管理者画面トップ]
  ├── [フレーバー表示制御] カード
  │     → adminSubMode = 'flavor-visibility'
  └── [新フレーバー追加] カード
        → adminSubMode = 'add-flavor'

[フレーバー表示制御]
  - マウント時: getAllFlavorsWithBrand() で全件取得
  - テーブル表示: ブランド名 / 銘柄名 / 表示(チェックボックス)
  - ブランドでグループ化して表示（ブランド名の行見出しあり）
  - 変更がある場合のみ「変更を反映」ボタンを活性化（画面下部固定）
  - 保存: batchUpdateFlavorIsActive(変更差分) → 成功トースト表示

[新フレーバー追加]
  - TransferApp の入荷サブモードにある「新規銘柄を追加」セクションをそのまま移植
  - ブランド一覧は listTransferBrandsOrdered() を利用（既存 export 済）
  - 追加後にブランドリストを reload
  - 月選択（transferMonth）は不要 ← arrivalAddDisabled の `!this.transferMonth` チェックを除去
```

#### コンポーネント構造

```vue
<script>
data() {
  return {
    adminSubMode: null,            // null | 'flavor-visibility' | 'add-flavor'
    // フレーバー表示制御
    allFlavors: [],                // { id, name, is_active, brands:{name} }[]
    pendingChanges: {},            // { [flavorId]: is_active } 変更差分
    savingChanges: false,
    // 新フレーバー追加（TransferApp から移植）
    adminBrands: [],
    arrivalSelectedBrand: '',
    arrivalNewBrandShortName: '',
    arrivalNewBrandFormalName: '',
    arrivalNewFlavorName: '',
    arrivalAddingFlavor: false,
  }
},
computed: {
  hasChanges() { return Object.keys(this.pendingChanges).length > 0 },
  // arrivalBrandValidationMessage, arrivalFlavorValidationMessage, arrivalAddDisabled
  // TransferApp から移植（transferMonth チェックを除去）
},
methods: {
  async loadAllFlavors() { ... },  // getAllFlavorsWithBrand()
  onToggle(flavorId, checked) {    // pendingChanges に差分を記録
    const original = this.allFlavors.find(f => f.id === flavorId)?.is_active
    if (checked === original) delete this.pendingChanges[flavorId]  // 元に戻ったら差分から除外
    else this.pendingChanges[flavorId] = checked
  },
  async saveChanges() { ... },    // batchUpdateFlavorIsActive → reload
  async addArrivalFlavor() { ... } // TransferApp から移植
}
</script>
```

#### フレーバー表示制御の一覧レイアウト

```
[ブランド: Al Fakher]
  □ Double Apple        [表示]
  ✓ Grape               [表示]

[ブランド: Fumari]
  ✓ Ambrosia            [表示]
  □ Blueberry Muffin    [非表示]
...

[変更を反映] ← 画面最下部に fixed 表示、hasChanges 時のみ活性
```

---

### Step 3: PortalMenu.vue 更新

- 「管理者画面」カードを追加（テーマカラー: slate/gray 系）
- アイコン: 設定/歯車アイコン
- emit: `open-admin`
- グリッドは現在 5枚（1列/2列）→ 6枚になるため、レイアウト変更なし（奇数枚でもOK）

```vue
<button @click="$emit('open-admin')" ...>
  <!-- 歯車SVGアイコン -->
  <h3>管理者画面</h3>
  <p>フレーバーマスタの管理・新規追加</p>
</button>
```

---

### Step 4: App.vue 更新

```js
// import 追加
import AdminApp from './components/apps/AdminApp.vue'

// components 追加
components: { ..., AdminApp }

// openAdminApp() 追加
openAdminApp() {
  this.appMode = 'admin'
}
```

テンプレートに追加:
```vue
<main v-if="appMode === 'admin'" ...>
  <AdminApp
    ref="adminApp"
    @update:loading="loading = $event"
    @update:loadingMessage="loadingMessage = $event"
  />
</main>
```

PortalMenu バインド追加:
```vue
@open-admin="openAdminApp"
```

---

### Step 5: AppHeader.vue 更新

行 22-23 の三項演算子チェーンに `admin` ケースを追加:

```vue
{{ appMode === 'request' ? '補充依頼' :
   (appMode === 'inventory' ? '棚卸し入力' :
   (appMode === 'transfer' ? '移動記録' :
   (appMode === 'cost' ? '原価計算' :
   (appMode === 'admin' ? '管理者画面' : 'ダッシュボード')))) }}
```

行 15 のアクセントカラー分岐にも `appMode === 'admin' ? 'bg-slate-600'` を追加。

---

## リスク

| リスク | 影響 | 対策 |
|---|---|---|
| `is_active` 変更後の他モードへの即時反映 | 変更後すぐに他モードを開くと古いデータが残る可能性 | 各モードは `mounted()` 時にデータ再取得するため影響は低い |
| 新フレーバー追加UIの重複実装 | TransferApp と AdminApp の両方でロジックを維持する必要がある | 今回はシンプルにコピーで実装（共通 composable 化は別タスクとして検討） |
| is_active 一括更新の排他制御 | 複数ユーザーが同時に変更した場合、後勝ちになる | 他機能も同様の楽観的更新であるため許容範囲 |
| ダッシュボード集計への影響 | フレーバー非表示化で過去月のダッシュボード表示も変わる | RPC の is_active フィルタが全期間に適用されるため意図的な仕様とする |

---

## 確認したい点

1. **管理者画面のアクセス制御**: 全ユーザーが触れる前提でよいか？追加 PIN 認証などは不要か？
2. **ダッシュボードの is_active 影響**: フレーバー非表示化が過去月のダッシュボード集計にも影響することを許容するか？
3. **フレーバー一覧のソート**: ブランド名 → 銘柄名でソートする方針でよいか？非アクティブフレーバーの表示位置は？
4. **テーマカラー**: 管理者画面カードのカラーは slate/gray 系でよいか？

---

## 触る想定ファイル・範囲

| ファイル | 変更内容 |
|---|---|
| `src/api.js` | `getAllFlavorsWithBrand()` の export 化、`batchUpdateFlavorIsActive()` 追加 |
| `src/components/apps/AdminApp.vue` | **新規作成**（サブモード選択、フレーバー表示制御、新フレーバー追加） |
| `src/components/PortalMenu.vue` | 「管理者画面」カード追加、`open-admin` emit 追加 |
| `src/App.vue` | AdminApp import・mount、`openAdminApp()` 追加、`@open-admin` バインド |
| `src/components/common/AppHeader.vue` | `appMode === 'admin'` のタイトル・カラー分岐追加 |

DBマイグレーション不要（`is_active` カラムは既存、`default true` で稼働済み）。
