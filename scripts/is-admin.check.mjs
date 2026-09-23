// Definisi web.is_admin() ada di TIGA berkas SQL, dan ketiganya memakai
// `create or replace` — jadi berkas mana pun yang dijalankan TERAKHIR yang
// berlaku. Selama tiga-tiganya sepadan, urutan apa pun aman; begitu satu saja
// tertinggal versi ringkas ("role = admin" tanpa syarat password awal), menjalankan
// berkas itu SETELAH migrasi mengembalikan aturan lama tanpa jejak apa pun —
// dan urutan itu justru yang wajar dilakukan orang saat memasang ulang dari nol.
//
// Dijaga di sini, bukan di kepala: perbedaannya satu baris SQL yang tidak
// terlihat oleh siapa pun yang membaca ketiga berkas secara terpisah.
// Jalankan: node scripts/is-admin.check.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const BERKAS = [
  'supabase/schema.sql',
  'supabase/migrate-public-to-web.sql',
  'supabase/require-password-change.sql',
];

/** Badan fungsi + hak aksesnya, tanpa komentar dan tanpa perbedaan spasi. */
function definisi(berkas) {
  const isi = readFileSync(join(akar, berkas), 'utf8');
  const m = /create or replace function web\.is_admin\(\)[\s\S]*?grant execute on function web\.is_admin\(\)[^;]*;/i.exec(isi);
  assert.ok(m, `web.is_admin() (beserta grant-nya) tidak ditemukan di ${berkas}`);
  return m[0].replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim();
}

const acuan = definisi(BERKAS[0]);
for (const berkas of BERKAS.slice(1)) {
  assert.equal(definisi(berkas), acuan, `definisi web.is_admin() di ${berkas} berbeda dari ${BERKAS[0]}`);
}

// Isi yang wajib ada — tanpa ini, "sama di ketiga berkas" masih bisa berarti
// sama-sama salah.
assert.match(acuan, /join auth\.users/i, 'penanda password ada di auth.users');
assert.match(acuan, /raw_app_meta_data\s*->>\s*'require_password_change'/, 'syarat password awal harus dibaca dari app_metadata');
assert.doesNotMatch(acuan, /user_metadata/, 'user_metadata bisa diubah pemilik akun — tidak boleh jadi penanda');
assert.match(acuan, /coalesce\([^)]*'false'\)\s*=\s*'false'/, 'akun tanpa penanda harus tetap dinilai admin');
assert.match(acuan, /role\s*=\s*'admin'/);
assert.match(acuan, /grant execute on function web\.is_admin\(\) to authenticated/i);
assert.match(acuan, /security definer/i);

console.log(`[✓] is-admin: definisi web.is_admin() identik di ${BERKAS.length} berkas SQL`);
