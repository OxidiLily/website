// Tunggu sampai canvas Lanyard benar-benar berukuran penuh, beri waktu fisika
// menstabilkan, lalu screenshot HALAMAN (bukan baca canvas — canvas WebGL
// tanpa preserveDrawingBuffer selalu terbaca kosong lewat drawImage).
import { chromium } from 'playwright-core';
const EXEC = `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const url = process.argv[2] || 'http://192.168.2.11:3000/about';
const out = process.argv[3] || '/tmp/lanyard.png';
const b = await chromium.launch({ executablePath: EXEC, args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto(url, { waitUntil:'domcontentloaded', timeout:60000 });
let siap=false;
for (let i=0;i<40;i++){
  await p.waitForTimeout(1500);
  const s = await p.evaluate(()=>{ const c=document.querySelector('.lanyard-wrapper canvas'); return c? {w:c.width,h:c.height}:null; });
  if (s && s.w > 500) { console.log(`canvas siap ${s.w}x${s.h} pada ${((i+1)*1.5).toFixed(1)}s`); siap=true; break; }
}
if(!siap) console.log('canvas Lanyard tidak pernah berukuran penuh');
await p.waitForTimeout(8000); // biarkan fisika menstabilkan
await p.screenshot({ path: out, timeout: 60000 });
console.log('screenshot →', out);
await b.close();
