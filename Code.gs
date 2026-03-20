/**
 * 統合スプレッドシートID
 */
const SPREADSHEET_ID = '1p4zcL3Pb1ZtwtpnDGtsL0nBwk0Lt1Xk02Iiupcj_hCk';

const DATA_START_ROW  = 3;
// DATA_LAST_ROW: 最終行はSUM合計行のため、getLastRow()-1 で動的に計算する

/**
 * 店舗別 列インデックス定義（0-indexed）
 * tupper: [タッパー1, タッパー2]
 * flavor: [50g, 100g, 125g, 200g, 250g, 1kg, その他]  ← 在庫7種
 * merch:  [50g, 100g, 125g, 200g, 250g, 1kg]           ← 物販6種
 */
const STORE_COLUMNS = {
  office: {
    tupper:  [6, 7],                              // G, H
    flavor:  [11, 12, 13, 14, 15, 16, 17],       // L, M, N, O, P, Q, R
    merch:   [19, 20, 21, 22, 23, 24]            // T, U, V, W, X, Y
  },
  baba: {
    tupper:  [27, 28],                            // AB, AC
    flavor:  [32, 33, 34, 35, 36, 37, 38],       // AG, AH, AI, AJ, AK, AL, AM
    merch:   [40, 41, 42, 43, 44, 45]            // AO, AP, AQ, AR, AS, AT
  },
  nakano: {
    tupper:  [48, 49],                            // AW, AX
    flavor:  [53, 54, 55, 56, 57, 58, 59],       // BB, BC, BD, BE, BF, BG, BH
    merch:   [61, 62, 63, 64, 65, 66]            // BJ, BK, BL, BM, BN, BO
  },
  baba_2nd: {
    tupper:  [69, 70],                            // BR, BS
    flavor:  [74, 75, 76, 77, 78, 79, 80],       // BW, BX, BY, BZ, CA, CB, CC
    merch:   [82, 83, 84, 85, 86, 87]            // CE, CF, CG, CH, CI, CJ
  }
};

/**
 * 読み取り最大列数（CJ列まで = 88列、0-indexed で 87）
 */
const MAX_COL_COUNT = 88;

/**
 * 補充依頼用在庫合計列（0-indexed）
 * HQ=224, HR=225, HS=226, HT=227
 */
const STOCK_TOTAL_COLS = {
  office:   224, // HQ
  baba:     225, // HR
  nakano:   226, // HS
  baba_2nd: 227  // HT
};

/**
 * 前月消費量列（0-indexed）
 * 事務所: HY(232), 馬場: HZ(233), 中野: IA(234), 2号店: IB(235)
 */
const PREV_MONTH_CONS_COLS = {
  office:   232,
  baba:     233,
  nakano:   234,
  baba_2nd: 235
};


/**
 * 実施日の記録先セル
 * 事務所: IH3 (242列目), 馬場: II3 (243列目), 中野: IJ3 (244列目), 2号店: IK3 (245列目)
 */
const DATE_CELLS = {
  office:   'IH3',
  baba:     'II3',
  nakano:   'IJ3',
  baba_2nd: 'IK3'
};

/**
 * 在庫量確認モード用列定数（0-indexed）
 * IH=241, II=242, IJ=243, IK=244, IL=245, IM=246, IN=247
 */
const STOCK_OVERVIEW_COLS = {
  prevConsumption: 246,  // IM列: 前月消費量
  totalStock:      247   // IN列: 総在庫量
};

/**
 * 在庫量確認モード用データ取得
 * @param {number|string} monthNum
 * @returns {Array} [{ rowIndex, brand, flavorName, totalStock, prevConsumption }]
 */
function getStockOverview(monthNum) {
  const sheetName = monthNum + '月';
  const ss    = openSS();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('シート「' + sheetName + '」が見つかりません。');

  const lastRow = sheet.getLastRow() - 1; // 最終行はSUM合計行のため1行手前まで
  if (lastRow < DATA_START_ROW) return [];

  const numRows    = lastRow - DATA_START_ROW + 1;
  const brandFlavor = sheet.getRange(DATA_START_ROW, 1, numRows, 2).getValues();
  const totalStockVals  = sheet.getRange(DATA_START_ROW, STOCK_OVERVIEW_COLS.totalStock + 1, numRows, 1).getValues();
  const prevConsVals    = sheet.getRange(DATA_START_ROW, STOCK_OVERVIEW_COLS.prevConsumption + 1, numRows, 1).getValues();

  let currentBrand = '';
  const items = [];

  brandFlavor.forEach((row, i) => {
    const brand  = String(row[0]).trim();
    const flavor = String(row[1]).trim();
    if (brand  !== '') currentBrand = brand;
    if (flavor === '' || currentBrand === '') return;

    const totalStock      = typeof totalStockVals[i][0] === 'number'  ? totalStockVals[i][0]  : 0;
    const prevConsumption = typeof prevConsVals[i][0]   === 'number'  ? prevConsVals[i][0]    : 0;

    items.push({
      rowIndex:       DATA_START_ROW + i,
      brand:          currentBrand,
      flavorName:     flavor,
      totalStock,
      prevConsumption
    });
  });

  return items;
}


// ============================================================
// Phase 3: GAS API ラッパー
// ============================================================

/** APIキー（フロントエンドの .env の VITE_API_KEY と一致させること） */
const API_SECRET_KEY = 'vv-app-secret-ds8dns9s';

/** APIキー検証 */
function validateApiKey_(key) {
  return key === API_SECRET_KEY;
}

/** JSON レスポンス生成 */
function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * GET リクエストルーター
 * クエリパラメータ: apiKey, action, + 各関数用パラメータ
 */
function doGet(e) {
  const p = e.parameter || {};

  if (!validateApiKey_(p.apiKey)) {
    return jsonResponse_({ error: { message: '認証エラー: APIキーが無効です。' } });
  }

  try {
    switch (p.action) {
      case 'getSheetData':
        return jsonResponse_(getSheetData(p.storeKey, p.sheetName));

      case 'getInventoryData':
        return jsonResponse_(getInventoryData(parseInt(p.monthNum, 10)));

      case 'getFlavorListForTransfer':
        return jsonResponse_(getFlavorListForTransfer(parseInt(p.monthNum, 10)));

      case 'getPendingTransferRecords':
        return jsonResponse_(getPendingTransferRecords(parseInt(p.monthNum, 10), p.destStoreKey));

      case 'getTransferRecordDetail':
        return jsonResponse_(getTransferRecordDetail(parseInt(p.monthNum, 10), parseInt(p.blockIndex, 10), p.destStoreKey));

      case 'getStockOverview':
        return jsonResponse_(getStockOverview(parseInt(p.monthNum, 10)));

      default:
        return jsonResponse_({ error: { message: '不明なアクション: ' + p.action } });
    }
  } catch (err) {
    return jsonResponse_({ error: { message: err.message || 'Unknown error' } });
  }
}

/**
 * POST リクエストルーター
 * リクエストボディ (JSON): { apiKey, action, payload }
 */
function doPost(e) {
  let body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (parseErr) {
    return jsonResponse_({ error: { message: 'JSONパースエラー: ' + parseErr.message } });
  }

  if (!validateApiKey_(body.apiKey)) {
    return jsonResponse_({ error: { message: '認証エラー: APIキーが無効です。' } });
  }

  try {
    switch (body.action) {
      case 'submitData':
        return jsonResponse_(submitData(body.payload));

      case 'submitTransferRecord':
        return jsonResponse_(submitTransferRecord(body.payload));

      case 'completeInspection':
        return jsonResponse_(completeInspection(body.payload));

      default:
        return jsonResponse_({ error: { message: '不明なアクション: ' + body.action } });
    }
  } catch (err) {
    return jsonResponse_({ error: { message: err.message || 'Unknown error' } });
  }
}

/**
 * 統合スプレッドシートを取得（キャッシュなし・単純な開き直し）
 */
function openSS() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Get data from the specified sheet
 * @param {string} storeKey - e.g., "baba_2nd"
 * @param {string} sheetName - e.g., "1月"
 * @returns {object} { items: Array, date: string }
 */
function getSheetData(storeKey, sheetName) {
  const cols = STORE_COLUMNS[storeKey];
  if (!cols) {
    throw new Error('指定された店舗が無効です。');
  }

  let ss;
  try {
    ss = openSS();
  } catch (e) {
    throw new Error('スプレッドシートへのアクセス権限がありません（またはシートが見つかりません）。');
  }

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('シート「' + sheetName + '」が見つかりません。');
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) {
    return { items: [], date: '' };
  }

  // 実施日を新セルから取得
  const dateCell = DATE_CELLS[storeKey];
  let dateStr = '';
  if (dateCell) {
    const dateValue = sheet.getRange(dateCell).getValue();
    if (dateValue instanceof Date) {
      dateStr = Utilities.formatDate(dateValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }
  }

  // 全列を一括取得
  const range = sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, MAX_COL_COUNT);
  const dataValues = range.getValues();

  let currentBrand = '';
  const items = [];

  dataValues.forEach((row, index) => {
    const colBrand  = String(row[0]).trim(); // A列
    const colFlavor = String(row[1]).trim(); // B列

    if (colBrand !== '') currentBrand = colBrand;
    if (colFlavor === '') return;

    const displayBrand = currentBrand || 'Other';

    items.push({
      rowIndex: DATA_START_ROW + index,
      brand: displayBrand,
      flavorName: colFlavor,

      tupper: {
        basic:   row[cols.tupper[0]],
        reserve: row[cols.tupper[1]]
      },

      flavor: {
        val50:    row[cols.flavor[0]],
        val100:   row[cols.flavor[1]],
        val125:   row[cols.flavor[2]],
        val200:   row[cols.flavor[3]],
        val250:   row[cols.flavor[4]],
        val1kg:   row[cols.flavor[5]],
        valOther: row[cols.flavor[6]]
      },

      merch: {
        val50:  row[cols.merch[0]],
        val100: row[cols.merch[1]],
        val125: row[cols.merch[2]],
        val200: row[cols.merch[3]],
        val250: row[cols.merch[4]],
        val1kg: row[cols.merch[5]]
      }
    });
  });

  return { items: items, date: dateStr };
}

/**
 * Submit inventory data
 * @param {object} payload
 */
function submitData(payload) {
  const { storeKey, sheetName, date, items } = payload;

  const cols = STORE_COLUMNS[storeKey];
  if (!cols) {
    throw new Error('指定された店舗が無効です。');
  }

  let ss;
  try {
    ss = openSS();
  } catch (e) {
    throw new Error('スプレッドシートへのアクセス権限がありません（またはシートが見つかりません）。');
  }

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('シート「' + sheetName + '」が見つかりません。');
  }

  // 実施日を指定のセルに書き込む（B1廃止）
  const dateCell = DATE_CELLS[storeKey];
  if (dateCell) {
    sheet.getRange(dateCell).setValue(date);
  }

  if (!items || items.length === 0) {
    return { success: true };
  }

  const getVal = (val) => (val === undefined || val === null) ? '' : val;

  // 連続した行ごとにAPI呼び出しを最小化
  items.sort((a, b) => a.rowIndex - b.rowIndex);

  const blocks = [];
  let currentBlock = [];

  for (const item of items) {
    if (currentBlock.length === 0) {
      currentBlock.push(item);
    } else {
      const lastItem = currentBlock[currentBlock.length - 1];
      if (item.rowIndex === lastItem.rowIndex + 1) {
        currentBlock.push(item);
      } else {
        blocks.push(currentBlock);
        currentBlock = [item];
      }
    }
  }
  if (currentBlock.length > 0) blocks.push(currentBlock);

  blocks.forEach(block => {
    const startRow = block[0].rowIndex;
    const numRows  = block.length;

    const tupperValues = [];
    const flavorValues = [];
    const merchValues  = [];

    block.forEach(item => {
      tupperValues.push([
        item.tupper ? getVal(item.tupper.basic)   : '',
        item.tupper ? getVal(item.tupper.reserve) : ''
      ]);

      flavorValues.push([
        item.flavor ? getVal(item.flavor.val50)    : '',
        item.flavor ? getVal(item.flavor.val100)   : '',
        item.flavor ? getVal(item.flavor.val125)   : '',
        item.flavor ? getVal(item.flavor.val200)   : '',
        item.flavor ? getVal(item.flavor.val250)   : '',
        item.flavor ? getVal(item.flavor.val1kg)   : '',
        item.flavor ? getVal(item.flavor.valOther) : ''
      ]);

      merchValues.push([
        item.merch ? getVal(item.merch.val50)  : '',
        item.merch ? getVal(item.merch.val100) : '',
        item.merch ? getVal(item.merch.val125) : '',
        item.merch ? getVal(item.merch.val200) : '',
        item.merch ? getVal(item.merch.val250) : '',
        item.merch ? getVal(item.merch.val1kg) : ''
      ]);
    });

    // タッパー（2列）
    sheet.getRange(startRow, cols.tupper[0] + 1, numRows, 2).setValues(tupperValues);

    // 在庫（7列）
    sheet.getRange(startRow, cols.flavor[0] + 1, numRows, 7).setValues(flavorValues);

    // 物販（6列）
    sheet.getRange(startRow, cols.merch[0] + 1, numRows, 6).setValues(merchValues);
  });

  // 前月消費量のマイナスチェック
  // SpreadsheetApp.flush() を呼んで反映を待つ
  SpreadsheetApp.flush();
  
  const consCol = PREV_MONTH_CONS_COLS[storeKey];
  const negativeConsumptionItems = [];

  if (consCol !== undefined) {
    const lastRow = sheet.getLastRow();
    if (lastRow >= DATA_START_ROW) {
      // 必要な列（A, B, 消費量列まで）を取得
      const range = sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, consCol + 1);
      const dataValues = range.getValues();
      
      dataValues.forEach((row) => {
        const brand = String(row[0]).trim();
        const flavor = String(row[1]).trim();
        const consumption = row[consCol];
        
        if (brand !== '' && flavor !== '') {
          // 数値判定し、マイナスならリストに追加
          let cVal = 0;
          if (typeof consumption === 'number') {
            cVal = consumption;
          } else if (consumption) {
            const m = String(consumption).replace(/,/g, '').trim().match(/-?\d+(\.\d+)?/);
            if (m) cVal = parseFloat(m[0]);
          }
          
          if (cVal < 0) {
            negativeConsumptionItems.push(brand + ' ' + flavor);
          }
        }
      });
    }
  }

  return { 
    success: true, 
    negativeConsumptionItems: negativeConsumptionItems
  };
}

/**
 * --- API: 補充依頼用 在庫データ取得 ---
 * @param {string|number} monthNum - 取得対象月
 */
function getInventoryData(monthNum) {
  const targetMonth = monthNum ? monthNum : (new Date().getMonth() + 1);
  const sheetName = targetMonth + '月';

  Logger.log('Target Sheet Name: ' + sheetName);

  let ss;
  try {
    ss = openSS();
  } catch (e) {
    throw new Error('スプレッドシートへのアクセス権限がありません。');
  }

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('シート「' + sheetName + '」が見つかりません。');
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) return [];

  // HT列（228列目）まで取得
  const TOTAL_READ_COLS = 228;
  const values = sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, TOTAL_READ_COLS).getValues();

  let currentBrand = '';
  const data = {};

  values.forEach(row => {
    const colBrand  = String(row[0]).trim();
    const colFlavor = String(row[1]).trim();

    if (colBrand !== '') currentBrand = colBrand;
    if (colFlavor === '' || currentBrand === '') return;

    const key = currentBrand + '_' + colFlavor;

    if (!data[key]) {
      data[key] = {
        id: key,
        brand: currentBrand,
        flavor: colFlavor,
        stock: { office: 0, baba_main: 0, nakano: 0, baba_2nd: 0 }
      };
    }

    const parseQty = (val) => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      const m = String(val).replace(/,/g, '').trim().match(/-?\d+(\.\d+)?/);
      return m ? parseFloat(m[0]) : 0;
    };

    // 各拠点の在庫合計列（HQ〜HT）を参照
    data[key].stock.office   = parseQty(row[STOCK_TOTAL_COLS.office]);
    data[key].stock.baba_main = parseQty(row[STOCK_TOTAL_COLS.baba]);
    data[key].stock.nakano   = parseQty(row[STOCK_TOTAL_COLS.nakano]);
    data[key].stock.baba_2nd = parseQty(row[STOCK_TOTAL_COLS.baba_2nd]);
  });

  return Object.values(data);
}

// =============================================================
// 移動記録モード
// =============================================================
//
// 移動記録領域: CW〜HL (1-indexed 101〜220)
// 4列ごとに1ブロック、最大30ブロック
// ブロック内オフセット: 0=office, 1=baba, 2=nakano, 3=baba_2nd
// 行1左端 = 実施日、行1右端(+3) = 検品チェックボックス
//
const TRANSFER_BLOCK_START_COL = 101;  // CW (1-indexed)
const TRANSFER_BLOCK_COUNT     = 30;
const TRANSFER_STORE_OFFSET    = { office: 0, baba: 1, nakano: 2, baba_2nd: 3 };

/**
 * 起票用フレーバー一覧取得
 * @param {number|string} monthNum
 * @returns {Array} [{ rowIndex, brand, flavorName }]
 */
function getFlavorListForTransfer(monthNum) {
  const sheetName = monthNum + '月';
  const ss    = openSS();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('シート「' + sheetName + '」が見つかりません。');

  // getLastRow() の最終行はSUM合計行のため、1行手前までをデータ行とする
  const lastRow = sheet.getLastRow() - 1;
  if (lastRow < DATA_START_ROW) return [];

  const values = sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 2).getValues();
  let currentBrand = '';
  const items = [];

  values.forEach((row, i) => {
    const brand  = String(row[0]).trim();
    const flavor = String(row[1]).trim();
    if (brand  !== '') currentBrand = brand;
    if (flavor === '' || currentBrand === '') return;
    items.push({ rowIndex: DATA_START_ROW + i, brand: currentBrand, flavorName: flavor });
  });

  return items;
}

/**
 * 未検品の移動記録一覧を取得
 * @param {number|string} monthNum
 * @param {string} destStoreKey
 * @returns {Array} [{ blockIndex, date, fromStoreKey }]
 */
function getPendingTransferRecords(monthNum, destStoreKey) {
  const sheetName  = monthNum + '月';
  const destOffset = TRANSFER_STORE_OFFSET[destStoreKey];
  if (destOffset === undefined) throw new Error('指定された移動先店舗が無効です。');

  const ss    = openSS();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('シート「' + sheetName + '」が見つかりません。');

  const lastRow    = sheet.getLastRow();
  const headerCols = TRANSFER_BLOCK_COUNT * 4;
  const headerRow  = sheet.getRange(1, TRANSFER_BLOCK_START_COL, 1, headerCols).getValues()[0];

  let dataRows = null;
  if (lastRow >= DATA_START_ROW) {
    dataRows = sheet.getRange(DATA_START_ROW, TRANSFER_BLOCK_START_COL,
                              lastRow - DATA_START_ROW + 1, headerCols).getValues();
  }

  const storeKeys = ['office', 'baba', 'nakano', 'baba_2nd'];
  const results   = [];

  for (let b = 0; b < TRANSFER_BLOCK_COUNT; b++) {
    const base     = b * 4;
    const dateVal  = headerRow[base];
    const checked  = headerRow[base + 3];

    if (checked === true || dateVal === '' || dateVal === null) continue;

    // 移動先列に正の値がある行が1件以上あるか
    let hasDestValue = false;
    if (dataRows) {
      for (const row of dataRows) {
        if (typeof row[base + destOffset] === 'number' && row[base + destOffset] > 0) {
          hasDestValue = true; break;
        }
      }
    }
    if (!hasDestValue) continue;

    // 移動元（負の値のある列）を特定
    let fromStoreKey = '';
    if (dataRows) {
      outer: for (let off = 0; off < 4; off++) {
        if (off === destOffset) continue;
        for (const row of dataRows) {
          if (typeof row[base + off] === 'number' && row[base + off] < 0) {
            fromStoreKey = storeKeys[off]; break outer;
          }
        }
      }
    }

    let dateStr = '';
    if (dateVal instanceof Date) {
      dateStr = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    } else if (dateVal) {
      dateStr = String(dateVal);
    }

    results.push({ blockIndex: b, date: dateStr, fromStoreKey });
  }

  return results;
}

/**
 * 移動記録の詳細を取得（検品入力画面用）
 * @param {number|string} monthNum
 * @param {number} blockIndex
 * @param {string} destStoreKey
 * @returns {Array} [{ rowIndex, brand, flavorName, qty }]
 */
function getTransferRecordDetail(monthNum, blockIndex, destStoreKey) {
  const sheetName  = monthNum + '月';
  const destOffset = TRANSFER_STORE_OFFSET[destStoreKey];
  if (destOffset === undefined) throw new Error('指定された移動先店舗が無効です。');

  const ss    = openSS();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('シート「' + sheetName + '」が見つかりません。');

  // getLastRow() の最終行はSUM合計行のため、1行手前までをデータ行とする
  const lastRow = sheet.getLastRow() - 1;
  if (lastRow < DATA_START_ROW) return [];

  const numRows      = lastRow - DATA_START_ROW + 1;
  const blockCol1    = TRANSFER_BLOCK_START_COL + blockIndex * 4; // 1-indexed
  const brandFlavor  = sheet.getRange(DATA_START_ROW, 1, numRows, 2).getValues();
  const blockData    = sheet.getRange(DATA_START_ROW, blockCol1, numRows, 4).getValues();

  let currentBrand = '';
  const items = [];

  brandFlavor.forEach((row, i) => {
    const brand  = String(row[0]).trim();
    const flavor = String(row[1]).trim();
    if (brand  !== '') currentBrand = brand;
    if (flavor === '' || currentBrand === '') return;

    const qty = blockData[i][destOffset];
    if (typeof qty !== 'number' || qty <= 0) return;

    items.push({ rowIndex: DATA_START_ROW + i, brand: currentBrand, flavorName: flavor, qty });
  });

  return items;
}

/**
 * 起票データ書き込み（LockService排他制御付き）
 * @param {object} payload { monthNum, fromStoreKey, destStoreKey, date, items:[{rowIndex,qty}] }
 */
function submitTransferRecord(payload) {
  const { monthNum, fromStoreKey, destStoreKey, date, items, autoInspect } = payload;
  const sheetName  = monthNum + '月';
  
  const fromOffset = fromStoreKey ? TRANSFER_STORE_OFFSET[fromStoreKey] : undefined;
  const destOffset = destStoreKey ? TRANSFER_STORE_OFFSET[destStoreKey] : undefined;
  if (fromOffset === undefined && destOffset === undefined) throw new Error('店舗キーが無効です。');

  const lock     = LockService.getScriptLock();
  const acquired = lock.tryLock(10000);
  if (!acquired) {
    throw new Error('現在ほかのユーザーが書き込み中です。少し待ってから再度お試しください。');
  }

  try {
    const ss    = openSS();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error('シート「' + sheetName + '」が見つかりません。');

    // 送信直前に空きブロックを確定
    const headerCols   = TRANSFER_BLOCK_COUNT * 4;
    const headerRow    = sheet.getRange(1, TRANSFER_BLOCK_START_COL, 1, headerCols).getValues()[0];
    let emptyBlockIndex = -1;
    for (let b = 0; b < TRANSFER_BLOCK_COUNT; b++) {
      const v = headerRow[b * 4];
      if (v === '' || v === null) { emptyBlockIndex = b; break; }
    }
    if (emptyBlockIndex === -1) throw new Error('移動記録の空き領域がありません（月内上限30件）。');

    const blockCol1 = TRANSFER_BLOCK_START_COL + emptyBlockIndex * 4;

    // 日付を左上セル（行1）に書き込み
    sheet.getRange(1, blockCol1).setValue(date);
    // チェックボックス（行1, 右端）の値（入荷・廃棄時はTRUE）
    sheet.getRange(1, blockCol1 + 3).setValue(autoInspect ? true : false);

    // フレーバーデータを書き込み
    items.forEach(item => {
      if (fromOffset !== undefined) {
        sheet.getRange(item.rowIndex, blockCol1 + fromOffset).setValue(-item.qty);
      }
      if (destOffset !== undefined) {
        sheet.getRange(item.rowIndex, blockCol1 + destOffset).setValue(item.qty);
      }
    });

    SpreadsheetApp.flush();
    return { success: true, blockIndex: emptyBlockIndex };

  } finally {
    lock.releaseLock();
  }
}

/**
 * 検品完了: 修正された数量を上書きし、チェックボックスにTRUEを書き込む
 * @param {object} payload { monthNum, blockIndex, fromStoreKey, destStoreKey, items:[{rowIndex,qty}] }
 */
function completeInspection(payload) {
  const { monthNum, blockIndex, fromStoreKey, destStoreKey, items } = payload;
  const sheetName = monthNum + '月';

  const lock     = LockService.getScriptLock();
  const acquired = lock.tryLock(10000);
  if (!acquired) {
    throw new Error('現在ほかのユーザーが書き込み中です。少し待ってから再度お試しください。');
  }

  try {
    const ss    = openSS();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error('シート「' + sheetName + '」が見つかりません。');

    const blockCol1 = TRANSFER_BLOCK_START_COL + blockIndex * 4;
    const fromOffset = TRANSFER_STORE_OFFSET[fromStoreKey];
    const destOffset = TRANSFER_STORE_OFFSET[destStoreKey];
    if (fromOffset === undefined || destOffset === undefined) throw new Error('店舗キーが無効です。');

    // getLastRow() の最終行はSUM合計行のため、1行手前までをデータ行とする
    const lastRow = sheet.getLastRow() - 1;
    
    // 現在の移動元・移動先列のデータをクリア (3行目以降)
    sheet.getRange(3, blockCol1 + fromOffset, lastRow - 2, 1).clearContent();
    sheet.getRange(3, blockCol1 + destOffset, lastRow - 2, 1).clearContent();

    // 新しい数量を書き込む
    if (items && items.length > 0) {
      items.forEach(item => {
        const qty = parseInt(item.qty, 10);
        if (!isNaN(qty) && qty > 0) {
          sheet.getRange(item.rowIndex, blockCol1 + fromOffset).setValue(-qty);
          sheet.getRange(item.rowIndex, blockCol1 + destOffset).setValue(qty);
        }
      });
    }

    // 検品完了チェック（TRUE）を付与
    sheet.getRange(1, blockCol1 + 3).setValue(true);
    SpreadsheetApp.flush();

    return { success: true };
  } finally {
    lock.releaseLock();
  }
}
