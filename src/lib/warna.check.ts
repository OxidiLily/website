// Pemeriksa warna ikon merek. Jalankan: npx tsx src/lib/warna.check.ts
import assert from 'node:assert/strict';
import { warnaIkon } from './warna';

// Merek hitam → putih di latar gelap; yang berwarna tetap warnanya.
for (const gelap of ['000000', '181717', '0A0A0A']) assert.equal(warnaIkon(gelap), '#ffffff', gelap);
for (const warna of ['F24E1E', '3178C6', '61DAFB', 'F7DF1E', '777BB4', '4169E1', 'FF2D20']) {
  assert.equal(warnaIkon(warna), `#${warna}`, warna);
}
// Biru tua PostgreSQL/PHP tidak boleh ikut jadi putih — masih terbaca di hitam.
assert.equal(warnaIkon('4169E1'), '#4169E1');
// Nilai rusak tidak melempar, jatuh ke warna yang pasti terlihat.
assert.equal(warnaIkon('zz'), '#ffffff');
assert.equal(warnaIkon('#F03C2E'), '#F03C2E', 'tanda pagar di depan diterima');
console.log('[✓] warna: semua pemeriksaan lolos');
