// Uji Supabase nyata; membuat akun uji terisolasi lalu menghapusnya.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID, randomBytes } from 'node:crypto';
import { homedir } from 'node:os';
const env = Object.fromEntries(readFileSync(`${homedir()}/DATA/Documents/obsidian-vault/kredensial/kredensial.env`, 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; }));
const url = env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const anon = env.VITE_SUPABASE_PUBLISHABLE_KEY;
async function req(path, method = 'GET', body, token = key, profile) {
  const response = await fetch(url + path, { method, headers: { apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(profile ? { 'Accept-Profile': 'web', 'Content-Profile': 'web' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
  const data = await response.json().catch(() => null);
  assert(response.ok, `${method} ${path.split('?')[0]} HTTP ${response.status}, kode ${data?.code || data?.error_code || ''}`);
  return data;
}
let id;
try {
  const email = `test-${randomUUID()}@example.com`;
  const password = randomBytes(24).toString('hex');
  const user = await req('/auth/v1/admin/users', 'POST', { email, password, email_confirm: true, app_metadata: { require_password_change: true } });
  id = user.id;
  await req(`/rest/v1/profiles?id=eq.${id}`, 'PATCH', { role: 'admin' }, key, true);
  const login = await req('/auth/v1/token?grant_type=password', 'POST', { email, password }, anon);
  const token = login.access_token;
  assert.equal(await req('/rest/v1/rpc/is_admin', 'POST', {}, token, true), false);
  await req('/auth/v1/user', 'PUT', { data: { require_password_change: false } }, token);
  assert.equal(await req('/rest/v1/rpc/is_admin', 'POST', {}, token, true), false, 'user_metadata tidak boleh melewati pembatasan');
  const nextPassword = randomBytes(24).toString('hex');
  await req('/auth/v1/user', 'PUT', { password: nextPassword }, token);
  assert.equal((await req('/auth/v1/user', 'GET', undefined, token)).app_metadata.require_password_change, false);
  assert.equal(await req('/rest/v1/rpc/is_admin', 'POST', {}, token, true), true);
  const second = await req('/auth/v1/token?grant_type=password', 'POST', { email, password: nextPassword }, anon);
  assert.equal(second.user.app_metadata.require_password_change, false);
  console.log('[✓] Supabase nyata: login awal terkunci, manipulasi metadata ditolak, ganti kata sandi membuka hak admin, login ulang lulus.');
} finally {
  if (id) {
    await req(`/auth/v1/admin/users/${id}`, 'DELETE');
    assert.equal((await req(`/rest/v1/profiles?id=eq.${id}&select=id`, 'GET', undefined, key, true)).length, 0);
    console.log('[✓] Akun uji dibersihkan; akun admin utama tidak diubah.');
  }
}
