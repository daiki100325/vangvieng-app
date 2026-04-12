/**
 * 棚卸し Step2（物販）/ Step3（在庫）の表示するグラム列。
 * マスタキーはスプレッドシート A 列の brand 全文（trim のみ）と正本ノート一致。
 * Source: V-MINT/notes/inventory_package_visibility_plan.md
 */

/** UI / v-model キー接尾辞（val50, val100, …） */
export const ALL_INVENTORY_PACKAGE_SIZES = ['50', '100', '125', '200', '250', '1kg']

/** @typedef {{ merchSizes: string[], stockGramSizes: string[] }} InventoryPackageRule */

/** @type {Record<string, InventoryPackageRule>} */
const BRAND_RULES = {
    'AF (Al Fakher)': { merchSizes: ['50', '250'], stockGramSizes: ['50', '250'] },
    'AZ (Afzal)': { merchSizes: ['50', '250'], stockGramSizes: ['50', '250'] },
    'AZR GOLD (Azure Gold Line)': { merchSizes: ['100'], stockGramSizes: ['100'] },
    'AZR BLACK (Azure Black Line)': { merchSizes: ['100'], stockGramSizes: ['100'] },
    'DBJ (Debaj)': { merchSizes: ['50'], stockGramSizes: ['50'] },
    'FM (Fumari)': { merchSizes: ['100'], stockGramSizes: ['100'] },
    'HF (Hookafina)': { merchSizes: ['100'], stockGramSizes: ['100'] },
    'MH (Musthave)': { merchSizes: [], stockGramSizes: [] },
    'SB (Starbuzz/Bold)': { merchSizes: ['100', '250'], stockGramSizes: ['100', '250'] },
    'SS (Social Smoke)': { merchSizes: ['100', '250', '1kg'], stockGramSizes: ['100', '250', '1kg'] },
    'TF (Trifecta)': { merchSizes: ['100', '250'], stockGramSizes: ['100', '250'] },
    'TG NOIR (Tangiers Noir)': { merchSizes: ['100', '250'], stockGramSizes: ['100', '250'] },
    'TG BURLEY (Tangiers Burley)': { merchSizes: ['100', '250'], stockGramSizes: ['100', '250'] },
    'TG BIRQUQ (Tangiers Birquq)': { merchSizes: ['100', '250'], stockGramSizes: ['100', '250'] },
    'TG F-LINE (Tangiers F-Line)': { merchSizes: ['100', '250'], stockGramSizes: ['100', '250'] }
}

/** 同一 brand で B 列ごとに上書きする場合のみ使用 @type {Record<string, InventoryPackageRule>} */
const BRAND_FLAVOR_RULES = {}

function norm(s) {
    return String(s ?? '').trim()
}

/**
 * @param {{ brand?: string, flavorName?: string, flavor?: string, name?: string }} item
 * @returns {InventoryPackageRule | null} null = 制限なし（全列）
 */
export function resolveInventoryPackageRules(item) {
    const brand = norm(item.brand)
    const flavor = norm(item.flavorName || item.flavor || item.name)
    const compound = `${brand}|${flavor}`
    if (compound !== '|' && BRAND_FLAVOR_RULES[compound]) return BRAND_FLAVOR_RULES[compound]
    if (brand && BRAND_RULES[brand]) return BRAND_RULES[brand]
    return null
}

/**
 * @param {{ brand?: string, flavorName?: string, flavor?: string, name?: string }} item
 * @returns {string[]}
 */
export function getVisibleMerchSizes(item) {
    const r = resolveInventoryPackageRules(item)
    if (!r) return ALL_INVENTORY_PACKAGE_SIZES.slice()
    return r.merchSizes.slice()
}

/**
 * @param {{ brand?: string, flavorName?: string, flavor?: string, name?: string }} item
 * @returns {string[]}
 */
export function getVisibleStockGramSizes(item) {
    const r = resolveInventoryPackageRules(item)
    if (!r) return ALL_INVENTORY_PACKAGE_SIZES.slice()
    return r.stockGramSizes.slice()
}
