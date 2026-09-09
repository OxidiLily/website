// Menulis dist/sitemap.xml dan melengkapi dist/robots.txt setelah `vite build`.
//
// Kenapa saat build, bukan berkas statis di public/: daftar artikel hidup di
// database dan domainnya diatur di panel (`site_website`). Berkas statis akan
// basi diam-diam setiap kali artikel ditambah.
//
// GAGAL-LUNAK: kalau database tak terjangkau atau domainnya belum diisi, skrip
// ini memberi peringatan lalu keluar dengan status 0. Build yang jatuh hanya
// karena sitemap tidak bisa dibuat jauh lebih merugikan daripada situs tayang
// tanpa sitemap.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

config();

const DIST = path.resolve('dist');
const URL_SUPABASE = process.env.VITE_SUPABASE_URL ?? '';
const KUNCI = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

/** Halaman tetap yang selalu ada, dengan prioritas relatifnya. */
const HALAMAN: [string, string][] = [
  ['/', '1.0'],
  ['/about', '0.7'],
  ['/project', '0.8'],
  ['/blog', '0.8'],
  ['/contact', '0.6'],
];

/** `portfolio.example` / `https://portfolio.example/` → `https://portfolio.example` */
export function normalkanDomain(nilai: string): string | null {
  const v = (nilai || '').trim();
  if (!v) return null;
  const dengansSkema = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(dengansSkema);
    // Nama host tanpa titik (mis. "localhost" atau teks isian) bukan domain
    // publik; sitemap dengan URL seperti itu lebih buruk daripada tidak ada.
    if (!u.hostname.includes('.')) return null;
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

export function bangunSitemap(asal: string, slug: string[], tanggal: Record<string, string> = {}): string {
  const baris = (loc: string, prioritas: string, ubah?: string) =>
    [
      '  <url>',
      `    <loc>${asal}${loc}</loc>`,
      ubah ? `    <lastmod>${ubah}</lastmod>` : '',
      `    <priority>${prioritas}</priority>`,
      '  </url>',
    ]
      .filter(Boolean)
      .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...HALAMAN.map(([loc, p]) => baris(loc, p)),
    ...slug.map((s) => baris(`/blog/${encodeURIComponent(s)}`, '0.6', tanggal[s])),
    '</urlset>',
    '',
  ].join('\n');
}

async function ambilSlug(): Promise<{ slug: string[]; tanggal: Record<string, string> }> {
  if (!URL_SUPABASE || !KUNCI) return { slug: [], tanggal: {} };
  // RLS sudah membatasi anon ke artikel berstatus published, jadi tidak perlu
  // filter status di sini — dan tidak boleh, supaya draf tak pernah bocor.
  const res = await fetch(`${URL_SUPABASE}/rest/v1/blogs?select=slug,updated_at&order=created_at.desc`, {
    headers: { apikey: KUNCI, Authorization: `Bearer ${KUNCI}`, 'Accept-Profile': 'web' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const rows = (await res.json()) as { slug: string; updated_at?: string }[];
  const tanggal: Record<string, string> = {};
  for (const r of rows) if (r.updated_at) tanggal[r.slug] = new Date(r.updated_at).toISOString().slice(0, 10);
  return { slug: rows.map((r) => r.slug).filter(Boolean), tanggal };
}

async function ambilDomain(): Promise<string | null> {
  if (process.env.SITE_URL) return normalkanDomain(process.env.SITE_URL);
  if (!URL_SUPABASE || !KUNCI) return null;
  const res = await fetch(`${URL_SUPABASE}/rest/v1/settings?select=value&key=eq.site_website`, {
    headers: { apikey: KUNCI, Authorization: `Bearer ${KUNCI}`, 'Accept-Profile': 'web' },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as { value?: string }[];
  return normalkanDomain(rows[0]?.value ?? '');
}

async function utama(): Promise<void> {
  if (!existsSync(DIST)) {
    console.warn('[seo-files] dist/ belum ada — dilewati.');
    return;
  }
  const asal = await ambilDomain();
  if (!asal) {
    console.warn('[seo-files] domain situs belum diketahui (SITE_URL atau setting site_website) — sitemap dilewati.');
    return;
  }
  const { slug, tanggal } = await ambilSlug();
  await writeFile(path.join(DIST, 'sitemap.xml'), bangunSitemap(asal, slug, tanggal), 'utf8');

  const robots = path.join(DIST, 'robots.txt');
  if (existsSync(robots)) {
    const isi = await readFile(robots, 'utf8');
    if (!/^Sitemap:/m.test(isi)) {
      await writeFile(robots, `${isi.trimEnd()}\n\nSitemap: ${asal}/sitemap.xml\n`, 'utf8');
    }
  }
  console.log(`[seo-files] sitemap.xml: ${HALAMAN.length} halaman + ${slug.length} artikel — ${asal}`);
}

// Hanya jalan saat dieksekusi langsung. Tanpa penjaga ini, sekadar MENGIMPOR
// modul — yang dilakukan berkas pemeriksanya — ikut menulis dist/sitemap.xml.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  utama().catch((e) => {
    console.warn(`[seo-files] dilewati: ${e?.message ?? e}`);
  });
}
