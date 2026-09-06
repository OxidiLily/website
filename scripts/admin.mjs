// Uji panel admin end-to-end di browser: login sungguhan, buka Pengaturan
// (kartu AI Agent), lalu buka form Blog & Proyek untuk memastikan field unggah
// gambar dan tombol Generate AI benar-benar ada.
// Kredensial dibaca dari argumen supaya tidak tertulis di berkas ini.
import { chromium } from 'playwright-core';

const EXEC = `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const BASE = process.env.BASE || 'http://192.168.2.11:3000';
const EMAIL = process.env.ADMIN_EMAIL;
const PASS = process.env.ADMIN_PASS;
if (!EMAIL || !PASS) { console.error('butuh env ADMIN_EMAIL & ADMIN_PASS'); process.exit(1); }

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));

let fail = 0;
const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`); return ok; };
const hasText = (t) => page.evaluate((x) => (document.body.innerText || '').includes(x), t);

await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
check(await hasText('Masuk ke panel admin'), 'halaman login tampil');

await page.fill('#admin-email', EMAIL);
await page.fill('#admin-password', PASS);
await page.click('button[type="submit"]');
await page.waitForTimeout(6000);
check(await hasText('Panel admin'), 'login berhasil → sidebar panel');
check(await hasText('Dashboard'), 'dashboard tampil');

// Pengaturan → kartu AI Agent
await page.locator('button', { hasText: /^Pengaturan$/ }).first().click();
await page.waitForTimeout(3000);
check(await hasText('AI Agent'), 'kartu AI Agent ada di Pengaturan');
check(await hasText('Uji koneksi'), 'tombol Uji koneksi ada');
check((await page.locator('input[type="password"]').count()) > 0, 'field API key bertipe password');

// Blog → form: upload gambar + generate AI
await page.locator('button', { hasText: /^Blog$/ }).first().click();
await page.waitForTimeout(1200);
await page.locator('button', { hasText: /Manage Blog/ }).first().click();
await page.waitForTimeout(3500);
check(await hasText('Manage Blog'), 'halaman Manage Blog terbuka');
await page.locator('button', { hasText: /Tambah/ }).first().click();
await page.waitForTimeout(1800);
check((await page.locator('input[type="file"]').count()) > 0, 'form blog punya input unggah gambar');
check(await hasText('Generate dengan AI'), 'form blog punya tombol Generate dengan AI');
await page.locator('button', { hasText: /^Batal$/ }).first().click();
await page.waitForTimeout(800);

// Proyek → form: upload gambar + field client/year
await page.locator('button', { hasText: /^Proyek$/ }).first().click();
await page.waitForTimeout(1200);
await page.locator('button', { hasText: /Manage Proyek/ }).first().click();
await page.waitForTimeout(3000);
await page.locator('button', { hasText: /Tambah/ }).first().click();
await page.waitForTimeout(1800);
check((await page.locator('input[type="file"]').count()) > 0, 'form proyek punya input unggah gambar');
check(await hasText('Klien'), 'form proyek punya field Klien');
check(await hasText('Tahun'), 'form proyek punya field Tahun');

if (errs.length) { fail++; console.log('PAGEERROR:\n  ' + [...new Set(errs)].join('\n  ')); }
console.log(fail ? `\n${fail} GAGAL` : '\nSEMUA LULUS');
await browser.close();
process.exit(fail ? 1 : 0);
