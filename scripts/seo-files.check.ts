// Pemeriksa bagian murni generator SEO. Jalankan: npx tsx scripts/seo-files.check.ts
//
// Sitemap yang salah bentuk atau berisi domain isian tidak menimbulkan error di
// mana pun — ia diterima mesin pencari lalu mengarahkan perayap ke alamat yang
// tidak ada. Karena itu penyaring domainnya diuji terpisah.
import assert from 'node:assert/strict';
import { normalkanDomain, bangunSitemap } from './seo-files';

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

console.log('[✓] seo-files: semua pemeriksaan lolos');
