import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Layers, 
  BookOpen, 
  User, 
  Mail, 
  ArrowUpRight,
  Sparkles,
  Heart,
  Search,
  Command,
  MessageSquare,
  LayoutDashboard
} from 'lucide-react';
import { PageId } from '../types';
import { AiAssistantModal } from './AiAssistantModal';
import { GlobalSearchModal } from './GlobalSearchModal';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onSelectBlog?: (postId: string) => void;
  onSelectProject?: (projectId: string) => void;
}

interface MobileNavItem {
  id: PageId | 'search';
  name: string;
  icon: React.FC<{ className?: string }>;
}

const desktopNavLinks: { id: PageId; name: string; href: string; badge?: string }[] = [
  { id: 'home', name: 'Home', href: '#home' },
  { id: 'project', name: 'Project', href: '#project' },
  { id: 'blog', name: 'Blog', href: '#blog' },
  { id: 'about', name: 'About', href: '#about' },
  { id: 'contact', name: 'Contact', href: '#contact' },
];

export const Navbar: React.FC<NavbarProps> = ({ 
  currentPage, 
  onNavigate,
  onSelectBlog,
  onSelectProject
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<PageId | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global keyboard shortcut to open search modal (Cmd+K, Ctrl+K, or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K or Ctrl+K or / (when not focused in an input)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavClick = (pageId: PageId) => {
    onNavigate(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navTransition = {
    duration: 0.45,
    ease: [0.16, 1, 0.3, 1],
  };

  return (
    <>
      {/* Mobile-First Sticky Top Bar (Shown on Mobile screens < md) */}
      <header
        id="mobile-top-bar"
        className="md:hidden sticky top-0 left-0 right-0 z-30 w-full bg-black/85 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 flex items-center justify-between transition-colors"
      >
        {/* Brand Logo & Name */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2 text-white font-bold tracking-tight text-base cursor-pointer focus:outline-none"
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-white"
            >
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" fill="currentColor" fillOpacity="0.12" />
              <path d="m3.3 7 8.7 5 8.7-5" stroke="currentColor" strokeWidth="2" />
              <path d="M12 22V12" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <span className="font-semibold text-white tracking-tight text-sm">Studio.craft</span>
        </button>

        {/* Mobile Header Quick Actions - intentionally empty to keep mobile clean as requested */}
        <div className="flex items-center gap-2" />
      </header>

      {/* Desktop Top Navbar Header (Shown on tablet and desktop: md:block) */}
      <motion.header
        id="main-navbar"
        initial={false}
        animate={{
          paddingTop: isScrolled ? 20 : 0,
          paddingLeft: isScrolled ? 16 : 0,
          paddingRight: isScrolled ? 16 : 0,
        }}
        transition={navTransition}
        className="hidden md:block fixed top-0 left-0 right-0 z-40 pointer-events-none"
      >
        <motion.div
          initial={false}
          animate={{
            maxWidth: isScrolled ? '1040px' : '100%',
            height: isScrolled ? 56 : 64,
            borderRadius: isScrolled ? 9999 : 0,
            borderBottomWidth: 1,
            borderTopWidth: isScrolled ? 1 : 0,
            borderLeftWidth: isScrolled ? 1 : 0,
            borderRightWidth: isScrolled ? 1 : 0,
            paddingLeft: isScrolled ? 16 : 24,
            paddingRight: isScrolled ? 16 : 24,
            boxShadow: isScrolled
              ? '0 12px 30px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.08)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
          }}
          transition={navTransition}
          className="w-full mx-auto flex items-center justify-between pointer-events-auto bg-white/95 text-black backdrop-blur-md border-neutral-200/90"
        >
          {/* Brand Logo & Title */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 text-black font-bold tracking-tight text-base sm:text-lg cursor-pointer select-none group shrink-0"
          >
            {/* Isometric Cube Icon */}
            <div className="relative w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 sm:w-6 sm:h-6 text-black transform group-hover:scale-105 transition-transform"
              >
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" fill="currentColor" fillOpacity="0.06" />
                <path d="m3.3 7 8.7 5 8.7-5" stroke="currentColor" strokeWidth="2.2" />
                <path d="M12 22V12" stroke="currentColor" strokeWidth="2.2" />
                <path d="M7.5 4.5 16.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1 1" />
              </svg>
            </div>
            <span className="font-semibold text-black tracking-tight text-sm sm:text-base">Studio.craft</span>
          </button>

          {/* Desktop/Tablet Center Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-0.5 lg:gap-1 text-xs lg:text-sm font-medium"
            onMouseLeave={() => setHoveredNav(null)}
          >
            {desktopNavLinks.map((link) => {
              const isActive = currentPage === link.id;
              const isHovered = hoveredNav === link.id;

              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  onMouseEnter={() => setHoveredNav(link.id)}
                  className={`relative flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-full text-xs lg:text-sm transition-colors cursor-pointer select-none whitespace-nowrap ${
                    isActive
                      ? 'text-black font-semibold'
                      : 'text-neutral-600 hover:text-black font-medium'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 bg-neutral-200/80 rounded-full -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  {!isActive && isHovered && (
                    <motion.div
                      layoutId="navbar-hover-pill"
                      className="absolute inset-0 bg-neutral-100 rounded-full -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    />
                  )}

                  <span>{link.name}</span>

                  {link.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-black text-white rounded-full font-semibold">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Area: Search Trigger (shown on tab/desktop) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Trigger Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search all content"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-neutral-100/90 hover:bg-neutral-200/90 border border-neutral-200 text-neutral-700 hover:text-black text-xs font-medium transition-all cursor-pointer select-none shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-xs font-medium text-neutral-800">Search</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 bg-white text-neutral-700 rounded border border-neutral-200 shadow-2xs ml-0.5">
                <span>⌘</span>K
              </kbd>
            </motion.button>
          </div>
        </motion.div>
      </motion.header>

      {/* Mobile Floating Dock with Center Curved Notch & Circular Disc Buttons */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none px-2 pb-[env(safe-area-inset-bottom)]"
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="pointer-events-auto relative w-[340px] max-w-[94vw] h-[60px]"
        >
          {/* SVG Background with Flared Curved Scoop / Notch */}
          <svg
            viewBox="0 0 340 60"
            className="absolute inset-0 w-full h-full filter drop-shadow-[0_16px_36px_rgba(0,0,0,0.9)] pointer-events-none"
          >
            {/* Dark background fill with smooth flared curved scoop matching reference image */}
            <path
              d="
                M 26,0
                L 122,0
                C 132,0 138,4 142,11
                C 147,24 157,36 170,36
                C 183,36 193,24 198,11
                C 202,4 208,0 218,0
                L 314,0
                A 26,26 0 0 1 340,26
                L 340,34
                A 26,26 0 0 1 314,60
                L 26,60
                A 26,26 0 0 1 0,34
                L 0,26
                A 26,26 0 0 1 26,0
                Z
              "
              className="fill-[#0c0c0e]/95 backdrop-blur-2xl"
            />
            {/* Highlighted stroke border highlighting the smooth flared curved scoop */}
            <path
              d="
                M 26,0
                L 122,0
                C 132,0 138,4 142,11
                C 147,24 157,36 170,36
                C 183,36 193,24 198,11
                C 202,4 208,0 218,0
                L 314,0
                A 26,26 0 0 1 340,26
                L 340,34
                A 26,26 0 0 1 314,60
                L 26,60
                A 26,26 0 0 1 0,34
                L 0,26
                A 26,26 0 0 1 26,0
                Z
              "
              fill="none"
              stroke="rgba(255, 255, 255, 0.18)"
              strokeWidth="1.2"
            />
          </svg>

          {/* Elevated Center AI Button (Sitting nestled comfortably in the curved scoop) */}
          <div className="absolute left-1/2 -top-5 -translate-x-1/2 z-20 flex items-center justify-center pointer-events-auto">
            <motion.button
              onClick={() => setIsAiOpen(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              aria-label="Buka AI Assistant"
              className="relative w-[50px] h-[50px] rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 shadow-[0_10px_25px_rgba(99,102,241,0.6),0_0_15px_rgba(34,211,238,0.5)] cursor-pointer focus:outline-none group"
            >
              {/* Inner Circular Disc */}
              <div className="w-full h-full rounded-full bg-[#121216] border border-white/30 flex flex-col items-center justify-center relative overflow-hidden group-hover:bg-[#181820] transition-colors">
                <Sparkles className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)] group-hover:scale-110 transition-transform" />
                <span className="text-[8px] font-black tracking-wider text-white uppercase font-mono mt-0.5 leading-none">
                  AI
                </span>
              </div>
            </motion.button>
          </div>

          {/* Nav Icons Container (Symmetrical Circular Disc Buttons with evenly distributed spacing) */}
          <div className="relative z-10 w-full h-full flex items-center justify-between px-2.5 sm:px-3">
            {/* Left Nav Group: Home, Projects, Blog (3 circular buttons) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* 1. Home */}
              <button
                onClick={() => handleNavClick('home')}
                aria-label="Home"
                className="relative p-0 m-0 border-0 bg-transparent cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    currentPage === 'home'
                      ? 'bg-neutral-800 text-white ring-1 ring-white/20 shadow-inner'
                      : 'bg-[#1c1c1f] text-neutral-400 hover:text-white hover:bg-[#2a2a2e] active:scale-90'
                  }`}
                >
                  <Home className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${currentPage === 'home' ? 'stroke-[2.2] text-white' : 'stroke-[1.8]'}`} />
                </div>
              </button>

              {/* 2. Projects */}
              <button
                onClick={() => handleNavClick('project')}
                aria-label="Projects"
                className="relative p-0 m-0 border-0 bg-transparent cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    currentPage === 'project'
                      ? 'bg-neutral-800 text-white ring-1 ring-white/20 shadow-inner'
                      : 'bg-[#1c1c1f] text-neutral-400 hover:text-white hover:bg-[#2a2a2e] active:scale-90'
                  }`}
                >
                  <Layers className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${currentPage === 'project' ? 'stroke-[2.2] text-white' : 'stroke-[1.8]'}`} />
                </div>
              </button>

              {/* 3. Blog */}
              <button
                onClick={() => handleNavClick('blog')}
                aria-label="Blog"
                className="relative p-0 m-0 border-0 bg-transparent cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    currentPage === 'blog'
                      ? 'bg-neutral-800 text-white ring-1 ring-white/20 shadow-inner'
                      : 'bg-[#1c1c1f] text-neutral-400 hover:text-white hover:bg-[#2a2a2e] active:scale-90'
                  }`}
                >
                  <BookOpen className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${currentPage === 'blog' ? 'stroke-[2.2] text-white' : 'stroke-[1.8]'}`} />
                </div>
              </button>
            </div>

            {/* Center Gap fitting the flared scoop curve and AI button comfortably without dead zones */}
            <div className="w-12 sm:w-14 shrink-0 pointer-events-none" />

            {/* Right Nav Group: Contact, About, Search (3 circular buttons) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* 4. Contact */}
              <button
                onClick={() => handleNavClick('contact')}
                aria-label="Contact"
                className="relative p-0 m-0 border-0 bg-transparent cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    currentPage === 'contact'
                      ? 'bg-neutral-800 text-white ring-1 ring-white/20 shadow-inner'
                      : 'bg-[#1c1c1f] text-neutral-400 hover:text-white hover:bg-[#2a2a2e] active:scale-90'
                  }`}
                >
                  <Mail className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${currentPage === 'contact' ? 'stroke-[2.2] text-white' : 'stroke-[1.8]'}`} />
                </div>
              </button>

              {/* 5. About */}
              <button
                onClick={() => handleNavClick('about')}
                aria-label="About"
                className="relative p-0 m-0 border-0 bg-transparent cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    currentPage === 'about'
                      ? 'bg-neutral-800 text-white ring-1 ring-white/20 shadow-inner'
                      : 'bg-[#1c1c1f] text-neutral-400 hover:text-white hover:bg-[#2a2a2e] active:scale-90'
                  }`}
                >
                  <User className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${currentPage === 'about' ? 'stroke-[2.2] text-white' : 'stroke-[1.8]'}`} />
                </div>
              </button>

              {/* 6. Search (Paling Kanan) */}
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search All Content"
                className="relative p-0 m-0 border-0 bg-transparent cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSearchOpen
                      ? 'bg-neutral-800 text-amber-300 ring-1 ring-amber-400/40 shadow-inner'
                      : 'bg-[#1c1c1f] text-neutral-400 hover:text-white hover:bg-[#2a2a2e] active:scale-90'
                  }`}
                >
                  <Search className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isSearchOpen ? 'stroke-[2.2] text-amber-300' : 'stroke-[1.8]'}`} />
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </nav>

      {/* Global Content Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavClick}
        onSelectBlog={onSelectBlog}
        onSelectProject={onSelectProject}
      />

      {/* Floating Circular Chat AI Button (Hidden on mobile, visible on Tablet & Desktop views) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex fixed md:bottom-7 right-4 md:right-8 z-40 items-center justify-end group"
      >
        {/* Hover Tooltip Pill (Desktop) */}
        <div className="hidden md:flex pointer-events-none absolute right-full mr-3 items-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/95 text-white border border-neutral-700/80 shadow-xl backdrop-blur-md text-xs font-semibold whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Chat AI</span>
          </div>
        </div>

        {/* Circular Chat AI Button (Enlarged ~1.6x) */}
        <motion.button
          id="chat-ai-fab-btn"
          onClick={() => setIsAiOpen(true)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Buka Chat AI"
          className="relative w-15 h-15 md:w-16 md:h-16 rounded-full bg-neutral-900/95 text-white border border-neutral-700/80 shadow-2xl backdrop-blur-md hover:bg-neutral-800 hover:border-cyan-400/70 transition-all flex items-center justify-center cursor-pointer select-none"
        >
          {/* Subtle glowing animated gradient border hover effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Sparkle badge on top right corner */}
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full flex items-center justify-center border-2 border-black shadow-md">
            <Sparkles className="w-2.5 h-2.5 text-black stroke-[2.5]" />
          </div>

          {/* Center Chat Message Icon */}
          <MessageSquare className="w-7 h-7 text-neutral-100 group-hover:text-cyan-300 transition-colors duration-200" />
        </motion.button>
      </motion.div>

      {/* Interactive AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onNavigate={handleNavClick}
      />
    </>
  );
};

export default Navbar;
