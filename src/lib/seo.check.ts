// Pemeriksa bagian MURNI dari lib/seo. Jalankan: npx tsx src/lib/seo.check.ts
//
// Yang diuji di sini hanya yang tidak menyentuh DOM. Salah di sini tidak
// menjatuhkan situs — ia diam-diam mengirim deskripsi terpotong atau data
// terstruktur yang ditolak mesin pencari, dan itu baru ketahuan berbulan kemudian.
import assert from 'node:assert/strict';
import { ringkasUntukMeta, jsonLdArtikel, tanggalIso } from './seo';

// Tag HTML dibuang, spasi dirapatkan.
assert.equal(ringkasUntukMeta('<p>Halo   <strong>dunia</strong></p>'), 'Halo dunia');
assert.equal(ringkasUntukMeta('  banyak\n\nspasi  '), 'banyak spasi');

// Pendek dari batas -> apa adanya, tanpa elipsis.
assert.equal(ringkasUntukMeta('Pendek saja'), 'Pendek saja');

// Panjang -> dipotong DI BATAS KATA, tidak di tengah kata.
const panjang = 'kata '.repeat(60).trim();
const hasil = ringkasUntukMeta(panjang);
assert.ok(hasil.length <= 161, `panjang hasil ${hasil.length}`);
assert.ok(hasil.endsWith('…'));
assert.ok(!/kat…$/.test(hasil), 'tidak boleh memotong di tengah kata');

// Tanda baca menggantung sebelum elipsis dibuang.
assert.ok(!/[,;:]…$/.test(ringkasUntukMeta('a'.repeat(100) + ', ' + 'b'.repeat(100))));

// Satu kata raksasa tanpa batas kata -> tetap mengembalikan isi, bukan kosong.
const satuKata = ringkasUntukMeta('x'.repeat(300));
assert.ok(satuKata.length > 10 && satuKata.endsWith('…'));

// Masukan kosong tidak melempar.
assert.equal(ringkasUntukMeta(''), '');
assert.equal(ringkasUntukMeta(undefined as unknown as string), '');

// Tanggal
assert.equal(tanggalIso(undefined), null);
assert.equal(tanggalIso('bukan tanggal'), null);
assert.equal(tanggalIso('2026-09-09')?.slice(0, 10), '2026-09-09');

// JSON-LD: bentuk minimum yang sah.
const a = jsonLdArtikel({
  judul: 'CasaOS', deskripsi: '<p>Sistem operasi server rumahan.</p>',
  url: 'https://situs.test/blog/casaos', penulis: 'tekad', namaSitus: 'OxidiLily',
  terbit: '2026-09-09',
});
assert.equal(a['@type'], 'Article');
assert.equal(a.headline, 'CasaOS');
assert.equal(a.description, 'Sistem operasi server rumahan.');
assert.equal((a.mainEntityOfPage as any)['@id'], 'https://situs.test/blog/casaos');
assert.equal((a.author as any).name, 'tekad');
assert.ok(typeof a.datePublished === 'string');
// dateModified jatuh ke datePublished saat tak ada tanggal ubah.
assert.equal(a.dateModified, a.datePublished);
// Tanggal tak terbaca TIDAK boleh ikut sebagai field kosong.
const b = jsonLdArtikel({ judul: 'x', deskripsi: 'y', url: 'z', penulis: 'p', namaSitus: 's', terbit: 'ngawur' });
assert.ok(!('datePublished' in b), 'tanggal tak terbaca harus dihilangkan, bukan dikirim kosong');
assert.ok(!('image' in b), 'gambar kosong tidak boleh jadi field');
// Harus bisa diserialisasi — inilah yang benar-benar dipasang ke halaman.
assert.doesNotThrow(() => JSON.parse(JSON.stringify(a)));

console.log('[✓] seo: semua pemeriksaan lolos');
