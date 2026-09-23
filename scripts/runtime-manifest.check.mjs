// Manifes runtime yang dipotong salah bisa membuat `npm ci` di image menolak
// seluruh lockfile — dan itu baru ketahuan setelah build berjalan. Pemeriksa ini
// menahan kesalahan yang paling mungkin: paket langsung yang versinya tidak
// sama dengan lockfile utama, dependensi yang kepotong, dan paket build yang
// ikut terbawa (TypeScript, React, three.js).
//
// Jalankan: node scripts/runtime-manifest.check.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAKET_RUNTIME, potongLock } from './runtime-manifest.mjs';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(readFileSync(join(akar, 'package-lock.json'), 'utf8'));
const { packageJson, packageLock } = potongLock(lock);

// ── Paket langsung: yang diimpor vite.config.ts, versi PERSIS dari lockfile ──
assert.deepEqual(Object.keys(packageJson.dependencies).sort(), [...PAKET_RUNTIME].sort());
for (const p of PAKET_RUNTIME) {
  assert.equal(packageJson.dependencies[p], lock.packages[`node_modules/${p}`].version, `versi ${p} harus diambil dari lockfile, bukan rentang ^`);
  assert.ok(packageLock.packages[`node_modules/${p}`], `${p} harus ikut di lockfile potongan`);
}

// ── Pohon di bawahnya ikut ──────────────────────────────────────────────────
const ada = (nama) => Object.keys(packageLock.packages).some((k) => k === `node_modules/${nama}` || k.endsWith(`/node_modules/${nama}`));
for (const wajib of ['esbuild', 'rollup', 'postcss', 'picomatch', '@babel/core', '@tailwindcss/oxide', '@rollup/rollup-linux-x64-gnu', '@esbuild/linux-x64']) {
  assert.ok(ada(wajib), `${wajib} dipakai saat vite start — harus ada di lockfile potongan`);
}

// ── Yang tidak dipakai saat start tidak ikut ─────────────────────────────────
for (const terlarang of ['typescript', 'react', 'react-dom', 'three', '@supabase/supabase-js', '@types/node']) {
  assert.ok(lock.packages[`node_modules/${terlarang}`], `${terlarang} diharapkan ada di lockfile UTAMA (kalau tidak, uji ini tidak bermakna)`);
  assert.equal(ada(terlarang), false, `${terlarang} hanya dipakai saat build — tidak boleh ikut ke image akhir`);
}

// ── Setiap dependensi paket yang ikut harus ada juga di potongannya ─────────
// Inilah yang divalidasi `npm ci`: potongan tidak boleh menghilangkan apa pun
// yang ada di lockfile utama, karena satu yang hilang membuat ia menolak
// seluruh lockfile dan build berhenti di tahap runtime.
//
// Yang memang TIDAK ada di lockfile utama (pohon paket opsional platform lain)
// dilewati: `npm ci` menerima bentuk itu di lockfile utama, jadi bentuk yang
// sama juga diterima di potongannya.
const adaDiUtama = (nama) => Boolean(lock.packages[`node_modules/${nama}`]);
let diperiksa = 0;
for (const [kunci, entri] of Object.entries(packageLock.packages)) {
  for (const nama of [...Object.keys(entri.dependencies ?? {}), ...Object.keys(entri.optionalDependencies ?? {})]) {
    if (!adaDiUtama(nama)) continue;
    diperiksa++;
    assert.ok(ada(nama), `${kunci || '(root)'} bergantung pada ${nama} yang hilang dari lockfile potongan`);
  }
}
assert.ok(diperiksa > 50, `harus ada banyak ketergantungan yang diperiksa, dapat ${diperiksa}`);

// ── Lockfile yang tidak masuk akal ditolak, bukan menghasilkan berkas separuh ─
assert.throws(() => potongLock({ packages: {} }), /tidak ada di package-lock\.json/);
assert.throws(() => potongLock({}), /bagian "packages"/);

console.log(`[✓] runtime-manifest: ${Object.keys(packageLock.packages).length - 1} paket terkunci, tanpa perkakas build`);
