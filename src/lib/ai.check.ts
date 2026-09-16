// Pemeriksa pemetaan base_url → URL endpoint. Jalankan: npx tsx src/lib/ai.check.ts
//
// Salah di sini gagal tanpa pesan yang berguna: base_url yang kelebihan atau
// kekurangan satu segmen menjawab 404, dan 404 dari gateway tidak bisa
// dibedakan admin dari gateway yang mati atau kunci yang salah.
import assert from 'node:assert/strict';
import { aiUrl } from './ai';

// base_url OpenAI-compatible yang sudah memuat versinya — dilengkapi jalurnya saja.
assert.equal(aiUrl('https://api.openai.com/v1', 'openai'), 'https://api.openai.com/v1/chat/completions');
assert.equal(aiUrl('https://openrouter.ai/api/v1', 'openai'), 'https://openrouter.ai/api/v1/chat/completions');
assert.equal(aiUrl('http://localhost:11434/v1', 'openai'), 'http://localhost:11434/v1/chat/completions');
assert.equal(aiUrl('/ai/v1', 'openai'), '/ai/v1/chat/completions');

// base_url tanpa versi — versinya ikut dilengkapi.
assert.equal(aiUrl('https://api.deepseek.com', 'openai'), 'https://api.deepseek.com/v1/chat/completions');
assert.equal(aiUrl('http://ai.home:20128', 'openai'), 'http://ai.home:20128/v1/chat/completions');
assert.equal(aiUrl('/ai', 'openai'), '/ai/v1/chat/completions');

// Anthropic menaruh versinya di jalur; `/v1` yang terlanjur diketik tidak boleh digandakan.
assert.equal(aiUrl('https://api.anthropic.com', 'anthropic'), 'https://api.anthropic.com/v1/messages');
assert.equal(aiUrl('https://api.anthropic.com/v1', 'anthropic'), 'https://api.anthropic.com/v1/messages');
assert.equal(aiUrl('/ai', 'anthropic'), '/ai/v1/messages');

// Jalur relatif tanpa awalan /ai: `/v1` yang diketik apa adanya akan mendarat
// di /v1 SPA dan dijawab 404 — gejalanya identik dengan gateway mati. Bentuk
// inilah yang diketik admin di layar Pengaturan, dan skrip uji di bawah
// menahannya.
assert.equal(aiUrl('/v1', 'openai'), '/ai/v1/chat/completions');
assert.equal(aiUrl('/v1', 'anthropic'), '/ai/v1/messages');
assert.equal(aiUrl('/v4', 'openai'), '/ai/v4/chat/completions');
assert.equal(aiUrl('/ai/v1', 'openai'), '/ai/v1/chat/completions');
assert.equal(aiUrl('/ai', 'anthropic'), '/ai/v1/messages');

// Endpoint lengkap yang sudah tersimpan di tabel `settings` tidak boleh berubah arti.
assert.equal(aiUrl('http://ai.home:20128/v1/chat/completions', 'openai'), 'http://ai.home:20128/v1/chat/completions');
assert.equal(aiUrl('/ai/v1/chat/completions', 'openai'), '/ai/v1/chat/completions');
assert.equal(aiUrl('https://api.anthropic.com/v1/messages', 'anthropic'), 'https://api.anthropic.com/v1/messages');

// Spasi dan garis miring berlebih dari tempel-salin.
assert.equal(aiUrl('  https://api.openai.com/v1//  ', 'openai'), 'https://api.openai.com/v1/chat/completions');

console.log('[ok] ai.check.ts lulus');

// Origin untuk CSP: kedua sisi dinormalkan dulu, jadi VITE_AI_ORIGIN yang
// disalin apa adanya beserta jalurnya tetap cocok dengan origin request.
import { originDiizinkan } from './ai';
const asal = 'http://192.168.2.11:3000';
assert.equal(originDiizinkan('/ai/v1/chat/completions', 'http://192.168.2.11:20128/v1', asal), true);
assert.equal(originDiizinkan('/ai/v1/chat/completions', '', asal), true);
assert.equal(originDiizinkan('http://192.168.2.11:20128/v1/chat/completions', 'http://192.168.2.11:20128/v1', asal), true);
assert.equal(originDiizinkan('http://192.168.2.99:20128/v1/x', 'http://192.168.2.11:20128/v1', asal), false);
assert.equal(originDiizinkan('http://192.168.2.11:20128/v1/x', 'sampah, http://192.168.2.11:20128', asal), true);
assert.equal(originDiizinkan('', 'http://192.168.2.11:20128', asal), true, 'origin situs sendiri');
console.log('[ok] ai.check.ts — originDiizinkan lulus');

// Body gateway: JSON sah, lalu `data: [DONE]` menempel tanpa baris baru.
import { uraiJawaban } from './ai';
assert.equal(uraiJawaban('{"choices":[{"message":{"content":"ok"}}]}')?.choices[0].message.content, 'ok');
assert.equal(uraiJawaban('{"a":1}data: [DONE]')?.a, 1);
assert.equal(uraiJawaban('{"a":1}data: [DONE] data: [DONE]')?.a, 1);
assert.equal(uraiJawaban('{"a":1}\n\ndata: [DONE]')?.a, 1);
assert.equal(uraiJawaban('<html>502</html>'), null);
assert.equal(uraiJawaban('{"a":1}')?.a, 1);
console.log('[ok] ai.check.ts — uraiJawaban lulus');

// Kunci API tidak boleh masuk daftar yang dibaca pengunjung.
import { AI_KEYS, AI_KEYS_PUBLIK } from './ai';
assert.equal((AI_KEYS_PUBLIK as readonly string[]).includes('ai_api_key'), false);
assert.equal((AI_KEYS as readonly string[]).includes('ai_api_key'), true);
for (const k of AI_KEYS_PUBLIK) assert.ok((AI_KEYS as readonly string[]).includes(k), k);
console.log('[ok] ai.check.ts — AI_KEYS_PUBLIK tanpa ai_api_key');

// Endpoint yang boleh dipakai halaman publik: hanya jalur se-origin, karena di
// situ kuncinya disuntikkan server dan tidak pernah sampai ke pengunjung.
import { bolehDipakaiPublik } from './ai';
assert.equal(bolehDipakaiPublik('/ai/v1'), true);
assert.equal(bolehDipakaiPublik('  /ai/v1  '), true);
assert.equal(bolehDipakaiPublik('http://192.168.2.11:20128/v1'), false);
assert.equal(bolehDipakaiPublik('https://api.openai.com/v1'), false);
assert.equal(bolehDipakaiPublik('https://api.anthropic.com'), false);
assert.equal(bolehDipakaiPublik(''), false);
console.log('[ok] ai.check.ts — bolehDipakaiPublik lulus');
