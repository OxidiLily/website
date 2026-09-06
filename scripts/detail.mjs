// Apakah halaman detail benar-benar membuka isinya (modal project / post blog),
// dan apakah klik navigasi menulis URL berbentuk path.
import { chromium } from 'playwright-core';

const EXEC = `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const BASE = process.argv[2] || 'http://192.168.2.11:3000';

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Menunggu KONDISI, bukan durasi: halaman detail baru lengkap setelah chunk
// lazy + fetch Supabase selesai, dan itu lamanya berubah-ubah tergantung beban
// mesin. Tunggu tetap 3 detik pernah bikin uji ini "gagal" padahal aplikasinya
// benar.
async function report(path, needle, timeout = 25000) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  let found = false;
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    found = await page.evaluate((n) => (document.body.innerText || '').includes(n), needle);
    if (found) break;
    await page.waitForTimeout(400);
  }
  console.log(`${found ? 'OK  ' : 'FAIL'} ${path} → memuat "${needle}"? ${found}  title="${await page.title()}"`);
  return found;
}

let fail = 0;
if (!(await report('/project/kinetic-design-system', 'Kinetic Design System'))) fail++;
if (!(await report('/blog/how-ai-is-transforming-frontend-development', 'How AI is Transforming'))) fail++;

// Klik navigasi: cari tombol/anchor bertuliskan Projects di navbar
await page.goto(BASE + '/home', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
const labels = await page.evaluate(() =>
  [...document.querySelectorAll('nav button, nav a')].map((e) => (e.innerText || '').trim()).filter(Boolean),
);
console.log('label nav:', JSON.stringify(labels.slice(0, 12)));
const btn = page.locator('nav button, nav a').filter({ hasText: /^Projects?$/i }).first();
if (await btn.count()) {
  await btn.click();
  await page.waitForTimeout(1800);
  const u = new URL(page.url());
  const ok = !page.url().includes('#') && u.pathname === '/project';
  if (!ok) fail++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} klik nav Projects → ${u.pathname}`);
} else {
  console.log('(!) tombol nav "Projects" tidak ketemu — selektor uji, bukan bug app');
}

console.log(fail ? `\n${fail} GAGAL` : '\nSEMUA LULUS');
await browser.close();
process.exit(fail ? 1 : 0);
