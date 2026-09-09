// Pemeriksa bagian murni generator SEO. Jalankan: npx tsx scripts/seo-files.check.ts
//
// Sitemap yang salah bentuk atau berisi domain isian tidak menimbulkan error di
// mana pun — ia diterima mesin pencari lalu mengarahkan perayap ke alamat yang
// tidak ada. Karena itu penyaring domainnya diuji terpisah.
import assert from 'node:assert/strict';
import { normalkanDomain, bangunSitemap, htmlArtikel, escAttr } from './seo-files';

// Domain tanpa skema dilengkapi https.
assert.equal(normalkanDomain('portfolio-atelier.design'), 'https://portfolio-atelier.design');
assert.equal(normalkanDomain('https://situs.test/'), 'https://situs.test');
assert.equal(normalkanDomain('http://situs.test'), 'http://situs.test');
assert.equal(normalkanDomain('  situs.test  '), 'https://situs.test');

// Yang BUKAN domain publik harus ditolak, bukan dipaksa jadi URL.
assert.equal(normalkanDomain(''), null);
assert.equal(normalkanDomain('   '), null);
assert.equal(normalkanDomain('localhost'), null, 'localhost bukan domain publik');
assert.equal(normalkanDomain('belum diisi'), null, 'teks isian harus ditolak');

// Sitemap: XML yang sah dan memuat halaman tetap + artikel.
const xml = bangunSitemap('https://situs.test', ['casaos', 'halo-dunia'], { casaos: '2026-09-09' });
assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
assert.ok(xml.includes('<loc>https://situs.test/</loc>'));
assert.ok(xml.includes('<loc>https://situs.test/blog/casaos</loc>'));
assert.ok(xml.includes('<lastmod>2026-09-09</lastmod>'));
// Artikel tanpa tanggal tidak boleh memancarkan <lastmod> kosong.
assert.ok(!xml.includes('<lastmod></lastmod>'));
assert.equal(xml.trimEnd().endsWith('</urlset>'), true);
// Tiap <url> punya pasangan penutup.
assert.equal((xml.match(/<url>/g) ?? []).length, (xml.match(/<\/url>/g) ?? []).length);
assert.equal((xml.match(/<url>/g) ?? []).length, 7, '5 halaman tetap + 2 artikel');

// Slug dengan karakter aneh di-encode, tidak merusak XML.
assert.ok(bangunSitemap('https://situs.test', ['a b']).includes('/blog/a%20b'));

// Tanpa artikel pun sitemap tetap sah.
assert.ok(bangunSitemap('https://situs.test', []).includes('</urlset>'));

// ── htmlArtikel: head statis per artikel ────────────────────────────────
const KERANGKA = [
  '<!doctype html>', '<html lang="id">', '<head>',
  '<title>OxidiLily — Portfolio</title>',
  '<meta name="description" content="deskripsi situs" />',
  '<meta property="og:title" content="OxidiLily" />',
  '<meta property="og:description" content="deskripsi situs" />',
  '<meta property="og:type" content="website" />',
  '<link rel="canonical" href="/" />',
  '</head>', '<body><div id="root"></div></body>', '</html>',
].join('\n');

const html = htmlArtikel(KERANGKA, 'https://situs.test',
  { slug: 'casaos', title: 'CasaOs', content: '<p>Server rumahan ringan.</p>', author: 'tekad',
    created_at: '2026-09-09T03:00:00Z', updated_at: '2026-09-09T04:00:00Z', meta: null },
  'OxidiLily');

assert.ok(html.includes('<title>CasaOs — OxidiLily</title>'), 'judul harus diganti');
assert.ok(!html.includes('OxidiLily — Portfolio'), 'judul lama tidak boleh tersisa');
assert.ok(html.includes('content="Server rumahan ringan."'), 'deskripsi dari isi artikel');
assert.ok(html.includes('<meta property="og:type" content="article" />') ||
          /og:type["'] content=["']article/.test(html), 'og:type jadi article');
assert.ok(html.includes('href="https://situs.test/blog/casaos"'), 'canonical per artikel');
// og:url dan twitter:* belum ada di kerangka -> harus DISISIPKAN, bukan hilang.
assert.ok(/og:url["'] content=["']https:\/\/situs\.test\/blog\/casaos/.test(html), 'og:url disisipkan');
assert.ok(html.includes('twitter:title'), 'twitter:title disisipkan');
// Hanya SATU canonical, tidak menumpuk.
assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
// JSON-LD tertanam dan sah.
// id wajib sama dengan ID_JSONLD di src/lib/seo.ts, supaya blok statis DIGANTI
// runtime, bukan ditemani blok kedua.
const m = html.match(/<script id="jsonld-halaman" type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert.ok(m, 'JSON-LD harus ada');
const ld = JSON.parse(m![1].replace(/\\u003c/g, '<'));
assert.equal(ld['@type'], 'Article');
assert.equal(ld.headline, 'CasaOs');
assert.equal(ld.author.name, 'tekad');
// Tidak boleh ada '<' mentah di dalam <script> — itu bisa menutupnya lebih awal.
assert.ok(!m![1].includes('<'), 'karakter < di JSON-LD wajib di-escape');

// Kutip dan tanda & di judul tidak boleh merusak atribut.
const nakal = htmlArtikel(KERANGKA, 'https://situs.test',
  { slug: 'x', title: 'A "B" & <C>', content: 'isi', meta: null }, 'S');
assert.ok(nakal.includes('&quot;B&quot;'), 'kutip di-escape');
assert.ok(nakal.includes('&amp;'), 'ampersand di-escape');
assert.ok(!/content="A "B"/.test(nakal), 'atribut tidak boleh pecah');
assert.equal(escAttr('a<b>c&d"e'), 'a&lt;b&gt;c&amp;d&quot;e');

// meta.excerpt menang atas content.
const pakaiExcerpt = htmlArtikel(KERANGKA, 'https://s.test',
  { slug: 'y', title: 'Y', content: 'ISI PANJANG', meta: { excerpt: 'RINGKASAN' } }, 'S');
assert.ok(pakaiExcerpt.includes('content="RINGKASAN"'));

console.log('[✓] seo-files: semua pemeriksaan lolos');
