import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotDirs = [
  resolve(__dirname, 'notes', 'screenshots'),
  resolve(__dirname, 'screenshots'),
];

const mdPath = resolve(__dirname, 'notes/V-MINT2.0_user-manual.md');
const outputArg = process.argv[2];
const pdfPath = outputArg
  ? resolve(__dirname, outputArg)
  : resolve(__dirname, 'notes/V-MINT2.0_user-manual_v2.pdf');

let md = readFileSync(mdPath, 'utf8');

// Obsidianフロントマターを除去
md = md.replace(/^---[\s\S]*?---\n/, '');

// Obsidian wikilink形式の画像 ![[screenshots/xxx.png]] → Base64インライン img タグ
md = md.replace(/!\[\[screenshots\/([^\]]+)\]\]/g, (_, filename) => {
  for (const dir of screenshotDirs) {
    const imgPath = resolve(dir, filename);
    try {
      const data = readFileSync(imgPath);
      const ext = filename.split('.').pop().toLowerCase();
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
      const b64 = data.toString('base64');
      return `\n<div class="manual-image"><img src="data:${mime};base64,${b64}" alt="${filename}"></div>\n`;
    } catch {
      // Try the next candidate directory.
    }
  }

  console.warn(`[WARN] 画像読み込み失敗: ${filename}`);
  return `<p style="color:red;">[画像読み込みエラー: ${filename}]</p>`;
});

// ObsidianのWikiリンク（ページリンク）を除去
md = md.replace(/\[\[([^\]]+)\]\]/g, '$1');

const body = marked.parse(md);

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page {
      size: A4;
      margin: 14mm 12mm;
    }
    body {
      font-family: "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;
      font-size: 12px;
      line-height: 1.55;
      color: #1a1a1a;
      padding: 0;
      max-width: none;
      margin: 0 auto;
    }
    h1 {
      font-size: 21px;
      margin: 0 0 10px;
      border-bottom: 2px solid #4a6fa5;
      padding-bottom: 5px;
      page-break-before: always;
      break-before: page;
      break-after: avoid-page;
    }
    h1:first-of-type {
      page-break-before: auto;
      break-before: auto;
    }
    h2 {
      font-size: 16px;
      margin: 16px 0 8px;
      border-bottom: 1px solid #aac4e8;
      padding-bottom: 3px;
      color: #2c4a7a;
      page-break-before: always;
      break-before: page;
      break-after: avoid-page;
    }
    h2:first-of-type {
      page-break-before: auto;
      break-before: auto;
    }
    h3 { font-size: 14px; margin: 12px 0 6px; color: #3a5a8a; break-after: avoid-page; }
    h4 { font-size: 12px; margin: 10px 0 5px; color: #4a6a9a; break-after: avoid-page; }
    p { margin: 5px 0; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 8px 0;
      font-size: 11px;
    }
    th {
      background: #4a6fa5;
      color: white;
      padding: 5px 8px;
      text-align: left;
    }
    td { padding: 4px 8px; border: 1px solid #d0d8e8; }
    tr:nth-child(even) td { background: #f5f8fd; }
    code {
      font-family: "Consolas", "Courier New", monospace;
      background: #f0f4fa;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 11px;
    }
    pre {
      background: #f0f4fa;
      border: 1px solid #d0d8e8;
      border-radius: 6px;
      padding: 10px 12px;
      margin: 8px 0;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    pre code { background: none; padding: 0; font-size: 11px; }
    blockquote {
      border-left: 4px solid #4a6fa5;
      background: #f0f6ff;
      padding: 8px 14px;
      margin: 10px 0;
      border-radius: 0 6px 6px 0;
      color: #444;
    }
    ul, ol { padding-left: 20px; margin: 6px 0; }
    li { margin: 2px 0; }
    hr { border: none; border-top: 1px solid #d0d8e8; margin: 12px 0; }
    .manual-image {
      margin: 1.1em 0;
      text-align: center;
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
    .manual-image img {
      width: auto;
      max-width: 74%;
      max-height: 98mm;
      height: auto;
      display: inline-block;
      border: 1px solid #d5dce8;
      border-radius: 6px;
      background: #fff;
      padding: 2px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }
    table, pre, blockquote {
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
    strong { color: #1a3a6a; }
  </style>
</head>
<body>
${body}
</body>
</html>`;

const tmpHtmlPath = resolve(__dirname, 'notes/_tmp_manual.html');
writeFileSync(tmpHtmlPath, html, 'utf8');

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

await page.goto(`file:///${tmpHtmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });

await page.pdf({
  path: pdfPath,
  format: 'A4',
  margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
  printBackground: true,
});

await browser.close();

import { unlinkSync } from 'fs';
unlinkSync(tmpHtmlPath);

console.log(`PDF生成完了: ${pdfPath}`);
