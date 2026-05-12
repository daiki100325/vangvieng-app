// V-MINT2.0 スクリーンショット自動取得スクリプト
// 実行前に Vite dev server (npm run dev) を起動しておくこと

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

async function shot(page, filename, label) {
  const fp = path.join(SCREENSHOTS_DIR, filename)
  await page.screenshot({ path: fp })
  console.log(`✓ ${label}`)
}

async function clickPinDigit(page, digit) {
  await page.evaluate((d) => {
    const btns = Array.from(document.querySelectorAll('button'))
    const btn = btns.find(b => b.textContent.trim() === d)
    if (!btn) throw new Error(`PIN ボタン "${d}" が見つかりません`)
    btn.click()
  }, digit)
  await delay(200)
}

async function clickCardByHeading(page, heading) {
  await page.evaluate((h) => {
    const all = Array.from(document.querySelectorAll('h3'))
    const el = all.find(e => e.textContent.trim() === h)
    if (!el) throw new Error(`カード見出し "${h}" が見つかりません`)
    const btn = el.closest('button')
    if (!btn) throw new Error(`"${h}" の親ボタンが見つかりません`)
    btn.click()
  }, heading)
}

async function clickHeaderBack(page) {
  await page.evaluate(() => {
    const header = document.querySelector('header')
    if (!header) throw new Error('header が見つかりません')
    const btn = header.querySelector('button')
    if (!btn) throw new Error('ヘッダーの戻るボタンが見つかりません')
    btn.click()
  })
  await delay(800)
  // 確認ダイアログが出た場合は「はい」をクリック
  await dismissConfirmIfVisible(page)
  await delay(400)
}

async function dismissConfirmIfVisible(page) {
  try {
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some(b => b.textContent.trim() === 'キャンセル'),
      { timeout: 1500 }
    )
    // ダイアログが表示中 → OK(はい)ボタンをクリック
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const cancelIdx = btns.findIndex(b => b.textContent.trim() === 'キャンセル')
      if (cancelIdx >= 0 && btns[cancelIdx + 1]) btns[cancelIdx + 1].click()
    })
    await delay(600)
  } catch {
    // ダイアログなし → 何もしない
  }
}

async function waitForPortal(page) {
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('h3')).some(h => h.textContent.trim() === '棚卸し入力'),
    { timeout: 12000 }
  )
  await delay(400)
}

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
    // ── 1. PIN入力画面 ──────────────────────────────────────────
    console.log('アプリ読み込み中...')
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })
    await delay(800)
    await shot(page, '01_pin_auth.png', 'PIN入力画面')

    // ── 2. PIN入力 → ポータルメニュー ───────────────────────────
    console.log('PIN 入力中 (4646)...')
    for (const digit of '4646') {
      await clickPinDigit(page, digit)
    }
    await delay(1800)
    await shot(page, '02_portal_menu.png', 'ポータルメニュー')

    // ── 3. 棚卸し入力 ─────────────────────────────────────────
    await clickCardByHeading(page, '棚卸し入力')
    await delay(1500)
    await shot(page, '03_inventory_top.png', '棚卸し入力（初期画面）')
    await clickHeaderBack(page)
    await waitForPortal(page)

    // ── 4. 原価計算 ────────────────────────────────────────────
    await clickCardByHeading(page, '原価計算')
    await delay(1500)
    await shot(page, '04_cost_top.png', '原価計算（初期画面）')
    await clickHeaderBack(page)
    await waitForPortal(page)

    // ── 5. 補充依頼 ────────────────────────────────────────────
    await clickCardByHeading(page, '補充依頼')
    await delay(1500)
    await shot(page, '05_request_top.png', '補充依頼（初期画面）')
    await clickHeaderBack(page)
    await waitForPortal(page)

    // ── 6. 移動記録 ────────────────────────────────────────────
    await clickCardByHeading(page, '移動記録')
    await delay(1500)
    await shot(page, '06_transfer_top.png', '移動記録（初期画面）')
    await clickHeaderBack(page)
    await waitForPortal(page)

    // ── 7. ダッシュボード ─────────────────────────────────────
    await clickCardByHeading(page, 'ダッシュボード')
    await delay(1800)
    await shot(page, '07_dashboard_top.png', 'ダッシュボード（初期画面）')
    await clickHeaderBack(page)
    await waitForPortal(page)

    console.log('\n全スクリーンショット取得完了！')
  } catch (err) {
    console.error('\nエラー:', err.message)
    const errPath = path.join(SCREENSHOTS_DIR, 'error_state.png')
    await page.screenshot({ path: errPath })
    console.error(`エラー時の画面 → ${errPath}`)
  } finally {
    await browser.close()
  }
}

main()
