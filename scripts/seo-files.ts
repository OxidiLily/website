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
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { ringkasUntukMeta, jsonLdArtikel } from '../src/lib/seo';

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

export interface Artikel {
  slug: string;
  title: string;
  content?: string;
  author?: string;
  created_at?: string;
  updated_at?: string;
  meta?: { excerpt?: string; subtitle?: string } | null;
}

async function ambilArtikel(): Promise<Artikel[]> {
  if (!URL_SUPABASE || !KUNCI) return [];
  // RLS sudah membatasi anon ke artikel berstatus published, jadi tidak perlu
  // filter status di sini — dan tidak boleh, supaya draf tak pernah bocor.
  const res = await fetch(
    `${URL_SUPABASE}/rest/v1/blogs?select=slug,title,content,author,created_at,updated_at,meta&order=created_at.desc`,
    { headers: { apikey: KUNCI, Authorization: `Bearer ${KUNCI}`, 'Accept-Profile': 'web' } },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return ((await res.json()) as Artikel[]).filter((r) => r.slug);
}


/** Teks apa pun → aman ditaruh di dalam atribut HTML. */
export function escAttr(nilai: string): string {
  return (nilai || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Ganti isi satu meta di HTML mentah; sisipkan sebelum </head> kalau belum ada.
 *
 * Bekerja pada TEKS, bukan DOM: skrip ini berjalan di Node setelah `vite build`,
 * dan menarik pengurai HTML utuh hanya untuk menukar beberapa atribut adalah
 * ongkos yang tidak perlu.
 */
function tukarMeta(html: string, atribut: 'name' | 'property', kunci: string, isi: string): string {
  const pola = new RegExp(`(<meta\\s+${atribut}=["']${kunci}["'][^>]*content=["'])[^"']*(["'])`, 'i');
  if (pola.test(html)) return html.replace(pola, `$1${escAttr(isi)}$2`);
  return html.replace('</head>', `  <meta ${atribut}="${kunci}" content="${escAttr(isi)}" />\n</head>`);
}

/**
 * Kerangka index.html + data artikel → HTML statis dengan head yang benar.
 *
 * Ini BUKAN SSR: badan halaman tetap kosong dan diisi React di browser. Yang
 * ditutup di sini adalah celah yang tidak bisa ditutup JavaScript — perayap
 * kartu tautan (WhatsApp, Twitter, Slack) dan sebagian mesin pencari membaca
 * HTML MENTAH, jadi meta yang hanya dipasang saat runtime tidak pernah mereka
 * lihat. Dengan berkas ini tiap artikel punya judul, deskripsi, canonical, dan
 * data terstrukturnya sendiri sejak byte pertama.
 */
export function htmlArtikel(kerangka: string, asal: string, a: Artikel, namaSitus: string): string {
  const url = `${asal}/blog/${encodeURIComponent(a.slug)}`;
  const gambar = `${asal}/logo.png`;
  const judul = `${a.title} — ${namaSitus}`;
  const deskripsi = ringkasUntukMeta(a.meta?.excerpt || a.meta?.subtitle || a.content || '');

  let html = kerangka;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escAttr(judul)}</title>`);
  html = tukarMeta(html, 'name', 'description', deskripsi);
  html = tukarMeta(html, 'property', 'og:title', a.title);
  html = tukarMeta(html, 'property', 'og:description', deskripsi);
  html = tukarMeta(html, 'property', 'og:type', 'article');
  html = tukarMeta(html, 'property', 'og:url', url);
  html = tukarMeta(html, 'property', 'og:image', gambar);
  html = tukarMeta(html, 'name', 'twitter:title', a.title);
  html = tukarMeta(html, 'name', 'twitter:description', deskripsi);
  html = tukarMeta(html, 'name', 'twitter:image', gambar);

  const kanonik = /<link\s+rel=["']canonical["'][^>]*>/i;
  const tautan = `<link rel="canonical" href="${escAttr(url)}" />`;
  html = kanonik.test(html) ? html.replace(kanonik, tautan) : html.replace('</head>', `  ${tautan}\n</head>`);

  const ld = jsonLdArtikel({
    judul: a.title, deskripsi, url,
    penulis: a.author || namaSitus, namaSitus,
    terbit: a.created_at, diperbarui: a.updated_at, gambar,
  });
  // `</` di dalam JSON dipecah supaya tidak pernah menutup <script> lebih awal.
  const json = JSON.stringify(ld).replace(/</g, '\\u003c');
  // id-nya sama dengan yang dipakai terapkanJsonLd(): begitu React jalan, blok
  // statis ini DIGANTI, bukan ditemani blok kedua. Tanpa id yang sama halaman
  // artikel membawa dua Article sekaligus, dan yang statis masih menyebut URL
  // artikel lama setelah pengunjung pindah artikel.
  return html.replace('</head>', `  <script id="jsonld-halaman" type="application/ld+json">${json}</script>\n</head>`);
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

async function ambilNamaSitus(): Promise<string> {
  if (!URL_SUPABASE || !KUNCI) return 'OxidiLily';
  try {
    const res = await fetch(`${URL_SUPABASE}/rest/v1/settings?select=value&key=eq.site_name`, {
      headers: { apikey: KUNCI, Authorization: `Bearer ${KUNCI}`, 'Accept-Profile': 'web' },
    });
    const rows = (await res.json()) as { value?: string }[];
    return rows[0]?.value?.trim() || 'OxidiLily';
  } catch {
    return 'OxidiLily';
  }
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
  const artikel = await ambilArtikel();
  const slug = artikel.map((a) => a.slug);
  const tanggal: Record<string, string> = {};
  for (const a of artikel) {
    if (a.updated_at) tanggal[a.slug] = new Date(a.updated_at).toISOString().slice(0, 10);
  }
  await writeFile(path.join(DIST, 'sitemap.xml'), bangunSitemap(asal, slug, tanggal), 'utf8');

  // HTML statis per artikel: dist/blog/<slug>.html. Perayap yang tidak
  // menjalankan JavaScript mendapat head yang benar dari byte pertama.
  //
  // Berkas DATAR, bukan <slug>/index.html: penyaji dist/ adalah `vite preview`,
  // dan fallback SPA-nya menang atas pengalihan indeks-direktori. `/blog/casaos`
  // (bentuk yang dipakai canonical dan yang diambil perayap) terbukti menjawab
  // kerangka situs, bukan artikelnya — hanya `/blog/casaos/` dengan garis miring
  // penutup yang mengenai berkasnya. Bentuk datar terlayani di kedua-duanya.
  const namaSitus = await ambilNamaSitus();
  const kerangka = await readFile(path.join(DIST, 'index.html'), 'utf8');
  await mkdir(path.join(DIST, 'blog'), { recursive: true });
  for (const a of artikel) {
    // Slug dikarang di panel admin lalu dipakai sebagai NAMA BERKAS; yang
    // membawa pemisah jalur akan menulis di luar dist/blog.
    if (a.slug !== path.basename(a.slug) || a.slug.startsWith('.')) {
      console.warn(`[seo-files] slug tidak aman sebagai nama berkas, dilewati: ${a.slug}`);
      continue;
    }
    await writeFile(path.join(DIST, 'blog', `${a.slug}.html`), htmlArtikel(kerangka, asal, a, namaSitus), 'utf8');
  }

  const robots = path.join(DIST, 'robots.txt');
  if (existsSync(robots)) {
    const isi = await readFile(robots, 'utf8');
    if (!/^Sitemap:/m.test(isi)) {
      await writeFile(robots, `${isi.trimEnd()}\n\nSitemap: ${asal}/sitemap.xml\n`, 'utf8');
    }
  }
  console.log(`[seo-files] sitemap.xml: ${HALAMAN.length} halaman + ${slug.length} artikel; HTML statis: ${artikel.length} — ${asal}`);
}

// Hanya jalan saat dieksekusi langsung. Tanpa penjaga ini, sekadar MENGIMPOR
// modul — yang dilakukan berkas pemeriksanya — ikut menulis dist/sitemap.xml.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  utama().catch((e) => {
    console.warn(`[seo-files] dilewati: ${e?.message ?? e}`);
  });
}
