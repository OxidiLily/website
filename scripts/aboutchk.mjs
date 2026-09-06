import { chromium } from 'playwright-core';
const EXEC = `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const b = await chromium.launch({ executablePath: EXEC, args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
p.on('console',m=>{ if(m.type()==='error') errs.push(m.text().slice(0,180)); });
await p.goto('http://192.168.2.11:3000/about', { waitUntil:'domcontentloaded', timeout:60000 });
let r;
for (let i=0;i<40;i++){
  await p.waitForTimeout(1500);
  r = await p.evaluate(()=>({
    teks:(document.querySelector('main')?.innerText||'').trim().length,
    wrapper:!!document.querySelector('.lanyard-wrapper'),
    canvas:document.querySelectorAll('canvas').length,
    logoImg:[...document.querySelectorAll('img')].filter(i=>i.src.includes('logo.png')).length,
    logoSvg:document.querySelectorAll('header svg, nav svg').length,
  }));
  if (r.wrapper && r.teks>500) break;
}
console.log(JSON.stringify(r));
console.log(errs.length? 'ERR: '+[...new Set(errs)].slice(0,3).join(' | ') : 'ERR: (tidak ada)');
await b.close();
