/**
 * api.js - GAS API クライアント
 * google.script.run の代替として使用する fetch ラッパー
 */

const API_URL = import.meta.env.VITE_GAS_API_URL;
const API_KEY  = import.meta.env.VITE_API_KEY;

// GETリクエスト汎用ラッパー
export async function gasGet(action, params = {}) {
  const qs = new URLSearchParams({ action, apiKey: API_KEY, ...params });
  const res = await fetch(`${API_URL}?${qs}`);
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  const json = await res.json();
  if (json && json.error) throw new Error(json.error.message);
  return json;
}

// POSTリクエスト汎用ラッパー
// ※ GAS は Content-Type: application/json を CORS Preflight でブロックするため text/plain を使用
export async function gasPost(action, payload = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, apiKey: API_KEY, payload })
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  const json = await res.json();
  if (json && json.error) throw new Error(json.error.message);
  return json;
}

// ============================================================
// 各機能ごとのAPI呼び出し
// ============================================================

/** 棚卸し: データ取得 */
export const getSheetData = (storeKey, sheetName) =>
  gasGet('getSheetData', { storeKey, sheetName });

/** 棚卸し: データ送信 */
export const submitData = (payload) =>
  gasPost('submitData', payload);

/** 棚卸し: 消費量マイナスチェック（ドライラン・書き込みなし） */
export const checkNegativeConsumption = (payload) =>
  gasPost('checkNegativeConsumption', payload);

/** 補充依頼: 在庫データ取得 */
export const getInventoryData = (monthNum) =>
  gasGet('getInventoryData', { monthNum });

/** 移動記録: フレーバー一覧取得 */
export const getFlavorListForTransfer = (monthNum) =>
  gasGet('getFlavorListForTransfer', { monthNum });

/** 移動記録: 未検品一覧取得 */
export const getPendingTransferRecords = (monthNum, destStoreKey) =>
  gasGet('getPendingTransferRecords', { monthNum, destStoreKey });

/** 移動記録: 詳細取得 */
export const getTransferRecordDetail = (monthNum, blockIndex, destStoreKey) =>
  gasGet('getTransferRecordDetail', { monthNum, blockIndex, destStoreKey });

/** 移動記録: 起票送信 */
export const submitTransferRecord = (payload) =>
  gasPost('submitTransferRecord', payload);

/** 移動記録: 検品完了 */
export const completeInspection = (payload) =>
  gasPost('completeInspection', payload);

/** 在庫量確認: データ取得 */
export const getStockOverview = (monthNum) =>
  gasGet('getStockOverview', { monthNum });
