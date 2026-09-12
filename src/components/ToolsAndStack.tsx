import React from 'react';
import { motion } from 'motion/react';
import type { ToolItem } from '../types';
import { LOGO, useSettings, useTools } from '../lib/content';
import { warnaIkon } from '../lib/warna';
import {
  siAstro, siBun, siClaude, siCloudflare, siCss, siCursor, siDart, siDebian, siDocker, siFigma,
  siFlutter, siGit, siGithub, siGo, siHtml5, siJavascript, siKotlin, siLaravel, siLinux, siMysql,
  siNextdotjs, siNginx, siNodedotjs, siNotion, siOllama, siPhp, siPostgresql, siProxmox, siPython,
  siReact, siRust, siShadcnui, siSupabase, siSvelte, siSwift, siTailwindcss, siThreedotjs,
  siTypescript, siUbuntu, siV0, siVercel, siVite, siVuedotjs,
} from 'simple-icons';

/**
 * Ikon merek dari Simple Icons — bentuk resmi tiap merek, bukan gambar
 * tangan yang "mirip". Sebelumnya tiap ikon adalah SVG yang ditulis manual
 * dan sebagian cuma bentuk generik (Cursor digambar sebagai kubus). Daftar ini
 * dikurasi, bukan seluruh paket: Vite hanya membundel ikon yang diimpor, dan
 * mengimpor semuanya berarti ribuan ikon ikut ke pengunjung.
 *
 * VS Code tidak ada di Simple Icons (dicabut atas permintaan merek dagang),
 * jadi tetap memakai SVG manual di bawah.
 */

type IkonMerek = { path: string; hex: string; title: string };

// Kunci = nama tool yang dinormalkan (huruf kecil, tanpa tanda baca), jadi
// "Next.js", "next js", dan "NextJS" sama-sama jatuh ke `nextjs`.
const IKON_MEREK: Record<string, IkonMerek> = {
  astro: siAstro, bun: siBun, claude: siClaude, cloudflare: siCloudflare, css: siCss, css3: siCss,
  cursor: siCursor, dart: siDart, debian: siDebian, docker: siDocker, figma: siFigma,
  flutter: siFlutter, git: siGit, github: siGithub, go: siGo, golang: siGo, html: siHtml5,
  html5: siHtml5, javascript: siJavascript, js: siJavascript, kotlin: siKotlin, laravel: siLaravel,
  linux: siLinux, mysql: siMysql, nextjs: siNextdotjs, nginx: siNginx, nodejs: siNodedotjs,
  node: siNodedotjs, notion: siNotion, ollama: siOllama, php: siPhp, postgresql: siPostgresql,
  postgres: siPostgresql, proxmox: siProxmox, python: siPython, react: siReact, rust: siRust,
  shadcnui: siShadcnui, shadcn: siShadcnui, supabase: siSupabase, svelte: siSvelte, swift: siSwift,
  tailwindcss: siTailwindcss, tailwind: siTailwindcss, threejs: siThreedotjs, typescript: siTypescript,
  ts: siTypescript, ubuntu: siUbuntu, v0: siV0, vercel: siVercel, vite: siVite, vuejs: siVuedotjs,
  vue: siVuedotjs,
};

const IkonSimple: React.FC<{ ikon: IkonMerek }> = ({ ikon }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" role="img" aria-label={ikon.title} xmlns="http://www.w3.org/2000/svg">
    <path d={ikon.path} fill={warnaIkon(ikon.hex)} />
  </svg>
);

const IkonVSCode = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5 2L5.8 11.2L2.5 8.7C2.2 8.5 1.7 8.6 1.5 8.9L0.2 10.6C0 10.9 0 11.3 0.3 11.6L5.5 15.5L0.3 19.4C0 19.7 0 20.1 0.2 20.4L1.5 22.1C1.7 22.4 2.2 22.5 2.5 22.3L5.8 19.8L17.5 29V2Z" fill="#0065A9" />
    <path d="M17.5 2L5.8 11.2L17.5 20.4V2Z" fill="#007ACC" />
    <path d="M17.5 20.4L5.8 11.2L17.5 2V20.4Z" fill="#1F9CF0" />
    <path d="M23.1 3.7C23.6 4.1 24 4.8 24 5.5V16.5C24 17.2 23.6 17.9 23.1 18.3L17.5 22.8V22.4L17.5 2L23.1 3.7Z" fill="#007ACC" />
  </svg>
);

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
  const kunci = brandKey(tool.name);
  if (kunci === 'vscode' || kunci === 'visualstudiocode') return <IkonVSCode />;
  const merek = IKON_MEREK[kunci];
  if (merek) return <IkonSimple ikon={merek} />;
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
