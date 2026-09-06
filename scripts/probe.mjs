// Diagnostik: buka halaman di chromium, kumpulkan error konsol + request gagal,
// dan laporkan apakah <canvas> WebGL benar-benar ter-render.
// Pakai: node scripts/probe.mjs <url> [url2 ...]
import { chromium } from 'playwright-core';

const EXEC = process.env.CHROME
  || `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;

const urls = process.argv.slice(2);
if (!urls.length) { console.error('beri minimal satu URL'); process.exit(1); }

const browser = await chromium.launch({
  executablePath: EXEC,
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

for (const url of urls) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  const failed = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
  page.on('requestfailed', (r) => failed.push(`${r.failure()?.errorText} ${r.url().slice(0, 120)}`));

  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch((e) => errors.push('GOTO: ' + e.message));
  await page.waitForTimeout(3500); // beri waktu chunk lazy + WebGL init

  const info = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll('canvas')].map((c) => ({
      w: c.width, h: c.height,
      visible: !!(c.offsetWidth || c.offsetHeight),
    }));
    return {
      canvases,
      imgs: [...document.querySelectorAll('img')].map((i) => ({ ok: i.complete && i.naturalWidth > 0, src: i.currentSrc.slice(0, 80) })).slice(0, 6),
      title: document.title,
      bodyText: (document.body.innerText || '').slice(0, 120).replace(/\s+/g, ' '),
    };
  });

  console.log(`\n=== ${url}`);
  console.log(`title: ${info.title}`);
  console.log(`canvas: ${info.canvases.length} → ${JSON.stringify(info.canvases)}`);
  console.log(`img ok: ${info.imgs.filter((i) => i.ok).length}/${info.imgs.length}`);
  if (errors.length) console.log('ERRORS:\n  ' + [...new Set(errors)].join('\n  '));
  else console.log('ERRORS: (tidak ada)');
  if (failed.length) console.log('REQUEST GAGAL:\n  ' + [...new Set(failed)].join('\n  '));
  await page.close();
}

await browser.close();
