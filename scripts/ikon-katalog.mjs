#!/usr/bin/env node
/**
 * Membangun katalog ikon dari https://dashboardicons.com (repo
 * homarr-labs/dashboard-icons) jadi berkas yang ikut repo:
 * `src/data/ikon-katalog.json`.
 *
 * Kenapa katalognya DISALIN ke repo alih-alih diambil situs saat dipakai:
 *   * panel admin berjalan di LAN/Tailscale dan situs ini memang dirancang
 *     tetap berguna tanpa internet (Supabase dan gateway AI-nya pun di LAN) —
 *     pencarian ikon tidak boleh mati hanya karena GitHub tidak terjangkau;
 *   * daftar 3300 ikon itu dipakai untuk MEMVALIDASI jalur /ikon/svg/<slug>.svg
 *     (lihat vite.config.ts). Kalau daftarnya diambil saat permintaan berjalan,
 *     nama ikon dari klien ikut menentukan URL apa yang diunduh server ini.
 *     Dengan daftar tetap, slug yang tidak ada di katalog tidak pernah
 *     diteruskan ke mana pun.
 *
 * Jalankan `node scripts/ikon-katalog.mjs` untuk memperbarui (butuh internet).
 * Tambahkan `--terbaru` untuk memakai commit terakhir branch main; tanpa itu
 * commit yang sudah terpatok di bawah yang dipakai, jadi hasilnya sama persis
 * setiap kali dijalankan.
 */
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const AKAR = dirname(dirname(fileURLToPath(import.meta.url)));
const KELUARAN = join(AKAR, 'src/data/ikon-katalog.json');
const REPO = 'homarr-labs/dashboard-icons';
const RAW = `https://raw.githubusercontent.com/${REPO}`;

// Commit yang dipatok. Naikkan dengan `--terbaru` saat ingin menyegarkan.
const KOMIT_TETAP = 'cf87d9bbd47792b20893f090ff48763fe874b05d';

const ambilJson = async (url) => {
  const res = await fetch(url, {headers: {'user-agent': 'desain-web-ikon/1.0'}, signal: AbortSignal.timeout(60_000)});
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
};

const main = async () => {
  const mintaTerbaru = process.argv.includes('--terbaru');
  let komit = KOMIT_TETAP;
  if (mintaTerbaru) {
    const kepala = await fetch(`https://api.github.com/repos/${REPO}/commits/main`, {
      headers: {'user-agent': 'desain-web-ikon/1.0', accept: 'application/vnd.github+json'},
      signal: AbortSignal.timeout(30_000),
    });
    if (!kepala.ok) throw new Error(`tidak bisa membaca commit main: HTTP ${kepala.status}`);
    komit = (await kepala.json()).sha;
    console.log(`commit main terbaru: ${komit}`);
  }

  console.log(`mengunduh metadata.json @ ${komit.slice(0, 10)}…`);
  const metadata = await ambilJson(`${RAW}/${komit}/metadata.json`);
  const pohon = await ambilJson(`${RAW}/${komit}/tree.json`);
  const berkasSvg = new Set(pohon?.svg ?? []);

  // Hanya ikon yang benar-benar punya berkas .svg di repo yang masuk katalog:
  // metadata memuat juga ikon yang cuma punya png/webp, dan menjanjikan slug
  // yang tidak bisa disajikan sama saja dengan membuat tautan mati.
  const ikon = {};
  let tanpaSvg = 0;
  for (const [nama, meta] of Object.entries(metadata)) {
    if (!berkasSvg.has(`${nama}.svg`)) {
      tanpaSvg++;
      continue;
    }
    const a = (meta?.aliases ?? []).map((s) => String(s).trim()).filter(Boolean);
    const k = (meta?.categories ?? []).map((s) => String(s).trim()).filter(Boolean);
    const w = meta?.colors ?? {};
    const warna = [w.dark, w.light].filter((v) => typeof v === 'string' && v).map(String);
    const isi = {};
    if (a.length) isi.a = a;
    if (k.length) isi.k = k;
    if (warna.length) isi.w = warna;
    ikon[nama] = isi;
  }

  // Varian gelap/terang yang disebut metadata ikon induknya ikut didaftarkan
  // walau tidak punya entri sendiri — itu berkas .svg sungguhan (mis.
  // `dagster-dark.svg`), dan tanpanya varian tersebut tidak bisa dicari.
  let varianDitambah = 0;
  for (const nama of Object.keys(ikon)) {
    for (const v of ikon[nama].w ?? []) {
      if (ikon[v] || !berkasSvg.has(`${v}.svg`)) continue;
      ikon[v] = { w: [nama] };
      varianDitambah++;
    }
  }

  const slug = Object.keys(ikon).sort();
  const hasil = {
    versi: 1,
    sumber: `https://dashboardicons.com (${REPO})`,
    komit,
    dibuat: new Date().toISOString().slice(0, 10),
    jumlah: slug.length,
    ikon,
  };

  mkdirSync(dirname(KELUARAN), {recursive: true});
  writeFileSync(KELUARAN, JSON.stringify(hasil, null, 1) + '\n');
  const ukuran = readFileSync(KELUARAN).length;
  console.log(
    `[✓] katalog: ${slug.length} ikon (${(ukuran / 1024).toFixed(0)} KB) → src/data/ikon-katalog.json\n` +
      `    ${Object.keys(metadata).length} entri metadata, ${tanpaSvg} tanpa berkas svg, ` +
      `${varianDitambah} varian gelap/terang ditambahkan`,
  );
};

main().catch((e) => {
  // Berkas lama SENGAJA tidak dihapus: katalog yang sedikit tertinggal jauh
  // lebih berguna daripada panel yang kehilangan seluruh pilihan ikonnya.
  console.error(`[×] gagal membangun katalog: ${e?.message ?? e}`);
  console.error('    src/data/ikon-katalog.json yang lama dibiarkan apa adanya.');
  process.exit(1);
});
