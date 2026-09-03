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
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));

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
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<{ email: string; name: string } | null>(null);

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

  // Sync state with URL hash and pathname on mount and when changed
  useEffect(() => {
    const resolveRoute = () => {
      let target = '';
      
      if (window.location.hash) {
        // Strip leading # and optional slashes: e.g. '#/admin' -> 'admin', '#admin' -> 'admin'
        target = window.location.hash.replace(/^#+[\/]?/, '').trim().toLowerCase();
      } else if (window.location.pathname && window.location.pathname !== '/') {
        // Fallback for direct pathname e.g. '/admin' -> 'admin'
        target = window.location.pathname.replace(/^\/+/, '').trim().toLowerCase();
      }

      // Remove trailing slashes
      target = target.replace(/\/+$/, '');

      if (!target || target === 'home') {
        setCurrentPage('home');
        setSelectedBlogId(null);
        setSelectedProjectId(null);
        return;
      }

      if (target.startsWith('blog')) {
        const parts = target.split('/');
        const postId = parts.length > 1 ? parts.slice(1).join('/') : null;
        setCurrentPage('blog');
        setSelectedBlogId(postId);
        return;
      }

      if (target.startsWith('project')) {
        const parts = target.split('/');
        const projId = parts.length > 1 ? parts.slice(1).join('/') : null;
        setCurrentPage('project');
        setSelectedProjectId(projId);
        return;
      }

      if (
        target === 'admin' ||
        target.startsWith('admin') ||
        target === 'dashboard' ||
        target.startsWith('dashboard') ||
        target === 'login' ||
        target.startsWith('login')
      ) {
        setCurrentPage('admin');
        return;
      }

      if (['contact', 'about'].includes(target)) {
        setCurrentPage(target as PageId);
        return;
      }

      // Rute tak dikenal: jatuh ke home. Sebelumnya fungsi ini selesai tanpa
      // melakukan apa pun, jadi URL berubah tapi halaman tidak.
      setCurrentPage('home');
      setSelectedBlogId(null);
      setSelectedProjectId(null);
    };

    resolveRoute();
    window.addEventListener('hashchange', resolveRoute);
    window.addEventListener('popstate', resolveRoute);
    return () => {
      window.removeEventListener('hashchange', resolveRoute);
      window.removeEventListener('popstate', resolveRoute);
    };
  }, []);

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    setSelectedBlogId(null);
    setSelectedProjectId(null);

    if (page === 'admin') {
      // Admin punya URL kanonik berbasis path, bukan hash.
      window.history.pushState(null, '', '/admin/login');
    } else {
      // Keluar dari /admin/login: bersihkan path dulu, kalau tidak URL-nya
      // jadi '/admin/login#home'.
      if (window.location.pathname !== '/') window.history.replaceState(null, '', '/');
      window.location.hash = page;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBlog = (postId: string) => {
    setCurrentPage('blog');
    setSelectedBlogId(postId);
    window.location.hash = `blog/${postId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProject = (projectId: string) => {
    // Modal project dibuka DI ATAS daftar. Scroll ke atas hanya kalau kita
    // memang berpindah halaman (mis. dari pencarian navbar); kalau sudah di
    // halaman project, posisi scroll pengguna dipertahankan.
    const changingPage = currentPage !== 'project';
    setCurrentPage('project');
    setSelectedProjectId(projectId);
    window.location.hash = `project/${projectId}`;
    if (changingPage) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Menutup detail tanpa scroll: hanya membuang id dari URL supaya tombol Back
  // browser dan tautan yang dibagikan tetap konsisten dengan yang terlihat.
  const handleCloseDetail = (page: PageId) => {
    setSelectedBlogId(null);
    setSelectedProjectId(null);
    window.location.hash = page;
  };

  const handleAdminLoginSuccess = (user?: { email: string; name: string }) => {
    setIsAdminAuthenticated(true);
    if (user) {
      setAdminUser(user);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminUser(null);
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
            key={currentPage + (isAdminPage ? (isAdminAuthenticated ? '-dash' : '-login') : '')}
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
            {currentPage === 'admin' && (
              isAdminAuthenticated ? (
                <DashboardPage
                  onNavigate={handleNavigate}
                  onLogout={handleAdminLogout}
                  user={adminUser}
                />
              ) : (
                <AdminLoginPage
                  onLoginSuccess={handleAdminLoginSuccess}
                  onNavigate={handleNavigate}
                />
              )
            )}
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
