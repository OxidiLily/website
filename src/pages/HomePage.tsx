import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Decor } from '../components/Decor';
import { motion } from 'motion/react';
import { ScrollVelocity } from '../components/ScrollVelocity';
import { projectsData, blogPostsData } from '../data/siteData';
import { fetchProjects, fetchBlogPosts } from '../lib/content';
import { PageId } from '../types';
import { ArrowRight, Sparkles, ExternalLink, Code2, Layers } from 'lucide-react';
import aboutMePortrait from '../assets/images/about_me_portrait_1787881947027.jpg';

import { canRenderWebGL } from '../lib/device';

// Ballpit (three.js) dan Orb (ogl) hanya diunduh kalau memang akan dirender.
const Ballpit = lazy(() => import('../components/Ballpit').then(m => ({ default: m.Ballpit })));
const Orb = lazy(() => import('../components/Orb').then(m => ({ default: m.Orb })));

interface HomePageProps {
  onNavigate: (page: PageId) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState(projectsData);
  const [posts, setPosts] = useState(blogPostsData);
  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => {});
    fetchBlogPosts().then(setPosts).catch(() => {});
  }, []);
  return (
    <div className="w-full">
      {/* Hero Section with Fullscreen Ballpit */}
      <section
        id="hero-section"
        className="relative w-full h-[85vh] sm:h-screen min-h-[520px] sm:min-h-[600px] flex flex-col items-center justify-center pt-0 md:pt-0 overflow-hidden bg-black pb-0"
      >
        {/* Fullscreen 3D Ballpit Background */}
        <div className="absolute inset-0 w-full h-full z-0">
          {!canRenderWebGL ? (
            // Perangkat lemah ATAU WebGL tak tersedia (mis. Brave Shields):
            // simulasi 100 bola diganti gradien statis, hero tetap punya
            // kedalaman tanpa satu pun frame WebGL.
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_50%_40%,#2a2a2a_0%,#111_45%,#000_75%)]" />
          ) : (
            <Decor>
              <Ballpit
                count={100}
                gravity={0.3}
                friction={1}
                wallBounce={0.9}
                followCursor={false}
                colors={['#ffffff', '#000000']}
                className="w-full h-full"
              />
            </Decor>
          )}
        </div>

        {/* Hero Overlay Text */}
        <div className="relative z-10 text-center max-w-3xl mx-auto px-4 sm:px-6 -mt-6 md:mt-0 pointer-events-none select-none">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-md leading-[1.15]">
            Crafting Digital Products with Physics & Precision
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-neutral-300 drop-shadow max-w-xl mx-auto leading-relaxed">
            Building clear, useful products with refined aesthetics, smooth 60fps WebGL simulations, and robust systems.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-xs sm:max-w-none mx-auto pointer-events-auto">
            <button
              onClick={() => onNavigate('project')}
              className="min-h-[44px] px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Projects</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="min-h-[44px] px-6 py-3 rounded-full bg-neutral-900/90 text-white font-medium text-sm border border-neutral-700 hover:bg-neutral-800 active:scale-95 transition-all backdrop-blur-sm flex items-center justify-center cursor-pointer"
            >
              <span>About Me</span>
            </button>
          </div>
        </div>
      </section>

      {/* ScrollVelocity Marquee Section right after Hero */}
      <div className="py-4 sm:py-6 md:py-8 bg-neutral-950/90 border-y border-neutral-900 overflow-hidden backdrop-blur-sm">
        <ScrollVelocity
          texts={['React Bits', 'Scroll Velocity — Interactive Physics']}
          velocity={60}
          className="text-neutral-300 uppercase tracking-tighter hover:text-white transition-colors duration-200"
        />
      </div>

      {/* Content Section with Orb Background */}
      <div className="relative w-full overflow-hidden bg-black">
        {/* Ambient Orb Background Layer */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden flex items-center justify-center">
          {canRenderWebGL && (
            <div className="w-full h-full max-w-6xl min-h-[1000px] relative opacity-75">
              <Decor>
                <Orb
                  hue={0}
                  hoverIntensity={0}
                  rotateOnHover={true}
                  forceHoverState={false}
                  backgroundColor="#000000"
                />
              </Decor>
            </div>
          )}
          {/* Smooth blend from top and bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />
        </div>

        {/* Relative Content Container */}
        <div className="relative z-10">
          {/* Featured Projects Highlight */}
          <section className="py-14 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 sm:mb-12">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Featured Projects
                </h2>
              </div>
              <button
                onClick={() => onNavigate('project')}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer group self-start sm:self-auto py-1"
              >
                <span>View all projects</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {projects.slice(0, 3).map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  onClick={() => onNavigate('project')}
                  className="group cursor-pointer rounded-2xl bg-neutral-950/90 backdrop-blur-md border border-neutral-800/80 hover:border-neutral-600 active:scale-[0.99] overflow-hidden transition-all duration-300 shadow-lg flex flex-col justify-between"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-neutral-900 relative">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] sm:text-[11px] font-medium text-neutral-200 border border-neutral-700">
                      {project.category}
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] sm:text-xs text-neutral-400 mb-1.5 font-mono">
                        <span>{project.client}</span>
                        <span>{project.year}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-neutral-200 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-neutral-900">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-neutral-900/90 text-neutral-300 font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Quick About Teaser */}
          <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <div className="bg-neutral-950/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-12 border border-neutral-800/80 relative overflow-hidden flex flex-col-reverse md:flex-row items-center justify-between gap-6 sm:gap-8">
              <div className="w-full max-w-xl space-y-3 sm:space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-neutral-900 border border-neutral-800 text-neutral-400">
                  <span>Batang, Jawa Tengah, Indonesia 🇮🇩</span>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Design & Development Driven by Craft and Autonomy
                </h3>
                <p className="text-neutral-400 text-xs sm:text-sm md:text-base leading-relaxed">
                  I partner with early-stage teams and visionary founders to take ideas from zero to production launch, fusing meticulous design systems with robust frontend engineering.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onNavigate('about')}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white hover:text-neutral-300 transition-colors cursor-pointer py-1"
                  >
                    <span>Read full story & background</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="w-28 h-28 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border border-neutral-800 shrink-0 shadow-2xl">
                <img
                  src={aboutMePortrait}
                  alt="Designer portrait"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
            </div>
          </section>

          {/* Latest Articles Highlight */}
          <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-white" />
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Latest from Blog</h3>
              </div>
              <button
                onClick={() => onNavigate('blog')}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer group self-start sm:self-auto py-1"
              >
                <span>View all articles</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {posts.slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  onClick={() => onNavigate('blog')}
                  className="p-5 sm:p-6 rounded-2xl bg-neutral-950/90 backdrop-blur-md border border-neutral-900/80 hover:border-neutral-700 active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-neutral-400 mb-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-neutral-900 text-neutral-300 font-medium text-[11px]">
                        {post.category}
                      </span>
                      <span className="text-[11px]">{post.readTime}</span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-neutral-200 transition-colors mt-2">
                      {post.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-neutral-400 mt-2.5 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-400 group-hover:text-white transition-colors">
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom Direct CTA */}
          <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-snug">
              Have a project in mind? Let's build something exceptional.
            </h3>
            <p className="text-neutral-400 text-xs sm:text-sm md:text-base mt-3 max-w-xl mx-auto leading-relaxed">
              Currently taking on select design systems, frontend engineering, and WebGL interactive projects.
            </p>
            <div className="mt-6 sm:mt-8 flex justify-center">
              <button
                onClick={() => onNavigate('contact')}
                className="w-full sm:w-auto min-h-[44px] px-8 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 active:scale-95 transition-all shadow-xl cursor-pointer"
              >
                Get In Touch
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
