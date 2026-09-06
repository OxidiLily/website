// Pemeriksa keterkaitan panel ↔ halaman publik.
// Jalankan: npx tsx src/data/content.check.ts
//
// Dua hal di bawah ini gagal TANPA pesan error apa pun kalau salah, jadi
// keduanya tidak bisa diandalkan pada pembacaan mata:
//
//   1. Medan di panel yang kuncinya tidak pernah diseed/tidak punya cadangan.
//      Adminnya mengisi, menekan Simpan, mendapat "Tersimpan" — dan halaman
//      publik tetap menampilkan teks lama.
//   2. Hasil pencarian yang menunjuk jangkar yang tidak ada di halaman mana
//      pun. Mengkliknya tidak melempar error, cuma tidak terjadi apa-apa —
//      persis keluhan yang memulai perubahan ini.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PAGE_EDITORS, SITE_KEYS } from '../pages/admin/pageContent';
import { defaultSettings } from './siteData';
import { searchIndex } from './searchIndex';

const akar = new URL('../..', import.meta.url).pathname;

// ── 1. Tiap kunci di panel punya cadangan DAN seed ───────────────────────
const skema = readFileSync(join(akar, 'supabase/schema.sql'), 'utf8');

const kunciPanel = Object.values(PAGE_EDITORS).flatMap((p) =>
  p.cards.flatMap((c) => c.fields.map((f) => f.key)),
);

assert.ok(kunciPanel.length > 40, `kunci panel terlalu sedikit: ${kunciPanel.length}`);

for (const kunci of kunciPanel) {
  assert.ok(
    kunci in defaultSettings,
    `kunci "${kunci}" bisa disunting di panel tapi tidak punya nilai cadangan di defaultSettings ` +
      '(src/data/siteData.ts) — halaman akan menampilkan undefined saat database belum menjawab',
  );
  assert.ok(
    skema.includes(`'${kunci}'`),
    `kunci "${kunci}" bisa disunting di panel tapi tidak diseed di supabase/schema.sql`,
  );
}

// Sebaliknya: cadangan yang tak pernah diseed berarti kuncinya tidak akan
// pernah terbaca dari database, jadi suntingannya tidak berpengaruh.
for (const kunci of Object.keys(defaultSettings)) {
  assert.ok(
    skema.includes(`'${kunci}'`),
    `defaultSettings memuat "${kunci}" yang tidak ada di supabase/schema.sql`,
  );
}

// ── 2. Tiap jangkar hasil pencarian benar-benar ada di halaman ───────────
const berkasTsx = (dir: string): string[] =>
  readdirSync(join(akar, dir), { withFileTypes: true }).flatMap((d) =>
    d.isDirectory()
      ? berkasTsx(join(dir, d.name))
      : d.name.endsWith('.tsx')
        ? [join(akar, dir, d.name)]
        : [],
  );

const sumber = berkasTsx('src').map((f) => readFileSync(f, 'utf8')).join('\n');

const jangkarStatis = searchIndex
  .filter((i) => i.actionPayload?.type === 'page')
  .map((i) => ({ id: i.id, sectionId: i.actionPayload?.sectionId }));

for (const { id, sectionId } of jangkarStatis) {
  assert.ok(sectionId, `entri pencarian "${id}" tidak menyebut sectionId — kliknya tidak berefek`);
  assert.ok(
    sumber.includes(`id="${sectionId}"`),
    `entri pencarian "${id}" menunjuk jangkar "${sectionId}" yang tidak ada di satu pun berkas .tsx`,
  );
}

// ── 3. Tidak ada setelan yang tak bisa disunting dari panel ──────────────
// Kebalikan dari pemeriksaan pertama: kunci yang punya cadangan tapi tidak
// muncul di panel mana pun adalah teks yang tampil di situs tanpa ada cara
// mengubahnya — persis keluhan yang memulai perubahan ini.
const bisaDisunting = new Set([...kunciPanel, ...SITE_KEYS.map((f) => f.key)]);
const takTerjangkau = Object.keys(defaultSettings).filter((k) => !bisaDisunting.has(k));
assert.deepEqual(
  takTerjangkau,
  [],
  `kunci berikut menggerakkan situs tapi tidak ada medannya di panel: ${takTerjangkau.join(', ')}`,
);

// ── 4. Halaman publik tidak lagi memuat teks yang dipatri ────────────────
// Menangkap teks yang lolos masuk lagi ke .tsx alih-alih ke `settings`.
// Daftar kecuali berisi hal yang memang BUKAN teks: lambang tombol, satuan,
// dan tanda baca yang jadi bagian tata letak.
const HALAMAN_PUBLIK = [
  'src/App.tsx',
  'src/components/Navbar.tsx',
  'src/components/Footer.tsx',
  'src/components/AboutMe.tsx',
  'src/components/ToolsAndStack.tsx',
  'src/components/GlobalSearchModal.tsx',
  'src/components/AiAssistantModal.tsx',
  'src/components/BlogPostDetail.tsx',
  'src/pages/HomePage.tsx',
  'src/pages/AboutPage.tsx',
  'src/pages/ContactPage.tsx',
  'src/pages/BlogPage.tsx',
  'src/pages/ProjectPage.tsx',
];

const DIKECUALIKAN = new Set(['ESC', 'K', 'Live', 'OxidiLily']);

const membandel: string[] = [];
for (const berkas of HALAMAN_PUBLIK) {
  const isi = readFileSync(join(akar, berkas), 'utf8');
  for (const [, teks] of isi.matchAll(/>\s*([A-Za-z][A-Za-z0-9 ,.'!?&:/-]{3,80}?)\s*</g)) {
    const bersih = teks.trim();
    if (DIKECUALIKAN.has(bersih)) continue;
    // Satu kata tanpa spasi umumnya nama komponen/atribut yang terpotong regex.
    if (!bersih.includes(' ')) continue;
    membandel.push(`${berkas}: "${bersih}"`);
  }
}
// Teks juga bisa bersembunyi DI DALAM ekspresi JSX, bukan di antara tag:
// nilai cadangan (`{post.actionLabel || 'Get Started'}`) dan atribut yang
// dibaca pembaca layar. Bentuk ini tidak terlihat oleh pemeriksaan di atas,
// dan justru di situlah kalimat terakhir yang masih dipatri ditemukan.
//
// Aturan pemilahnya: atribut teks selalu diperiksa, sedangkan literal
// cadangan hanya dihitung kalau berbentuk kalimat — diawali huruf besar dan
// memuat huruf kecil. Itu memisahkannya dari kelas CSS (`p-0 pb-0`), rute
// (`/admin/login`), ukuran (`1040px`), dan id bagian, yang semuanya memang
// bukan teks untuk dibaca orang.
const ATRIBUT_TEKS = /(?:placeholder|title|alt|aria-label)="([^"]{2,80})"/g;
const CADANGAN = /(?:\|\|\s*|\?\s*)'([A-Z][^']{1,69})'/g;
const kalimat = (v: string) => /^[A-Z]/.test(v) && /[a-z]/.test(v);

for (const berkas of HALAMAN_PUBLIK) {
  for (const baris of readFileSync(join(akar, berkas), 'utf8').split('\n')) {
    const t = baris.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) continue;
    for (const [, v] of baris.matchAll(ATRIBUT_TEKS)) {
      if (/[A-Za-z]{2}/.test(v)) membandel.push(`${berkas}: atribut "${v}"`);
    }
    for (const [, v] of baris.matchAll(CADANGAN)) {
      if (kalimat(v)) membandel.push(`${berkas}: cadangan "${v}"`);
    }
  }
}

assert.deepEqual(
  membandel,
  [],
  `teks berikut masih dipatri di halaman publik, seharusnya lewat settings:\n  ${membandel.join('\n  ')}`,
);

console.log(
  `[ok] content.check.ts lulus — ${kunciPanel.length} kunci panel, ` +
    `${jangkarStatis.length} jangkar pencarian, ${HALAMAN_PUBLIK.length} berkas publik bersih`,
);
