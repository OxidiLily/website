// Jalankan: PGLITE_MODULE=/lokasi/pglite/dist/index.js node scripts/password-change.check.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
try {
  await db.exec(`
    create role authenticated;
    create role service_role;
    create schema auth;
    create schema web;
    create table auth.users(id uuid primary key, encrypted_password text, raw_app_meta_data jsonb);
    create table web.profiles(id uuid, role text);
    create function auth.uid() returns uuid language sql as $$ select '00000000-0000-0000-0000-000000000001'::uuid $$;
    insert into auth.users values ('00000000-0000-0000-0000-000000000001', 'initial-test-hash', '{"require_password_change":true}');
    insert into web.profiles values ('00000000-0000-0000-0000-000000000001', 'admin');
  `);
  await db.exec(readFileSync(new URL('../supabase/require-password-change.sql', import.meta.url), 'utf8'));
  const allowed = async () => (await db.query('select web.is_admin() as allowed')).rows[0].allowed;
  assert.equal(await allowed(), false);
  await db.exec("update auth.users set encrypted_password = encrypted_password");
  assert.equal(await allowed(), false, 'Hash tidak berubah: tetap terkunci');
  await db.exec("update auth.users set encrypted_password = 'changed-test-hash'");
  assert.equal(await allowed(), true);
  assert.equal((await db.query('select raw_app_meta_data from auth.users')).rows[0].raw_app_meta_data.require_password_change, false);
  await db.exec("update web.profiles set role = 'viewer'");
  assert.equal(await allowed(), false, 'Viewer tidak boleh menjadi admin');
  console.log('[✓] PostgreSQL: admin terkunci sebelum perubahan hash, terbuka sesudahnya; viewer tetap ditolak.');
} finally { await db.close(); }
