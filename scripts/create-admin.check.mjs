import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createAdmin, hostLokal } from './create-admin.mjs';

const dir = mkdtempSync(join(tmpdir(), 'admin-check-'));
const originalFetch = globalThis.fetch;
try {
  for (const name of ['key', 'password']) writeFileSync(join(dir, name), randomBytes(24).toString('hex'), { mode: 0o600 });
  const env = { VITE_SUPABASE_URL: 'https://supabase.invalid', ADMIN_EMAIL: 'admin@example.invalid', SUPABASE_SERVICE_ROLE_KEY_FILE: join(dir, 'key'), ADMIN_PASSWORD_FILE: join(dir, 'password') };
  // Kunci service-role DAN kata sandi admin dikirim oleh skrip ini. Lewat http
  // polos ke host yang bukan lokal, keduanya menyeberang jaringan dalam teks
  // terbuka. Supabase homelab tetap boleh http — yang ditolak host publiknya.
  for (const host of ['localhost', 'supabase', 'supabase.home', 'supabase.local', '192.168.2.11', '10.0.0.5', '127.0.0.1', '::1', 'fd00::1']) {
    assert.equal(hostLokal(host), true, `${host} harus dinilai host lokal`);
  }
  for (const host of ['supabase.example.com', '8.8.8.8', '203.0.113.9', 'supabase.io', '172.32.0.1']) {
    assert.equal(hostLokal(host), false, `${host} harus dinilai host publik`);
  }
  await assert.rejects(createAdmin({ ...env, VITE_SUPABASE_URL: 'http://supabase.example.com' }), /http polos/);
  await assert.rejects(createAdmin({ ...env, VITE_SUPABASE_URL: 'http://203.0.113.9:8000' }), /http polos/);
  await assert.rejects(createAdmin({ ...env, VITE_SUPABASE_URL: 'ftp://supabase.invalid' }), /tidak valid/);

  let user;
  let role;
  let writes = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(options.redirect, 'error');
    const path = new URL(url).pathname;
    let data;
    if (path === '/auth/v1/admin/users' && !options.method) data = { users: user ? [user] : [] };
    else if (path === '/auth/v1/admin/users') { writes++; user = { id: 'test-id', email: env.ADMIN_EMAIL }; data = user; }
    else if (path === '/auth/v1/token') data = { user };
    else if (path === '/rest/v1/profiles' && options.method === 'POST') {
      assert.equal(options.headers['Content-Profile'], 'web');
      writes++; role = JSON.parse(options.body).role; data = [{ role }];
    } else if (path === '/rest/v1/profiles') {
      assert.equal(options.headers['Accept-Profile'], 'web'); data = role ? [{ role }] : [];
    } else assert.fail('Permintaan tak terduga');
    return Response.json(data);
  };
  await createAdmin(env);
  assert.equal(role, 'admin');
  assert.equal(writes, 2);
  await createAdmin(env);
  assert.equal(writes, 2, 'Eksekusi ulang tidak boleh mengubah akun');
  role = 'viewer';
  await assert.rejects(createAdmin(env), /bukan admin/);
  assert.equal(writes, 2);
  globalThis.fetch = async () => new Response(null, { status: 401 });
  await assert.rejects(createAdmin(env), /HTTP 401/);
  await assert.rejects(createAdmin({ ...env, ADMIN_EMAIL: '' }), /email valid/);
  console.log('[✓] Uji pembuatan, pengulangan, perlindungan akun lama, kebijakan TLS, serta kegagalan lulus (Supabase simulasi).');
} finally {
  globalThis.fetch = originalFetch;
  rmSync(dir, { recursive: true, force: true });
}
