import React from 'react';
import { motion } from 'motion/react';
import type { ToolItem } from '../types';
import { LOGO, useSettings, useTools } from '../lib/content';
import { warnaIkon } from '../lib/warna';
import { siClaude, siCursor, siOllama, siProxmox, siShadcnui, siV0 } from 'simple-icons';
// Salinan devicon astro-original.svg dengan huruf A-nya diputihkan: aslinya
// gradasi hitam-ungu (logo untuk latar terang) yang lenyap di kartu hitam,
// sementara api jingganya harus tetap jingga — jadi tidak bisa sekadar
// dibalik warnanya seperti GitHub/Vercel.
import astro from '../assets/ikon/astro-latar-gelap.svg';
import bun from 'devicon/icons/bun/bun-original.svg';
import cloudflare from 'devicon/icons/cloudflare/cloudflare-original.svg';
import css3 from 'devicon/icons/css3/css3-original.svg';
import dart from 'devicon/icons/dart/dart-original.svg';
import debian from 'devicon/icons/debian/debian-original.svg';
import docker from 'devicon/icons/docker/docker-original.svg';
import figma from 'devicon/icons/figma/figma-original.svg';
import flutter from 'devicon/icons/flutter/flutter-original.svg';
import git from 'devicon/icons/git/git-original.svg';
import github from 'devicon/icons/github/github-original.svg';
import go from 'devicon/icons/go/go-original.svg';
import html5 from 'devicon/icons/html5/html5-original.svg';
import javascript from 'devicon/icons/javascript/javascript-original.svg';
import kotlin from 'devicon/icons/kotlin/kotlin-original.svg';
import laravel from 'devicon/icons/laravel/laravel-original.svg';
import linux from 'devicon/icons/linux/linux-original.svg';
import mysql from 'devicon/icons/mysql/mysql-original.svg';
import nextjs from 'devicon/icons/nextjs/nextjs-original.svg';
import nginx from 'devicon/icons/nginx/nginx-original.svg';
import nodejs from 'devicon/icons/nodejs/nodejs-original.svg';
import notion from 'devicon/icons/notion/notion-original.svg';
import php from 'devicon/icons/php/php-original.svg';
import postgresql from 'devicon/icons/postgresql/postgresql-original.svg';
import python from 'devicon/icons/python/python-original.svg';
import react from 'devicon/icons/react/react-original.svg';
import rust from 'devicon/icons/rust/rust-original.svg';
import supabase from 'devicon/icons/supabase/supabase-original.svg';
import svelte from 'devicon/icons/svelte/svelte-original.svg';
import swift from 'devicon/icons/swift/swift-original.svg';
import tailwindcss from 'devicon/icons/tailwindcss/tailwindcss-original.svg';
import threejs from 'devicon/icons/threejs/threejs-original.svg';
import typescript from 'devicon/icons/typescript/typescript-original.svg';
import ubuntu from 'devicon/icons/ubuntu/ubuntu-original.svg';
import vercel from 'devicon/icons/vercel/vercel-original.svg';
import vite from 'devicon/icons/vitejs/vitejs-original.svg';
import vscode from 'devicon/icons/vscode/vscode-original.svg';
import vuejs from 'devicon/icons/vuejs/vuejs-original.svg';

/**
 * Logo merek BERWARNA resmi dari Devicon (varian `-original`): Figma dengan
 * lima warnanya, Astro dengan roket jingga, Next.js lingkaran hitam ber-N
 * putih. Simple Icons yang dipakai sebelumnya sengaja satu warna — bentuknya
 * resmi, warnanya tidak.
 *
 * Daftar ini dikurasi, bukan seluruh paket: setiap SVG yang diimpor ikut ke
 * bundel (yang kecil disisipkan sebagai data URI), dan mengimpor ratusan logo
 * berarti pengunjung mengunduh ratusan logo.
 *
 * Kunci = nama tool yang dinormalkan (huruf kecil, tanpa tanda baca), jadi
 * "Next.js", "next js", dan "NextJS" sama-sama jatuh ke `nextjs`.
 */
const LOGO_MEREK: Record<string, string> = {
  astro, bun, cloudflare, css: css3, css3, dart, debian, docker, figma, flutter, git, github, go,
  golang: go, html: html5, html5, javascript, js: javascript, kotlin, laravel, linux, mysql, nextjs,
  nginx, nodejs, node: nodejs, notion, php, postgresql, postgres: postgresql, python,
  react, rust, supabase, svelte, swift, tailwindcss, tailwind: tailwindcss, threejs, typescript,
  ts: typescript, ubuntu, vercel, vite, vscode, visualstudiocode: vscode, vuejs, vue: vuejs,
};

/**
 * Logo yang resminya hitam — lenyap di kartu hitam. Dibalik jadi putih:
 * itu persis varian "untuk latar gelap" yang dipublikasikan merek-merek ini
 * sendiri (Invertocat putih GitHub, segitiga putih Vercel, N putih Next.js).
 */
const DIBALIK_DI_GELAP = new Set(['github', 'vercel', 'threejs', 'rust', 'nextjs', 'notion']);

/**
 * Merek yang tidak ada di Devicon (atau yang varian Devicon-nya buruk —
 * Proxmox berupa tulisan tak terbaca di 24 px), dari Simple Icons: satu
 * warna, bentuk resmi. v0, Cursor, shadcn/ui, Ollama resminya hitam pekat,
 * jadi putih di latar gelap sudah tepat; Claude jingga, Proxmox jingga.
 */
type IkonMerek = { path: string; hex: string; title: string };
const IKON_MONO: Record<string, IkonMerek> = {
  v0: siV0, cursor: siCursor, shadcnui: siShadcnui, shadcn: siShadcnui, ollama: siOllama, claude: siClaude,
  proxmox: siProxmox,
};

const IkonSimple: React.FC<{ ikon: IkonMerek }> = ({ ikon }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" role="img" aria-label={ikon.title} xmlns="http://www.w3.org/2000/svg">
    <path d={ikon.path} fill={warnaIkon(ikon.hex)} />
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
  const logo = LOGO_MEREK[kunci];
  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        data-merek={kunci}
        className="w-6 h-6 object-contain"
        style={DIBALIK_DI_GELAP.has(kunci) ? { filter: 'invert(1)' } : undefined}
        loading="lazy"
      />
    );
  }
  const mono = IKON_MONO[kunci];
  if (mono) return <IkonSimple ikon={mono} />;
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
