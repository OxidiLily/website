// Klik MOUSE sungguhan di koordinat tombol Search — bukan element.click(),
// supaya elemen yang tertutup overlay/pointer-events ikut ketahuan.
import { chromium } from 'playwright-core';
const EXEC = `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const b = await chromium.launch({ executablePath: EXEC, args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1600,height:900} });
p.on('pageerror',e=>console.log('[pageerror]',String(e).slice(0,200)));
await p.goto('http://192.168.2.11:3000/home',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(9000);
const box = await p.evaluate(()=>{
  const el=[...document.querySelectorAll('button')].find(e=>/search/i.test(e.getAttribute('aria-label')||''));
  if(!el) return null;
  const r=el.getBoundingClientRect();
  const cx=r.x+r.width/2, cy=r.y+r.height/2;
  const atas=document.elementFromPoint(cx,cy);
  return { x:cx, y:cy, w:r.width, h:r.height,
           elemenTeratas: atas? atas.tagName+'.'+String(atas.className).slice(0,60) : null,
           tombolTeratas: el.contains(atas) || atas===el };
});
console.log('tombol Search:', JSON.stringify(box));
if (box) {
  await p.mouse.click(box.x, box.y);
  await p.waitForTimeout(2000);
  console.log('setelah klik mouse → input:', await p.evaluate(()=>document.querySelectorAll('input').length),
              '| modal?', await p.evaluate(()=>/ESC|All Content/.test(document.body.innerText||'')));
}
await b.close();
