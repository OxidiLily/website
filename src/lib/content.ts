// Sumber data halaman publik: Supabase, dengan data statis siteData.ts sebagai
// fallback (situs tetap tampil kalau DB kosong/tak terjangkau).
//
// Field kaya yang tak punya kolom sendiri di skema (sections, subtitle, tags,
// featured, dst) disimpan di kolom `meta jsonb` dan disebar kembali di sini —
// jadi tidak ada yang hilang saat bolak-balik DB.
import { useEffect, useState } from 'react';
import type { BlogPost, ExperienceItem, ProjectItem, SiteSettings, ToolItem } from '../types';
import {
  blogPostsData,
  defaultExperiences,
  defaultSettings,
  defaultTools,
  projectsData,
} from '../data/siteData';

/** Gambar pengganti untuk konten yang belum punya gambar sendiri. */
export const LOGO = '/logo.png';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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
    excerpt: meta.excerpt ?? strip(r.content).slice(0, 160),
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
