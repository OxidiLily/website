// Pemeriksa kecil untuk logika yang bukan satu baris: pembuatan slug dan
// perkiraan waktu baca. Jalankan: npx tsx src/pages/admin/resources.check.ts
import assert from 'node:assert/strict';
import { RESOURCES, slugify } from './resources';

assert.equal(slugify('Halo Dunia'), 'halo-dunia');
assert.equal(slugify('  Judul   dengan  spasi ganda '), 'judul-dengan-spasi-ganda');
assert.equal(slugify('Café Ré-Design!'), 'cafe-re-design');
assert.equal(slugify('---'), '');
assert.equal(slugify('Rp1.000 / bulan'), 'rp1-000-bulan');

const save = RESOURCES.blogs.beforeSave!;
assert.equal(save({ content: '<p>satu dua tiga</p>' }).reading_time, 1, 'artikel pendek tetap 1 menit');
assert.equal(save({ content: '' }).reading_time, 1, 'isi kosong tidak boleh 0 menit');
assert.equal(save({ content: 'kata '.repeat(400) }).reading_time, 2, '400 kata = 2 menit');
assert.equal(save({ content: '<b>a</b><i>b</i>' }).reading_time, 1, 'tag tidak dihitung sebagai kata');

console.log('[ok] resources.check.ts lulus');
