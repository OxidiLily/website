// Manifes + lockfile untuk tahap runtime image. Lihat Dockerfile tahap 2.
//
// Kenapa dipotong dari package-lock.json, bukan disusun dengan
// `npm install --package-lock-only`: yang terakhir menyelesaikan ulang SELURUH
// pohon dari registry saat build, jadi versi transitif yang jalan di container
// bisa berbeda dari yang diuji di host tanpa satu pun berkas yang mencatatnya.
// Di sini pohonnya diambil apa adanya dari lockfile yang sudah ada — resolusi
// dan hash-nya sama persis — dan tidak ada permintaan jaringan saat build.
// (Selain itu `--package-lock-only` juga ditolak kebijakan npm di sebagian
// mesin: EALLOWREMOTE, "Fetching packages of type remote have been disabled".)
//
// Vite mengevaluasi vite.config.ts saat start, jadi image akhir cuma butuh
// paket yang diimpor berkas itu. React, three.js, klien Supabase, dan
// TypeScript tidak perlu ikut: semuanya sudah dipanggang ke dist/.
//
// Jalankan: node scripts/runtime-manifest.mjs [direktori-keluaran]

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Paket yang diimpor vite.config.ts (langsung). */
export const PAKET_RUNTIME = ['vite', '@vitejs/plugin-react', '@tailwindcss/vite', 'tailwindcss'];

const NAMA = 'desain-web-runtime';
const VERSI = '1.0.0';

/**
 * package-lock.json penuh → { packageJson, packageLock } yang hanya berisi
 * paket runtime dan seluruh pohon di bawahnya.
 */
export function potongLock(lock, paket = PAKET_RUNTIME) {
  const semua = lock?.packages;
  if (!semua || typeof semua !== 'object') throw new Error('package-lock.json tidak punya bagian "packages"');

  const perlu = new Set();
  const telusuri = (nama) => {
    const kunci = `node_modules/${nama}`;
    if (perlu.has(kunci)) return;
    const entri = semua[kunci];
    // Entri yang memang tidak ada di lockfile bukan tanda lockfile rusak:
    // paket opsional milik platform lain (mis. `@tailwindcss/oxide-wasm32-wasi`
    // dengan `cpu: ["wasm32"]`) tercatat di lockfile TANPA pohonnya, dan
    // `npm ci` menerima bentuk itu apa adanya di lockfile utama juga. Yang
    // penting potongan ini tidak kehilangan apa pun yang ada di sana — itu yang
    // diperiksa scripts/runtime-manifest.check.mjs.
    if (!entri) return;
    perlu.add(kunci);
    for (const d of [...Object.keys(entri.dependencies ?? {}), ...Object.keys(entri.optionalDependencies ?? {})]) {
      telusuri(d);
    }
  };
  for (const p of paket) {
    if (!semua[`node_modules/${p}`]) throw new Error(`paket "${p}" tidak ada di package-lock.json`);
    telusuri(p);
  }

  const deps = Object.fromEntries(paket.map((p) => [p, semua[`node_modules/${p}`].version]));
  const packages = {
    '': { name: NAMA, version: VERSI, private: true, dependencies: deps },
  };
  for (const [kunci, entri] of Object.entries(semua)) {
    if (!kunci) continue;
    // Entri bersarang (`node_modules/a/node_modules/b`) ikut begitu induknya
    // dipakai — npm memvalidasi lockfile sampai ke tingkat itu, dan berkas
    // bersarang yang hilang membuat `npm ci` menolak seluruh lockfile.
    const induk = kunci.split('/node_modules/')[0];
    if (perlu.has(kunci) || perlu.has(induk)) packages[kunci] = entri;
  }

  return {
    packageJson: { name: NAMA, private: true, type: 'module', dependencies: deps },
    packageLock: {
      name: NAMA,
      version: VERSI,
      lockfileVersion: lock.lockfileVersion ?? 3,
      requires: true,
      packages,
    },
  };
}

/** Tulis kedua berkas ke direktori tujuan. */
export function tulisManifes(berkasLock, tujuan) {
  const { packageJson, packageLock } = potongLock(JSON.parse(readFileSync(berkasLock, 'utf8')));
  mkdirSync(tujuan, { recursive: true });
  writeFileSync(join(tujuan, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');
  writeFileSync(join(tujuan, 'package-lock.json'), JSON.stringify(packageLock, null, 2) + '\n');
  return { jumlahPaket: Object.keys(packageLock.packages).length - 1, deps: packageJson.dependencies };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Lockfile dibaca relatif terhadap BERKAS INI, bukan terhadap direktori kerja:
  // di Dockerfile ia dijalankan dari /app (lockfile ada di sana), tapi saat diuji
  // dari direktori lain, direktori kerja justru tidak punya lockfile sama sekali.
  const akarRepo = join(dirname(fileURLToPath(import.meta.url)), '..');
  const hasil = tulisManifes(join(akarRepo, 'package-lock.json'), process.argv[2] ?? '/runtime');
  console.log(`[runtime-manifest] ${hasil.jumlahPaket} paket terkunci:`, hasil.deps);
}
