// Pemeriksa perapih keluaran AI. Jalankan: npx tsx src/lib/blogWriter.check.ts
//
// Salah di sini tersimpan diam-diam ke database dan baru terlihat sebagai
// artikel rusak di halaman publik, jadi tiap cabang dicek satu per satu.
import assert from 'node:assert/strict';
import { bersihkanHtmlArtikel, pecahArtikel, tampakHtml, tugasArtikel, PROMPT_PENULIS_BLOG } from './blogWriter';

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

// Aturan blok kode harus ikut terkirim — inilah yang membuat model menandai
// bahasa dan nama berkas, dan tanpa penanda itu kartu kodenya tidak punya apa
// pun untuk ditampilkan di kepalanya.
assert.match(PROMPT_PENULIS_BLOG, /class="language-XXX"/);
assert.match(PROMPT_PENULIS_BLOG, /data-file="Terminal"/);

// Aturan akurasi + kewajiban mencantumkan sumber.
assert.match(PROMPT_PENULIS_BLOG, /Jangan mengarang versi/);
assert.match(PROMPT_PENULIS_BLOG, /<h2>Sumber<\/h2>/);

// Bahan rujukan yang ditempel admin harus benar-benar masuk ke perintahnya,
// dan mengikat model pada bahan itu. Tanpa ini artikelnya kembali ditulis dari
// ingatan model — persis keluhan "sumbernya tidak terpercaya".
const denganSumber = tugasArtikel('CasaOS', 'https://wiki.casaos.io — dokumentasi resmi');
assert.match(denganSumber, /BAHAN RUJUKAN/);
assert.match(denganSumber, /wiki\.casaos\.io/);
assert.match(denganSumber, /jangan ditambahkan/);
// Tanpa bahan, blok itu tidak boleh muncul sebagai kepala kosong.
assert.doesNotMatch(tugasArtikel('CasaOS'), /BAHAN RUJUKAN/);
assert.doesNotMatch(tugasArtikel('CasaOS', '   '), /BAHAN RUJUKAN/);

// ── pecahArtikel: HTML artikel → potongan prosa + blok kode ────────────────

// Bentuk yang diminta prompt: bahasa dan nama berkas di <code>.
{
  const p = pecahArtikel('<p>Sebelum</p><pre><code class="language-ts" data-file="use-theme.ts">const a = 1;</code></pre><p>Sesudah</p>');
  assert.equal(p.length, 3);
  assert.deepEqual(p[0], { jenis: 'html', isi: '<p>Sebelum</p>' });
  assert.deepEqual(p[1], { jenis: 'kode', bahasa: 'ts', berkas: 'use-theme.ts', isi: 'const a = 1;' });
  assert.deepEqual(p[2], { jenis: 'html', isi: '<p>Sesudah</p>' });
}

// Atribut menempel di <pre>, bukan di <code> — sama-sama keluar dari model.
{
  const p = pecahArtikel('<pre class="language-bash" data-file="Terminal"><code>echo hai</code></pre>');
  assert.deepEqual(p[0], { jenis: 'kode', bahasa: 'bash', berkas: 'Terminal', isi: 'echo hai' });
}

// <pre> telanjang tanpa <code> dan tanpa penanda apa pun tetap jadi blok kode.
{
  const p = pecahArtikel('<pre>wget -qO- https://get.casaos.io | sudo bash</pre>');
  assert.deepEqual(p[0], { jenis: 'kode', bahasa: '', berkas: '', isi: 'wget -qO- https://get.casaos.io | sudo bash' });
}

// Entitas dibuka supaya `&lt;div&gt;` tampil sebagai kode, BUKAN hilang jadi tag.
// `&amp;lt;` harus berhenti di `&lt;` — dibuka dua kali artinya salah tampil.
{
  const p = pecahArtikel('<pre><code>&lt;div&gt; &amp;&amp; &quot;x&quot; &amp;lt;</code></pre>');
  assert.equal((p[0] as any).isi, '<div> && "x" &lt;');
}

// Artikel tanpa satu pun blok kode tetap satu potongan HTML utuh.
assert.deepEqual(pecahArtikel('<p>Hanya prosa</p>'), [{ jenis: 'html', isi: '<p>Hanya prosa</p>' }]);
assert.deepEqual(pecahArtikel(''), []);

console.log('[✓] blogWriter: semua pemeriksaan lolos');

// ── susunArtikel: daftar isi dari <h2> ─────────────────────────────────────
import { susunArtikel } from './blogWriter';
{
  const { html, sections } = susunArtikel(
    '<h2>Apa Itu CasaOS?</h2><p>a</p><h2 class="x" id="lama">Cara &amp; Syarat</h2><p>b</p><h2>Kesimpulan</h2><h2>Kesimpulan</h2>',
  );
  assert.deepEqual(sections.map((s) => [s.id, s.title]), [
    ['apa-itu-casaos', 'Apa Itu CasaOS?'],
    ['cara-syarat', 'Cara & Syarat'],
    ['kesimpulan', 'Kesimpulan'],
    ['kesimpulan-2', 'Kesimpulan'],
  ]);
  // id yang dipasang di HTML HARUS sama persis dengan yang ada di daftar —
  // itu yang membuat tombol lompat benar-benar mendarat.
  for (const s of sections) assert.match(html, new RegExp(`<h2 id="${s.id}"`));
  // id lama diganti, bukan ditumpuk; atribut lain dipertahankan.
  assert.match(html, /<h2 id="cara-syarat" class="x">/);
  assert.doesNotMatch(html, /id="lama"/);
}
assert.deepEqual(susunArtikel(''), { html: '', sections: [] });
assert.deepEqual(susunArtikel('<p>tanpa judul</p>').sections, []);
console.log('[✓] blogWriter: susunArtikel lolos');
