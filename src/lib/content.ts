// Sumber data halaman publik: Supabase, dengan data statis siteData.ts sebagai
// fallback (situs tetap tampil kalau DB kosong/tak terjangkau).
//
// Field kaya yang tak punya kolom sendiri di skema (sections, subtitle, tags,
// featured, dst) disimpan di kolom `meta jsonb` dan disebar kembali di sini —
// jadi tidak ada yang hilang saat bolak-balik DB.
import { useEffect, useState } from 'react';
import { SUPABASE_KEY, SUPABASE_URL } from './apiBase';
import type { BlogPost, ExperienceItem, ProjectItem, SiteSettings, ToolItem } from '../types';
import { ringkasUntukMeta } from './seo';
import {
  blogPostsData,
  defaultExperiences,
  defaultSettings,
  defaultTools,
  projectsData,
} from '../data/siteData';

/** Gambar pengganti untuk konten yang belum punya gambar sendiri. */
export const LOGO = '/logo.png';

const URL = SUPABASE_URL;
const KEY = SUPABASE_KEY;

async function rest(path: string): Promise<any[] | null> {
  try {
    const res = await fetch(`${URL}/rest/v1/${path}`, {
      // `Accept-Profile` memilih schema untuk permintaan BACA. Tanpa header
      // ini PostgREST memakai schema pertama di daftarnya (`public`) dan
      // menjawab 404 — tabelnya ada, hanya tidak di sana.
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Accept-Profile': 'web' },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length ? rows : null;
  } catch {
    return null;
  }
}

/**
 * Satu INSERT anon ke tabel publik-tulis (`messages`, `ai_chat_sessions`).
 *
 * Sengaja lewat fetch, bukan supabase-js: menarik klien 267 KB ke chunk halaman
 * publik demi satu POST tidak sepadan. Yang mengizinkannya policy
 * `*_public_insert`; anon tetap tidak bisa MEMBACA baris siapa pun.
 *
 * `keepalive` dipakai saat kiriman berangkat tepat ketika komponennya ditutup
 * atau tabnya ditinggalkan — tanpa itu browser membatalkan permintaan yang
 * masih terbang dan barisnya tidak pernah sampai.
 */
export async function insert(table: string, row: object, opts: { keepalive?: boolean } = {}): Promise<void> {
  const res = await fetch(`${URL}/rest/v1/${table}`, {
    method: 'POST',
    keepalive: opts.keepalive,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      // Pasangan tulis dari `Accept-Profile`: memilih schema untuk INSERT.
      'Content-Profile': 'web',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(String(res.status));
}

const strip = (html: string) => (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

function toProject(r: any): ProjectItem {
  const meta = r.meta ?? {};
  return {
    ...meta,
    id: r.slug,
    title: r.name,
    category: meta.category ?? r.project_categories?.name ?? 'Web',
    description: r.description ?? '',
    year: r.year ?? meta.year ?? '',
    client: r.client ?? meta.client ?? '',
    tags: Array.isArray(r.tech_stack) ? r.tech_stack : (meta.tags ?? []),
    image: r.image || meta.image || LOGO,
    featured: meta.featured ?? false,
  };
}

function toBlog(r: any): BlogPost {
  const meta = r.meta ?? {};
  const category = meta.category ?? r.blog_categories?.name ?? 'Engineering';
  return {
    ...meta,
    id: r.slug,
    title: r.title,
    category,
    date: meta.date ?? new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    readTime: r.reading_time ? `${r.reading_time} min read` : (meta.readTime ?? '5 min read'),
    // Potong di batas kata, bukan di karakter ke-160: excerpt ini dipakai
    // kartu blog SEKALIGUS meta description, dan potongan di tengah kata
    // terbaca rusak di hasil pencarian.
    excerpt: meta.excerpt ?? ringkasUntukMeta(r.content ?? ''),
    content: r.content ?? '',
    tags: meta.tags ?? [category],
  };
}

export async function fetchProjects(): Promise<ProjectItem[]> {
  const rows = await rest(
    'projects?select=slug,name,description,image,client,year,tech_stack,icon,meta,project_categories(name)&order=created_at.desc',
  );
  return rows ? rows.map(toProject) : projectsData;
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  // RLS membatasi anon ke status=published, jadi tak perlu filter eksplisit.
  const rows = await rest(
    'blogs?select=slug,title,content,reading_time,author,created_at,meta,blog_categories(name)&order=created_at.desc',
  );
  return rows ? rows.map(toBlog) : blogPostsData;
}

// ── Konten halaman yang dikelola panel ───────────────────────────────────

/**
 * Teks tiap halaman. Hanya baris `is_public` yang terbaca anon (RLS), jadi
 * kunci AI di tabel yang sama tidak pernah ikut terkirim ke pengunjung.
 *
 * Dijanjikan sekali per muat halaman: Navbar, Footer, dan halaman aktif
 * semuanya memanggil ini, dan tanpa cache itu berarti tiga permintaan
 * identik untuk data yang sama.
 */
let settingsOnce: Promise<SiteSettings> | null = null;

export function fetchSettings(): Promise<SiteSettings> {
  settingsOnce ??= rest('settings?select=key,value').then((rows) =>
    rows
      ? { ...defaultSettings, ...Object.fromEntries(rows.map((r: any) => [r.key, r.value ?? ''])) }
      : defaultSettings,
  );
  return settingsOnce;
}

export async function fetchTools(): Promise<ToolItem[]> {
  // RLS sudah menyaring is_active, jadi tak perlu filter eksplisit.
  const rows = await rest('tools?select=id,name,category,icon,link&order=sort_order.asc,name.asc');
  return rows
    ? rows.map((r: any) => ({
        id: String(r.id),
        name: r.name,
        category: r.category ?? '',
        icon: r.icon || undefined,
        link: r.link || undefined,
      }))
    : defaultTools;
}

export async function fetchExperiences(): Promise<ExperienceItem[]> {
  const rows = await rest('experiences?select=id,year,title,description&order=sort_order.asc');
  return rows
    ? rows.map((r: any) => ({
        id: String(r.id),
        year: r.year,
        title: r.title,
        description: r.description ?? '',
      }))
    : defaultExperiences;
}

/**
 * Ringkasan isi situs untuk asisten AI di halaman publik.
 *
 * Tanpa ini asisten menjawab dari pengetahuan umum dan mengaku tidak tahu
 * apa-apa soal situsnya — terukur: dengan system prompt "jawab sesuai yang ada
 * di website" model tetap membalas "saya tidak memiliki akses ke website
 * tertentu yang Anda maksud". Prompt tidak membawa data; data harus dikirim.
 *
 * Sumbernya PERSIS sama dengan yang dibaca halaman publik, jadi apa pun yang
 * diubah admin di panel ikut terbawa tanpa disalin ke tempat kedua.
 *
 * Sengaja ringkas, bukan salinan penuh: isi artikel utuh menghabiskan anggaran
 * token sebelum pertanyaannya sempat dibaca. Judul, kategori, dan ringkasan
 * sudah cukup untuk mengarahkan, dan tombol navigasi di modal yang membawa
 * pengunjung ke halaman lengkapnya.
 */
let konteksOnce: Promise<string> | null = null;

export function konteksSitus(): Promise<string> {
  konteksOnce ??= Promise.all([
    fetchSettings(),
    fetchProjects(),
    fetchBlogPosts(),
    fetchTools(),
    fetchExperiences(),
  ]).then(([t, proyek, blog, tools, pengalaman]) => {
    const potong = (v: string, n: number) => strip(v ?? '').slice(0, n);
    const bagian = [
      // Aturan bentuk jawaban hidup di kode, bukan di medan panel: gelembung
      // chat merender teks POLOS (satu <p> di AiAssistantModal), jadi markdown
      // apa pun tampil mentah — tabel jadi deretan `|---|`, penekanan jadi
      // bintang yang kelihatan. Medan "System prompt" di panel tetap milik
      // admin untuk mengatur nada dan isi; yang di sini menjamin bentuknya
      // masih bisa dibaca di antarmuka yang ada.
      'Kamu asisten di situs ini, berbicara langsung dengan pengunjung.',
      'Cara menjawab:',
      '- Tulis sebagai percakapan biasa. JANGAN memakai markdown sama sekali:',
      '  tanpa judul (#), tanpa tabel, tanpa daftar berpoin atau bernomor,',
      '  tanpa garis pemisah (---), tanpa **tebal**, tanpa blok kode.',
      '- Pendek: dua sampai empat kalimat. Kalau perlu menyebut beberapa hal,',
      '  rangkai dalam satu kalimat yang mengalir, bukan daftar ke bawah.',
      '- Jawab HANYA yang ditanyakan. Jangan menumpahkan seluruh isi situs',
      '  kalau pengunjung cuma bertanya satu hal.',
      '- Ikuti bahasa yang dipakai pengunjung.',
      '- Emoji secukupnya saja, jangan di setiap kalimat.',
      '- Di bawah jawabanmu sudah ada tombol yang membawa pengunjung ke halaman',
      '  terkait, jadi tidak perlu menuliskan daftar lengkap atau tautan.',
      '',
      'Data di bawah ini bahan referensi untuk menjawab — jangan disalin mentah,',
      'dan jangan ditampilkan sebagai daftar.',
      '',
      `Situs: ${t.site_name} — ${potong(t.site_description, 300)}`,
      `Kontak: email ${t.site_email}, WhatsApp ${t.site_whatsapp}, lokasi ${t.site_location}`,
      `Halaman: ${['home', 'project', 'blog', 'about', 'contact'].join(', ')}`,
      `Proyek (${proyek.length}):`,
      ...proyek.slice(0, 20).map(
        (p) => `- ${p.title} [${p.category}, ${p.year}, klien ${p.client}] ${potong(p.description, 200)} (teknologi: ${p.tags.join(', ')})`,
      ),
      `Artikel blog (${blog.length}):`,
      ...blog.slice(0, 20).map((b) => `- ${b.title} [${b.category}, ${b.date}, ${b.readTime}] ${potong(b.excerpt, 200)}`),
      `Tools & stack: ${tools.map((x) => `${x.name} (${x.category})`).join(', ')}`,
      `Pengalaman: ${pengalaman.map((x) => `${x.year} ${x.title}`).join('; ')}`,
    ];
    return bagian.join('\n');
  });
  return konteksOnce;
}

/**
 * Render dengan cadangan statis lebih dulu, lalu ganti begitu database
 * menjawab. Pola ini dipakai bertiga (settings, tools, experiences) supaya
 * tidak ada halaman yang sempat tampil kosong sambil menunggu jaringan.
 *
 * `load` sengaja TIDAK masuk dependency: yang dioper selalu fungsi
 * tingkat-modul yang stabil, dan memasukkannya membuat pemanggil yang
 * menulis `useRemote(() => …)` inline mengambil ulang di setiap render.
 */
function useRemote<T>(load: () => Promise<T>, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    let alive = true;
    load()
      .then((v) => alive && setValue(v))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return value;
}

export const useSettings = (): SiteSettings => useRemote(fetchSettings, defaultSettings);
export const useTools = (): ToolItem[] => useRemote(fetchTools, defaultTools);
export const useExperiences = (): ExperienceItem[] => useRemote(fetchExperiences, defaultExperiences);
