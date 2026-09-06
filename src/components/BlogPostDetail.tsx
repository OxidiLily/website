import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BlogPost, PageId } from '../types';
import { ArrowLeft, Check, Share2, Bookmark } from 'lucide-react';
import { useSettings } from '../lib/content';

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
  const [activeSection, setActiveSection] = useState<string>(
    post.sections?.[0]?.id || 'overview'
  );
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

  // Observe active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!post.sections) return;
      const scrollPos = window.scrollY + 160;

      for (const section of post.sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post.sections]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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
              if (post.sections?.[0]?.id) scrollToSection(post.sections[0].id);
            }}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs sm:text-sm hover:bg-neutral-200 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            {post.actionLabel || 'Get Started'}
          </button>
          <button
            onClick={() => {
              if (post.sections?.[1]?.id) scrollToSection(post.sections[1].id);
            }}
            className="min-h-[40px] px-4 py-2 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-300 font-medium text-xs sm:text-sm hover:bg-neutral-900 active:scale-95 hover:text-white transition-all cursor-pointer"
          >
            {post.guideType || 'Gardening Guide'}
          </button>
        </div>

        {/* Mobile-Only Quick Jump Table of Contents Pill Bar */}
        {post.sections && post.sections.length > 0 && (
          <div className="md:hidden mt-6 pt-4 border-t border-neutral-900">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-2">
              {t.post_jump_label}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4">
              {post.sections.map((sec) => {
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
            <div className="pt-4 border-t border-neutral-800">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform" />
                <span>{t.post_back}</span>
              </button>
            </div>
          </div>

          {/* Center Column: Visual Graphic & Article Guide Content */}
          <div className="md:col-span-6 space-y-8">
            {/* Visual Media Graphic Card */}
            <div className="w-full aspect-[16/10] bg-neutral-950 rounded-2xl sm:rounded-3xl border border-neutral-800 flex items-center justify-center p-8 overflow-hidden shadow-2xl select-none">
              {/* Isometric Striped Geometric Cube Illustration in Monochrome */}
              <div className="w-36 h-36 sm:w-44 sm:h-44 relative flex items-center justify-center">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full text-white drop-shadow-md"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Isometric Group */}
                  <g transform="translate(100, 100)">
                    {/* Top Face Outer */}
                    <path
                      d="M 0,-48 L 48,-24 L 0,0 L -48,-24 Z"
                      fill="#171717"
                      stroke="#404040"
                      strokeWidth="1"
                    />
                    {/* Top Face Inner Inset */}
                    <path
                      d="M 0,-44 L 44,-22 L 0,0 L -44,-22 Z"
                      fill="#0a0a0a"
                    />
                    {/* Top inner vertical slats */}
                    <path d="M -36,-20 L -36,-14" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M -24,-26 L -24,-8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M -12,-32 L -12,-2" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 0,-38 L 0,0" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 12,-32 L 12,-2" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 24,-26 L 24,-8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 36,-20 L 36,-14" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Left Face */}
                    <path
                      d="M -48,-24 L 0,0 L 0,54 L -48,30 Z"
                      fill="#171717"
                      stroke="#404040"
                      strokeWidth="1"
                    />
                    {/* Inner hollow cutout on Left Face */}
                    <path
                      d="M -40,-16 L -8,0 L -8,44 L -40,28 Z"
                      fill="#0a0a0a"
                    />
                    {/* Left Face Vertical Slats */}
                    <path d="M -32, -8 L -32, 28" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M -24, -4 L -24, 32" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M -16, 0 L -16, 36" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Right Face */}
                    <path
                      d="M 0,0 L 48,-24 L 48,30 L 0,54 Z"
                      fill="#262626"
                      stroke="#525252"
                      strokeWidth="1"
                    />
                    {/* Right Face Slats with cutout */}
                    <path
                      d="M 8,0 L 40,-16 L 40,28 L 8,44 Z"
                      fill="#0a0a0a"
                    />
                    <path d="M 16, 0 L 16, 36" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 24, -4 L 24, 32" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 32, -8 L 32, 28" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Solid Geometric Accent Cutouts in Center */}
                    <polygon points="0,6 -20,16 -20,38 0,48" fill="#ffffff" />
                    <polygon points="0,6 20,16 20,38 0,48" fill="#a3a3a3" />
                    <polygon points="0,6 -20,-4 0,-14 20,-4" fill="#525252" />
                  </g>
                </svg>
              </div>
            </div>

            {/* Main Section Header */}
            <div className="pt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {post.mainHeading || "Beginner's Guide"}
              </h2>
            </div>

            {/* Sub-sections rendering */}
            <div className="space-y-8 text-neutral-300 leading-relaxed text-sm sm:text-[15px]">
              {post.sections && post.sections.length > 0 ? (
                post.sections.map((sec) => (
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
                <div className="space-y-4">
                  <p>{post.content}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: daftar isi lengket, judulnya dari settings */}
          <div className="md:col-span-3 sticky top-28 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
              {t.post_toc_label}
            </div>

            <div className="space-y-1 text-xs sm:text-sm">
              {post.sections && post.sections.length > 0 ? (
                post.sections.map((sec) => {
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
