// Pemeriksa sanitasi HTML. Jalankan: npx tsx src/lib/sanitasi.check.ts
//
// Ini penjaga yang menahan jalur paling langsung di situs ini: isi artikel
// disimpan admin/AI lalu disuntikkan ke DOM setiap pengunjung lewat
// `dangerouslySetInnerHTML`. Uji di bawah bukan contoh sopan — semuanya bentuk
// yang benar-benar dipakai untuk menembus sanitizer, termasuk tag yang TIDAK
// ditutup, yang tetap diurai browser walau akhir dokumen yang menutupnya.
import assert from 'node:assert/strict';
import { sanitasiArtikel, tautanAman, tautanBersih } from './sanitasi';
import { markdownKeHtml } from './markdown';

// ── Yang harus LOLOS apa adanya ───────────────────────────────────────────
assert.equal(sanitasiArtikel('<p>Halo <strong>dunia</strong></p>'), '<p>Halo <strong>dunia</strong></p>');
assert.equal(sanitasiArtikel('<h2 id="apa-itu">Apa Itu?</h2>'), '<h2 id="apa-itu">Apa Itu?</h2>');
assert.equal(sanitasiArtikel('<ul><li>satu</li><li>dua</li></ul>'), '<ul><li>satu</li><li>dua</li></ul>');
assert.equal(
  sanitasiArtikel('<pre><code class="language-ts" data-file="Terminal">const a = 1;</code></pre>'),
  '<pre><code class="language-ts" data-file="Terminal">const a = 1;</code></pre>',
  'penanda bahasa & nama berkas dipakai KodeBlok — kalau hilang, kartu kodenya rusak',
);
assert.equal(sanitasiArtikel('<p class="isi-artikel">x</p>'), '<p class="isi-artikel">x</p>');
assert.equal(
  sanitasiArtikel('<figure><img src="/logo.png" alt="Logo" width="120" loading="lazy"></figure>'),
  '<figure><img src="/logo.png" alt="Logo" width="120" loading="lazy"></figure>',
);
assert.equal(sanitasiArtikel('<blockquote><p>kutipan</p></blockquote>'), '<blockquote><p>kutipan</p></blockquote>');
assert.equal(sanitasiArtikel('<table><tr><th scope="col">A</th><td colspan="2">B</td></tr></table>'),
  '<table><tr><th scope="col">A</th><td colspan="2">B</td></tr></table>');

// Keluaran markdown WAJIB lewat tanpa satu pun perubahan: satu tag di daftar
// ini hilang berarti artikel baru tampil beda dari yang ditulis penulisnya.
{
  const md = [
    '## Judul Bagian',
    '',
    'Paragraf dengan **tebal**, *miring*, `kode`, dan [tautan](https://a.b/c).',
    '',
    '- butir satu',
    '- butir dua',
    '',
    '> kutipan',
    '',
    '```ts Terminal',
    'const a = 1;',
    '```',
  ].join('\n');
  const html = markdownKeHtml(md);
  assert.equal(sanitasiArtikel(html), html, 'HTML hasil markdown harus lolos sanitasi utuh');
  assert.match(html, /class="language-ts"/);
}

// ── Yang harus DIBERSIHKAN ────────────────────────────────────────────────

// 1. Tag yang isinya ikut dibuang.
for (const jahat of [
  '<script>alert(1)</script>',
  '<script src="//jahat.example/x.js"></script>',
  '<SCRIPT>alert(1)</SCRIPT>',
  '<style>body{background:url(javascript:alert(1))}</style>',
  '<iframe src="//jahat.example"></iframe>',
  '<object data="//jahat.example"></object>',
  '<embed src="//jahat.example">',
  '<svg><script>alert(1)</script></svg>',
  '<form action="//jahat.example"><input name="x"></form>',
  '<title>judul dokumen</title>',
  '<meta http-equiv="refresh" content="0;url=//jahat.example">',
]) {
  const hasil = sanitasiArtikel(`<p>sebelum</p>${jahat}<p>sesudah</p>`);
  assert.doesNotMatch(hasil, /alert|jahat\.example|<script|<style|<iframe|<object|<embed|<svg|<form|<input|<title|<meta/i,
    `tidak boleh ada sisa bahaya dari ${jahat}`);
  assert.match(hasil, /<p>sebelum<\/p>/);
  assert.match(hasil, /<p>sesudah<\/p>/, 'isi setelah tag berbahaya tidak boleh ikut terhapus');
}

// 2. Atribut event handler & style.
assert.equal(sanitasiArtikel('<img src="x" onerror="alert(1)">'), '<img src="x">');
assert.equal(sanitasiArtikel('<p onclick="alert(1)">x</p>'), '<p>x</p>');
assert.equal(sanitasiArtikel('<div style="background:url(javascript:alert(1))">x</div>'), '<div>x</div>');
assert.equal(sanitasiArtikel('<img src="x" srcset="//jahat.example 2x">'), '<img src="x">');
assert.equal(sanitasiArtikel('<img src="x" ONERROR=alert(1)>'), '<img src="x">');

// 3. Skema URL berbahaya — termasuk bentuk yang menyamar.
for (const href of [
  'javascript:alert(1)',
  'JaVaScRiPt:alert(1)',
  'java\tscript:alert(1)',
  'java\nscript:alert(1)',
  'jav&#x61;script:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'vbscript:msgbox(1)',
  'file:///etc/passwd',
]) {
  const hasil = sanitasiArtikel(`<a href="${href}">klik</a>`);
  assert.equal(hasil, '<a>klik</a>', `href harus dibuang: ${href}`);
}
assert.equal(sanitasiArtikel('<img src="javascript:alert(1)">'), '<img>');
assert.equal(sanitasiArtikel('<img src="data:text/html,<script>alert(1)</script>">'), '<img>',
  'data: hanya boleh untuk gambar, bukan dokumen');

// 4. Tag TIDAK ditutup. Browser tetap mengurainya, jadi sanitizer tidak boleh
//    bergantung pada adanya `>`.
{
  const hasil = sanitasiArtikel('<p>awal</p><img src=x onerror=alert(1)');
  // Browser tetap mengurai tag tak tertutup di akhir dokumen sebagai tag
  // lengkap. Karena itu sisanya harus jadi TEKS ter-escape — bukan tag, dan
  // bukan pula dihapus diam-diam.
  assert.equal(hasil, '<p>awal</p>&lt;img src=x onerror=alert(1)');
}
{
  // `>` berikutnya milik tag lain — atribut jahat tidak boleh ikut tercetak.
  const hasil = sanitasiArtikel('<img src=x onerror=alert(1) <p>halo</p>');
  assert.doesNotMatch(hasil, /onerror|alert/);
  assert.match(hasil, /halo/);
}
{
  const hasil = sanitasiArtikel('5 < 6 dan 7 > 4');
  assert.equal(hasil, '5 &lt; 6 dan 7 > 4', 'kurang-dari telanjang jadi teks, bukan tag');
}

// 5. Komentar (termasuk komentar bersyarat) dibuang utuh.
assert.equal(sanitasiArtikel('<p>a</p><!-- <script>alert(1)</script> --><p>b</p>'), '<p>a</p><p>b</p>');

// 6. Tag tak dikenal: tagnya hilang, isinya tetap.
assert.equal(sanitasiArtikel('<blink>halo</blink>'), 'halo');
assert.equal(sanitasiArtikel('<html><head><title>t</title></head><body><p>x</p></body></html>'), '<p>x</p>');
assert.equal(sanitasiArtikel('<>aneh</>'), '&lt;>aneh&lt;/>');

// 7. target="_blank" tanpa noopener diberi, nilai target lain ditolak.
assert.equal(sanitasiArtikel('<a href="https://a.b" target="_blank">x</a>'),
  '<a href="https://a.b" target="_blank" rel="noopener noreferrer">x</a>');
assert.equal(sanitasiArtikel('<a href="https://a.b" target="_top">x</a>'), '<a href="https://a.b">x</a>');
assert.equal(sanitasiArtikel('<a href="https://a.b" target="_blank" rel="noreferrer noopener">x</a>'),
  '<a href="https://a.b" target="_blank" rel="noreferrer noopener">x</a>');

// 8. Nilai atribut yang tidak berbentuk ditolak, bukan dipotong.
assert.equal(sanitasiArtikel('<p class="a<b>c">x</p>'), '<p>x</p>');
assert.equal(sanitasiArtikel('<h2 id="a b">x</h2>'), '<h2>x</h2>');
assert.equal(sanitasiArtikel('<img width="99999">'), '<img>');
assert.equal(sanitasiArtikel('<p title="bebas &amp; aman">x</p>'), '<p title="bebas &amp; aman">x</p>');

// 9. Entitas yang sudah ada tidak di-escape dua kali.
assert.equal(sanitasiArtikel('<p>5 &lt; 6 &amp; 7</p>'), '<p>5 &lt; 6 &amp; 7</p>');

// 10. Idempoten — IsiKonten bisa merender ulang isi yang sama.
{
  const contoh = [
    '<p>a</p><script>alert(1)</script><img src=x onerror=alert(1)',
    '<div style="x"><a href="javascript:1">y</a></div>',
    '<p>5 &lt; 6</p>',
  ];
  for (const c of contoh) {
    const sekali = sanitasiArtikel(c);
    assert.equal(sanitasiArtikel(sekali), sekali, `sanitasi harus idempoten: ${c}`);
  }
}

// 11. Jangan mengubah masukan yang tidak masuk akal menjadi crash.
for (const aneh of ['', '<', '</', '<p', '<!--', '<a href="', '<p>a</p>'.repeat(50)]) {
  assert.equal(typeof sanitasiArtikel(aneh), 'string');
}

// ── tautanAman ────────────────────────────────────────────────────────────
for (const ok of ['https://a.b/c', 'http://a.b', 'mailto:a@b.c', 'tel:+62', '/relatif', '#jangkar', '?q=1', './x', '../x']) {
  assert.equal(tautanAman(ok), true, `${ok} harus aman`);
}
for (const tolak of ['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,x', 'vbscript:x', 'file:///x', '', '   ']) {
  assert.equal(tautanAman(tolak), false, `${tolak} harus ditolak`);
}
assert.equal(tautanAman('data:image/png;base64,iVBORw0KGgo=', { dataGambar: true }), true);
assert.equal(tautanAman('data:text/html;base64,PHNjcmlwdD4=', { dataGambar: true }), false);
assert.equal(tautanBersih('  https://a.b/c  '), 'https://a.b/c');
assert.equal(tautanBersih('javascript:alert(1)'), '');
assert.equal(tautanBersih(undefined), '');
assert.equal(tautanBersih(null), '');

console.log('[✓] sanitasi: semua pemeriksaan lolos');
