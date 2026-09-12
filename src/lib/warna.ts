/**
 * Warna merek untuk latar gelap, atau putih kalau warnanya terlalu gelap.
 *
 * Simple Icons menyimpan warna resmi tiap merek; GitHub, Vercel, Next.js,
 * Cursor, dan Bun resminya hitam — di kartu hitam ia lenyap. Ambangnya
 * luminansi relatif (rumus WCAG): di bawahnya dipakai putih.
 * Diuji lewat `npx tsx src/lib/warna.check.ts`.
 */
export function warnaIkon(hex: string, latarGelap = true): string {
  const bersih = hex.replace(/^#/, '');
  const n = parseInt(bersih, 16);
  if (Number.isNaN(n) || bersih.length !== 6) return latarGelap ? '#ffffff' : '#000000';
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminansi = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (latarGelap) return luminansi < 0.08 ? '#ffffff' : `#${bersih}`;
  return luminansi > 0.85 ? '#000000' : `#${bersih}`;
}
