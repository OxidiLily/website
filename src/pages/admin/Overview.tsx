import React, { useEffect, useState } from 'react';
import { FileText, FolderKanban, Mail, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Stats = {
  total_blogs: number;
  published_blogs: number;
  draft_blogs: number;
  blogs_this_month: number;
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_products: number;
  unread_messages: number;
};

const count = async (table: string, apply?: (q: any) => any): Promise<number> => {
  const base = supabase.from(table).select('id', { count: 'exact', head: true });
  const { count: c } = await (apply ? apply(base) : base);
  return c ?? 0;
};

export const Overview: React.FC<{ onOpen: (view: string) => void }> = ({ onOpen }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      try {
        const [
          total_blogs, published_blogs, draft_blogs, blogs_this_month,
          total_projects, active_projects, completed_projects,
          total_products, unread_messages,
        ] = await Promise.all([
          count('blogs'),
          count('blogs', (q) => q.eq('status', 'published')),
          count('blogs', (q) => q.eq('status', 'draft')),
          count('blogs', (q) => q.gte('created_at', startOfMonth.toISOString())),
          count('projects'),
          count('projects', (q) => q.eq('status', 'aktif')),
          count('projects', (q) => q.eq('status', 'selesai')),
          count('products'),
          count('messages', (q) => q.eq('is_read', false)),
        ]);

        const [{ data: b }, { data: p }] = await Promise.all([
          supabase.from('blogs').select('id, title, status, created_at, blog_categories(name)')
            .order('created_at', { ascending: false }).limit(5),
          supabase.from('projects').select('id, name, status, created_at')
            .order('created_at', { ascending: false }).limit(5),
        ]);

        if (!alive) return;
        setStats({
          total_blogs, published_blogs, draft_blogs, blogs_this_month,
          total_projects, active_projects, completed_projects,
          total_products, unread_messages,
        });
        setBlogs(b ?? []);
        setProjects(p ?? []);
      } catch (e: any) {
        if (alive) setError(e?.message ?? 'Gagal memuat statistik.');
      }
    })();
    return () => { alive = false; };
  }, []);

  const cards = stats
    ? [
        { label: 'Artikel', value: stats.total_blogs, hint: `${stats.blogs_this_month} bulan ini · ${stats.draft_blogs} draft`, icon: FileText, view: 'blogs' },
        { label: 'Proyek', value: stats.total_projects, hint: `${stats.active_projects} aktif · ${stats.completed_projects} selesai`, icon: FolderKanban, view: 'projects' },
        { label: 'Produk', value: stats.total_products, hint: 'katalog toko', icon: Package, view: 'products' },
        { label: 'Pesan belum dibaca', value: stats.unread_messages, hint: 'dari form kontak', icon: Mail, view: 'messages' },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-100">Dashboard</h1>
        <p className="text-xs text-neutral-400 mt-1">Ringkasan isi situs, dibaca langsung dari Supabase.</p>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(cards.length ? cards : Array.from({ length: 4 }, () => null)).map((c, i) => (
          <button
            key={c?.label ?? i}
            onClick={() => c && onOpen(c.view)}
            disabled={!c}
            className="text-left p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">{c?.label ?? '—'}</span>
              {c && <c.icon className="w-4 h-4 text-neutral-500" />}
            </div>
            <p className="text-2xl font-bold text-neutral-100 mt-2">{c ? c.value : '·'}</p>
            <p className="text-[11px] text-neutral-500 mt-1">{c?.hint ?? ''}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <RecentList
          title="Artikel terbaru"
          empty="Belum ada artikel."
          rows={blogs.map((b) => ({
            id: b.id,
            primary: b.title,
            secondary: `${b.blog_categories?.name ?? 'tanpa kategori'} · ${b.status}`,
            at: b.created_at,
          }))}
          onOpen={() => onOpen('blogs')}
        />
        <RecentList
          title="Proyek terbaru"
          empty="Belum ada proyek."
          rows={projects.map((p) => ({ id: p.id, primary: p.name, secondary: p.status, at: p.created_at }))}
          onOpen={() => onOpen('projects')}
        />
      </div>
    </div>
  );
};

const RecentList: React.FC<{
  title: string;
  empty: string;
  rows: { id: number; primary: string; secondary: string; at: string }[];
  onOpen: () => void;
}> = ({ title, empty, rows, onOpen }) => (
  <div className="rounded-xl border border-neutral-800 overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/60">
      <h2 className="text-xs font-semibold text-neutral-200">{title}</h2>
      <button onClick={onOpen} className="text-[11px] text-neutral-400 hover:text-neutral-100 transition-colors">
        Lihat semua
      </button>
    </div>
    <ul className="divide-y divide-neutral-800">
      {rows.length === 0 && <li className="px-4 py-6 text-center text-xs text-neutral-500">{empty}</li>}
      {rows.map((r) => (
        <li key={r.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-neutral-100 truncate">{r.primary}</p>
            <p className="text-[11px] text-neutral-500 truncate">{r.secondary}</p>
          </div>
          <span className="text-[11px] text-neutral-500 shrink-0">
            {new Date(r.at).toLocaleDateString('id-ID')}
          </span>
        </li>
      ))}
    </ul>
  </div>
);
