// Pemeriksa penilai sumber & pembersih halaman. Jalankan: npx tsx src/lib/riset.check.ts
//
// Ini penjaga paling penting di seluruh alur riset: kalau alasanTepercaya()
// meloloskan yang salah, artikel publik mengutip sumber sembarangan; kalau ia
// menolak yang benar, artikel tidak pernah bisa ditulis sama sekali.
import assert from 'node:assert/strict';
import {
  alasanTepercaya,
  bahanDariSumber,
  bersihkanHalaman,
  promptKandidat,
  uraikanKandidat,
} from './riset';

// ── Yang HARUS lolos ──────────────────────────────────────────────────────
assert.ok(alasanTepercaya('https://developer.mozilla.org/en-US/docs/Web/HTML'));
assert.ok(alasanTepercaya('https://docs.docker.com/engine/install/'));
assert.ok(alasanTepercaya('https://wiki.casaos.io/en/get-started'), 'subdomain wiki. adalah dokumentasi resmi');
assert.ok(alasanTepercaya('https://www.hostinger.co.id/tutorial/apa-itu-web-hosting'));
assert.ok(alasanTepercaya('https://www.rumahweb.com/journal/apa-itu-web-hosting/'));
assert.ok(alasanTepercaya('https://id.wikipedia.org/wiki/Peladen'), 'subdomain bahasa ikut lewat domain induk');
assert.ok(alasanTepercaya('https://raw.githubusercontent.com/x/y/HEAD/README.md'));

// Situs resmi proyek tidak menyerupai apa pun — ia hanya bisa dipercaya lewat
// asal-usul yang bisa ditunjuk, bukan lewat bentuk domainnya.
assert.equal(alasanTepercaya('https://casaos.zimaspace.com/docs'), null);
assert.match(
  alasanTepercaya('https://casaos.zimaspace.com/docs', ['https://casaos.zimaspace.com']) ?? '',
  /situs resmi proyek/,
);

// ── Yang HARUS ditolak ────────────────────────────────────────────────────
assert.equal(alasanTepercaya('https://medium.com/@seseorang/casaos-hebat'), null);
assert.equal(alasanTepercaya('https://blog-acak.xyz/casaos'), null);
assert.equal(alasanTepercaya('https://stackoverflow.com/questions/1'), null, 'forum tanya-jawab bukan rujukan');
// `dev.to` adalah platform blog pribadi; awalan `dev.` pernah meloloskannya.
assert.equal(alasanTepercaya('https://dev.to/seseorang/casaos-hebat'), null);
// http polos: isinya bisa diubah di jalur, dan artikelnya jadi salah tanpa jejak.
assert.equal(alasanTepercaya('http://developer.mozilla.org/x'), null);
// Alamat internal homelab — inilah yang membuat jalur /riset tidak bisa dipakai
// mengintip jaringan dalam walau tidak berautentikasi.
assert.equal(alasanTepercaya('https://192.168.2.99:8000/rest/v1/settings'), null);
assert.equal(alasanTepercaya('https://ai.home/v1/models'), null);
assert.equal(alasanTepercaya('file:///etc/passwd'), null);
assert.equal(alasanTepercaya('bukan-url'), null);
// Domain yang cuma MEMUAT nama domain tepercaya tidak ikut dipercaya.
assert.equal(alasanTepercaya('https://mozilla.org.penipu.xyz/x'), null);
assert.equal(alasanTepercaya('https://notmozilla.org/x'), null);

// ── Pembersih halaman ─────────────────────────────────────────────────────
{
  const html = `<html><head><title>Panduan &amp; Contoh</title></head><body>
    <nav>Beranda Kontak</nav>
    <script>var a = "kalimat di dalam script";</script>
    <style>.x { color: red }</style>
    <main><p>Paragraf pertama.</p><p>Paragraf kedua &#8212; dengan tanda.</p></main>
    <footer>Hak cipta</footer></body></html>`;
  const { judul, teks } = bersihkanHalaman(html);
  assert.equal(judul, 'Panduan & Contoh');
  // Isi <script>/<style>/<nav>/<footer> bukan prosa halaman; ikut terbaca
  // berarti ribuan token sampah mendesak isi sungguhan keluar dari konteks.
  assert.doesNotMatch(teks, /kalimat di dalam script/);
  assert.doesNotMatch(teks, /color: red/);
  assert.doesNotMatch(teks, /Beranda Kontak/);
  assert.doesNotMatch(teks, /Hak cipta/);
  assert.match(teks, /Paragraf pertama\./);
  assert.match(teks, /Paragraf kedua — dengan tanda\./);
  // Dua paragraf TIDAK boleh menyatu jadi satu kalimat yang tidak pernah
  // ditulis siapa pun — itu sumber palsu yang lahir dari perapian teks.
  assert.doesNotMatch(teks, /pertama\. Paragraf/);
}

// Halaman tanpa <main> tetap terbaca, dan batas panjang dihormati.
assert.match(bersihkanHalaman('<html><body><p>Isi apa adanya.</p></body></html>').teks, /Isi apa adanya\./);
assert.equal(bersihkanHalaman('<p>' + 'a'.repeat(500) + '</p>', 100).teks.length, 100);
assert.deepEqual(bersihkanHalaman(''), { judul: '', teks: '' });

// ── Kandidat dari jawaban model ───────────────────────────────────────────
assert.deepEqual(
  uraikanKandidat('1. https://docs.docker.com/get-started/\n- https://docs.docker.com/get-started/\nhttps://kubernetes.io/docs/home/.'),
  ['https://docs.docker.com/get-started/', 'https://kubernetes.io/docs/home/'],
);
assert.deepEqual(uraikanKandidat('tidak ada alamat di sini'), []);
assert.deepEqual(uraikanKandidat(''), []);
assert.match(promptKandidat('CasaOS'), /"CasaOS"/);
assert.match(promptKandidat('CasaOS'), /dokumentasi resmi/);

// ── Bahan rujukan ─────────────────────────────────────────────────────────
{
  const bahan = bahanDariSumber([
    { url: 'https://a.dev/x', judul: 'Judul A', teks: 'Isi A', alasan: 'penerbit tepercaya' },
    { url: 'https://b.dev/y', judul: '', teks: 'Isi B', alasan: 'penerbit tepercaya' },
  ]);
  assert.match(bahan, /\[SUMBER 1\] Judul A/);
  assert.match(bahan, /URL: https:\/\/a\.dev\/x/);
  // Sumber tanpa <title> tetap harus punya penanda — kalau tidak, model tidak
  // punya apa pun untuk ditulis di daftar sumber artikelnya.
  assert.match(bahan, /\[SUMBER 2\] https:\/\/b\.dev\/y/);
  assert.match(bahan, /Isi B/);
}
assert.equal(bahanDariSumber([]), '');

console.log('[✓] riset: semua pemeriksaan lolos');

// ── Repositori GitHub benar-benar milik topiknya? ─────────────────────────
// Tanpa penjaga ini, "web hosting" menyeret `awesome-selfhosted` (repo paling
// populer yang kebetulan cocok kata kuncinya) dan README-nya masuk sebagai
// sumber resmi. Itu benar-benar terjadi di uji pertama, bukan kekhawatiran.
import { repoMilikTopik } from './riset';
assert.equal(repoMilikTopik('CasaOS', 'CasaOS'), true);
assert.equal(repoMilikTopik('CasaOS', 'cara memasang CasaOS di mini PC'), true);
assert.equal(repoMilikTopik('awesome-selfhosted', 'web hosting'), false);
assert.equal(repoMilikTopik('awesome-selfhosted', 'Awesome Selfhosted'), true);
assert.equal(repoMilikTopik('', 'CasaOS'), false);
assert.equal(repoMilikTopik('go', 'x'), false, 'topik terlalu pendek tidak boleh mencocoki apa pun');

// Alamat terpotong di batas token — kerap muncul di jawaban model — dibuang.
assert.deepEqual(uraikanKandidat('https://www dan https://docs.docker.com/x'), ['https://docs.docker.com/x']);

// Penyedia hosting bereputasi ikut diterima; itu yang dicari pembaca artikel
// hosting, dan tanpa mereka topik seperti "web hosting" kehabisan sumber.
assert.ok(alasanTepercaya('https://www.linode.com/docs/'));
assert.ok(alasanTepercaya('https://www.hostgator.com/help'));
assert.ok(alasanTepercaya('https://www.siteground.com/kb/'));

console.log('[✓] riset: penjaga topik & daftar penyedia lolos');
