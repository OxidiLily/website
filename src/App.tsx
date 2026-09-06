import React, { Suspense, lazy, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BackToTop } from './components/BackToTop';
import { PageId } from './types';
import { isDesktopPointer, isLowPowerDevice } from './lib/device';

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

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

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

  // Routing berbasis PATH (History API): /home, /blog, /blog/<id>, /project/<id>,
  // /contact, /about, /admin/login. Bukan hash — URL hash tidak pernah dikirim
  // ke server, jadi tidak bisa dibedakan sebagai halaman nyata dan buruk untuk
  // berbagi tautan maupun SEO. `vite preview` sudah punya SPA fallback, jadi
  // memuat langsung /blog/<id> mengembalikan index.html.
  useEffect(() => {
    const applyTarget = (target: string) => {
      target = target.replace(/^\/+/, '').replace(/\/+$/, '').trim().toLowerCase();

      if (!target || target === 'home') {
        setCurrentPage('home');
        setSelectedBlogId(null);
        setSelectedProjectId(null);
        return;
      }

      if (target.startsWith('blog')) {
        const parts = target.split('/');
        setCurrentPage('blog');
        setSelectedBlogId(parts.length > 1 ? parts.slice(1).join('/') : null);
        setSelectedProjectId(null);
        return;
      }

      if (target.startsWith('project')) {
        const parts = target.split('/');
        setCurrentPage('project');
        setSelectedProjectId(parts.length > 1 ? parts.slice(1).join('/') : null);
        setSelectedBlogId(null);
        return;
      }

      if (target.startsWith('admin') || target.startsWith('dashboard') || target.startsWith('login')) {
        setCurrentPage('admin');
        setSelectedBlogId(null);
        setSelectedProjectId(null);
        return;
      }

      if (target === 'contact' || target === 'about') {
        setCurrentPage(target as PageId);
        setSelectedBlogId(null);
        setSelectedProjectId(null);
        return;
      }

      // Rute tak dikenal → home.
      setCurrentPage('home');
      setSelectedBlogId(null);
      setSelectedProjectId(null);
    };

    const resolveRoute = () => {
      // Tautan lama berbentuk #blog/<id> masih beredar (bookmark, riwayat).
      // Diterjemahkan sekali ke path yang setara, lalu hash dibuang supaya
      // tidak ada dua bentuk URL untuk halaman yang sama.
      //
      // HANYA hash yang memang rute. ContactPage punya jangkar dalam-halaman
      // `#form`; kalau semua hash diterjemahkan, menekan Back setelah mengklik
      // jangkar itu akan melempar pengguna ke home.
      const hash = window.location.hash.replace(/^#+\/?/, '').trim().toLowerCase();
      const isRoute = /^(home|blog|project|contact|about|admin|dashboard|login)(\/|$)/.test(hash);
      if (hash && isRoute) {
        window.history.replaceState(null, '', `/${hash}`);
        applyTarget(hash);
        return;
      }
      applyTarget(window.location.pathname);
    };

    resolveRoute();
    window.addEventListener('popstate', resolveRoute);
    return () => window.removeEventListener('popstate', resolveRoute);
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
      {!isAdminPage && isDesktopPointer && !isLowPowerDevice && (
        <Suspense fallback={null}>
          <SplashCursor />
        </Suspense>
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
            <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
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
