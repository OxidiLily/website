// Uji asisten AI PUBLIK lewat browser sungguhan: jawabannya harus datang dari
// model, bukan teks cadangan panel.
//
// Penjaga regresi yang penting: baris `settings` berawalan `ai_` lahir dengan
// `is_public = false` kalau panel menyimpannya tanpa kolom itu, dan asisten di
// halaman publik — yang hanya membaca baris `is_public` lewat RLS — langsung
// jatuh ke jawabanCadangan(). Gejalanya: setiap pertanyaan dijawab "Terima
// kasih atas pertanyaannya mengenai ...", tanpa satu pun panggilan ke /ai/*.
//
// Jalankan: LD_LIBRARY_PATH=<dir> node scripts/ai-live-publik.mjs [BASE]
import { chromium } from 'playwright-core';

const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const CHROME = process.env.CHROME
  || `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const TANYA = (process.env.TANYA || 'halo,proyek apa saja yang ada di website ini?').split(',');

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage();
const net = [];
page.on('response', (r) => {
  if (r.url().includes('/ai/')) net.push(`${r.status()} ${r.url().replace(BASE, '')}`);
});

await page.goto(BASE, { waitUntil: 'networkidle' });
// Tombolnya tanpa teks — labelnya di aria-label (settings.nav_chat_label).
const tombol = (await page.$('[aria-label="Chat AI"]')) || (await page.$('[aria-label*="Chat"]'));
if (!tombol) throw new Error('Tombol Chat AI tidak ditemukan');
await tombol.evaluate((el) => el.click());
await page.waitForSelector('input[type="text"]', { timeout: 8000 });

for (const pesan of TANYA) {
  await page.fill('input[type="text"]', pesan);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(30000);
}

// Gelembung percakapan saja — teks halaman di belakang modal ikut terbaca kalau
// seluruh body diambil.
const gelembung = await page.evaluate(() => {
  const panel = document.querySelector('div.fixed.inset-0');
  if (!panel) return [];
  return [...panel.querySelectorAll('div')]
    .filter((d) => typeof d.className === 'string' && d.className.includes('max-w-[82%]'))
    .map((d) => d.innerText.trim().replace(/\s+/g, ' '));
});
await browser.close();

console.log('[net]', net.length ? net.join(' | ') : '(tidak ada panggilan /ai/*)');
for (const g of gelembung) console.log('  *', g.slice(0, 240));

// Kegagalan yang harus terlihat: jawaban cadangan, atau nol panggilan ke /ai/*.
const cadangan = gelembung.some((t) => t.startsWith('Terima kasih atas pertanyaannya mengenai'));
const gagal = cadangan || !net.some((n) => n.startsWith('200'));
console.log(gagal ? '[✗] asisten TIDAK memakai model' : '[✓] asisten menjawab dari model');
process.exitCode = gagal ? 1 : 0;
