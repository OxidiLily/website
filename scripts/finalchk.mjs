import { chromium } from 'playwright-core';
const EXEC = `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const b = await chromium.launch({ executablePath: EXEC, args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
let fail=0; const ok=(c,l)=>{ if(!c) fail++; console.log(`${c?'OK  ':'FAIL'} ${l}`); };

// A. /about saat refresh: TIDAK boleh ada gambar kartu statis
const p1 = await b.newPage({ viewport:{width:1600,height:900} });
await p1.goto('http://192.168.2.11:3000/about',{waitUntil:'domcontentloaded',timeout:60000});
let adaGambar=false;
for(let i=0;i<12;i++){ await p1.waitForTimeout(700);
  if(await p1.evaluate(()=>document.querySelectorAll('#about img').length>0)) { adaGambar=true; break; } }
ok(!adaGambar, 'tidak ada gambar kartu statis selama memuat');
for(let i=0;i<40;i++){ await p1.waitForTimeout(1500);
  if(await p1.evaluate(()=>!!document.querySelector('.lanyard-wrapper'))) break; }
ok(await p1.evaluate(()=>!!document.querySelector('.lanyard-wrapper')), 'lanyard 3D akhirnya tampil');
await p1.close();

// B. search: klik mouse + Enter ke halaman detail
const p2 = await b.newPage({ viewport:{width:1600,height:900} });
await p2.goto('http://192.168.2.11:3000/home',{waitUntil:'domcontentloaded',timeout:60000});
await p2.waitForTimeout(8000);
const box=await p2.evaluate(()=>{const el=[...document.querySelectorAll('button')].find(e=>/search/i.test(e.getAttribute('aria-label')||''));const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};});
await p2.mouse.click(box.x,box.y); await p2.waitForTimeout(3500);
ok(await p2.evaluate(()=>document.querySelectorAll('input').length>0),'modal search terbuka');
await p2.keyboard.type('kinetic'); await p2.waitForTimeout(1500);
const n=await p2.evaluate(()=>{const m=(document.body.innerText||'').match(/Found (\d+) result/);return m?+m[1]:0;});
ok(n>0, `cari "kinetic" → ${n} hasil`);
await p2.keyboard.press('Enter'); await p2.waitForTimeout(3000);
ok(new URL(p2.url()).pathname.startsWith('/project/'), `Enter → ${new URL(p2.url()).pathname}`);
await p2.close();
console.log(fail?`\n${fail} GAGAL`:'\nSEMUA LULUS');
await b.close(); process.exit(fail?1:0);
