import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PageId } from '../types';

interface FooterProps {
  onNavigate?: (page: PageId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNav = (page: PageId) => {
    if (onNavigate) {
      onNavigate(page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      id="footer-section"
      className="relative z-20 w-full min-h-screen bg-transparent text-white flex flex-col justify-between p-3 sm:p-6 md:p-8 lg:p-10 box-border"
    >
      {/* Main Fullscreen Transparent Glass Card */}
      <div className="w-full flex-1 flex flex-col justify-between bg-black/40 backdrop-blur-xl border border-white/10 text-white rounded-3xl sm:rounded-[36px] p-6 sm:p-10 md:p-14 lg:p-20 shadow-2xl">
        {/* Top Spacer or Small Tag */}
        <div className="w-full flex justify-between items-center text-xs font-semibold tracking-widest text-neutral-400 uppercase">
          <span>Studio Craft • Portfolio & Store</span>
          <span>San Francisco, CA 🇺🇸</span>
        </div>

        {/* Big Header Title */}
        <div className="my-auto py-8 sm:py-12 md:py-16 text-center">
          <h2 className="text-6xl sm:text-8xl md:text-9xl lg:text-[11rem] xl:text-[13rem] font-extrabold tracking-tighter text-white select-none leading-none">
            Studio.craft
          </h2>
        </div>

        {/* Bottom Section inside Card */}
        <div className="w-full space-y-8">
          {/* Thin Divider Line */}
          <div className="w-full border-t border-white/10" />

          {/* 3 Columns Section: EMAIL | FOLLOW US | LOCATION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 items-start">
            {/* Column 1: EMAIL */}
            <div className="space-y-2">
              <span className="block text-xs font-bold tracking-widest uppercase text-neutral-400">
                DIRECT INQUIRY
              </span>
              <a
                href="mailto:hello@independent-designer.com"
                className="inline-flex items-center gap-1.5 text-sm sm:text-base font-medium text-white hover:text-neutral-300 transition-colors"
              >
                <span>hello@independent-designer.com</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            {/* Column 2: FOLLOW US */}
            <div className="space-y-2">
              <span className="block text-xs font-bold tracking-widest uppercase text-neutral-400">
                CHANNELS
              </span>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm sm:text-base font-medium text-white">
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-neutral-300 transition-colors">
                  X / Twitter
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-neutral-300 transition-colors">
                  GitHub
                </a>
                <a href="https://dribbble.com" target="_blank" rel="noreferrer" className="hover:text-neutral-300 transition-colors">
                  Dribbble
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-neutral-300 transition-colors">
                  LinkedIn
                </a>
              </div>
            </div>

            {/* Column 3: LOCATION & AVAILABILITY */}
            <div className="space-y-2 md:text-right">
              <span className="block text-xs font-bold tracking-widest uppercase text-neutral-400">
                BASE & TIMEZONE
              </span>
              <p className="text-sm sm:text-base font-medium text-white">
                San Francisco, CA (PT UTC-7)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-bar below Card */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 px-4 pt-6 pb-2 text-xs sm:text-sm text-neutral-400 font-normal">
        {/* Left Navigation links */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <button onClick={() => handleNav('home')} className="hover:text-white transition-colors cursor-pointer">
            Home
          </button>
          <button onClick={() => handleNav('project')} className="hover:text-white transition-colors cursor-pointer">
            Project
          </button>
          <button onClick={() => handleNav('blog')} className="hover:text-white transition-colors cursor-pointer">
            Blog
          </button>
          <button onClick={() => handleNav('shop')} className="hover:text-white transition-colors cursor-pointer">
            Shop
          </button>
          <button onClick={() => handleNav('about')} className="hover:text-white transition-colors cursor-pointer">
            About
          </button>
          <button onClick={() => handleNav('contact')} className="hover:text-white transition-colors cursor-pointer">
            Contact
          </button>
        </div>

        {/* Right Copyright info */}
        <div>
          <span>© 2026 Studio.craft. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
