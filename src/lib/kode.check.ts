// Pemeriksa pewarna sintaks. Jalankan: npx tsx src/lib/kode.check.ts
//
// Yang diuji di sini adalah dua hal yang paling gampang salah dan paling
// terlihat di layar: batas token (komentar vs URL di dalam string) dan
// pembagian baris (nomor baris meleset satu = seluruh gutter salah).
import assert from 'node:assert/strict';
import { barisToken, labelBahasa, tokenKode } from './kode';

const gabung = (kode: string, bahasa = '') => tokenKode(kode, bahasa).map((t) => t.teks).join('');
const jenisDari = (kode: string, bahasa = '') =>
  tokenKode(kode, bahasa).filter((t) => t.jenis !== 'polos').map((t) => [t.jenis, t.teks]);

// Tidak boleh ada satu karakter pun yang hilang atau berubah urutan.
for (const [kode, bahasa] of [
  ['const x = 1; // catatan', 'ts'],
  ['# pasang\nwget -qO- https://get.casaos.io | sudo bash', 'bash'],
  ['def f():\n    return "x"  # kembali', 'python'],
  ['', 'ts'],
] as [string, string][]) {
  assert.equal(gabung(kode, bahasa), kode, `token hilang untuk: ${kode}`);
}

// Kata kunci, angka, string, komentar dikenali di gaya C.
assert.deepEqual(jenisDari("const n = 42; // hai", 'ts'), [
  ['kunci', 'const'],
  ['angka', '42'],
  ['komentar', '// hai'],
]);

// `//` DI DALAM string adalah URL, bukan komentar. Ini yang paling sering
// merusak tampilan: sisa barisnya ikut hijau sampai akhir.
assert.deepEqual(jenisDari('fetch("https://a.b/c") // pergi', 'ts'), [
  ['teks', '"https://a.b/c"'],
  ['komentar', '// pergi'],
]);

// `#` hanya komentar di keluarga shell/python. Di TS ia bukan apa-apa,
// jadi warna heksa di CSS/TS tidak berubah jadi komentar sebaris penuh.
assert.deepEqual(jenisDari('# pasang dulu', 'bash'), [['komentar', '# pasang dulu']]);
// Nama program bukan kata kunci: `sudo` dan `wget` harus sama-sama polos,
// supaya tidak ada satu kata biru sendirian di tengah baris perintah.
assert.deepEqual(jenisDari('wget -qO- https://x | sudo bash', 'bash'), []);
assert.deepEqual(jenisDari('for f in *; do echo "$f"; done', 'bash'), [
  ['kunci', 'for'], ['kunci', 'in'], ['kunci', 'do'], ['teks', '"$f"'], ['kunci', 'done'],
]);
assert.deepEqual(jenisDari('const c = "#fff";', 'ts'), [['kunci', 'const'], ['teks', '"#fff"']]);

// Komentar blok melintasi baris: harus dikenali utuh dulu, baru dipotong per
// baris. Tokenisasi per baris akan memecahnya jadi sampah.
{
  const b = barisToken('/* satu\n   dua */\nlet a;', 'js');
  assert.equal(b.length, 3);
  assert.equal(b[0][0].jenis, 'komentar');
  assert.equal(b[1][0].jenis, 'komentar');
  assert.equal(b[2][0].jenis, 'kunci');
}

// Jumlah baris = jumlah '\n' + 1, termasuk baris kosong di tengah. Meleset di
// sini berarti nomor di gutter tidak cocok dengan kodenya.
assert.equal(barisToken('a\n\nb', 'ts').length, 3);
assert.equal(barisToken('satu baris', 'ts').length, 1);
assert.deepEqual(barisToken('a\n\nb', 'ts')[1], []);

// Lencana bahasa: dari class kalau ada, dari ekstensi berkas kalau tidak.
assert.equal(labelBahasa('typescript'), 'TS');
assert.equal(labelBahasa('', 'docker-compose.yml'), 'YML');
assert.equal(labelBahasa('bash'), 'SH');
assert.equal(labelBahasa(''), 'CODE');

console.log('[✓] kode: semua pemeriksaan lolos');

// Artikel warisan: <pre><code> telanjang berisi perintah → dikenali shell.
import { tebakBahasa } from './kode';
assert.equal(tebakBahasa('wget -qO- https://get.casaos.io | sudo bash'), 'bash');
assert.equal(tebakBahasa('$ npm install'), 'bash');
assert.equal(tebakBahasa('const a = 1;'), '');
// Penanda dari penulis selalu menang atas tebakan.
assert.equal(tebakBahasa('sudo apt install', 'python'), 'python');
console.log('[✓] kode: tebakan bahasa lolos');
