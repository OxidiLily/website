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
import { PAGE_EDITORS } from '../pages/admin/pageContent';
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

console.log(
  `[ok] content.check.ts lulus — ${kunciPanel.length} kunci panel, ${jangkarStatis.length} jangkar pencarian`,
);
