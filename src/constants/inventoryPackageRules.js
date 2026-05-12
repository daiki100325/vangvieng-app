export const ALL_INVENTORY_PACKAGE_SIZES = ['50', '100', '125', '200', '250', '1kg']

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
  // packages_configured=false（未設定）の場合は全サイズを返す（フォールバック）
  if (!bd || !bd.packages_configured) return ALL_INVENTORY_PACKAGE_SIZES.slice()
  return ALL_INVENTORY_PACKAGE_SIZES.filter(size => bd[SIZE_TO_COLUMN[size]] === true)
}

export function getVisibleMerchSizes(item) {
  return resolveVisibleSizes(item)
}

export function getVisibleStockGramSizes(item) {
  return resolveVisibleSizes(item)
}
