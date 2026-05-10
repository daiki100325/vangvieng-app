import { createClient } from '@supabase/supabase-js'
import { parsePeriodKey, toMonthNumFromPeriodKey } from './utils/periods.js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
}

function normalizeStoreKey(key) {
  if (key === 'baba') return 'baba_main'
  return key
}

async function getStoreIdByKey(storeKey) {
  const key = normalizeStoreKey(storeKey)
  const { data, error } = await supabase.from('stores').select('id').eq('store_key', key).single()
  if (error) throw error
  return data.id
}

async function getOrderedFlavorsWithBrand() {
  const { data, error } = await supabase
    .from('flavors')
    .select('id,name,is_active,brands(name,short_name)')
    .order('name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getAllFlavorsWithBrand() {
  requireSupabase()
  return getOrderedFlavorsWithBrand()
}

export async function batchUpdateFlavorIsActive(updates) {
  requireSupabase()
  await Promise.all(
    updates.map(({ id, is_active }) =>
      supabase.from('flavors').update({ is_active }).eq('id', id).then(({ error }) => { if (error) throw error })
    )
  )
}

function normalizePeriodKey(periodValue) {
  const parsed = parsePeriodKey(periodValue)
  return parsed ? parsed.periodKey : null
}

function toMonthNum(periodValue) {
  return toMonthNumFromPeriodKey(periodValue)
}

function getPreviousPeriodKey(periodKey) {
  if (!periodKey) return null
  const year = Math.floor(periodKey / 100)
  const month = periodKey % 100
  if (month === 1) return (year - 1) * 100 + 12
  return year * 100 + (month - 1)
}

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return obj[k]
  }
  return undefined
}

function toNumeric(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function toSubmittedValue(value) {
  if (value === null || value === undefined || value === '') return 0
  return toNumeric(value)
}

function toJstTimestampString(date = new Date()) {
  const jst = new Date(date.getTime() + (9 * 60 * 60 * 1000))
  return jst.toISOString().slice(0, 19).replace('T', ' ')
}

function buildSubmittedInventoryRow(item, base = {}) {
  return {
    ...base,
    flavor_id: item.flavorId || item.id || item.rowIndex,
    tupper_basic: item?.tupper?.basicEnabled === false ? null : toSubmittedValue(item?.tupper?.basic),
    tupper_reserve: item?.tupper?.reserveEnabled === false ? null : toSubmittedValue(item?.tupper?.reserve),
    merch_pkg_50: toSubmittedValue(item?.merch?.val50),
    merch_pkg_100: toSubmittedValue(item?.merch?.val100),
    merch_pkg_125: toSubmittedValue(item?.merch?.val125),
    merch_pkg_200: toSubmittedValue(item?.merch?.val200),
    merch_pkg_250: toSubmittedValue(item?.merch?.val250),
    merch_pkg_1kg: toSubmittedValue(item?.merch?.val1kg),
    stock_pkg_50: toSubmittedValue(item?.flavor?.val50),
    stock_pkg_100: toSubmittedValue(item?.flavor?.val100),
    stock_pkg_125: toSubmittedValue(item?.flavor?.val125),
    stock_pkg_200: toSubmittedValue(item?.flavor?.val200),
    stock_pkg_250: toSubmittedValue(item?.flavor?.val250),
    stock_pkg_1kg: toSubmittedValue(item?.flavor?.val1kg),
    stock_other: toSubmittedValue(item?.flavor?.valOther)
  }
}

function inventoryRowsEqual(a, b) {
  return (
    (a?.tupper_basic ?? null) === (b?.tupper_basic ?? null)
    && (a?.tupper_reserve ?? null) === (b?.tupper_reserve ?? null)
    && toNumeric(a?.merch_pkg_50) === toNumeric(b?.merch_pkg_50)
    && toNumeric(a?.merch_pkg_100) === toNumeric(b?.merch_pkg_100)
    && toNumeric(a?.merch_pkg_125) === toNumeric(b?.merch_pkg_125)
    && toNumeric(a?.merch_pkg_200) === toNumeric(b?.merch_pkg_200)
    && toNumeric(a?.merch_pkg_250) === toNumeric(b?.merch_pkg_250)
    && toNumeric(a?.merch_pkg_1kg) === toNumeric(b?.merch_pkg_1kg)
    && toNumeric(a?.stock_pkg_50) === toNumeric(b?.stock_pkg_50)
    && toNumeric(a?.stock_pkg_100) === toNumeric(b?.stock_pkg_100)
    && toNumeric(a?.stock_pkg_125) === toNumeric(b?.stock_pkg_125)
    && toNumeric(a?.stock_pkg_200) === toNumeric(b?.stock_pkg_200)
    && toNumeric(a?.stock_pkg_250) === toNumeric(b?.stock_pkg_250)
    && toNumeric(a?.stock_pkg_1kg) === toNumeric(b?.stock_pkg_1kg)
    && toNumeric(a?.stock_other) === toNumeric(b?.stock_other)
  )
}

function inventoryRowHasPersistableValue(row) {
  return (
    row?.tupper_basic === null
    || row?.tupper_reserve === null
    || toNumeric(row?.tupper_basic) !== 0
    || toNumeric(row?.tupper_reserve) !== 0
    || toNumeric(row?.merch_pkg_50) !== 0
    || toNumeric(row?.merch_pkg_100) !== 0
    || toNumeric(row?.merch_pkg_125) !== 0
    || toNumeric(row?.merch_pkg_200) !== 0
    || toNumeric(row?.merch_pkg_250) !== 0
    || toNumeric(row?.merch_pkg_1kg) !== 0
    || toNumeric(row?.stock_pkg_50) !== 0
    || toNumeric(row?.stock_pkg_100) !== 0
    || toNumeric(row?.stock_pkg_125) !== 0
    || toNumeric(row?.stock_pkg_200) !== 0
    || toNumeric(row?.stock_pkg_250) !== 0
    || toNumeric(row?.stock_pkg_1kg) !== 0
    || toNumeric(row?.stock_other) !== 0
  )
}

function calculateInventoryGrams(item) {
  const tupper = item?.tupper || {}
  const merch = item?.merch || {}
  const flavor = item?.flavor || {}

  return (
    (tupper.basicEnabled === false ? 0 : toNumeric(tupper.basic))
    + (tupper.reserveEnabled === false ? 0 : toNumeric(tupper.reserve))
    + toNumeric(merch.val50) * 50
    + toNumeric(merch.val100) * 100
    + toNumeric(merch.val125) * 125
    + toNumeric(merch.val200) * 200
    + toNumeric(merch.val250) * 250
    + toNumeric(merch.val1kg) * 1000
    + toNumeric(flavor.val50) * 50
    + toNumeric(flavor.val100) * 100
    + toNumeric(flavor.val125) * 125
    + toNumeric(flavor.val200) * 200
    + toNumeric(flavor.val250) * 250
    + toNumeric(flavor.val1kg) * 1000
    + toNumeric(flavor.valOther)
  )
}

function formatWarningAmount(value) {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? rounded : rounded.toFixed(1)
}

function buildFlavorDisplayName(item) {
  return item?.flavorName || item?.flavor || item?.name || `ID:${item?.flavorId || item?.id || item?.rowIndex || ''}`
}

async function fetchLatestInventoryByFlavor(storeId, periodKey) {
  const { data, error } = await supabase
    .from('inventory_logs')
    .select(`
      id,
      flavor_id,
      recorded_at,
      created_at,
      tupper_basic,
      tupper_reserve,
      merch_pkg_50,
      merch_pkg_100,
      merch_pkg_125,
      merch_pkg_200,
      merch_pkg_250,
      merch_pkg_1kg,
      stock_pkg_50,
      stock_pkg_100,
      stock_pkg_125,
      stock_pkg_200,
      stock_pkg_250,
      stock_pkg_1kg,
      stock_other
    `)
    .eq('store_id', storeId)
    .eq('period_key', periodKey)
    .order('flavor_id', { ascending: true })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  if (error) throw error

  const latestByFlavor = new Map()
  for (const row of data || []) {
    if (latestByFlavor.has(row.flavor_id)) continue
    latestByFlavor.set(row.flavor_id, (
      toNumeric(row.tupper_basic)
      + toNumeric(row.tupper_reserve)
      + toNumeric(row.merch_pkg_50) * 50
      + toNumeric(row.merch_pkg_100) * 100
      + toNumeric(row.merch_pkg_125) * 125
      + toNumeric(row.merch_pkg_200) * 200
      + toNumeric(row.merch_pkg_250) * 250
      + toNumeric(row.merch_pkg_1kg) * 1000
      + toNumeric(row.stock_pkg_50) * 50
      + toNumeric(row.stock_pkg_100) * 100
      + toNumeric(row.stock_pkg_125) * 125
      + toNumeric(row.stock_pkg_200) * 200
      + toNumeric(row.stock_pkg_250) * 250
      + toNumeric(row.stock_pkg_1kg) * 1000
      + toNumeric(row.stock_other)
    ))
  }
  return latestByFlavor
}

async function fetchLatestInventoryRowsByFlavor(storeId, periodKey) {
  const { data, error } = await supabase
    .from('inventory_logs')
    .select(`
      id,
      flavor_id,
      recorded_at,
      created_at,
      tupper_basic,
      tupper_reserve,
      merch_pkg_50,
      merch_pkg_100,
      merch_pkg_125,
      merch_pkg_200,
      merch_pkg_250,
      merch_pkg_1kg,
      stock_pkg_50,
      stock_pkg_100,
      stock_pkg_125,
      stock_pkg_200,
      stock_pkg_250,
      stock_pkg_1kg,
      stock_other
    `)
    .eq('store_id', storeId)
    .eq('period_key', periodKey)

  if (error) throw error

  const latestByFlavor = new Map()
  for (const row of data || []) {
    latestByFlavor.set(row.flavor_id, row)
  }
  return latestByFlavor
}

async function fetchCompletedTransferDeltaByFlavor(storeId, periodKey) {
  const { data, error } = await supabase
    .from('transfer_logs')
    .select('flavor_id, from_store_id, dest_store_id, quantity')
    .eq('period_key', periodKey)
    .eq('status', 'completed')
    .or(`from_store_id.eq.${storeId},dest_store_id.eq.${storeId}`)

  if (error) throw error

  const deltaByFlavor = new Map()
  for (const row of data || []) {
    let delta = 0
    if (row.dest_store_id === storeId) delta += toNumeric(row.quantity)
    if (row.from_store_id === storeId) delta -= toNumeric(row.quantity)
    deltaByFlavor.set(row.flavor_id, toNumeric(deltaByFlavor.get(row.flavor_id)) + delta)
  }
  return deltaByFlavor
}

function buildItemFromLog(log, idx) {
  return {
    rowIndex: idx + 1,
    id: log.flavor_id,
    flavorId: log.flavor_id,
    brand: log.brand_name,
    flavorName: log.flavor_name,
    appDisplay: true,
    tupper: {
      basic: log.tupper_basic ?? '',
      reserve: log.tupper_reserve ?? '',
      basicEnabled: pick(log, 'tupper_basic_enabled', 'tupperBasicEnabled') ?? (log.tupper_basic !== null),
      reserveEnabled: pick(log, 'tupper_reserve_enabled', 'tupperReserveEnabled') ?? (log.tupper_reserve !== null)
    },
    merch: {
      val50: log.merch_pkg_50 ?? '',
      val100: log.merch_pkg_100 ?? '',
      val125: log.merch_pkg_125 ?? '',
      val200: log.merch_pkg_200 ?? '',
      val250: log.merch_pkg_250 ?? '',
      val1kg: log.merch_pkg_1kg ?? ''
    },
    flavor: {
      val50: log.stock_pkg_50 ?? '',
      val100: log.stock_pkg_100 ?? '',
      val125: log.stock_pkg_125 ?? '',
      val200: log.stock_pkg_200 ?? '',
      val250: log.stock_pkg_250 ?? '',
      val1kg: log.stock_pkg_1kg ?? '',
      valOther: log.stock_other ?? ''
    }
  }
}

export async function getSheetData(storeKey, sheetName) {
  requireSupabase()
  const periodKey = normalizePeriodKey(sheetName)
  const storeId = await getStoreIdByKey(storeKey)
  const { data, error } = await supabase.rpc('fetch_inventory_sheet_data', {
    p_store_id: storeId,
    p_period_key: periodKey
  })
  if (error) throw error
  const items = (data || []).map((row, idx) => buildItemFromLog(row, idx))
  return { items, date: items[0]?.recorded_at || '' }
}

export async function submitData(payload) {
  requireSupabase()
  const periodKey = normalizePeriodKey(payload.sheetName)
  const monthNum = toMonthNum(payload.sheetName)
  const storeId = await getStoreIdByKey(payload.storeKey)
  const latestRowsByFlavor = await fetchLatestInventoryRowsByFlavor(storeId, periodKey)
  const rows = (payload.items || [])
    .map((item) => buildSubmittedInventoryRow(item, {
      recorded_at: payload.date,
      period_key: periodKey,
      month_num: monthNum,
      store_id: storeId,
      updated_at: toJstTimestampString()
    }))
    .filter((row) => {
      const latest = latestRowsByFlavor.get(row.flavor_id)
      if (!latest) return inventoryRowHasPersistableValue(row)
      return !inventoryRowsEqual(row, latest)
    })

  if (rows.length === 0) {
    return { success: true, negativeConsumptionItems: [], insertedCount: 0 }
  }

  const { error } = await supabase
    .from('inventory_logs')
    .upsert(rows, { onConflict: 'period_key,store_id,flavor_id' })
  if (error) throw error
  return { success: true, negativeConsumptionItems: [], insertedCount: rows.length }
}

export async function checkNegativeConsumption(payload) {
  requireSupabase()

  const periodKey = normalizePeriodKey(payload.sheetName)
  const prevPeriodKey = getPreviousPeriodKey(periodKey)
  const storeId = await getStoreIdByKey(payload.storeKey)

  const [prevInventoryByFlavor, prevTransferByFlavor] = await Promise.all([
    prevPeriodKey ? fetchLatestInventoryByFlavor(storeId, prevPeriodKey) : Promise.resolve(new Map()),
    prevPeriodKey ? fetchCompletedTransferDeltaByFlavor(storeId, prevPeriodKey) : Promise.resolve(new Map())
  ])

  const negativeConsumptionItems = []
  const highConsumptionItems = []

  for (const item of payload.items || []) {
    const flavorId = item.flavorId || item.id || item.rowIndex
    const flavorName = buildFlavorDisplayName(item)
    const prevStock = toNumeric(prevInventoryByFlavor.get(flavorId))
    const prevTransfer = toNumeric(prevTransferByFlavor.get(flavorId))
    const currentStock = calculateInventoryGrams(item)
    const consumption = prevStock + prevTransfer - currentStock
    const formattedAmount = formatWarningAmount(consumption)

    if (payload.storeKey === 'office') {
      if (consumption !== 0) {
        negativeConsumptionItems.push({ name: flavorName, amount: formattedAmount })
      }
    } else if (consumption < 0) {
      negativeConsumptionItems.push({ name: flavorName, amount: formattedAmount })
    }

    if (consumption > 500) {
      highConsumptionItems.push({ name: flavorName, amount: formattedAmount })
    }
  }

  negativeConsumptionItems.sort((a, b) => Number(a.amount) - Number(b.amount))
  highConsumptionItems.sort((a, b) => Number(b.amount) - Number(a.amount))

  return { negativeConsumptionItems, highConsumptionItems }
}

/** transfer_logs に存在する最大の period_key（移動記録の最新対象月） */
export async function fetchLatestTransferPeriodKey() {
  requireSupabase()
  const { data, error } = await supabase
    .from('transfer_logs')
    .select('period_key')
    .order('period_key', { ascending: false })
    .limit(1)
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  const pk = row?.period_key
  return pk != null ? normalizePeriodKey(pk) : null
}

/** inventory_logs に存在する最大の period_key（棚卸し記録の最新対象月） */
export async function fetchLatestInventoryPeriodKey() {
  requireSupabase()
  const { data, error } = await supabase
    .from('inventory_logs')
    .select('period_key')
    .order('period_key', { ascending: false })
    .limit(1)
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  const pk = row?.period_key
  return pk != null ? normalizePeriodKey(pk) : null
}

export async function getInventoryData(monthNum) {
  requireSupabase()
  const { data, error } = await supabase.rpc('fetch_request_inventory_data', { p_period_key: normalizePeriodKey(monthNum) })
  if (error) throw error
  return data || []
}

export async function getFlavorListForTransfer(monthNum) {
  requireSupabase()
  const { data, error } = await supabase.rpc('fetch_transfer_flavors', { p_period_key: normalizePeriodKey(monthNum) })
  if (error) throw error
  return (data || []).map((row) => ({
    rowIndex: pick(row, 'rowIndex', 'rowindex'),
    id: pick(row, 'id'),
    flavorId: pick(row, 'flavorId', 'flavorid'),
    brand: pick(row, 'brand'),
    flavorName: pick(row, 'flavorName', 'flavorname'),
    appDisplay: pick(row, 'appDisplay', 'appdisplay'),
    stock: pick(row, 'stock') || {}
  }))
}

export async function getAllTransferRecords(monthNum) {
  requireSupabase()
  const { data, error } = await supabase.rpc('fetch_all_transfer_records', { p_period_key: normalizePeriodKey(monthNum) })
  if (error) throw error
  return (data || []).map((row) => ({
    blockIndex: pick(row, 'blockIndex', 'blockindex'),
    date: pick(row, 'date'),
    fromStoreKey: pick(row, 'fromStoreKey', 'fromstorekey'),
    destStoreKey: pick(row, 'destStoreKey', 'deststorekey'),
    recordType: pick(row, 'recordType', 'recordtype'),
    inspected: pick(row, 'inspected'),
    comment: pick(row, 'comment')
  }))
}

export async function getPendingTransferRecords(monthNum, destStoreKey) {
  requireSupabase()
  const destStoreId = await getStoreIdByKey(destStoreKey)
  const { data, error } = await supabase.rpc('fetch_pending_transfer_records', {
    p_period_key: normalizePeriodKey(monthNum),
    p_dest_store_id: destStoreId
  })
  if (error) throw error
  return (data || []).map((row) => ({
    blockIndex: pick(row, 'blockIndex', 'blockindex'),
    date: pick(row, 'date'),
    fromStoreKey: pick(row, 'fromStoreKey', 'fromstorekey')
  }))
}

export async function getTransferRecordDetail(monthNum, blockIndex, destStoreKey) {
  requireSupabase()
  const storeId = await getStoreIdByKey(destStoreKey)
  const { data, error } = await supabase.rpc('fetch_transfer_record_detail', {
    p_period_key: normalizePeriodKey(monthNum),
    p_block_index: blockIndex,
    p_store_id: storeId
  })
  if (error) throw error
  return (data || []).map((row) => ({
    rowIndex: pick(row, 'rowIndex', 'rowindex'),
    brand: pick(row, 'brand'),
    flavorName: pick(row, 'flavorName', 'flavorname'),
    qty: pick(row, 'qty')
  }))
}

export async function getDisposeRecordDetail(monthNum, blockIndex, fromStoreKey) {
  requireSupabase()
  const storeId = await getStoreIdByKey(fromStoreKey)
  const { data, error } = await supabase.rpc('fetch_dispose_record_detail', {
    p_period_key: normalizePeriodKey(monthNum),
    p_block_index: blockIndex,
    p_store_id: storeId
  })
  if (error) throw error
  return (data || []).map((row) => ({
    rowIndex: pick(row, 'rowIndex', 'rowindex'),
    brand: pick(row, 'brand'),
    flavorName: pick(row, 'flavorName', 'flavorname'),
    qty: pick(row, 'qty')
  }))
}

export async function submitTransferRecord(payload) {
  requireSupabase()
  const fromStoreId = payload.fromStoreKey ? await getStoreIdByKey(payload.fromStoreKey) : null
  const destStoreId = payload.destStoreKey ? await getStoreIdByKey(payload.destStoreKey) : null
  const periodKey = normalizePeriodKey(payload.periodKey ?? payload.monthNum)
  const monthNum = toMonthNum(payload.periodKey ?? payload.monthNum)
  const rows = (payload.items || []).map((item) => ({
    period_key: periodKey,
    month_num: monthNum,
    recorded_at: payload.date,
    from_store_id: fromStoreId,
    dest_store_id: destStoreId,
    flavor_id: item.flavorId || item.id || item.rowIndex,
    quantity: item.qty,
    status: payload.autoInspect ? 'completed' : 'pending',
    comment: payload.comment || null
  }))
  const { error } = await supabase.from('transfer_logs').insert(rows)
  if (error) throw error
  return { success: true }
}

export async function addFlavorForArrival(payload) {
  requireSupabase()
  const providedShortName = String(payload.brandShortName || '').trim()
  const providedFormalName = String(payload.brandFormalName || '').trim()
  const fallbackBrand = String(payload.brand || '').trim()
  const brandShortName = providedShortName
  const brandName = providedFormalName || fallbackBrand
  const flavorName = String(payload.flavorName || '').trim()
  if (!brandName || !flavorName) throw new Error('brand and flavorName are required')

  let brandId = null
  const { data: existingBrand } = await supabase.from('brands').select('id').eq('name', brandName).maybeSingle()
  if (existingBrand?.id) brandId = existingBrand.id
  if (!brandId) {
    const { data: insertedBrand, error: brandError } = await supabase
      .from('brands')
      .insert({ name: brandName, short_name: brandShortName || brandName.split(' ')[0] })
      .select('id')
      .single()
    if (brandError) throw brandError
    brandId = insertedBrand.id
  }

  const { data: dup } = await supabase
    .from('flavors')
    .select('id')
    .eq('brand_id', brandId)
    .eq('name', flavorName)
    .maybeSingle()
  if (dup?.id) throw new Error('同一ブランド・フレーバーが既に存在します。')

  const { error } = await supabase
    .from('flavors')
    .insert({ brand_id: brandId, name: flavorName, is_active: true })
  if (error) throw error

  return { success: true }
}

export async function completeInspection(payload) {
  requireSupabase()
  const fromStoreId = payload.fromStoreKey ? await getStoreIdByKey(payload.fromStoreKey) : null
  const destStoreId = payload.destStoreKey ? await getStoreIdByKey(payload.destStoreKey) : null
  const items = (payload.items || []).map((item) => ({
    rowIndex: item.flavorId || item.id || item.rowIndex,
    qty: item.qty
  }))
  const { error } = await supabase.rpc('complete_transfer_inspection', {
    p_period_key: normalizePeriodKey(payload.periodKey ?? payload.monthNum),
    p_block_index: payload.blockIndex,
    p_from_store_id: fromStoreId,
    p_dest_store_id: destStoreId,
    p_items: items
  })
  if (error) throw error
  return { success: true }
}

export async function amendTransferRecord(payload) {
  requireSupabase()
  const pk = normalizePeriodKey(payload.periodKey ?? payload.monthNum)
  const items = (payload.items || []).map((item) => ({
    flavorId: item.flavorId || item.id || item.rowIndex,
    qty: item.qty
  }))
  const rpcParams = {
    p_period_key: pk,
    p_block_index: payload.blockIndex,
    p_items: items
  }
  if (payload.comment !== undefined) {
    rpcParams.p_comment = payload.comment ?? null
  }
  const { data, error } = await supabase.rpc('amend_transfer_record', rpcParams)
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return { success: row?.success !== false }
}

export async function deleteTransferRecordBlock(payload) {
  requireSupabase()
  const pk = normalizePeriodKey(payload.periodKey ?? payload.monthNum)
  const { data, error } = await supabase.rpc('delete_transfer_record_block', {
    p_period_key: pk,
    p_block_index: payload.blockIndex
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return {
    success: row?.success !== false,
    deletedCount: Number(pick(row, 'deletedCount', 'deleted_count', 'deletedcount')) || 0
  }
}

export async function getStockOverview(monthNum) {
  requireSupabase()
  const { data, error } = await supabase.rpc('fetch_stock_overview', { p_period_key: normalizePeriodKey(monthNum) })
  if (error) throw error
  return (data || []).map((row) => ({
    rowIndex: pick(row, 'rowIndex', 'rowindex'),
    brand: pick(row, 'brand'),
    flavorName: pick(row, 'flavorName', 'flavorname'),
    totalStock: toNumeric(pick(row, 'totalStock', 'totalstock')),
    prevConsumption: toNumeric(pick(row, 'prevConsumption', 'prevconsumption')),
    appDisplay: pick(row, 'appDisplay', 'appdisplay')
  }))
}

export async function getDashboardStockOverview(monthNum) {
  requireSupabase()
  const periodKey = normalizePeriodKey(monthNum)
  const { data, error } = await supabase.rpc('fetch_dashboard_stock_overview', { p_period_key: periodKey })
  if (!error) {
    return (data || []).map((row) => ({
      rowIndex: pick(row, 'rowIndex', 'rowindex'),
      brand: pick(row, 'brand'),
      flavorName: pick(row, 'flavorName', 'flavorname'),
      totalStock: toNumeric(pick(row, 'totalStock', 'totalstock')),
      prevConsumption: toNumeric(pick(row, 'prevConsumption', 'prevconsumption')),
      appDisplay: pick(row, 'appDisplay', 'appdisplay'),
      storeStocks: {
        office: toNumeric(pick(row, 'officeStock', 'officestock')),
        baba: toNumeric(pick(row, 'babaMainStock', 'babamainstock')),
        nakano: toNumeric(pick(row, 'nakanoStock', 'nakanostock')),
        baba_2nd: toNumeric(pick(row, 'baba2ndStock', 'baba2ndstock'))
      }
    }))
  }
  // RPC未反映環境では既存APIを組み合わせてフォールバックする
  if (!String(error.message || '').includes('fetch_dashboard_stock_overview')) throw error

  const [overviewRows, transferRows] = await Promise.all([
    getStockOverview(periodKey),
    getFlavorListForTransfer(periodKey)
  ])
  const transferMap = new Map(
    transferRows.map((row) => [`${row.brand}::${row.flavorName}`, row.stock || {}])
  )
  return overviewRows.map((row) => {
    const stock = transferMap.get(`${row.brand}::${row.flavorName}`) || {}
    return {
      ...row,
      storeStocks: {
        office: toNumeric(stock.office),
        baba: toNumeric(stock.baba_main),
        nakano: toNumeric(stock.nakano),
        baba_2nd: toNumeric(stock.baba_2nd)
      }
    }
  })
}

export async function getInventoryResultDetails(monthNum, storeKey) {
  requireSupabase()
  const periodKey = normalizePeriodKey(monthNum)
  const storeId = await getStoreIdByKey(storeKey)
  const { data, error } = await supabase.rpc('fetch_inventory_result_details', {
    p_period_key: periodKey,
    p_store_id: storeId
  })
  if (!error) {
    return (data || []).map((row) => ({
      rowIndex: pick(row, 'rowIndex', 'rowindex'),
      brand: pick(row, 'brand'),
      flavorName: pick(row, 'flavorName', 'flavorname'),
      tupperBasicStock: toNumeric(pick(row, 'tupperBasicStock', 'tupperbasicstock')),
      tupperReserveStock: toNumeric(pick(row, 'tupperReserveStock', 'tupperreservestock')),
      merchStock: toNumeric(pick(row, 'merchStock', 'merchstock')),
      inventoryStock: toNumeric(pick(row, 'inventoryStock', 'inventorystock')),
      currentTotal: toNumeric(pick(row, 'currentTotal', 'currenttotal')),
      prevTotal: toNumeric(pick(row, 'prevTotal', 'prevtotal')),
      prevConsumption: toNumeric(pick(row, 'prevConsumption', 'prevconsumption')),
      transferAmount: toNumeric(pick(row, 'transferAmount', 'transferamount')),
      currentConsumption: toNumeric(pick(row, 'currentConsumption', 'currentconsumption'))
    }))
  }
  // RPC未反映環境向けフォールバック
  if (!String(error.message || '').includes('fetch_inventory_result_details')) throw error

  const prevPeriodKey = getPreviousPeriodKey(periodKey)
  const prevPrevPeriodKey = getPreviousPeriodKey(prevPeriodKey)
  const periodKeys = [periodKey, prevPeriodKey, prevPrevPeriodKey].filter(Boolean)

  const [{ data: flavors, error: flavorsError }, { data: inventoryRows, error: inventoryError }, { data: transferRows, error: transferError }] = await Promise.all([
    supabase
      .from('flavors')
      .select('id,name,is_active,brands(name)')
      .eq('is_active', true),
    supabase
      .from('inventory_logs')
      .select(`
        id,
        period_key,
        flavor_id,
        created_at,
        tupper_basic,
        tupper_reserve,
        merch_pkg_50,
        merch_pkg_100,
        merch_pkg_125,
        merch_pkg_200,
        merch_pkg_250,
        merch_pkg_1kg,
        stock_pkg_50,
        stock_pkg_100,
        stock_pkg_125,
        stock_pkg_200,
        stock_pkg_250,
        stock_pkg_1kg,
        stock_other
      `)
      .eq('store_id', storeId)
      .in('period_key', periodKeys),
    supabase
      .from('transfer_logs')
      .select('period_key,flavor_id,from_store_id,dest_store_id,quantity')
      .eq('status', 'completed')
      .in('period_key', [periodKey, prevPeriodKey].filter(Boolean))
      .or(`from_store_id.eq.${storeId},dest_store_id.eq.${storeId}`)
  ])
  if (flavorsError) throw flavorsError
  if (inventoryError) throw inventoryError
  if (transferError) throw transferError

  const latestInventoryByPeriodFlavor = new Map()
  for (const row of inventoryRows || []) {
    const key = `${row.period_key}:${row.flavor_id}`
    const prev = latestInventoryByPeriodFlavor.get(key)
    if (!prev || new Date(row.created_at) > new Date(prev.created_at) || (row.created_at === prev.created_at && row.id > prev.id)) {
      latestInventoryByPeriodFlavor.set(key, row)
    }
  }

  const transferDelta = new Map()
  for (const row of transferRows || []) {
    let delta = 0
    if (row.dest_store_id === storeId) delta += toNumeric(row.quantity)
    if (row.from_store_id === storeId) delta -= toNumeric(row.quantity)
    const key = `${row.period_key}:${row.flavor_id}`
    transferDelta.set(key, toNumeric(transferDelta.get(key)) + delta)
  }

  const toBreakdown = (row) => {
    if (!row) return { tupperBasic: 0, tupperReserve: 0, merch: 0, inventory: 0, total: 0 }
    const tupperBasic = toNumeric(row.tupper_basic)
    const tupperReserve = toNumeric(row.tupper_reserve)
    const merch = toNumeric(row.merch_pkg_50) * 50
      + toNumeric(row.merch_pkg_100) * 100
      + toNumeric(row.merch_pkg_125) * 125
      + toNumeric(row.merch_pkg_200) * 200
      + toNumeric(row.merch_pkg_250) * 250
      + toNumeric(row.merch_pkg_1kg) * 1000
    const inventory = toNumeric(row.stock_pkg_50) * 50
      + toNumeric(row.stock_pkg_100) * 100
      + toNumeric(row.stock_pkg_125) * 125
      + toNumeric(row.stock_pkg_200) * 200
      + toNumeric(row.stock_pkg_250) * 250
      + toNumeric(row.stock_pkg_1kg) * 1000
      + toNumeric(row.stock_other)
    return { tupperBasic, tupperReserve, merch, inventory, total: tupperBasic + tupperReserve + merch + inventory }
  }

  const rows = (flavors || [])
    .map((flavor) => {
      const current = toBreakdown(latestInventoryByPeriodFlavor.get(`${periodKey}:${flavor.id}`))
      const prev = toBreakdown(latestInventoryByPeriodFlavor.get(`${prevPeriodKey}:${flavor.id}`))
      const prevPrev = toBreakdown(latestInventoryByPeriodFlavor.get(`${prevPrevPeriodKey}:${flavor.id}`))
      const currentTransfer = toNumeric(transferDelta.get(`${periodKey}:${flavor.id}`))
      const prevTransfer = toNumeric(transferDelta.get(`${prevPeriodKey}:${flavor.id}`))
      return {
        brand: flavor.brands?.name || '',
        flavorName: flavor.name,
        tupperBasicStock: current.tupperBasic,
        tupperReserveStock: current.tupperReserve,
        merchStock: current.merch,
        inventoryStock: current.inventory,
        currentTotal: current.total,
        prevTotal: prev.total,
        prevConsumption: prevPrev.total + prevTransfer - prev.total,
        transferAmount: currentTransfer,
        currentConsumption: prev.total + currentTransfer - current.total
      }
    })
    .sort((a, b) => (a.brand + a.flavorName).localeCompare(b.brand + b.flavorName, 'ja'))

  return rows.map((row, idx) => ({
    rowIndex: idx + 1,
    ...row
  }))
}

export async function listTransferBrandsOrdered() {
  requireSupabase()
  const rows = await getOrderedFlavorsWithBrand()
  return rows
    .map((r) => ({ brand: r.brands?.name || '', flavorName: r.name }))
    .sort((a, b) => (a.brand + a.flavorName).localeCompare(b.brand + b.flavorName, 'ja'))
}

// ============================================================
// 原価計算 API
// ============================================================

export async function getBrandsForCost() {
  requireSupabase()
  // 原価計算では集約ブランド（is_cost_group=true）と
  // どのグループにも属さないスタンドアロンブランド（cost_group_id IS NULL）のみ返す。
  // Azure Gold Line / Azure Black Line / Tangiers 各種は cost_group_id で集約ブランドへ紐付け済み。
  const { data, error } = await supabase
    .from('brands')
    .select('id,name,short_name')
    .or('is_cost_group.eq.true,cost_group_id.is.null')
    .order('name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getCostReport(storeKey, periodKey) {
  requireSupabase()
  const pk = normalizePeriodKey(periodKey)
  const storeId = await getStoreIdByKey(storeKey)
  const { data: report, error: reportError } = await supabase
    .from('cost_reports')
    .select('*')
    .eq('store_id', storeId)
    .eq('period_key', pk)
    .maybeSingle()
  if (reportError) throw reportError

  if (!report) return null

  const { data: brandSales, error: salesError } = await supabase
    .from('flavor_brand_sales')
    .select('*')
    .eq('report_id', report.id)
  if (salesError) throw salesError

  const { data: drinks, error: drinksError } = await supabase
    .from('drink_orders')
    .select('*')
    .eq('store_id', storeId)
    .eq('period_key', pk)
    .order('order_date', { ascending: true })
    .order('created_at', { ascending: true })
  if (drinksError) throw drinksError

  return { report, brandSales: brandSales || [], drinks: drinks || [] }
}

export async function upsertCostReport(storeKey, periodKey, fields) {
  requireSupabase()
  const pk = normalizePeriodKey(periodKey)
  const storeId = await getStoreIdByKey(storeKey)
  const row = {
    store_id: storeId,
    period_key: pk,
    updated_at: toJstTimestampString(),
    ...fields
  }
  const { data, error } = await supabase
    .from('cost_reports')
    .upsert(row, { onConflict: 'store_id,period_key' })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function saveBrandSales(reportId, brandSalesArray) {
  requireSupabase()
  if (!brandSalesArray.length) return
  const rows = brandSalesArray.map((b) => ({
    report_id: reportId,
    brand_id: b.brandId,
    total_consumption_g: b.totalConsumptionG,
    merch_count: b.merchCount,
    merch_count_secondary: b.merchCount250 || 0,
    grams_per_pack: b.gramsPerPack
  }))
  const { error } = await supabase
    .from('flavor_brand_sales')
    .upsert(rows, { onConflict: 'report_id,brand_id' })
  if (error) throw error
}

/** 指定店舗・対象月の棚卸し結果からブランドグループ別消費量(g)を返す Map<brandId, grams> */
export async function getBrandConsumptionForCost(storeKey, periodKey) {
  requireSupabase()
  const pk = normalizePeriodKey(periodKey)
  const prevPk = getPreviousPeriodKey(pk)
  const storeId = await getStoreIdByKey(storeKey)

  // アクティブなフレーバーと cost_group_id を含むブランド情報を取得
  const { data: flavors, error: flavorsError } = await supabase
    .from('flavors')
    .select('id, brand_id, brands(id, cost_group_id)')
    .eq('is_active', true)
  if (flavorsError) throw flavorsError

  // 今月の棚卸し在庫・前月の棚卸し在庫・今月の移動量を並列取得
  const [currentInv, prevInv, currentTransfer] = await Promise.all([
    fetchLatestInventoryByFlavor(storeId, pk),
    prevPk ? fetchLatestInventoryByFlavor(storeId, prevPk) : Promise.resolve(new Map()),
    fetchCompletedTransferDeltaByFlavor(storeId, pk)
  ])

  // フレーバーごとの消費量を原価計算ブランドグループ単位で集計
  // 消費量 = 前月末在庫 + 今月の移動量 - 今月末在庫
  const consumptionByBrandId = new Map()
  for (const flavor of flavors || []) {
    const effectiveBrandId = flavor.brands?.cost_group_id ?? flavor.brand_id
    const prev = toNumeric(prevInv.get(flavor.id))
    const transfer = toNumeric(currentTransfer.get(flavor.id))
    const current = toNumeric(currentInv.get(flavor.id))
    const consumption = prev + transfer - current
    consumptionByBrandId.set(
      effectiveBrandId,
      toNumeric(consumptionByBrandId.get(effectiveBrandId)) + consumption
    )
  }

  return consumptionByBrandId
}

export async function addDrinkOrder(storeKey, periodKey, orderData) {
  requireSupabase()
  const pk = normalizePeriodKey(periodKey)
  const storeId = await getStoreIdByKey(storeKey)
  const { data, error } = await supabase
    .from('drink_orders')
    .insert({
      store_id: storeId,
      period_key: pk,
      order_date: orderData.orderDate,
      amount: orderData.amount,
      description: orderData.description || null
    })
    .select('id,order_date,amount,description,created_at')
    .single()
  if (error) throw error
  return data
}

export async function updateDrinkOrder(orderId, orderData) {
  requireSupabase()
  const { data, error } = await supabase
    .from('drink_orders')
    .update({
      order_date: orderData.orderDate,
      amount: orderData.amount,
      description: orderData.description || null
    })
    .eq('id', orderId)
    .select('id,order_date,amount,description,created_at')
    .single()
  if (error) throw error
  return data
}

export async function deleteDrinkOrder(orderId) {
  requireSupabase()
  const { error } = await supabase
    .from('drink_orders')
    .delete()
    .eq('id', orderId)
  if (error) throw error
}

export async function getDrinkOrders(storeKey, periodKey) {
  requireSupabase()
  const pk = normalizePeriodKey(periodKey)
  const storeId = await getStoreIdByKey(storeKey)
  const { data, error } = await supabase
    .from('drink_orders')
    .select('id,order_date,amount,description,created_at')
    .eq('store_id', storeId)
    .eq('period_key', pk)
    .order('order_date', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getCostReportHistory(storeKey) {
  requireSupabase()
  const storeId = await getStoreIdByKey(storeKey)
  const { data: reports, error } = await supabase
    .from('cost_reports')
    .select('*')
    .eq('store_id', storeId)
    .order('period_key', { ascending: true })
  if (error) throw error
  if (!reports || reports.length === 0) return []

  const reportIds = reports.map((r) => r.id)
  const { data: allSales, error: salesError } = await supabase
    .from('flavor_brand_sales')
    .select('*')
    .in('report_id', reportIds)
  if (salesError) throw salesError

  const { data: allDrinks, error: drinksError } = await supabase
    .from('drink_orders')
    .select('period_key,amount')
    .eq('store_id', storeId)
  if (drinksError) throw drinksError

  const drinkTotalByPeriod = new Map()
  for (const d of allDrinks || []) {
    drinkTotalByPeriod.set(d.period_key, toNumeric(drinkTotalByPeriod.get(d.period_key)) + toNumeric(d.amount))
  }
  const salesByReport = new Map()
  for (const s of allSales || []) {
    if (!salesByReport.has(s.report_id)) salesByReport.set(s.report_id, [])
    salesByReport.get(s.report_id).push(s)
  }

  return reports.map((r) => {
    const sales = salesByReport.get(r.id) || []
    const flavorServe = sales.reduce((acc, s) => {
      const merchG = toNumeric(s.merch_count) * toNumeric(s.grams_per_pack)
      return acc + Math.max(0, toNumeric(s.total_consumption_g) - merchG)
    }, 0)
    const drinkTotal = toNumeric(drinkTotalByPeriod.get(r.period_key))

    const totalServings = toNumeric(r.hookahs_first) + toNumeric(r.hookahs_refill) + toNumeric(r.hookahs_staff) + toNumeric(r.hookahs_event)
    const totalVisitors = toNumeric(r.hookahs_charge) + toNumeric(r.hookahs_refill) + toNumeric(r.hookahs_staff) + toNumeric(r.hookahs_event)
    const charcoalServe = toNumeric(r.charcoal_nyanco_flat_serve) + toNumeric(r.charcoal_kingco_flat_serve)

    const A = totalServings > 0 ? flavorServe / totalServings : 0
    const B = toNumeric(r.price_flavor_per_g) * A
    const C = totalServings > 0 ? charcoalServe * 1000 / totalServings : 0
    const D = toNumeric(r.price_charcoal_per_kg) * C / 1000
    const E = totalVisitors > 0 ? drinkTotal / totalVisitors : 0
    const F = totalVisitors > 0 ? totalServings / totalVisitors : 0

    return {
      periodKey: r.period_key,
      startDate: r.start_date,
      endDate: r.end_date,
      totalServings,
      totalVisitors,
      flavorServeG: flavorServe,
      charcoalServeKg: charcoalServe,
      drinkTotal,
      A: Math.round(A * 100) / 100,
      B: Math.round(B * 100) / 100,
      C: Math.round(C * 100) / 100,
      D: Math.round(D * 100) / 100,
      E: Math.round(E * 100) / 100,
      F: Math.round(F * 1000) / 1000
    }
  })
}
