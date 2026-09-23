#!/usr/bin/env node
/**
 * Menyalin berkas SVG ikon dari dashboard-icons ke `public/ikon/svg/` supaya
 * ikon itu disajikan dari situs sendiri — tanpa internet, tanpa cache.
 *
 * Kapan perlu: kalau situs ini (atau container-nya) tidak punya akses keluar.
 * Tanpa langkah ini pun ikonnya tetap muncul; server mengambilnya sekali dari
 * CDN lalu menyimpannya di `.ikon-cache/`. Bedanya, `.ikon-cache` adalah cache
 * yang bisa hilang (container baru = cache kosong) dan butuh internet saat
 * pertama kali dipakai, sedangkan berkas di `public/ikon/svg/` ikut repo.
 *
 * Pemakaian:
 *   node scripts/ikon-ambil.mjs nextcloud docker proxmox
 *   node scripts/ikon-ambil.mjs --kategori "Developer-Tools" --batas 40
 *   node scripts/ikon-ambil.mjs --semua            # 2200+ berkas, ~6 MB
 *
 * Slug divalidasi terhadap katalog dulu: nama yang salah ketik dilaporkan,
 * bukan diam-diam menghasilkan 404 di situs.
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const AKAR = dirname(dirname(fileURLToPath(import.meta.url)));
const KATALOG_BERKAS = join(AKAR, 'src/data/ikon-katalog.json');
const TUJUAN = join(AKAR, 'public/ikon/svg');
const REPO = 'homarr-labs/dashboard-icons';
const RAW = `https://raw.githubusercontent.com/${REPO}`;
const BATAS_BYTE = 512 * 1024;

const arg = process.argv.slice(2);
const nilaiArg = (nama) => {
  const i = arg.indexOf(nama);
  return i === -1 ? '' : (arg[i + 1] ?? '');
};

const main = async () => {
  if (!existsSync(KATALOG_BERKAS)) {
    throw new Error(`katalog belum ada (${KATALOG_BERKAS}) — jalankan dulu: node scripts/ikon-katalog.mjs`);
  }
  const katalog = JSON.parse(readFileSync(KATALOG_BERKAS, 'utf8'));
  const ikon = katalog.ikon ?? {};
  const komit = katalog.komit;
  if (!komit || !Object.keys(ikon).length) throw new Error('katalog kosong atau tanpa commit — jalankan scripts/ikon-katalog.mjs');

  const semua = arg.includes('--semua');
  const kategori = nilaiArg('--kategori').toLowerCase();
  const batas = Number(nilaiArg('--batas')) || 0;
  const slugArg = arg.filter((a) => !a.startsWith('--') && a !== kategori && a !== String(batas));
  const slug = semua
    ? Object.keys(ikon)
    : slugArg.length
      ? slugArg.map((s) => s.trim().toLowerCase())
      : Object.entries(ikon)
          .filter(([, v]) => (v.k ?? []).some((k) => k.toLowerCase() === kategori))
          .map(([s]) => s);

  if (!slug.length) {
    console.error('Tidak ada slug yang dipilih.');
    console.error('Contoh: node scripts/ikon-ambil.mjs nextcloud docker   |   --kategori "Media-Servers"   |   --semua');
    process.exit(2);
  }

  const dipilih = batas > 0 ? slug.slice(0, batas) : slug;
  const tidakAda = dipilih.filter((s) => !ikon[s]);
  if (tidakAda.length) {
    console.error(`[×] tidak ada di katalog: ${tidakAda.join(', ')}`);
    console.error('    Panel admin bisa mencari nama yang benar: /ikon/cari?q=...');
    process.exit(1);
  }

  mkdirSync(TUJUAN, {recursive: true});
  let baru = 0;
  let dilewati = 0;
  let gagal = 0;

  for (const s of dipilih) {
    const berkas = join(TUJUAN, `${s}.svg`);
    // Berkas yang sudah ada TIDAK ditimpa: yang sudah disalin admin mungkin
    // sengaja berbeda dari versi CDN, dan menjalankan ulang skrip ini untuk
    // menambah dua ikon tidak boleh menulis ulang seluruh direktori.
    if (existsSync(berkas)) {
      dilewati++;
      continue;
    }
    try {
      const res = await fetch(`${RAW}/${komit}/svg/${s}.svg`, {
        headers: {'user-agent': 'desain-web-ikon/1.0'},
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (!buf.length || buf.length > BATAS_BYTE) throw new Error(`ukuran aneh (${buf.length} byte)`);
      if (!/<svg[\s>]/i.test(buf.toString('utf8').slice(0, 4000))) throw new Error('bukan SVG');
      writeFileSync(berkas, buf);
      baru++;
    } catch (e) {
      gagal++;
      console.error(`[×] ${s}: ${e?.message ?? e}`);
    }
  }

  console.log(`[✓] ${baru} ikon disalin ke public/ikon/svg/ (${dilewati} sudah ada, ${gagal} gagal)`);
};

main().catch((e) => {
  console.error(`[×] ${e?.message ?? e}`);
  process.exit(1);
});
