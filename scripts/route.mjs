// Verifikasi routing path: judul benar, URL tidak mengandung '#', dan halaman
// detail benar-benar membuka isinya (bukan jatuh ke home).
import { chromium } from 'playwright-core';

const EXEC = `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const BASE = process.argv[2] || 'http://192.168.2.11:3000';

const cases = [
  ['/home', 'OxidiLily — Portfolio'],
  ['/project', 'Projects — OxidiLily'],
  ['/blog', 'Blog — OxidiLily'],
  ['/contact', 'Contact — OxidiLily'],
  ['/about', 'About — OxidiLily'],
  ['/blog/how-ai-is-transforming-frontend-development', null],
  ['/project/kinetic-design-system', null],
  ['/admin/login', 'Admin — OxidiLily'],
];

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let fail = 0;

for (const [path, wantTitle] of cases) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  const url = page.url();
  const title = await page.title();
  const hasHash = url.includes('#');
  const pathOk = new URL(url).pathname === path;
  const titleOk = wantTitle ? title === wantTitle : title.includes('OxidiLily');
  const ok = !hasHash && pathOk && titleOk;
  if (!ok) fail++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${path.padEnd(50)} url=${new URL(url).pathname}${hasHash ? ' [ADA #]' : ''} title="${title}"`);
}

// Klik navigasi diuji terpisah di scripts/nav.mjs (navbar beranimasi +
// scroll-behavior:smooth membuat actionability Playwright menggantung).

// Hash lama harus diterjemahkan ke path
await page.goto(BASE + '/#blog', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1800);
const legacy = page.url();
const legacyOk = !legacy.includes('#') && new URL(legacy).pathname === '/blog';
if (!legacyOk) fail++;
console.log(`${legacyOk ? 'OK  ' : 'FAIL'} legacy /#blog → ${new URL(legacy).pathname}${legacy.includes('#') ? ' [ADA #]' : ''}`);

console.log(fail ? `\n${fail} GAGAL` : '\nSEMUA LULUS');
await browser.close();
process.exit(fail ? 1 : 0);
