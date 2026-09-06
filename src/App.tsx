import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Decor, PageBoundary } from './components/Decor';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BackToTop } from './components/BackToTop';
import { PageId } from './types';
import { canRenderWebGL, isDesktopPointer } from './lib/device';

// Tiap halaman dipecah jadi chunk sendiri. Tanpa ini seluruh three.js, ogl,
// rapier, dan drei ikut terunduh & di-parse di kunjungan pertama walau user
// cuma membuka satu halaman — beban terbesar untuk HP dan PC lama.
const SplashCursor = lazy(() => import('./components/SplashCursor').then(m => ({ default: m.SplashCursor })));
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ProjectPage = lazy(() => import('./pages/ProjectPage').then(m => ({ default: m.ProjectPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const AdminGate = lazy(() => import('./pages/admin/AdminGate').then(m => ({ default: m.AdminGate })));

const PAGE_TITLES: Record<PageId, string> = {
  home: 'OxidiLily — Portfolio',
  project: 'Projects — OxidiLily',
  blog: 'Blog — OxidiLily',
  contact: 'Contact — OxidiLily',
  about: 'About — OxidiLily',
  admin: 'Admin — OxidiLily',
};

/** Penanda muat antar-halaman. Sebelumnya kotak kosong tanpa tanda apa pun,
 *  sehingga mengklik hasil pencarian terlihat seperti tidak terjadi apa-apa. */
function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
      <span className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
      <span className="sr-only">Memuat halaman…</span>
    </div>
  );
}

interface Route {
  page: PageId;
  blogId: string | null;
  projectId: string | null;
}

/**
 * URL → halaman. Fungsi murni supaya bisa dipakai untuk NILAI AWAL state,
 * bukan hanya di dalam efek.
 *
 * Ini penting untuk kecepatan, bukan kerapian: kalau rute baru diselesaikan di
 * useEffect, render pertama selalu HomePage, sehingga membuka /about atau
 * /blog/<id> ikut mengunduh dan mem-parse chunk HomePage + Ballpit + Orb +
 * three.js (734 KB) lebih dulu — terukur menunda konten yang diminta sampai
 * puluhan detik di mesin lambat.
 */
function parseRoute(pathname: string, hash: string): Route {
  // Tautan lama berbentuk #blog/<id> masih beredar (bookmark, riwayat).
  // HANYA hash yang memang rute: ContactPage punya jangkar dalam-halaman
  // `#form`, dan menerjemahkan semua hash membuat tombol Back melempar ke home.
  const h = hash.replace(/^#+\/?/, '').trim().toLowerCase();
  const legacy = /^(home|blog|project|contact|about|admin|dashboard|login)(\/|$)/.test(h);
  const raw = (legacy ? h : pathname).replace(/^\/+/, '').replace(/\/+$/, '').trim().toLowerCase();

  const none: Route = { page: 'home', blogId: null, projectId: null };
  if (!raw || raw === 'home') return none;

  const parts = raw.split('/');
  const tail = parts.length > 1 ? parts.slice(1).join('/') : null;

  if (raw.startsWith('blog')) return { page: 'blog', blogId: tail, projectId: null };
  if (raw.startsWith('project')) return { page: 'project', blogId: null, projectId: tail };
  if (raw.startsWith('admin') || raw.startsWith('dashboard') || raw.startsWith('login')) {
    return { page: 'admin', blogId: null, projectId: null };
  }
  if (raw === 'contact' || raw === 'about') return { page: raw as PageId, blogId: null, projectId: null };

  return none; // rute tak dikenal → home
}

const initialRoute = parseRoute(window.location.pathname, window.location.hash);

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>(initialRoute.page);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(initialRoute.blogId);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialRoute.projectId);

  // Judul tab mengikuti halaman yang dibuka. Saat ada detail terbuka (post blog
  // atau modal project) judulnya diserahkan ke halaman itu, yang punya datanya —
  // App sengaja tidak menimpanya. Begitu id-nya hilang dari URL, judul halaman
  // dipulihkan di sini.
  useEffect(() => {
    if (selectedBlogId || selectedProjectId) return;
    document.title = PAGE_TITLES[currentPage];
  }, [currentPage, selectedBlogId, selectedProjectId]);

  // Muat ulang halaman saat LEBAR viewport berubah (mis. rotasi layar, jendela
  // desktop di-resize). Efek WebGL menghitung ukuran kanvas dan konstanta kelas
  // perangkat sekali saat mount, jadi tata letak baru butuh mount ulang.
  //
  // Sengaja HANYA lebar: di mobile, bilah alamat yang muncul/hilang saat scroll
  // mengubah TINGGI viewport terus-menerus — memantau tinggi berarti reload
  // tanpa henti. Debounce 300ms supaya drag jendela hanya memicu satu reload.
  useEffect(() => {
    let lastWidth = window.innerWidth;
    let timer = 0;

    const handleResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      clearTimeout(timer);
      timer = window.setTimeout(() => window.location.reload(), 300);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Rute awal sudah diselesaikan sebelum render pertama (lihat parseRoute).
  // Efek ini hanya mengurus perpindahan setelahnya: tombol Back/Forward, dan
  // penulisan ulang tautan hash lama menjadi path yang setara.
  useEffect(() => {
    const apply = () => {
      const r = parseRoute(window.location.pathname, window.location.hash);
      setCurrentPage(r.page);
      setSelectedBlogId(r.blogId);
      setSelectedProjectId(r.projectId);
    };

    if (window.location.hash) {
      const h = window.location.hash.replace(/^#+\/?/, '').trim().toLowerCase();
      if (/^(home|blog|project|contact|about|admin|dashboard|login)(\/|$)/.test(h)) {
        window.history.replaceState(null, '', `/${h}`);
      }
    }

    window.addEventListener('popstate', apply);
    return () => window.removeEventListener('popstate', apply);
  }, []);

  /** Satu-satunya penulis URL. Path, tanpa hash. */
  const pushPath = (path: string) => window.history.pushState(null, '', path);

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    setSelectedBlogId(null);
    setSelectedProjectId(null);
    pushPath(page === 'admin' ? '/admin/login' : `/${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBlog = (postId: string) => {
    setCurrentPage('blog');
    setSelectedBlogId(postId);
    pushPath(`/blog/${postId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProject = (projectId: string) => {
    // Modal project dibuka DI ATAS daftar. Scroll ke atas hanya kalau kita
    // memang berpindah halaman (mis. dari pencarian navbar); kalau sudah di
    // halaman project, posisi scroll pengguna dipertahankan.
    const changingPage = currentPage !== 'project';
    setCurrentPage('project');
    setSelectedProjectId(projectId);
    pushPath(`/project/${projectId}`);
    if (changingPage) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Menutup detail tanpa scroll: hanya membuang id dari URL supaya tombol Back
  // browser dan tautan yang dibagikan tetap konsisten dengan yang terlihat.
  const handleCloseDetail = (page: PageId) => {
    setSelectedBlogId(null);
    setSelectedProjectId(null);
    pushPath(`/${page}`);
  };

  const isAdminPage = currentPage === 'admin';

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black flex flex-col justify-between">
      {/* Fluid Interactive Splash Cursor (on public pages) */}
      {!isAdminPage && isDesktopPointer && canRenderWebGL && (
        <Decor>
          <SplashCursor />
        </Decor>
      )}

      {/* Dynamic Sticky / Floating Navbar with Global Search & Mobile Notch (only on public frontend pages) */}
      {!isAdminPage && (
        <Navbar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onSelectBlog={handleSelectBlog}
          onSelectProject={handleSelectProject}
        />
      )}

      {/* Main Content Area with Page Switcher */}
      <main className={`flex-1 w-full ${isAdminPage ? 'p-0 pb-0' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: isAdminPage ? 0 : 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isAdminPage ? 0 : -15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            <PageBoundary>
            <Suspense fallback={<PageLoading />}>
            {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
            {currentPage === 'project' && (
              <ProjectPage
                initialProjectId={selectedProjectId}
                onSelectProject={handleSelectProject}
                onCloseProject={() => handleCloseDetail('project')}
              />
            )}
            {currentPage === 'blog' && (
              <BlogPage
                onNavigate={handleNavigate}
                initialPostId={selectedBlogId}
                onSelectPost={handleSelectBlog}
                onClosePost={() => handleCloseDetail('blog')}
              />
            )}
            {currentPage === 'admin' && <AdminGate onNavigate={handleNavigate} />}
            {currentPage === 'contact' && <ContactPage />}
            {currentPage === 'about' && <AboutPage />}
            </Suspense>
            </PageBoundary>
          </motion.div>
        </AnimatePresence>

        {/* Ruang untuk dock navigasi mengambang di mobile. Harus berupa blok
            OPAK, bukan padding pada <main>: padding transparan membiarkan layer
            latar `fixed` milik halaman terlihat sebagai pita di atas footer. */}
        {!isAdminPage && <div className="relative z-10 h-32 md:hidden bg-black" />}
      </main>

      {/* Fullscreen Footer (only on public frontend pages) */}
      {!isAdminPage && <Footer onNavigate={handleNavigate} />}

      {/* Back To Top Floating Action Button (only on public frontend pages) */}
      {!isAdminPage && <BackToTop />}
    </div>
  );
}
