// Pemeriksa perapih keluaran AI. Jalankan: npx tsx src/lib/blogWriter.check.ts
//
// Salah di sini tersimpan diam-diam ke database dan baru terlihat sebagai
// artikel rusak di halaman publik, jadi tiap cabang dicek satu per satu.
import assert from 'node:assert/strict';
import { bersihkanHtmlArtikel, tampakHtml, tugasArtikel, PROMPT_PENULIS_BLOG } from './blogWriter';

// Pagar kode yang membungkus seluruh jawaban — dikupas.
assert.equal(bersihkanHtmlArtikel('```html\n<p>Halo</p>\n```'), '<p>Halo</p>');
assert.equal(bersihkanHtmlArtikel('```\n<p>Halo</p>\n```'), '<p>Halo</p>');

// Pagar kode DI DALAM artikel (contoh perintah) — TIDAK boleh ikut terkupas.
const denganContoh = '<p>Pasang:</p>\n<pre><code>```bash\ncurl x\n```</code></pre>';
assert.equal(bersihkanHtmlArtikel(denganContoh), denganContoh);

// Wrapper dokumen penuh — hanya isi <body> yang diambil.
assert.equal(
  bersihkanHtmlArtikel('<html><head><title>x</title></head><body><h2>Bab</h2><p>Isi</p></body></html>'),
  '<h2>Bab</h2><p>Isi</p>',
);
// Wrapper tanpa <body>.
assert.equal(bersihkanHtmlArtikel('<html><p>Isi</p></html>'), '<p>Isi</p>');

// Masukan kosong tidak melempar.
assert.equal(bersihkanHtmlArtikel(''), '');
assert.equal(bersihkanHtmlArtikel(undefined as unknown as string), '');

// Deteksi HTML vs markdown warisan — inilah yang memutuskan cara render.
assert.equal(tampakHtml('<p>Artikel baru</p>'), true);
assert.equal(tampakHtml('<h2>Bab</h2>'), true);
assert.equal(tampakHtml('**CasaOS: OS Server Rumahan Ringan** **Apa:** Sistem operasi...'), false);
assert.equal(tampakHtml(''), false);

// Prompt harus benar-benar melarang markdown dan menuntut penutup.
assert.match(PROMPT_PENULIS_BLOG, /DILARANG memakai markdown/);
assert.match(tugasArtikel('CasaOS'), /Kesimpulan/);
assert.match(tugasArtikel('CasaOS'), /"CasaOS"/);

// Instruksi SEO harus ikut terkirim — inilah yang membedakan artikel yang
// bisa ditemukan orang dari artikel yang cuma panjang.
assert.match(PROMPT_PENULIS_BLOG, /SEO/);
assert.match(PROMPT_PENULIS_BLOG, /cuplikan hasil pencarian/);
assert.match(tugasArtikel('CasaOS'), /Kata kunci utama artikel ini adalah "CasaOS"/);

console.log('[✓] blogWriter: semua pemeriksaan lolos');
