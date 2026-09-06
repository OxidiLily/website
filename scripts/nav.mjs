// Klik navigasi diuji lewat DOM (element.click()), bukan lewat actionability
// Playwright: index.css memasang `scroll-behavior: smooth` di <html>, dan
// scrollIntoViewIfNeeded tidak pernah selesai di navbar yang beranimasi.
// Handler onClick React tetap terpanggil, jadi yang diuji tetap perilaku nyata.
import { chromium } from 'playwright-core';
const EXEC = `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const BASE = 'http://192.168.2.11:3000';
const b = await chromium.launch({ executablePath: EXEC, args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto(BASE + '/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(3500);

let fail = 0;
for (const [label, want] of [['Project','/project'],['Blog','/blog'],['About','/about'],['Contact','/contact'],['Home','/home']]) {
  const clicked = await p.evaluate((l) => {
    const el = [...document.querySelectorAll('nav button, nav a')]
      .find((e) => (e.innerText || '').trim().toLowerCase() === l.toLowerCase());
    if (!el) return false;
    el.click();
    return true;
  }, label);
  if (!clicked) { console.log(`(!) tombol ${label} tak ada`); fail++; continue; }
  await p.waitForTimeout(2500);
  const u = new URL(p.url());
  const ok = !p.url().includes('#') && u.pathname === want;
  if (!ok) fail++;
  console.log(`${ok?'OK  ':'FAIL'} klik "${label}" → ${u.pathname}${p.url().includes('#')?' [ADA #]':''}`);
}
console.log(fail ? `\n${fail} GAGAL` : '\nSEMUA LULUS');
await b.close(); process.exit(fail?1:0);
