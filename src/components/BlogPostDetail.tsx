import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { BlogPost, BlogSection, PageId } from '../types';
import { ArrowLeft, Check, Share2, Bookmark } from 'lucide-react';
import { useSettings } from '../lib/content';
import { susunArtikel } from '../lib/blogWriter';
import { IsiKonten, keHtml } from './IsiKonten';
import { salinTeks } from '../lib/salin';

const TANPA_BAGIAN: BlogSection[] = [];

interface BlogPostDetailProps {
  post: BlogPost;
  onBack: () => void;
  onNavigateHome: () => void;
}

export const BlogPostDetail: React.FC<BlogPostDetailProps> = ({
  post,
  onBack,
  onNavigateHome,
}) => {
  const t = useSettings();

  // Bagian artikel: dari `meta.sections` untuk artikel warisan yang diisi
  // tangan, atau DIBACA DARI <h2> artikelnya sendiri untuk artikel HTML —
  // hasil AI maupun tulisan manusia. Tanpa ini daftar isinya kosong, tombol
  // lompatnya tidak menunjuk ke mana pun, dan label bawaan pengaturan
  // ("Beginner's Guide", "Gardening Guide") tampil di artikel yang tidak ada
  // hubungannya.
  const warisan = !!post.sections?.length;
  // Isi disimpan sebagai Markdown (artikel baru) atau HTML (baris lama);
  // keduanya jadi HTML dulu, baru judulnya dibaca untuk daftar isi.
  const tersusun = useMemo(() => (warisan ? null : susunArtikel(keHtml(post.content))), [warisan, post.content]);
  // `TANPA_BAGIAN` adalah satu array tetap, bukan `[]` baru tiap render:
  // dua effect di bawah bergantung pada `sections`, dan referensi yang
  // berganti setiap render membuat keduanya dipasang-lepas terus untuk
  // artikel teks polos yang memang tidak punya bagian.
  const sections = warisan ? post.sections! : (tersusun?.sections ?? TANPA_BAGIAN);

  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || 'overview');
  // Artikel yang sama dimuat dua kali: cadangan statis dulu, lalu baris dari
  // database. Daftar isinya ikut berganti, dan penanda aktif harus mengikuti.
  useEffect(() => {
    setActiveSection(sections[0]?.id || 'overview');
  }, [sections]);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Smooth scroll to section
  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Bagian aktif = bagian TERAKHIR yang judulnya sudah lewat di atas layar.
  // Aturan lama ("scrollPos di antara top dan top+height elemen") hanya cocok
  // untuk <section> warisan yang membungkus isinya; jangkar artikel HTML
  // adalah <h2> setinggi satu baris, jadi rentangnya nyaris tak pernah kena
  // dan penanda daftar isinya membeku di bagian pertama.
  useEffect(() => {
    if (!sections.length) return;
    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;
      let aktif = sections[0].id;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top + window.scrollY <= scrollPos) aktif = section.id;
      }
      setActiveSection(aktif);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  // Lewat `salinTeks`, bukan `navigator.clipboard` langsung: situs ini dibuka
  // lewat alamat LAN tanpa TLS, dan di sana API papan klip tidak ada sama
  // sekali — tombol ini dulu berganti jadi centang tanpa pernah menyalin apa
  // pun, yang lebih buruk daripada gagal terang-terangan.
  const handleShare = async () => {
    if (await salinTeks(window.location.href)) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full bg-black text-white min-h-screen pt-16 sm:pt-20 md:pt-28 pb-28 px-4 sm:px-6 md:px-8 lg:px-16"
    >
      <div className="max-w-6xl mx-auto">
        {/* Top Back and Utility Bar */}
        <div className="flex items-center justify-between mb-6 pb-2">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-neutral-400 font-normal">
            <button
              onClick={onNavigateHome}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Home
            </button>
            <span className="text-neutral-600">/</span>
            <button
              onClick={onBack}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Blog
            </button>
            <span className="text-neutral-600">/</span>
            <span className="text-white font-medium truncate max-w-[200px] sm:max-w-none">
              {post.breadcrumbTitle || post.title}
            </span>
          </nav>

          {/* Quick Actions (Share & Bookmark) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-xs font-medium text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
              title={t.post_share}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{isCopied ? t.post_copied : t.post_share}</span>
            </button>
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-white text-black border-white'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-900 hover:text-white'
              }`}
              title={t.post_bookmark}
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl">
          {post.title}
        </h1>

        {/* Subtitle / Lead */}
        {post.subtitle && (
          <p className="mt-3 sm:mt-5 text-sm sm:text-base md:text-lg text-neutral-300 max-w-2xl leading-relaxed">
            {post.subtitle}
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => {
              if (sections[0]?.id) scrollToSection(sections[0].id);
            }}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs sm:text-sm hover:bg-neutral-200 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            {post.actionLabel || t.post_action_default}
          </button>
          {/* Label bawaan pengaturan ("Gardening Guide") hanya untuk artikel
              warisan yang memang dirancang dengannya. Artikel HTML menampilkan
              tombol ini kalau ia sendiri menetapkan `guideType`. */}
          {(post.guideType || (warisan && t.post_guide_type_default)) && (
            <button
              onClick={() => {
                if (sections[1]?.id) scrollToSection(sections[1].id);
              }}
              className="min-h-[40px] px-4 py-2 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-300 font-medium text-xs sm:text-sm hover:bg-neutral-900 active:scale-95 hover:text-white transition-all cursor-pointer"
            >
              {post.guideType || t.post_guide_type_default}
            </button>
          )}
        </div>

        {/* Mobile-Only Quick Jump Table of Contents Pill Bar */}
        {sections.length > 0 && (
          <div className="md:hidden mt-6 pt-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-2">
              {t.post_jump_label}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4">
              {sections.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`min-h-[34px] px-3.5 py-1.5 rounded-full text-xs shrink-0 font-medium transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                      isActive
                        ? 'bg-white text-black font-semibold shadow'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                    }`}
                  >
                    {sec.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Editorial 3-Column Layout */}
        <div className="mt-8 sm:mt-14 md:mt-16 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Topics & Last Updated */}
          <div className="md:col-span-3 space-y-8">
            {/* Topics */}
            {post.topics && post.topics.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white mb-2">
                  Topics
                </h3>
                <div className="space-y-1.5 text-xs sm:text-sm text-neutral-400">
                  {post.topics.map((topic) => (
                    <div key={topic} className="hover:text-white transition-colors">
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Updated */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white mb-1">
                {t.post_last_updated}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400">
                {post.lastUpdated || post.date}
              </p>
            </div>

            {/* Back Link */}
            <div className="pt-4">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform" />
                <span>{t.post_back}</span>
              </button>
            </div>
          </div>

          {/* Center Column: isi artikel. Sengaja tanpa kartu grafis — halaman
              detail blog memang tidak menampilkan gambar. */}
          <div className="md:col-span-6 space-y-8">
            {/* Judul kelompok bagian. Bawaan pengaturan ("Beginner's Guide")
                hanya untuk artikel warisan; artikel HTML sudah membawa judul
                bagiannya sendiri di <h2>, dan judul umum di atasnya cuma
                menyesatkan. */}
            {(post.mainHeading || (warisan && t.post_main_heading)) && (
              <div className="pt-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {post.mainHeading || t.post_main_heading}
                </h2>
              </div>
            )}

            {/* Sub-sections rendering */}
            <div className="space-y-8 text-neutral-300 leading-relaxed text-sm sm:text-[15px]">
              {warisan ? (
                sections.map((sec) => (
                  <section key={sec.id} id={sec.id} className="scroll-mt-32 space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {sec.title}
                    </h3>
                    <p className="text-neutral-300 text-sm leading-relaxed">
                      {sec.content}
                    </p>
                  </section>
                ))
              ) : (
                /* Blok <pre><code> dikeluarkan dari aliran HTML dan digambar
                   sebagai kartu oleh IsiKonten: nomor baris, tombol salin, dan
                   pewarnaan sintaks mustahil dilakukan pada HTML mentah yang
                   cuma disuntikkan. */
                <IsiKonten html={tersusun!.html} />
              )}
            </div>
          </div>

          {/* Right Column: daftar isi lengket, judulnya dari settings */}
          <div className="md:col-span-3 sticky top-28 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
              {t.post_toc_label}
            </div>

            <div className="space-y-1 text-xs sm:text-sm">
              {sections.length > 0 ? (
                sections.map((sec) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`block w-full text-left py-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'border-l-2 border-white pl-2.5 font-bold text-white'
                          : 'pl-2.5 text-neutral-400 hover:text-white font-normal'
                      }`}
                    >
                      {sec.title}
                    </button>
                  );
                })
              ) : (
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="block w-full text-left py-1 pl-2.5 border-l-2 border-white font-bold text-white"
                >
                  {t.post_overview}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BlogPostDetail;
