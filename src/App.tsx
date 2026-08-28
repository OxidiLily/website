import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BackToTop } from './components/BackToTop';
import { HomePage } from './pages/HomePage';
import { ProjectPage } from './pages/ProjectPage';
import { BlogPage } from './pages/BlogPage';
import { ShopPage } from './pages/ShopPage';
import { ContactPage } from './pages/ContactPage';
import { AboutPage } from './pages/AboutPage';
import { PageId } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');

  // Sync state with URL hash on mount and when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['home', 'project', 'blog', 'shop', 'contact', 'about'].includes(hash)) {
        setCurrentPage(hash as PageId);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black flex flex-col justify-between">
      {/* Dynamic Sticky / Floating Navbar */}
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main Content Area with Page Switcher */}
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
            {currentPage === 'project' && <ProjectPage />}
            {currentPage === 'blog' && <BlogPage onNavigate={handleNavigate} />}
            {currentPage === 'shop' && <ShopPage />}
            {currentPage === 'contact' && <ContactPage />}
            {currentPage === 'about' && <AboutPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Fullscreen Shadcnblocks Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Back To Top Floating Action Button */}
      <BackToTop />
    </div>
  );
}
