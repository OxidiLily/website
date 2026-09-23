import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PageId } from '../types';
import { useSettings } from '../lib/content';
import { tautanAman } from '../lib/sanitasi';

interface FooterProps {
  onNavigate?: (page: PageId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const t = useSettings();

  const handleNav = (page: PageId) => {
    if (onNavigate) {
      onNavigate(page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      id="footer-section"
      className="relative z-20 w-full min-h-[85vh] md:min-h-[88vh] lg:min-h-screen bg-black text-white flex flex-col justify-between p-3 sm:p-5 md:p-6 lg:p-8 box-border"
    >
      {/* Main Fullscreen Semi-Transparent White Glass Card */}
      <div className="w-full flex-1 flex flex-col justify-between bg-white/90 backdrop-blur-2xl border border-white/60 text-black rounded-2xl sm:rounded-3xl md:rounded-[32px] p-5 sm:p-8 md:p-10 lg:p-14 xl:p-16 shadow-2xl overflow-hidden">
        {/* Top Spacer or Small Tag */}
        <div className="w-full flex justify-between items-center text-[10px] sm:text-xs md:text-xs font-semibold tracking-widest text-neutral-600 uppercase">
          <span>{t.footer_brand}</span>
          <span>{t.site_location}</span>
        </div>

        {/* Big Header Title (Fluid typography calibrated for mobile, tab, and desktop so it never wraps or overflows) */}
        <div className="my-auto py-6 sm:py-8 md:py-10 lg:py-12 text-center overflow-hidden">
          <h2 className="text-[11vw] sm:text-[9.5vw] md:text-[8.5vw] lg:text-[7.5rem] xl:text-[9rem] 2xl:text-[11rem] font-extrabold tracking-tighter text-black select-none leading-none whitespace-nowrap">
            {t.footer_wordmark}
          </h2>
        </div>

        {/* Bottom Section inside Card */}
        <div className="w-full space-y-5 sm:space-y-6 md:space-y-8">
          {/* Thin Divider Line */}
          <div className="w-full border-t border-black/10" />

          {/* 3 Columns Section: EMAIL | CHANNELS | LOCATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 md:gap-6 lg:gap-8 items-start">
            {/* Column 1: EMAIL */}
            <div className="space-y-1.5 sm:space-y-2">
              <span className="block text-[10px] sm:text-xs font-bold tracking-widest uppercase text-neutral-600">
                {t.footer_label_inquiry}
              </span>
              <a
                href={`mailto:${t.site_email}`}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm md:text-sm lg:text-base font-semibold text-black hover:text-neutral-600 transition-colors max-w-full"
              >
                <span className="truncate">{t.site_email}</span>
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>

            {/* Column 2: CHANNELS */}
            <div className="space-y-1.5 sm:space-y-2">
              <span className="block text-[10px] sm:text-xs font-bold tracking-widest uppercase text-neutral-600">
                {t.footer_label_channels}
              </span>
              <div className="flex flex-wrap items-center gap-x-3.5 sm:gap-x-5 gap-y-1.5 text-xs sm:text-sm md:text-sm lg:text-base font-semibold text-black">
                {([
                  [t.social_twitter_label, t.social_twitter],
                  [t.social_github_label, t.social_github],
                  [t.social_dribbble_label, t.social_dribbble],
                  [t.social_linkedin_label, t.social_linkedin],
                  [t.social_facebook_label, t.social_facebook],
                ] as const)
                  // Tautan sosial datang dari tabel `settings`, bukan dari kode.
                  // Nilai yang tidak berawalan skema yang sah (`javascript:`,
                  // `data:`) dibuang di sini, bukan dirender jadi tautan.
                  .filter(([label, url]) => label && url && tautanAman(url))
                  .map(([label, url]) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-neutral-600 transition-colors"
                    >
                      {label}
                    </a>
                  ))}
              </div>
            </div>

            {/* Column 3: LOCATION & AVAILABILITY */}
            <div className="space-y-1.5 sm:space-y-2 sm:col-span-2 md:col-span-1 md:text-right">
              <span className="block text-[10px] sm:text-xs font-bold tracking-widest uppercase text-neutral-600">
                {t.footer_label_base}
              </span>
              <p className="text-xs sm:text-sm md:text-sm lg:text-base font-semibold text-black">
                {t.footer_base}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-bar below Card */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 pt-4 pb-24 md:pb-6 text-xs sm:text-sm text-neutral-200 font-normal text-center sm:text-left">
        {/* Left Navigation links */}
        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3.5 sm:gap-6">
          {([
            ['home', t.nav_home],
            ['project', t.nav_project],
            ['blog', t.nav_blog],
            ['about', t.nav_about],
            ['contact', t.nav_contact],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => handleNav(id as PageId)}
              className="hover:text-white transition-colors cursor-pointer py-1"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right Copyright info. Pintu masuk admin sengaja TIDAK dipasang di UI —
            satu-satunya jalan adalah mengetik /admin/login langsung. */}
        <div className="flex items-center gap-3">
          <span>{t.footer_copyright}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
