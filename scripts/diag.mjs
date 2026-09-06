// Diagnostik halaman: teks yang benar-benar ter-render, error konsol/JS,
// respons >=400, dan jumlah canvas. Dipakai untuk memburu halaman yang
// "kelihatan load" tapi isinya kosong.
import { chromium } from 'playwright-core';

const EXEC = `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const urls = process.argv.slice(2);
if (!urls.length) { console.error('beri minimal satu URL'); process.exit(1); }

const browser = await chromium.launch({
  executablePath: EXEC,
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

for (const url of urls) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  const bad = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 240)); });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 400)));
  page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().slice(0, 120)}`); });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 }).catch((e) => errs.push('GOTO ' + e.message));
  await page.waitForTimeout(9000);

  const info = await page.evaluate(() => ({
    title: document.title,
    canvas: document.querySelectorAll('canvas').length,
    mainLen: (document.querySelector('main')?.innerText || '').trim().length,
    text: (document.querySelector('main')?.innerText || document.body.innerText || '').slice(0, 400).replace(/\s+/g, ' '),
  }));

  console.log(`\n=== ${url}`);
  console.log(`title=${info.title} | canvas=${info.canvas} | panjang teks <main>=${info.mainLen}`);
  console.log(`teks: ${info.text}`);
  console.log(errs.length ? 'ERRORS:\n  ' + [...new Set(errs)].join('\n  ') : 'ERRORS: (tidak ada)');
  if (bad.length) console.log('RESP>=400:\n  ' + [...new Set(bad)].join('\n  '));
  await page.close();
}
await browser.close();
