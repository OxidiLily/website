import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { PageId, NavLinkItem } from '../types';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

const navLinks: NavLinkItem[] = [
  { id: 'home', name: 'Home', href: '#home' },
  { id: 'project', name: 'Project', href: '#project' },
  { id: 'blog', name: 'Blog', href: '#blog' },
  { id: 'shop', name: 'Shop', href: '#shop', badge: 'New' },
  { id: 'about', name: 'About', href: '#about' },
  { id: 'contact', name: 'Contact', href: '#contact' },
];

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<PageId | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleNavClick = (pageId: PageId) => {
    setMobileMenuOpen(false);
    onNavigate(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navTransition = {
    duration: 0.45,
    ease: [0.16, 1, 0.3, 1],
  };

  return (
    <motion.header
      id="main-navbar"
      initial={false}
      animate={{
        paddingTop: isScrolled ? 36 : 0,
        paddingLeft: isScrolled ? 16 : 0,
        paddingRight: isScrolled ? 16 : 0,
      }}
      transition={navTransition}
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
    >
      <motion.div
        initial={false}
        animate={{
          maxWidth: isScrolled ? '980px' : '100%',
          height: isScrolled ? 56 : 64,
          borderRadius: isScrolled ? 9999 : 0,
          borderBottomWidth: 1,
          borderTopWidth: isScrolled ? 1 : 0,
          borderLeftWidth: isScrolled ? 1 : 0,
          borderRightWidth: isScrolled ? 1 : 0,
          paddingLeft: isScrolled ? 20 : 36,
          paddingRight: isScrolled ? 20 : 36,
          boxShadow: isScrolled
            ? '0 12px 30px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.08)'
            : '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        }}
        transition={navTransition}
        className="w-full mx-auto flex items-center justify-between pointer-events-auto bg-white/95 text-black backdrop-blur-md border-neutral-200/90"
      >
        {/* Left: Brand Logo & Title */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 text-black font-bold tracking-tight text-base sm:text-lg cursor-pointer select-none group"
        >
          {/* Isometric Cube Icon */}
          <div className="relative w-6 h-6 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-black transform group-hover:scale-105 transition-transform"
            >
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" fill="currentColor" fillOpacity="0.06" />
              <path d="m3.3 7 8.7 5 8.7-5" stroke="currentColor" strokeWidth="2.2" />
              <path d="M12 22V12" stroke="currentColor" strokeWidth="2.2" />
              <path d="M7.5 4.5 16.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1 1" />
            </svg>
          </div>
          <span className="font-semibold text-black tracking-tight">Studio.craft</span>
        </button>

        {/* Center: Desktop Navigation Links (Home, Project, Blog, Shop, About, Contact) */}
        <nav
          className="hidden md:flex items-center gap-1 text-sm font-medium"
          onMouseLeave={() => setHoveredNav(null)}
        >
          {navLinks.map((link) => {
            const isActive = currentPage === link.id;
            const isHovered = hoveredNav === link.id;

            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                onMouseEnter={() => setHoveredNav(link.id)}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm transition-colors cursor-pointer select-none ${
                  isActive
                    ? 'text-black font-semibold'
                    : 'text-neutral-600 hover:text-black font-medium'
                }`}
              >
                {/* Active or Hover Background Pill */}
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

        {/* Right: Quick Action (Hire / Contact CTA) */}
        <div className="hidden md:flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleNavClick('contact')}
            className="bg-black text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold hover:bg-neutral-800 transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <span>Let's Talk</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 text-neutral-800 hover:text-black cursor-pointer"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </motion.div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={`md:hidden max-w-5xl p-4 bg-white border border-neutral-200 flex flex-col gap-1.5 text-sm text-neutral-800 shadow-2xl pointer-events-auto overflow-hidden transition-all duration-300 ${
              isScrolled ? 'mx-auto mt-3 rounded-3xl' : 'mx-4 mt-2 rounded-2xl'
            }`}
          >
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-neutral-100 text-black font-bold'
                      : 'text-neutral-700 hover:bg-neutral-50 hover:text-black'
                  }`}
                >
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="text-[10px] px-2 py-0.5 bg-black text-white rounded-full font-semibold">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-2 border-t border-neutral-100">
              <button
                onClick={() => handleNavClick('contact')}
                className="w-full py-2.5 rounded-xl bg-black text-white font-semibold text-sm hover:bg-neutral-800 transition-colors text-center"
              >
                Let's Talk
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
