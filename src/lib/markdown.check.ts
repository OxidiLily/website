// Pemeriksa pengubah Markdown. Jalankan: npx tsx src/lib/markdown.check.ts
import assert from 'node:assert/strict';
import { markdownKeHtml, sebaris } from './markdown';

// Blok dasar — masing-masing jadi elemen yang sudah dikenal CSS .isi-artikel.
assert.equal(markdownKeHtml('## Apa Itu CasaOS?'), '<h2>Apa Itu CasaOS?</h2>');
assert.equal(markdownKeHtml('# Satu pagar'), '<h2>Satu pagar</h2>', '<h1> milik judul halaman');
assert.equal(markdownKeHtml('### Sub'), '<h3>Sub</h3>');
assert.equal(markdownKeHtml('Paragraf satu.\nmasih satu.\n\nParagraf dua.'), '<p>Paragraf satu.\nmasih satu.</p>\n<p>Paragraf dua.</p>');
assert.equal(markdownKeHtml('- a\n- b\n* c'), '<ul><li>a</li><li>b</li><li>c</li></ul>');
assert.equal(markdownKeHtml('1. a\n2. b\n3) c'), '<ol><li>a</li><li>b</li><li>c</li></ol>');
assert.equal(markdownKeHtml('> kutip\n> lanjut'), '<blockquote><p>kutip\nlanjut</p></blockquote>');

// Pagar kode: bahasa + nama berkas masuk ke atribut yang dibaca KodeBlok,
// isinya di-escape supaya `<div>` di dalam kode tampil, bukan jadi tag.
assert.equal(
  markdownKeHtml('```ts use-theme.ts\nconst a = "<div>";\n```'),
  '<pre><code class="language-ts" data-file="use-theme.ts">const a = &quot;&lt;div&gt;&quot;;</code></pre>',
);
assert.equal(markdownKeHtml('```bash\nsudo apt update\n```'), '<pre><code class="language-bash">sudo apt update</code></pre>');
assert.equal(markdownKeHtml('```\nx\n```'), '<pre><code>x</code></pre>');
assert.match(markdownKeHtml('```ts title="a.ts"\nx\n```'), /data-file="a\.ts"/);
// Pagar tanpa penutup: sisa dokumen jadi kode, bukan paragraf — dan tidak berputar.
assert.equal(markdownKeHtml('```\nsatu\ndua'), '<pre><code>satu\ndua</code></pre>');
// Baris `- ` atau `#` DI DALAM pagar bukan daftar/judul.
assert.equal(markdownKeHtml('```\n- bukan daftar\n# bukan judul\n```'), '<pre><code>- bukan daftar\n# bukan judul</code></pre>');

// Sebaris.
assert.equal(sebaris('a **tebal** b *miring* c `kode`'), 'a <strong>tebal</strong> b <em>miring</em> c <code>kode</code>');
assert.equal(sebaris('`*bukan* miring`'), '<code>*bukan* miring</code>', 'penekanan tidak menyentuh isi kode');
assert.equal(sebaris('snake_case_ini tetap'), 'snake_case_ini tetap', 'garis bawah bukan penekanan');
assert.equal(sebaris('2 * 3 * 4'), '2 * 3 * 4', 'bintang perkalian bukan penekanan');
assert.equal(sebaris('[docs](https://a.b/c)'), '<a href="https://a.b/c" target="_blank" rel="noreferrer noopener">docs</a>');
assert.equal(sebaris('[x](javascript:alert(1))'), '[x](javascript:alert(1))', 'skema berbahaya tetap teks');

// HTML yang diketik penulis TIDAK dijalankan — dilepas jadi teks.
assert.equal(markdownKeHtml('<script>alert(1)</script> aman'), '<p>&lt;script&gt;alert(1)&lt;/script&gt; aman</p>');
assert.equal(markdownKeHtml('A & B'), '<p>A &amp; B</p>');

// Teks polos tanpa penanda apa pun (artikel warisan) tetap jadi paragraf.
assert.equal(markdownKeHtml('Hanya kalimat.'), '<p>Hanya kalimat.</p>');
assert.equal(markdownKeHtml(''), '');
assert.equal(markdownKeHtml('\r\n## A\r\nb'), '<h2>A</h2>\n<p>b</p>', 'CRLF dari Windows');

// Contoh utuh seperti keluaran model.
const contoh = [
  '## Apa Itu CasaOS?',
  '',
  'CasaOS adalah **sistem operasi** untuk homelab.',
  '',
  '### Pasang',
  '',
  '1. Siapkan Debian',
  '2. Jalankan:',
  '',
  '```bash Terminal',
  'wget -qO- https://get.casaos.io | sudo bash',
  '```',
  '',
  '## Sumber',
  '',
  '- [Wiki CasaOS](https://wiki.casaos.io) — dokumentasi resmi',
].join('\n');
const html = markdownKeHtml(contoh);
assert.match(html, /^<h2>Apa Itu CasaOS\?<\/h2>\n<p>CasaOS adalah <strong>sistem operasi<\/strong>/);
assert.match(html, /<h3>Pasang<\/h3>\n<ol><li>Siapkan Debian<\/li><li>Jalankan:<\/li><\/ol>/);
assert.match(html, /<pre><code class="language-bash" data-file="Terminal">wget -qO- https:\/\/get\.casaos\.io \| sudo bash<\/code><\/pre>/);
assert.match(html, /<h2>Sumber<\/h2>\n<ul><li><a href="https:\/\/wiki\.casaos\.io"[^>]*>Wiki CasaOS<\/a> — dokumentasi resmi<\/li><\/ul>$/);

console.log('[✓] markdown: semua pemeriksaan lolos');
