// Apa yang tampil di kolom About: Lanyard React Bits (canvas) atau kartu statis?
import { chromium } from 'playwright-core';
const EXEC = `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const b = await chromium.launch({ executablePath: EXEC, args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
for (const blokir of [false, true]) {
  const ctx = await b.newContext({ viewport:{width:1600,height:950} });
  if (blokir) await ctx.addInitScript(() => {
    const o = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) {
      return (typeof t === 'string' && t.toLowerCase().includes('webgl')) ? null : o.call(this, t, ...a);
    };
  });
  const p = await ctx.newPage();
  await p.goto('http://192.168.2.11:3000/about', { waitUntil:'domcontentloaded', timeout:40000 });
  // Ukur KEADAAN AKHIR: kartu statis muncul lebih dulu sebagai fallback, lalu
  // digantikan Lanyard. Berhenti pada temuan pertama akan salah baca.
  await p.waitForTimeout(30000);
  const r = await p.evaluate(()=>({
    lanyard: !!document.querySelector('.lanyard-wrapper'),
    canvasDiLanyard: document.querySelectorAll('.lanyard-wrapper canvas').length,
    kartuStatis: document.querySelectorAll('#about img').length,
  }));
  console.log(`WebGL ${blokir?'DIBLOKIR':'NORMAL  '} → Lanyard React Bits: ${r.lanyard} (canvas ${r.canvasDiLanyard}) | kartu statis: ${r.kartuStatis>0}`);
  await ctx.close();
}
await b.close();
