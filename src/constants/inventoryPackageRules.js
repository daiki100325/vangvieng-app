export const ALL_INVENTORY_PACKAGE_SIZES = ['50', '100', '125', '200', '250', '1kg']

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

export function resolveInventoryPackageRules(item) {
  const brand = String(item?.brand ?? '').trim()
  if (brand && BRAND_RULES[brand]) return BRAND_RULES[brand]
  return null
}

export function getVisibleMerchSizes(item) {
  const rule = resolveInventoryPackageRules(item)
  if (!rule) return ALL_INVENTORY_PACKAGE_SIZES.slice()
  return rule.merchSizes.slice()
}

export function getVisibleStockGramSizes(item) {
  const rule = resolveInventoryPackageRules(item)
  if (!rule) return ALL_INVENTORY_PACKAGE_SIZES.slice()
  return rule.stockGramSizes.slice()
}
