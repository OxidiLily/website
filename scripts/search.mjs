// Search navbar: buka modal, hasil muncul, klik hasil blog → halaman detail
// benar-benar termuat (menunggu KONDISI, bukan durasi), dan hasil halaman
// biasa memindahkan rute.
import { chromium } from 'playwright-core';
const EXEC = `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const BASE = 'http://192.168.2.11:3000';
const b = await chromium.launch({ executablePath: EXEC, args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
let fail = 0;
const check = (ok,l) => { if(!ok) fail++; console.log(`${ok?'OK  ':'FAIL'} ${l}`); return ok; };
const open = async () => { await p.evaluate(()=>{const e=[...document.querySelectorAll('button')].find(x=>/search/i.test(x.getAttribute('aria-label')||''));e&&e.click();}); await p.waitForTimeout(1200); };
const type = async (v) => { await p.evaluate((x)=>{const i=[...document.querySelectorAll('input')][0];const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;s.call(i,x);i.dispatchEvent(new Event('input',{bubbles:true}));},v); await p.waitForTimeout(1200); };
const waitText = async (needle, ms=30000) => { const d=Date.now()+ms; while(Date.now()<d){ if(await p.evaluate(n=>(document.body.innerText||'').includes(n), needle)) return true; await p.waitForTimeout(400);} return false; };

await p.goto(BASE + '/home', { waitUntil:'domcontentloaded', timeout:40000 });
await waitText('Search');
await open();
check((await p.evaluate(()=>document.querySelectorAll('input').length)) > 0, 'modal search terbuka');
await type('How AI');
check(await p.evaluate(()=>/Found \d+ result/.test(document.body.innerText||'')), 'hasil pencarian muncul');
check(await p.evaluate(()=>document.querySelectorAll('[role="option"]').length>0), 'hasil punya role="option" (bisa keyboard)');

const clicked = await p.evaluate(()=>{const e=[...document.querySelectorAll('[role="option"]')].find(x=>(x.innerText||'').includes('How AI is Transforming'));if(!e)return false;e.click();return true;});
check(clicked, 'hasil blog bisa diklik');
check(await waitText('How AI is Transforming'), 'halaman detail blog benar-benar termuat');
check(new URL(p.url()).pathname === '/blog/how-ai-is-transforming-frontend-development', `URL detail = ${new URL(p.url()).pathname}`);

// Ctrl+K lalu pilih hasil halaman
await p.goto(BASE + '/home', { waitUntil:'domcontentloaded', timeout:40000 });
await waitText('Search');
await p.keyboard.press('Control+k'); await p.waitForTimeout(1200);
check((await p.evaluate(()=>document.querySelectorAll('input').length)) > 0, 'Ctrl+K membuka modal');
await type('contact');
await p.keyboard.press('Enter'); await p.waitForTimeout(2500);
check(new URL(p.url()).pathname === '/contact', `Enter pada hasil → ${new URL(p.url()).pathname}`);

console.log(fail ? `\n${fail} GAGAL` : '\nSEMUA LULUS');
await b.close(); process.exit(fail?1:0);
