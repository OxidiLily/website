#!/usr/bin/env node
/**
 * Memeriksa katalog ikon di src/data/ikon-katalog.json.
 *
 * Katalog itu BATAS keamanan, bukan sekadar data: jalur /ikon/svg/<slug>.svg
 * hanya mau mengunduh slug yang ada di dalamnya. Karena itu yang diperiksa di
 * sini bukan cuma "JSON-nya bisa dibaca", tapi:
 *   * setiap slug lolos bentuk yang dipakai server untuk menyusun URL;
 *   * tidak ada slug yang bisa keluar dari jalurnya (`..`, `/`, spasi);
 *   * `komit` berupa SHA 40 karakter — nilainya menempel ke URL unduhan, jadi
 *     nilai aneh di situ berarti alamat yang tidak pernah dimaksudkan;
 *   * jumlahnya wajar (katalog kosong mematikan seluruh fitur — server
 *     menjawab 503, dan itu benar, tapi harus ketahuan di sini lebih dahulu).
 *
 * Jalankan: npx tsx scripts/ikon-katalog.check.ts
 */
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {labelIkon, slugIkonSah, type KatalogIkon} from '../src/lib/ikon';

const AKAR = dirname(dirname(fileURLToPath(import.meta.url)));
const BERKAS = join(AKAR, 'src/data/ikon-katalog.json');

let gagal = 0;
const cek = (nama: string, benar: boolean, info = ''): void => {
  if (benar) console.log(`  [✓] ${nama}`);
  else {
    gagal++;
    console.log(`  [×] ${nama}${info ? ` — ${info}` : ''}`);
  }
};

const isi = JSON.parse(readFileSync(BERKAS, 'utf8')) as {
  versi?: number;
  sumber?: string;
  komit?: string;
  dibuat?: string;
  jumlah?: number;
  ikon?: KatalogIkon;
};
const ikon = isi.ikon ?? {};
const kunci = Object.keys(ikon);

console.log(`katalog: ${BERKAS}`);
cek('versi dikenali', isi.versi === 1, `versi=${isi.versi}`);
cek('menyebut sumbernya', /dashboardicons\.com/.test(isi.sumber ?? ''), isi.sumber ?? '');
cek('komit berupa SHA 40 hex', /^[0-9a-f]{40}$/.test(isi.komit ?? ''), isi.komit ?? '');
cek('tanggal dibuat terisi', /^\d{4}-\d{2}-\d{2}$/.test(isi.dibuat ?? ''), isi.dibuat ?? '');
cek('jumlah cocok dengan isinya', isi.jumlah === kunci.length, `jumlah=${isi.jumlah}, kunci=${kunci.length}`);
cek('katalog tidak kosong (minimal 1000 ikon)', kunci.length >= 1000, `${kunci.length} ikon`);

const slugBuruk = kunci.filter((s) => !slugIkonSah(s));
cek('semua slug lolos bentuk yang dipakai server', slugBuruk.length === 0, slugBuruk.slice(0, 8).join(', '));
cek('tidak ada slug ber-".."', !kunci.some((s) => s.includes('..')));
cek('tidak ada slug ber-"/"', !kunci.some((s) => s.includes('/')));
cek('tidak ada slug berspasi', !kunci.some((s) => /\s/.test(s)));
cek('kunci unik (JSON tidak bisa duplikat)', new Set(kunci).size === kunci.length);

const aliasBuruk = kunci.flatMap((s) => (ikon[s].a ?? []).filter((a) => typeof a !== 'string' || !a.trim()));
cek('alias selalu string tak kosong', aliasBuruk.length === 0, String(aliasBuruk.length));
const kategoriBuruk = kunci.flatMap((s) => (ikon[s].k ?? []).filter((k) => typeof k !== 'string' || !k.trim()));
cek('kategori selalu string tak kosong', kategoriBuruk.length === 0, String(kategoriBuruk.length));
const varianBuruk = kunci.flatMap((s) => (ikon[s].w ?? []).filter((v) => !slugIkonSah(v)));
cek('varian menunjuk slug yang sah', varianBuruk.length === 0, varianBuruk.slice(0, 5).join(', '));

// Label kosong berarti panel menampilkan tombol tanpa nama — ikonnya ada, tapi
// admin tidak tahu apa yang sedang dipilihnya.
const labelKosong = kunci.filter((s) => !labelIkon(s).trim());
cek('setiap slug menghasilkan label', labelKosong.length === 0, labelKosong.slice(0, 5).join(', '));

for (const wajib of ['docker', 'supabase', 'proxmox', 'nginx-proxy-manager', 'nextjs', 'postgresql', 'ubuntu-linux', 'debian-linux'])
  cek(`memuat ikon yang dipakai situs ini: ${wajib}`, Boolean(ikon[wajib]));

console.log(gagal === 0 ? '\n[✓] ikon-katalog: semua pemeriksaan lolos' : `\n[×] ikon-katalog: ${gagal} pemeriksaan gagal`);
process.exit(gagal === 0 ? 0 : 1);
