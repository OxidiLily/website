// Ikon dari https://dashboardicons.com (repo homarr-labs/dashboard-icons).
//
// Nilai yang DISIMPAN di kolom `icon` sengaja bukan URL, melainkan penanda
// `dashboardicon:<slug>`:
//   * kolom itu sudah lama dipakai untuk gambar unggahan (`/storage/v1/...`),
//     dan dua bentuk itu harus bisa hidup berdampingan tanpa kolom baru;
//   * origin situs ini tidak selalu sama (LAN vs Tailscale), jadi URL absolut
//     yang dipanggang ke database akan rusak bagi pembaca dari origin lain —
//     penanda slug selalu diterjemahkan ke jalur se-origin saat dirender.
//
// Katalognya ada di src/data/ikon-katalog.json (`node scripts/ikon-katalog.mjs`
// untuk menyegarkan). Berkas itu dipakai SERVER untuk memvalidasi slug sebelum
// mengunduh apa pun; berkas ini memuat sisi yang dipakai bersama oleh panel,
// situs, dan uji.
//
// Logika murni (tanpa DOM/jaringan/jam) supaya bisa diuji lewat
// `npx tsx src/lib/ikon.check.ts`.

import {tautanBersih} from './sanitasi';

/** Penanda nilai ikon dashboard di kolom `icon`. */
export const AWALAN_IKON = 'dashboardicon:';

/** Jalur tempat server menyajikan berkas SVG-nya. */
export const JALUR_IKON = '/ikon/svg/';

/** Titik masuk pencarian di server. */
export const JALUR_CARI_IKON = '/ikon/cari';

/**
 * Bentuk slug yang diterima: huruf kecil, angka, dan strip. TITIK sengaja tidak
 * ikut walau katalog dashboard-icons tidak punya satu pun slug bertitik.
 *
 * Slug ini menempel ke nama berkas dan URL yang diunduh server
 * (`/ikon/svg/<slug>.svg`). Dengan bentuk yang hanya boleh huruf/angka/strip,
 * tidak ada yang bisa ditafsirkan sebagai bagian jalur (`.` / `..` / ekstensi),
 * dan pemeriksaan bentuknya cukup satu baris.
 */
const POLA_SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** Slug ikon yang sah — dipakai server DAN klien (satu aturan, dua sisi). */
export const slugIkonSah = (slug: string): boolean => POLA_SLUG.test(slug);

/** Slug → nilai yang disimpan di database. */
export const nilaiIkon = (slug: string): string => `${AWALAN_IKON}${slug}`;

/** Nilai kolom `icon` → slug, atau null kalau bukan ikon dashboard / slugnya tidak sah. */
export const slugIkon = (nilai: string | null | undefined): string | null => {
  const teks = String(nilai ?? '').trim();
  if (!teks.toLowerCase().startsWith(AWALAN_IKON)) return null;
  const slug = teks.slice(AWALAN_IKON.length).trim().toLowerCase();
  return slugIkonSah(slug) ? slug : null;
};

/**
 * Nilai kolom `icon` apa pun bentuknya → src yang boleh dipasang di <img>.
 *
 * `null` berarti "jangan tampilkan ikon ini": pemanggil lalu jatuh ke ikon merek
 * bawaan atau logo situs. Nilai yang tidak dikenali TIDAK diteruskan apa adanya —
 * kolom ini bisa diisi dari panel, dan URL ber-skema aneh di situ berakhir
 * sebagai permintaan dari browser setiap pengunjung.
 */
export const tautanIkon = (nilai: string | null | undefined): string | null => {
  const slug = slugIkon(nilai);
  if (slug) return `${JALUR_IKON}${slug}.svg`;
  // Bukan ikon dashboard: mungkin gambar unggahan admin atau URL biasa. Skemanya
  // diperiksa pemeriksa yang sama dengan src gambar lain di situs ini.
  return tautanBersih(nilai, {dataGambar: true}) || null;
};

/** Potongan yang ditulis huruf besar semua saat membentuk label. */
const SINGKATAN = new Set([
  'ai', 'api', 'acl', 'cdn', 'cli', 'cpu', 'css', 'dns', 'ftp', 'gpu', 'gpt', 'html', 'http', 'https',
  'ide', 'iot', 'ip', 'js', 'json', 'llm', 'ml', 'nas', 'ntp', 'os', 'php', 'rest', 's3', 'smb', 'sql',
  'ssh', 'ssl', 'tls', 'ts', 'ui', 'ups', 'vm', 'vpn', 'vps', 'xml', 'yaml',
]);

/** `nginx-proxy-manager` → `Nginx Proxy Manager`, `claude-ai` → `Claude AI`. */
export const labelIkon = (slug: string): string =>
  slug
    .split(/[-_.]+/)
    .filter(Boolean)
    .map((k) => (SINGKATAN.has(k) ? k.toUpperCase() : k.charAt(0).toUpperCase() + k.slice(1)))
    .join(' ');

/** Ikon varian gelap (`-dark`)/terang (`-light`) — dipakai panel untuk memberi keterangan. */
export const varianIkon = (slug: string): 'gelap' | 'terang' | null => {
  if (slug.endsWith('-dark')) return 'gelap';
  if (slug.endsWith('-light')) return 'terang';
  return null;
};

export interface EntriKatalog {
  /** Alias/padanan nama yang bisa dicari. */
  a?: string[];
  /** Kategori dari dashboard-icons. */
  k?: string[];
  /** Slug varian gelap/terang yang sepasang dengan ikon ini. */
  w?: string[];
}

export type KatalogIkon = Record<string, EntriKatalog>;

export interface HasilCariIkon {
  slug: string;
  label: string;
  kategori: string[];
  varian: 'gelap' | 'terang' | null;
  /** Ikon persis, bukan tebakan — panel memakainya untuk menandai hasil teratas. */
  persis: boolean;
}

/**
 * Pencarian ikon: satu fungsi untuk server dan uji.
 *
 * Urutan nilainya sengaja: kecocokan slug PERSIS selalu di atas alias, dan
 * seluruh kecocokan slug di atas kategori. Admin yang mengetik "docker" ingin
 * ikon Docker, bukan 40 ikon lain yang kebetulan berkategori Docker.
 *
 * Kueri kosong mengembalikan sebagian katalog terurut abjad — itu yang dipakai
 * panel agar kotak pencarian yang masih kosong tidak terlihat seperti gagal.
 */
export const cariIkon = (katalog: KatalogIkon, kueri: string, batas = 60): HasilCariIkon[] => {
  const q = String(kueri ?? '').trim().toLowerCase();
  const qSlug = q.replace(/\s+/g, '-');
  const maks = Math.max(1, Math.min(200, Math.floor(batas) || 60));
  const nama = Object.keys(katalog);

  const skor = (slug: string, entri: EntriKatalog): number => {
    let s = 0;
    if (slug === qSlug) s = 1000;
    else if (qSlug && slug.startsWith(qSlug)) s = 800 - Math.min(200, slug.length - qSlug.length);
    else if (qSlug && slug.includes(qSlug)) s = 600 - Math.min(200, slug.length - qSlug.length);

    for (const a of entri.a ?? []) {
      const al = a.toLowerCase();
      if (al === q) s = Math.max(s, 700);
      else if (q && al.startsWith(q)) s = Math.max(s, 500);
      else if (q && al.includes(q)) s = Math.max(s, 300);
    }
    for (const k of entri.k ?? []) {
      const kl = k.toLowerCase();
      if (kl === q) s = Math.max(s, 400);
      else if (q && (kl.includes(q) || q.includes(kl))) s = Math.max(s, 150);
    }
    return s;
  };

  const hasil: { skor: number; h: HasilCariIkon }[] = [];
  for (const slug of nama) {
    const entri = katalog[slug] ?? {};
    const s = q ? skor(slug, entri) : 1;
    if (!s) continue;
    hasil.push({
      skor: s,
      h: {
        slug,
        label: labelIkon(slug),
        kategori: entri.k ?? [],
        varian: varianIkon(slug),
        persis: qSlug === slug,
      },
    });
  }

  // Skor menurun, lalu abjad: hasil dengan skor sama tidak boleh berpindah
  // urutan hanya karena urutan kunci di JSON.
  return hasil
    .sort((x, y) => y.skor - x.skor || x.h.slug.localeCompare(y.h.slug))
    .slice(0, maks)
    .map((r) => r.h);
};
