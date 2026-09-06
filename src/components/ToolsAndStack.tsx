import React from 'react';
import { motion } from 'motion/react';
import type { ToolItem } from '../types';
import { LOGO, useSettings, useTools } from '../lib/content';

const ToolIcons = {
  Figma: () => (
    <svg className="w-6 h-6" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE" />
      <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83" />
      <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262" />
      <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E" />
      <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF" />
    </svg>
  ),
  React: () => (
    <svg className="w-6 h-6 text-[#00D8FF]" viewBox="-11.5 -10.23174 23 20.46348" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <circle cx="0" cy="0" r="2.05" fill="#00D8FF" />
      <g stroke="#00D8FF" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  ),
  Nextjs: () => (
    <div className="w-6 h-6 rounded-full bg-black border border-neutral-700 flex items-center justify-center">
      <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
        <mask height="180" id="mask0_next" maskUnits="userSpaceOnUse" width="180" x="0" y="0">
          <circle cx="90" cy="90" fill="black" r="90" />
        </mask>
        <g mask="url(#mask0_next)">
          <circle cx="90" cy="90" data-framer-name="Base" fill="black" r="90" />
          <path d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z" fill="white" />
          <rect fill="white" height="72" width="12" x="115" y="54" />
        </g>
      </svg>
    </div>
  ),
  Tailwind: () => (
    <svg className="w-6 h-6 text-[#38BDF8]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z" />
    </svg>
  ),
  V0: () => (
    <div className="w-6 h-6 flex items-center justify-center font-black tracking-tighter text-white font-mono text-sm">
      <span className="text-white">v</span>
      <span className="text-neutral-400 font-normal">0</span>
    </div>
  ),
  Vite: () => (
    <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M29.916 6.096L16.732 29.475C16.425 30.02 15.626 30.016 15.324 29.467L2.247 5.76C1.902 5.134 2.41 4.38 3.12 4.476L16.294 6.257C16.48 6.282 16.668 6.273 16.85 6.231L28.98 3.44C29.675 3.28 30.25 3.978 29.916 6.096Z" fill="url(#vite-grad1)" />
      <path d="M22.06 1.455L10.428 3.66C9.918 3.757 9.58 4.267 9.712 4.767L15.394 26.271C15.54 26.822 16.326 26.837 16.495 26.292L23.003 5.334C23.161 4.825 22.756 4.316 22.06 1.455Z" fill="url(#vite-grad2)" />
      <path d="M16.945 7.426L10.231 16.861C10.024 17.151 10.255 17.551 10.609 17.52L14.773 17.154L13.882 22.776C13.811 23.228 14.398 23.473 14.675 23.107L21.579 14.004C21.799 13.714 21.564 13.303 21.206 13.342L17.16 13.784L18.173 8.016C18.254 7.558 17.65 7.306 16.945 7.426Z" fill="#FFD02F" />
      <defs>
        <linearGradient id="vite-grad1" x1="1.95" y1="3.5" x2="28.95" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#41D1FF" />
          <stop offset="1" stopColor="#BD34FE" />
        </linearGradient>
        <linearGradient id="vite-grad2" x1="10" y1="2" x2="22" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFEA83" />
          <stop offset="0.5" stopColor="#FFDD35" />
          <stop offset="1" stopColor="#FFA800" />
        </linearGradient>
      </defs>
    </svg>
  ),
  TypeScript: () => (
    <div className="w-6 h-6 rounded-md bg-[#3178C6] flex items-center justify-center text-white font-bold text-[11px] font-sans tracking-tight shadow-sm">
      TS
    </div>
  ),
  GitHub: () => (
    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  ),
  VSCode: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.5 2L5.8 11.2L2.5 8.7C2.2 8.5 1.7 8.6 1.5 8.9L0.2 10.6C0 10.9 0 11.3 0.3 11.6L5.5 15.5L0.3 19.4C0 19.7 0 20.1 0.2 20.4L1.5 22.1C1.7 22.4 2.2 22.5 2.5 22.3L5.8 19.8L17.5 29V2Z" fill="#0065A9" />
      <path d="M17.5 2L5.8 11.2L17.5 20.4V2Z" fill="#007ACC" />
      <path d="M17.5 20.4L5.8 11.2L17.5 2V20.4Z" fill="#1F9CF0" />
      <path d="M23.1 3.7C23.6 4.1 24 4.8 24 5.5V16.5C24 17.2 23.6 17.9 23.1 18.3L17.5 22.8V22.4L17.5 2L23.1 3.7Z" fill="#007ACC" />
    </svg>
  ),
  Vercel: () => (
    <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1L24 22H0L12 1Z" />
    </svg>
  ),
  Notion: () => (
    <div className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center font-serif font-black text-sm shadow-sm">
      N
    </div>
  ),
  Cursor: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z" fill="#262626" stroke="#A3A3A3" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M12 2V22" stroke="#A3A3A3" strokeWidth="1.2" />
      <path d="M3 7.2L21 16.8" stroke="#A3A3A3" strokeWidth="1.2" />
      <path d="M21 7.2L3 16.8" stroke="#A3A3A3" strokeWidth="1.2" />
      <path d="M12 12L21 7.2M12 12L3 7.2M12 12V22" fill="#404040" />
    </svg>
  ),
  Astro: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L4 21H8.5L10 17.5H14L15.5 21H20L12 3Z" fill="white" />
      <path d="M12 7.5L10.8 14H13.2L12 7.5Z" fill="#FF5D01" />
      <circle cx="12" cy="19.5" r="1.5" fill="#FF5D01" />
    </svg>
  ),
  Shadcn: () => (
    <svg className="w-6 h-6 text-white" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="208" y1="128" x2="128" y2="208" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="192" y1="40" x2="40" y2="192" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/**
 * Ikon merek bawaan, dikunci pada nama tool yang dinormalkan ("Next.js" dan
 * "next js" sama-sama jatuh ke `nextjs`). Ini yang dipakai kalau admin belum
 * mengunggah ikon sendiri untuk tool itu.
 */
const BRAND_ICONS: Record<string, () => React.ReactElement> = {
  figma: ToolIcons.Figma,
  nextjs: ToolIcons.Nextjs,
  v0: ToolIcons.V0,
  typescript: ToolIcons.TypeScript,
  vscode: ToolIcons.VSCode,
  notion: ToolIcons.Notion,
  astro: ToolIcons.Astro,
  react: ToolIcons.React,
  tailwindcss: ToolIcons.Tailwind,
  vite: ToolIcons.Vite,
  github: ToolIcons.GitHub,
  vercel: ToolIcons.Vercel,
  cursor: ToolIcons.Cursor,
  shadcnui: ToolIcons.Shadcn,
};

const brandKey = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Urutan pemilihan ikon: gambar yang diunggah admin → ikon merek bawaan →
 * logo situs. Tool baru yang dibuat dari panel karena itu selalu punya ikon,
 * bukan kotak kosong, walau adminnya belum sempat mengunggah apa pun.
 */
const ToolIcon: React.FC<{ tool: ToolItem }> = ({ tool }) => {
  if (tool.icon) {
    return <img src={tool.icon} alt="" className="w-6 h-6 object-contain" loading="lazy" />;
  }
  const Brand = BRAND_ICONS[brandKey(tool.name)];
  if (Brand) return <Brand />;
  return <img src={LOGO} alt="" className="w-6 h-6 object-contain" loading="lazy" />;
};

export const ToolsAndStack: React.FC = () => {
  const t = useSettings();
  const tools = useTools();

  // Dua kolom seimbang; ganjil ditaruh di kolom kiri. Sebelumnya isi tiap
  // kolom ditulis manual, jadi menambah satu tool dari panel akan membuat
  // kolomnya timpang selamanya.
  const tengah = Math.ceil(tools.length / 2);
  const leftColumn = tools.slice(0, tengah);
  const rightColumn = tools.slice(tengah);

  const renderCard = (item: ToolItem, index: number) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.4, delay: index * 0.03 }}
      className="group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-neutral-950/70 hover:bg-neutral-900/90 border border-neutral-800/80 hover:border-neutral-700 transition-all duration-200 backdrop-blur-sm overflow-hidden"
    >
      {/* Subtle Diagonal Hatch Texture matching reference */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 group-hover:opacity-45 transition-opacity"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.03) 0, rgba(255, 255, 255, 0.03) 1px, transparent 0, transparent 10px)',
        }}
      />

      <div className="relative z-10 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shrink-0 shadow-inner">
          <ToolIcon tool={item} />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm sm:text-base font-semibold text-white group-hover:text-amber-300 transition-colors">
            {item.name}
          </h4>
          <p className="text-[10px] sm:text-[11px] font-mono tracking-wider text-neutral-400 uppercase font-medium">
            {item.category}
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <section id="tools-section" className="scroll-mt-24 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {t.about_tools_heading}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">{leftColumn.map((item, idx) => renderCard(item, idx))}</div>
          <div className="space-y-4">
            {rightColumn.map((item, idx) => renderCard(item, idx + tengah))}
          </div>
        </div>
      </div>
    </section>
  );
};
