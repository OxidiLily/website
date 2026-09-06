// Sumber data halaman publik: Supabase, dengan data statis siteData.ts sebagai
// fallback (situs tetap tampil kalau DB kosong/tak terjangkau).
//
// Field kaya yang tak punya kolom sendiri di skema (sections, subtitle, tags,
// featured, dst) disimpan di kolom `meta jsonb` dan disebar kembali di sini —
// jadi tidak ada yang hilang saat bolak-balik DB.
import type { BlogPost, ProjectItem } from '../types';
import { blogPostsData, projectsData } from '../data/siteData';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function rest(path: string): Promise<any[] | null> {
  try {
    const res = await fetch(`${URL}/rest/v1/${path}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
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
    image: r.image ?? meta.image ?? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
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
    'blogs?select=slug,title,content,featured_image,reading_time,author,created_at,meta,blog_categories(name)&order=created_at.desc',
  );
  return rows ? rows.map(toBlog) : blogPostsData;
}
