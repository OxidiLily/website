// Simulasi Brave Shields / GPU diblokir: getContext WebGL selalu null.
import { chromium } from 'playwright-core';
const EXEC = `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const b = await chromium.launch({ executablePath: EXEC, args:['--no-sandbox'] });
const ctx = await b.newContext({ viewport:{width:1600,height:900} });
await ctx.addInitScript(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) {
    if (typeof t === 'string' && t.toLowerCase().includes('webgl')) return null;
    return orig.call(this, t, ...a);
  };
});
for (const url of ['/about','/home','/project','/blog','/contact']) {
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0,160)));
  await p.goto('http://192.168.2.11:3000'+url, { waitUntil:'domcontentloaded', timeout:40000 });
  await p.waitForTimeout(7000);
  const r = await p.evaluate(()=>({ len:(document.body.innerText||'').trim().length, nav:!!document.querySelector('nav') }));
  console.log(`${url.padEnd(10)} teks=${String(r.len).padStart(5)} navbar=${r.nav}  ${r.len<50?'<<< KOSONG':''}`);
  if (errs.length) console.log('     err:', [...new Set(errs)][0]);
  await p.close();
}
await b.close();
