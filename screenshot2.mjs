// V-MINT2.0 内部画面スクリーンショット取得スクリプト
// 事前に Vite dev server (npm run dev) を起動しておくこと

import puppeteer from 'puppeteer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCREENSHOTS_DIR = path.join(__dirname, 'notes', 'screenshots')
const BASE_URL = 'http://localhost:5173'
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2 }

const delay = (ms) => new Promise(r => setTimeout(r, ms))

// ────────────────────────────────────────────────────────────
// ヘルパー関数
// ────────────────────────────────────────────────────────────

async function shot(page, filename, label) {
  const fp = path.join(SCREENSHOTS_DIR, filename)
  await page.screenshot({ path: fp })
  console.log(`  ✓ ${label}`)
}

async function clickPinDigit(page, digit) {
  await page.evaluate((d) => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === d)
    if (!btn) throw new Error(`PIN ボタン "${d}" が見つかりません`)
    btn.click()
  }, digit)
  await delay(200)
}

async function clickButtonByText(page, text) {
  await page.evaluate((t) => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === t)
    if (!btn) throw new Error(`ボタン "${t}" が見つかりません`)
    btn.click()
  }, text)
}

async function clickCardByHeading(page, heading) {
  await page.evaluate((h) => {
    const el = Array.from(document.querySelectorAll('h3')).find(e => e.textContent.trim() === h)
    if (!el) throw new Error(`カード見出し "${h}" が見つかりません`)
    const btn = el.closest('button')
    if (!btn) throw new Error(`"${h}" の親ボタンが見つかりません`)
    btn.click()
  }, heading)
}

// n番目のselectをvalueに設定してinput/changeイベントを発火
async function selectNth(page, index, value) {
  await page.evaluate((idx, val) => {
    const el = document.querySelectorAll('select')[idx]
    if (!el) throw new Error(`select[${idx}] が見つかりません`)
    el.value = val
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, index, value)
  await delay(300)
}

// n番目のdate inputに値をセット
async function setNthDate(page, index, value) {
  await page.evaluate((idx, val) => {
    const el = document.querySelectorAll('input[type=date]')[idx]
    if (!el) throw new Error(`input[type=date][${idx}] が見つかりません`)
    el.value = val
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, index, value)
  await delay(300)
}

// 指定テキストを含むh2が出現するまで待機
async function waitForH2(page, text, timeout = 15000) {
  await page.waitForFunction(
    (t) => Array.from(document.querySelectorAll('h2')).some(h => h.textContent.trim() === t),
    { timeout }, text
  )
  await delay(300)
}

// LoadingOverlayが消えるまで待機
async function waitForLoadingDone(page, timeout = 20000) {
  try {
    // まずoverlayが出るのを短時間待つ
    await page.waitForFunction(
      () => document.querySelector('.fixed.inset-0 .animate-spin') !== null,
      { timeout: 2000 }
    )
  } catch { /* overlayが出ない場合もある */ }
  // overlayが消えるまで待つ
  await page.waitForFunction(
    () => document.querySelector('.fixed.inset-0 .animate-spin') === null,
    { timeout }
  )
  await delay(500)
}

// ConfirmDialogが出ていたらOKボタン（キャンセルの次のボタン）をクリック
async function dismissConfirmIfVisible(page) {
  try {
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some(b => b.textContent.trim() === 'キャンセル'),
      { timeout: 2000 }
    )
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const idx = btns.findIndex(b => b.textContent.trim() === 'キャンセル')
      if (idx >= 0 && btns[idx + 1]) btns[idx + 1].click()
    })
    await delay(600)
  } catch { /* ダイアログなし */ }
}

// ヘッダーの戻るボタンをクリック（必要に応じてConfirmDialogも処理）
async function clickHeaderBack(page) {
  await page.evaluate(() => {
    const btn = document.querySelector('header button')
    if (!btn) throw new Error('ヘッダーの戻るボタンが見つかりません')
    btn.click()
  })
  await delay(800)
  await dismissConfirmIfVisible(page)
  await delay(400)
}

// ポータルメニューが表示されるまで待機
async function waitForPortal(page) {
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('h3')).some(h => h.textContent.trim() === '棚卸し入力'),
    { timeout: 15000 }
  )
  await delay(400)
}

// ────────────────────────────────────────────────────────────
// メイン処理
// ────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  console.log(`保存先: ${SCREENSHOTS_DIR}\n`)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  })
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)

  try {
    // ────────────────────────────────────────────────────────
    // PIN入力 → ポータル
    // ────────────────────────────────────────────────────────
    console.log('【ログイン】')
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await delay(800)
    for (const digit of '4646') { await clickPinDigit(page, digit) }
    await delay(1800)
    console.log('  ✓ ポータル到達')

    // ────────────────────────────────────────────────────────
    // 棚卸し内部画面 (Step 1〜4)
    // ────────────────────────────────────────────────────────
    console.log('\n【棚卸し入力 内部画面】')
    await clickCardByHeading(page, '棚卸し入力')
    await waitForH2(page, '棚卸しを開始')
    await delay(1500) // 対象月の自動取得を待つ

    // 店舗: baba（馬場本店）
    await selectNth(page, 0, 'baba')
    // 年: すでに自動セットされているが念のため上書き
    await selectNth(page, 1, '2026')
    // 月
    await selectNth(page, 2, '5')
    // 実施日
    await setNthDate(page, 0, '2026-05-31')
    await delay(500)

    await clickButtonByText(page, '入力を開始する')
    // 店舗確認モーダルが出る
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('h2')).some(h => h.textContent.includes('店舗の確認')),
      { timeout: 5000 }
    )
    await clickButtonByText(page, '開始する') // モーダルのOKボタン
    await waitForLoadingDone(page)

    // Step 1: タッパー
    await waitForH2(page, 'タッパー')
    await shot(page, '10_inventory_step1.png', 'Step 1 タッパー確認')

    // Step 2: 物販
    await clickButtonByText(page, '次へ')
    await waitForH2(page, '物販')
    await shot(page, '11_inventory_step2.png', 'Step 2 物販入力')

    // Step 3: 在庫
    await clickButtonByText(page, '次へ')
    await waitForH2(page, '在庫')
    await shot(page, '12_inventory_step3.png', 'Step 3 在庫量入力')

    // Step 4: 入力内容確認（消費量チェック）
    await clickButtonByText(page, '次へ')
    await waitForH2(page, '入力内容確認')
    await waitForLoadingDone(page)
    await shot(page, '13_inventory_step4.png', 'Step 4 入力内容確認（消費量チェック）')

    // ポータルに戻る
    await clickHeaderBack(page)
    await waitForPortal(page)

    // ────────────────────────────────────────────────────────
    // 移動記録: 起票詳細フォーム
    // ────────────────────────────────────────────────────────
    console.log('\n【移動記録 起票詳細】')
    await clickCardByHeading(page, '移動記録')
    await delay(2000) // 対象月の自動取得を待つ
    // 「起票」ボタンをクリック（ボタン内に絵文字テキストが含まれるためincludes検索）
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const btn = btns.find(b => b.textContent.includes('起票') && !b.textContent.includes('修正') && !b.textContent.includes('検品'))
      if (!btn) throw new Error('「起票」ボタンが見つかりません')
      btn.click()
    })
    // 起票の詳細フォームが展開されるまで待つ
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('h3')).some(h => h.textContent.includes('起票の詳細')),
      { timeout: 5000 }
    )
    await delay(600)
    await shot(page, '20_transfer_issue.png', '移動記録 起票詳細フォーム')
    await clickHeaderBack(page)
    await waitForPortal(page)

    // ────────────────────────────────────────────────────────
    // 補充依頼 Step 1（依頼入力テーブル）
    // ────────────────────────────────────────────────────────
    console.log('\n【補充依頼 Step 1】')
    await clickCardByHeading(page, '補充依頼')
    await waitForH2(page, '補充依頼を開始')
    // 依頼元店舗: baba_main（馬場本店）
    await selectNth(page, 0, 'baba_main')
    // 年・月
    await selectNth(page, 1, '2026')
    await selectNth(page, 2, '5')
    await delay(500)
    await clickButtonByText(page, '依頼を開始する')
    await waitForLoadingDone(page)
    await delay(1000)
    await shot(page, '30_request_step1.png', '補充依頼 入力テーブル')
    await clickHeaderBack(page)
    await waitForPortal(page)

    // ────────────────────────────────────────────────────────
    // ダッシュボード: 在庫量確認
    // ────────────────────────────────────────────────────────
    console.log('\n【ダッシュボード 在庫量確認】')
    await clickCardByHeading(page, 'ダッシュボード')
    await delay(1000)
    // 「在庫量」モードを選択（他のモードと区別するためincludes検索）
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const btn = btns.find(b => b.textContent.includes('在庫量') && !b.textContent.includes('棚卸し'))
      if (!btn) throw new Error('「在庫量」モードボタンが見つかりません')
      btn.click()
    })
    await delay(800)
    // 年・月を選択
    await selectNth(page, 0, '2026')
    await selectNth(page, 1, '5')
    await waitForLoadingDone(page)
    await delay(1000)
    await shot(page, '40_dashboard_overview.png', 'ダッシュボード 在庫量確認')
    // ダッシュボードは2段階ナビ：overview → モード選択 → portal
    await clickHeaderBack(page) // overview → DashboardApp モード選択
    await delay(500)
    await clickHeaderBack(page) // モード選択 → portal
    await waitForPortal(page)

    // ────────────────────────────────────────────────────────
    // 原価計算: シーシャ Step 1〜5
    // ────────────────────────────────────────────────────────
    console.log('\n【原価計算 シーシャ Step 1〜5】')
    await clickCardByHeading(page, '原価計算')
    await delay(1000)
    // 店舗・年・月を選択
    await selectNth(page, 0, 'baba')
    await selectNth(page, 1, '2026')
    await selectNth(page, 2, '5')
    // シーシャモードを選択（ボタン内に絵文字あり、includesで検索）
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const btn = btns.find(b => b.textContent.includes('シーシャ') && !b.textContent.includes('販売数'))
      if (!btn) throw new Error('「シーシャ」ボタンが見つかりません')
      btn.click()
    })
    await delay(500)
    await clickButtonByText(page, '開始する')
    await waitForLoadingDone(page)
    await delay(1000)

    // Step 1: 集計期間
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('div')).some(d => d.textContent.trim() === '集計期間'),
      { timeout: 10000 }
    )
    // 集計期間の日付をセット（次へを押すために必要）
    await setNthDate(page, 0, '2026-05-01') // 集計開始日
    await setNthDate(page, 1, '2026-05-31') // 集計終了日
    await delay(500)
    await shot(page, '50_cost_step1.png', 'Step 1 集計期間')

    // Step 2: シーシャ販売数
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const btn = btns.find(b => b.textContent.trim() === '次へ' && !b.disabled)
      if (!btn) throw new Error('「次へ」が見つかりません')
      btn.click()
    })
    await delay(800)
    await shot(page, '51_cost_step2.png', 'Step 2 シーシャ販売数')

    // Step 3: フレーバー消費量
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const btn = btns.find(b => b.textContent.trim() === '次へ' && !b.disabled)
      if (!btn) throw new Error('「次へ」が見つかりません')
      btn.click()
    })
    await waitForLoadingDone(page)
    await delay(1000)
    await shot(page, '52_cost_step3.png', 'Step 3 フレーバー消費量')

    // Step 4: 炭消費量
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const btn = btns.find(b => b.textContent.trim() === '次へ' && !b.disabled)
      if (!btn) throw new Error('「次へ」が見つかりません')
      btn.click()
    })
    await delay(800)
    await shot(page, '53_cost_step4.png', 'Step 4 炭消費量')

    // Step 5: 計算結果確認（プレビュー）
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const btn = btns.find(b => b.textContent.trim() === '次へ' && !b.disabled)
      if (!btn) throw new Error('「次へ」が見つかりません')
      btn.click()
    })
    await delay(800)
    await shot(page, '54_cost_step5.png', 'Step 5 計算結果プレビュー')

    // ────────────────────────────────────────────────────────
    // 原価計算: ドリンクモード
    // ────────────────────────────────────────────────────────
    console.log('\n【原価計算 ドリンクモード】')
    // ヘッダー戻るボタン → CostAppのStep 0に戻る（goBackToTop）
    await page.evaluate(() => {
      const btn = document.querySelector('header button')
      if (!btn) throw new Error('ヘッダーボタンが見つかりません')
      btn.click()
    })
    await delay(800)
    // Step 0に戻ったことを確認（「原価計算を開始」h2が出る）
    await waitForH2(page, '原価計算を開始')
    // ドリンクボタンをクリック（店舗・月は前のセッションから引き継がれる）
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const btn = btns.find(b => b.textContent.includes('ドリンク') && !b.textContent.includes('発注'))
      if (!btn) throw new Error('「ドリンク」ボタンが見つかりません')
      btn.click()
    })
    await waitForLoadingDone(page)
    await delay(1500)
    await shot(page, '55_cost_drink.png', '原価計算 ドリンクモード')

    // ポータルに戻る（CostApp Step 0からはconfirmなし）
    await clickHeaderBack(page)
    await waitForPortal(page)

    console.log('\n全スクリーンショット取得完了！')

  } catch (err) {
    console.error('\nエラー:', err.message)
    const errPath = path.join(SCREENSHOTS_DIR, 'error2_state.png')
    await page.screenshot({ path: errPath })
    console.error(`エラー時の画面 → ${errPath}`)
  } finally {
    await browser.close()
  }
}

main()
