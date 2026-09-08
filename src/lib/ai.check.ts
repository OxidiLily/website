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

// Endpoint lengkap yang sudah tersimpan di tabel `settings` tidak boleh berubah arti.
assert.equal(aiUrl('http://ai.home:20128/v1/chat/completions', 'openai'), 'http://ai.home:20128/v1/chat/completions');
assert.equal(aiUrl('/ai/v1/chat/completions', 'openai'), '/ai/v1/chat/completions');
assert.equal(aiUrl('https://api.anthropic.com/v1/messages', 'anthropic'), 'https://api.anthropic.com/v1/messages');

// Spasi dan garis miring berlebih dari tempel-salin.
assert.equal(aiUrl('  https://api.openai.com/v1//  ', 'openai'), 'https://api.openai.com/v1/chat/completions');

console.log('[ok] ai.check.ts lulus');
