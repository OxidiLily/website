import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BackToTop } from './components/BackToTop';
import { SplashCursor } from './components/SplashCursor';
import { HomePage } from './pages/HomePage';
import { ProjectPage } from './pages/ProjectPage';
import { BlogPage } from './pages/BlogPage';
import { ContactPage } from './pages/ContactPage';
import { AboutPage } from './pages/AboutPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { PageId } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<{ email: string; name: string } | null>(null);

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
      }
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
    window.location.hash = page === 'admin' ? '/admin' : page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBlog = (postId: string) => {
    setCurrentPage('blog');
    setSelectedBlogId(postId);
    window.location.hash = `blog/${postId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProject = (projectId: string) => {
    setCurrentPage('project');
    setSelectedProjectId(projectId);
    window.location.hash = `project/${projectId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      {!isAdminPage && <SplashCursor />}

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
      <main className={`flex-1 w-full ${isAdminPage ? 'p-0 pb-0' : 'pb-32 md:pb-0'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage + (isAdminPage ? (isAdminAuthenticated ? '-dash' : '-login') : '')}
            initial={{ opacity: 0, y: isAdminPage ? 0 : 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isAdminPage ? 0 : -15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
            {currentPage === 'project' && <ProjectPage initialProjectId={selectedProjectId} />}
            {currentPage === 'blog' && (
              <BlogPage onNavigate={handleNavigate} initialPostId={selectedBlogId} />
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
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Fullscreen Footer (only on public frontend pages) */}
      {!isAdminPage && <Footer onNavigate={handleNavigate} />}

      {/* Back To Top Floating Action Button (only on public frontend pages) */}
      {!isAdminPage && <BackToTop />}
    </div>
  );
}
