#!/usr/bin/env node
/**
 * Uji jalur /ikon lewat server SUNGGUHAN (`vite preview`, yang juga dipakai
 * container produksi). Uji logika murni di src/lib/ikon.check.ts tidak
 * membuktikan apa pun tentang middlewavenya: batas slug, penyajian SVG, header
 * cache, dan penolakan metode semuanya hidup di vite.config.ts.
 *
 * Kenapa harus server sungguhan dan bukan tiruan: middleware itu dipasang lewat
 * `configurePreviewServer`, dan yang menentukan ia JALAN atau tidak adalah
 * urutannya terhadap penyaji statis Vite — hal yang tidak ada di tiruan mana pun.
 * Urutan itu juga yang pernah bikin ikon hasil `scripts/ikon-ambil.mjs` tidak
 * tersaji saat `vite preview` (middleware berjalan lebih dulu daripada penyaji
 * statis), dan fase kedua di bawah ini yang menjaganya tidak terulang.
 *
 * Jalankan: node scripts/ikon-jalur.check.mjs   (butuh dist/: npm run build)
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = dirname(dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.env.UJI_IKON_PORT || 4477);
const BASE = `http://127.0.0.1:${PORT}`;
const VITE = join(AKAR, 'node_modules', '.bin', 'vite');

if (!existsSync(join(AKAR, 'dist', 'index.html'))) {
  console.error('[×] dist/ belum ada — jalankan `npm run build` lebih dulu.');
  process.exit(2);
}

let gagal = 0;
const cek = (nama, benar, info = '') => {
  if (benar) console.log(`  [✓] ${nama}`);
  else {
    gagal++;
    console.log(`  [×] ${nama}${info ? ` — ${info}` : ''}`);
  }
};
const minta = (jalur, opsi = {}) => fetch(`${BASE}${jalur}`, { redirect: 'manual', ...opsi });

/** Nyalakan server, kembalikan { anak, matikan }. */
const nyalakan = async (env) => {
  const anak = spawn(VITE, ['preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    cwd: AKAR,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });
  let log = '';
  anak.stdout.on('data', (d) => (log += d));
  anak.stderr.on('data', (d) => (log += d));
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${BASE}/`, { signal: AbortSignal.timeout(2000) })).ok) break;
    } catch {
      /* belum siap */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  const matikan = async () => {
    anak.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 400));
    if (!anak.killed) anak.kill('SIGKILL');
  };
  return { anak, matikan, log: () => log };
};

// Cache diarahkan ke direktori sementara supaya uji ini tidak menulis apa pun ke
// repo, dan supaya "belum pernah diunduh" bisa dijamin saat fase kedua.
const sementara = mkdtempSync(join(tmpdir(), 'uji-ikon-'));
let server = null;
let server2 = null;

try {
  server = await nyalakan({ IKON_CACHE_DIR: join(sementara, 'cache') });
  if (!(await minta('/')).ok) throw new Error(`server tidak siap:\n${server.log().slice(-600)}`);

  console.log('pencarian ikon:');
  const cari = await minta('/ikon/cari?q=docker&batas=10');
  const isiCari = await cari.json();
  cek('GET /ikon/cari → 200', cari.status === 200, `status ${cari.status}`);
  cek('hasilnya JSON', String(cari.headers.get('content-type')).includes('application/json'));
  cek('slug yang dicari ada di hasil', (isiCari.hasil ?? []).some((h) => h.slug === 'docker'));
  cek('hasil teratas = yang paling persis', isiCari.hasil?.[0]?.slug === 'docker', isiCari.hasil?.[0]?.slug);
  cek('hasil dibatasi', (isiCari.hasil ?? []).length <= 10, String((isiCari.hasil ?? []).length));
  cek('label ikut dikirim', typeof isiCari.hasil?.[0]?.label === 'string' && isiCari.hasil[0].label.length > 0);

  const cariKosong = await (await minta('/ikon/cari')).json();
  cek('kueri kosong tetap mengembalikan katalog', (cariKosong.hasil ?? []).length > 0);
  const cariAsing = await (await minta('/ikon/cari?q=zzz-tidak-ada-zzz')).json();
  cek('kueri tanpa kecocokan → daftar kosong', (cariAsing.hasil ?? []).length === 0);

  // Kontrak untuk pengisian otomatis kolom ikon di panel (IkonInput): ikon diisi
  // sendiri HANYA saat nama barisnya persis ada di katalog. Salah isi lebih buruk
  // daripada kolom kosong, jadi sifat "persis" ini yang harus dijaga.
  const namaTepat = await (await minta('/ikon/cari?q=7zip&batas=1')).json();
  cek(
    'nama "7zip" persis → panel mengisi ikonnya sendiri',
    namaTepat.hasil?.[0]?.slug === '7zip' && namaTepat.hasil[0].persis === true,
    JSON.stringify(namaTepat.hasil?.[0] ?? null),
  );
  const namaSpasi = await (await minta(`/ikon/cari?q=${encodeURIComponent('docker mailserver')}&batas=1`)).json();
  cek(
    'nama berspasi → slug berstrip, persis (docker mailserver → docker-mailserver)',
    namaSpasi.hasil?.[0]?.slug === 'docker-mailserver' && namaSpasi.hasil[0].persis === true,
    JSON.stringify(namaSpasi.hasil?.[0] ?? null),
  );
  // "Docker Compose" bukan ikon di dashboard-icons, dan kolomnya memang TIDAK
  // diisi: menebak ikon 'docker' untuknya akan salah tanpa ada yang menyadari.
  const namaTanpaIkon = await (await minta(`/ikon/cari?q=${encodeURIComponent('docker compose')}&batas=1`)).json();
  cek(
    'nama yang tidak ada di katalog TIDAK dipaksa punya ikon',
    (namaTanpaIkon.hasil ?? []).every((h) => !h.persis),
    JSON.stringify(namaTanpaIkon.hasil?.[0] ?? null),
  );
  const namaMeleset = await (await minta(`/ikon/cari?q=${encodeURIComponent('Nextcloud Server Saya')}&batas=1`)).json();
  cek(
    'nama yang bukan nama ikon TIDAK mengisi otomatis',
    namaMeleset.hasil?.[0]?.persis !== true,
    JSON.stringify(namaMeleset.hasil?.[0] ?? null),
  );
  const kueriPanjang = await minta(`/ikon/cari?q=${'a'.repeat(300)}`);
  cek('kueri sangat panjang tidak menjatuhkan server', kueriPanjang.status === 200, `status ${kueriPanjang.status}`);

  console.log('\npenyajian berkas SVG:');
  const svg = await minta('/ikon/svg/docker.svg');
  const teksSvg = await svg.text();
  cek('GET /ikon/svg/docker.svg → 200', svg.status === 200, `status ${svg.status}`);
  cek('content-type svg', String(svg.headers.get('content-type')).startsWith('image/svg+xml'), String(svg.headers.get('content-type')));
  cek('isi benar-benar SVG', /<svg[\s>]/i.test(teksSvg.slice(0, 4000)));
  // TIDAK `immutable`: alamatnya tetap walau gambar ikonnya berubah setelah
  // katalog disegarkan, jadi cache satu tahun + immutable akan menahan gambar
  // lama di browser pengunjung selama itu.
  const cc = String(svg.headers.get('cache-control'));
  cek('cache panjang tapi tidak immutable', /max-age=\d{5,}/.test(cc) && !/immutable/.test(cc), cc);
  cek('nosniff terpasang', svg.headers.get('x-content-type-options') === 'nosniff');
  cek('CSP ketat untuk berkas pihak ketiga', /sandbox/.test(String(svg.headers.get('content-security-policy'))), String(svg.headers.get('content-security-policy')));
  cek('etag ada', Boolean(svg.headers.get('etag')));

  const lagi = await minta('/ikon/svg/docker.svg', { headers: { 'if-none-match': svg.headers.get('etag') } });
  cek('If-None-Match → 304', lagi.status === 304, `status ${lagi.status}`);

  const kepala = await minta('/ikon/svg/docker.svg', { method: 'HEAD' });
  cek('HEAD dilayani', kepala.status === 200, `status ${kepala.status}`);
  cek('HEAD menyebut panjangnya', Number(kepala.headers.get('content-length')) > 0, String(kepala.headers.get('content-length')));

  console.log('\nyang HARUS ditolak:');
  cek('slug di luar katalog → 404', (await minta('/ikon/svg/tidak-ada-ikon-ini.svg')).status === 404);
  // Percobaan keluar dari direktori: tanpa daftar-putih katalog, `%2e%2e%2f`
  // bisa menjadi jalan membaca berkas lain dari server ini.
  for (const jahat of [
    '/ikon/svg/%2e%2e%2f%2e%2e%2fpackage.json.svg',
    '/ikon/svg/..%2Fpackage.json.svg',
    '/ikon/svg/%2Fetc%2Fpasswd.svg',
  ]) {
    const status = (await minta(jahat)).status;
    cek(`traversal ditolak: ${jahat.slice(0, 36)}… → ${status}`, status === 404 || status === 400, `status ${status}`);
  }
  cek('POST ditolak 405', (await minta('/ikon/svg/docker.svg', { method: 'POST', body: 'x' })).status === 405);
  // Plugin ini hanya memiliki /ikon/cari dan /ikon/svg/<slug>.svg. Jalur lain di
  // bawah /ikon bukan miliknya dan harus diteruskan, bukan dijawab 404 JSON.
  const jalurLain = await minta('/ikon/apa-saja');
  cek(
    'jalur /ikon di luar dua rute itu diteruskan ke penangan berikutnya',
    !String(jalurLain.headers.get('content-type')).includes('application/json'),
    `status ${jalurLain.status}, tipe ${jalurLain.headers.get('content-type')}`,
  );
  const awalanMirip = await minta('/ikonxyz');
  cek(
    'awalan yang mirip (/ikonxyz) juga tidak direbut',
    !String(awalanMirip.headers.get('content-type')).includes('application/json'),
    `status ${awalanMirip.status}, tipe ${awalanMirip.headers.get('content-type')}`,
  );

  console.log('\nyang TIDAK boleh terganggu:');
  cek('situs utama tetap 200', (await minta('/')).status === 200);
  cek('berkas statis lain tidak direbut', (await minta('/favicon.ico')).status !== 500);

  await server.matikan();
  server = null;

  console.log('\nsaat CDN tidak terjangkau (situs tanpa internet):');
  server2 = await nyalakan({ IKON_CDN: 'http://127.0.0.1:1', IKON_CACHE_DIR: join(sementara, 'cache2') });
  cek('situs tetap menyala', (await minta('/')).status === 200);
  cek('pencarian tetap jalan (katalog lokal)', (await minta('/ikon/cari?q=docker')).status === 200);
  // Inilah regresi yang pernah terjadi: berkas hasil `scripts/ikon-ambil.mjs`
  // TIDAK diambil dari penyaji statis Vite, jadi middleware harus membacanya
  // sendiri. Kalau tidak, ikon yang sudah disalin ke repo pun gagal.
  const lokal = await minta('/ikon/svg/docker.svg');
  cek('ikon hasil salinan tetap tersaji', lokal.status === 200, `status ${lokal.status}`);
  cek('isinya tetap SVG', /<svg[\s>]/i.test((await lokal.text()).slice(0, 4000)));
  const hanyaCdn = await minta('/ikon/svg/nextcloud.svg');
  cek('ikon yang hanya ada di CDN → 502 yang jelas', hanyaCdn.status === 502, `status ${hanyaCdn.status}`);
  const pesan = await hanyaCdn.json().catch(() => ({}));
  cek('502 menyebut cara memperbaikinya', /ikon-ambil\.mjs/.test(String(pesan.saran ?? '')), JSON.stringify(pesan));
} catch (e) {
  gagal++;
  console.log(`  [×] uji berhenti: ${e?.message ?? e}`);
} finally {
  if (server) await server.matikan();
  if (server2) await server2.matikan();
  rmSync(sementara, { recursive: true, force: true });
}

console.log(gagal === 0 ? '\n[✓] ikon-jalur: semua pemeriksaan lolos' : `\n[×] ikon-jalur: ${gagal} pemeriksaan gagal`);
process.exit(gagal === 0 ? 0 : 1);
