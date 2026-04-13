---
tags: [project/v-mint, type/plan]
parent: [[V-MINT/notes/_index]]
source_chat: inventory-package-visibility
---

# 棚卸し：パッケージ入力の出し分け（プラン）

日本語の文字化け対策として、本ファイルを **UTF-8（BOM なし推奨）** で保存する。Cursor のチャット表示は環境依存のため、確定仕様は **このノートと Git の差分** を正とする。

## 決定事項

- **マスタ**は **フロントの静的モジュール**（ビルドに同梱）。パッケージ変更頻度は低い。GAS の API 往復は増やさない。
- **マスタ未登録**のブランド・行は **従来どおり**（物販・在庫ともグラム 6 列＋在庫は「その他」）。
- **MH・在庫（Step3）**：50g〜1kg の 6 入力は **非表示**。**「その他」（`valOther`）のみ表示**。
- **MH・物販（Step2）**：物販用「その他」列が無いため **パッケージ入力欄は出さない**（許可サイズを空配列）。タッパー等は従来どおり。

## 参照コード

- [InventoryApp.vue](../src/components/apps/InventoryApp.vue)
- [Code.gs](../Code.gs) の `getSheetData`（行単位は A 列 `brand`＋B 列 `flavorName`）

## 静的マスタの挙動

- **登録銘柄・物販**：下表「パッケージ制限あり」のグラム列のみ（例：`AF (Al Fakher)` → 50, 250）。
- **登録銘柄・在庫**：物販と同じグラム列 **＋「その他」**（`MH (Musthave)` を除く）。
- **`MH (Musthave)`・在庫**：グラム列なし、**その他のみ**。

データ形状の例：`merchSizes: string[]`、`stockGramSizes: string[]`。Step3 の「その他」ブロックは原則すべての行で残す（Musthave はグラムが無くその他だけ見える）。

## A 列の名称（略称＋正式名称）

スプレッドシート A 列に入る **`brand` 文字列は次のとおり**（括弧付きまで含めた **完全一致** をマスタキーとする想定。実装では少なくとも `trim()` で前後空白を除去）。

| A 列に含める名称 |
|------------------|
| AF (Al Fakher) |
| AWE (Al Waha Elite Edition) |
| AWJ (Al Waha JSE) |
| AZ (Afzal) |
| AZR GOLD (Azure Gold Line) |
| AZR BLACK (Azure Black Line) |
| DBJ (Debaj) |
| DZJ (Dozaj) |
| FA (Fantasia) |
| FM (Fumari) |
| GXM (Gixom) |
| HF (Hookafina) |
| MZ (Mazaya) |
| MH (Musthave) |
| ODM (Oduman Blend) |
| PT (Pure Tobacco) |
| RV (Revoshi) |
| SB (Starbuzz/Bold) |
| SS (Social Smoke) |
| TF (Trifecta) |
| TG NOIR (Tangiers Noir) |
| TG BURLEY (Tangiers Burley) |
| TG BIRQUQ (Tangiers Birquq) |
| TG F-LINE (Tangiers F-Line) |
| VV (Vang Vieng Mix) |

**B 列（フレーバー名）**は表示・集計用。パッケージ制限マスタの主キーは **原則として A 列のみ**（同一 A 列で B 列ごとにパッケージが異なる場合だけ `brand|flavorName` の上書きをオプションで持てる）。

## キー解決の優先順

1. 正規化後の `brand|flavorName` が完全一致 → そのエントリ（オプション）
2. なければ **`brand`（A 列の上表どおりの文字列）のみ** とマスタを照合
3. どちらもなければ **全列表示**

上表に載っていても、下の「パッケージ制限あり」に **無い** ブランドは、手順 3 に落ちる（従来どおり全列）。

## Vue 実装メモ

- `ALL_SIZES` を定数化。
- Step2：`visibleMerchSizes(item)`。`MH (Musthave)` は空配列 → パッケージグリッド非表示。
- Step3：`visibleStockGramSizes(item)` で 50〜1kg。「その他」は全行で表示。
- 列数可変に応じて `flex-wrap` や動的 `grid-cols-*`。

## パッケージ制限あり（A 列表記 = マスタキー）

物販は次のグラム列のみ表示。在庫は **同じグラム列 ＋「その他」**（`MH (Musthave)` は在庫で **その他のみ**／物販はパッケージ欄なし）。

| A 列（`brand`） | 物販グラム | 在庫グラム |
|-----------------|------------|------------|
| AF (Al Fakher) | 50g, 250g | ＋その他 |
| AZ (Afzal) | 50g, 250g | ＋その他 |
| AZR GOLD (Azure Gold Line) | 100g | ＋その他 |
| AZR BLACK (Azure Black Line) | 100g | ＋その他 |
| DBJ (Debaj) | 50g | ＋その他 |
| FM (Fumari) | 100g | ＋その他 |
| HF (Hookafina) | 100g | ＋その他 |
| MH (Musthave) | （物販パッケージ欄なし） | その他のみ |
| SB (Starbuzz/Bold) | 100g, 250g | ＋その他 |
| SS (Social Smoke) | 100g, 250g, 1Kg | ＋その他 |
| TF (Trifecta) | 100g, 250g | ＋その他 |
| TG NOIR (Tangiers Noir) | 100g, 250g | ＋その他 |
| TG BURLEY (Tangiers Burley) | 100g, 250g | ＋その他 |
| TG BIRQUQ (Tangiers Birquq) | 100g, 250g | ＋その他 |
| TG F-LINE (Tangiers F-Line) | 100g, 250g | ＋その他 |

シートの A 列が上表と **1 文字でも異なる**場合はマッチしない。略称だけ・括弧なしなどになっている場合は **シート側を上表に合わせる**か、実装で別名エントリを追加する。

## パッケージ制限なし（A 列表記は確定済みだが全列表示）

次の A 列名称は **現時点ではパッケージ制限マスタに登録しない**（従来どおり物販・在庫ともグラム 6 列＋在庫はその他）。

- AWE (Al Waha Elite Edition)
- AWJ (Al Waha JSE)
- DZJ (Dozaj)
- FA (Fantasia)
- GXM (Gixom)
- MZ (Mazaya)
- ODM (Oduman Blend)
- PT (Pure Tobacco)
- RV (Revoshi)
- VV (Vang Vieng Mix)

## 実装後ドキュメント

[CHANGELOG_DEV.md](../CHANGELOG_DEV.md)、必要なら [PRODUCT_SPEC.md](../docs/PRODUCT_SPEC.md) または本 `notes/` を更新する。

## 実装タスク

1. `src/constants/` に静的マスタと `resolveInventoryPackageRules(item)` を追加。
2. `InventoryApp.vue` の Step2/3 を接続。
3. 確認画面の `formatValues` は非表示列が空なら現状のまま利用可。
