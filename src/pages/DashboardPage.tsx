import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot, ChevronDown, FileText, FolderKanban, Globe, LayoutDashboard,
  LogOut, Mail, Menu, Settings, ShoppingBag,
} from 'lucide-react';
import { PageId } from '../types';
import { supabase } from '../lib/supabase';
import { RESOURCES, type ResourceKey } from './admin/resources';
import { ResourceManager } from './admin/ResourceManager';
import { Overview } from './admin/Overview';
import { SettingsView } from './admin/SettingsView';

export type AdminView = 'dashboard' | 'settings' | ResourceKey;

// Susunan menu mengikuti sidebar repo acuan: satu grup per domain, dengan
// "Manage <entitas>" dan "Manage Kategori" di dalamnya.
const NAV: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  view?: AdminView;
  children?: { view: AdminView; label: string }[];
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
  {
    id: 'blog', label: 'Blog', icon: FileText,
    children: [
      { view: 'blogs', label: 'Manage Blog' },
      { view: 'blog_categories', label: 'Manage Kategori' },
    ],
  },
  {
    id: 'projects', label: 'Proyek', icon: FolderKanban,
    children: [
      { view: 'projects', label: 'Manage Proyek' },
      { view: 'project_categories', label: 'Manage Kategori' },
    ],
  },
  {
    id: 'shop', label: 'Toko', icon: ShoppingBag,
    children: [
      { view: 'products', label: 'Manage Produk' },
      { view: 'shop_categories', label: 'Manage Kategori' },
    ],
  },
  {
    id: 'inbox', label: 'Pesan', icon: Mail,
    children: [
      { view: 'messages', label: 'Pesan Masuk' },
      { view: 'ai_chat_sessions', label: 'AI Chat' },
    ],
  },
  { id: 'settings', label: 'Pengaturan', icon: Settings, view: 'settings' },
];

const groupOf = (view: AdminView): string =>
  NAV.find((n) => n.view === view || n.children?.some((c) => c.view === view))?.id ?? 'dashboard';

const labelOf = (view: AdminView): string => {
  for (const n of NAV) {
    if (n.view === view) return n.label;
    const c = n.children?.find((c) => c.view === view);
    if (c) return c.label;
  }
  return 'Dashboard';
};

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
  onLogout: () => void;
  user: { email: string; name: string } | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onLogout, user }) => {
  const [view, setView] = useState<AdminView>('dashboard');
  const [openGroup, setOpenGroup] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [unread, setUnread] = useState(0);

  useEffect(() => setOpenGroup(groupOf(view)), [view]);

  useEffect(() => {
    let alive = true;
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .then(({ count }) => alive && setUnread(count ?? 0));
    return () => { alive = false; };
  }, [view]);

  const go = (v: AdminView) => {
    setView(v);
    setSidebarOpen(false);
  };

  const body = useMemo(() => {
    if (view === 'dashboard') return <Overview onOpen={(v) => go(v as AdminView)} />;
    if (view === 'settings')
      return <SettingsView email={user?.email ?? ''} name={name} onNameChange={setName} />;
    return <ResourceManager resource={RESOURCES[view]} />;
  }, [view, user?.email, name]);

  return (
    <div className="dark min-h-screen w-full bg-neutral-950 text-neutral-100 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed md:sticky top-0 z-50 h-screen w-64 shrink-0 border-r border-neutral-800 bg-neutral-950
          flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="px-5 py-5 border-b border-neutral-800">
          <p className="text-sm font-bold tracking-tight">OxidiLily</p>
          <p className="text-[11px] text-neutral-500">Panel admin</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = groupOf(view) === item.id;
            if (!item.children)
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.view!)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                    active ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {item.id === 'settings' && null}
                </button>
              );

            const open = openGroup === item.id;
            return (
              <div key={item.id} className="flex flex-col">
                <button
                  onClick={() => setOpenGroup(open ? '' : item.id)}
                  aria-expanded={open}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                    active ? 'text-neutral-100' : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {item.id === 'inbox' && unread > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px]">{unread}</span>
                    )}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="ml-6 mt-0.5 flex flex-col border-l border-neutral-800 pl-2">
                    {item.children.map((c) => (
                      <button
                        key={c.view}
                        onClick={() => go(c.view)}
                        className={`text-left px-2.5 py-1.5 rounded text-[11px] transition-colors ${
                          view === c.view ? 'text-neutral-100 bg-neutral-800/70' : 'text-neutral-500 hover:text-neutral-200'
                        }`}
                      >
                        {c.label}
                        {c.view === 'ai_chat_sessions' && <Bot className="w-3 h-3 inline ml-1.5 -mt-0.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-neutral-800 flex flex-col gap-1">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 transition-colors"
          >
            <Globe className="w-4 h-4" /> Lihat situs
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100"
              aria-label="Buka menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <p className="text-xs text-neutral-500 truncate">
              Admin <span className="text-neutral-600">/</span>{' '}
              <span className="text-neutral-200">{labelOf(view)}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {unread > 0 && (
              <button
                onClick={() => go('messages')}
                className="text-[11px] px-2 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/30"
              >
                {unread} pesan baru
              </button>
            )}
            <div className="text-right leading-tight">
              <p className="text-[11px] text-neutral-200">{name || user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-neutral-500">{user?.email}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{body}</main>
      </div>
    </div>
  );
};
