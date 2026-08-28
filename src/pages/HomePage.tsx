import React from 'react';
import { motion } from 'motion/react';
import { Ballpit } from '../components/Ballpit';
import { ScrollVelocity } from '../components/ScrollVelocity';
import { Orb } from '../components/Orb';
import { projectsData, blogPostsData, shopItemsData } from '../data/siteData';
import { PageId } from '../types';
import { ArrowRight, Sparkles, ExternalLink, Code2, Layers, ShoppingBag } from 'lucide-react';
import aboutMePortrait from '../assets/images/about_me_portrait_1787881947027.jpg';

interface HomePageProps {
  onNavigate: (page: PageId) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="w-full">
      {/* Hero Section with Fullscreen Ballpit */}
      <section
        id="hero-section"
        className="relative w-full h-screen min-h-[600px] flex flex-col items-center justify-center overflow-hidden bg-black pb-0"
      >
        {/* Fullscreen 3D Ballpit Background */}
        <div className="absolute inset-0 w-full h-full z-0">
          <Ballpit
            count={100}
            gravity={0.3}
            friction={1}
            wallBounce={0.9}
            followCursor={false}
            colors={['#ffffff', '#000000']}
            className="w-full h-full"
          />
        </div>

        {/* Hero Overlay Text */}
        <div className="relative z-10 text-center max-w-3xl mx-auto px-4 pointer-events-none select-none">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg leading-tight">
            Crafting Digital Products with Physics & Precision
          </h1>

          <p className="mt-5 text-base sm:text-lg text-neutral-300 drop-shadow max-w-xl mx-auto leading-relaxed">
            Building clear, useful products with refined aesthetics, smooth 60fps WebGL simulations, and robust systems.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 pointer-events-auto">
            <button
              onClick={() => onNavigate('project')}
              className="px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Projects</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="px-6 py-3 rounded-full bg-neutral-900/90 text-white font-medium text-sm border border-neutral-700 hover:bg-neutral-800 transition-all hover:scale-105 active:scale-95 backdrop-blur-sm cursor-pointer"
            >
              <span>About Me</span>
            </button>
          </div>
        </div>
      </section>

      {/* ScrollVelocity Marquee Section right after Hero */}
      <div className="py-3 bg-neutral-950/80 border-y border-neutral-900 overflow-hidden backdrop-blur-sm">
        <ScrollVelocity
          texts={['React Bits', 'Scroll Velocity — Interactive Physics']}
          velocity={80}
          className="text-neutral-300 font-extrabold uppercase tracking-tight hover:text-white transition-colors duration-200"
        />
      </div>

      {/* Content Section with Orb Background */}
      <div className="relative w-full overflow-hidden bg-black">
        {/* Ambient Orb Background Layer */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden flex items-center justify-center">
          <div className="w-full h-full max-w-6xl min-h-[1000px] relative opacity-75">
            <Orb
              hue={0}
              hoverIntensity={0}
              rotateOnHover={true}
              forceHoverState={false}
              backgroundColor="#000000"
            />
          </div>
          {/* Smooth blend from top and bottom to seamlessly merge with adjacent black sections */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />
        </div>

        {/* Relative Content Container */}
        <div className="relative z-10">
          {/* Featured Projects Highlight */}
          <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Featured Projects
                </h2>
              </div>
              <button
                onClick={() => onNavigate('project')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer group"
              >
                <span>View all projects</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projectsData.slice(0, 3).map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  onClick={() => onNavigate('project')}
                  className="group cursor-pointer rounded-2xl bg-neutral-950/80 backdrop-blur-md border border-neutral-800/80 hover:border-neutral-600 overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-lg flex flex-col justify-between"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-neutral-900 relative">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-medium text-neutral-200 border border-neutral-700">
                      {project.category}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                        <span>{project.client}</span>
                        <span>{project.year}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-neutral-200 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-neutral-900">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-neutral-900/90 text-neutral-300">
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
          <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <div className="bg-neutral-950/80 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-neutral-800/80 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-neutral-900 border border-neutral-800 text-neutral-400">
                  <span>San Francisco, CA 🇺🇸</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Design & Development Driven by Craft and Autonomy
                </h3>
                <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                  I partner with early-stage teams and visionary founders to take ideas from zero to production launch, fusing meticulous design systems with robust frontend engineering.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onNavigate('about')}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-neutral-300 transition-colors cursor-pointer"
                  >
                    <span>Read full story & background</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border border-neutral-800 shrink-0 shadow-2xl">
                <img
                  src={aboutMePortrait}
                  alt="Designer portrait"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </section>

          {/* Latest Articles & Digital Shop Quick Highlights */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Latest Articles */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-white" />
                    <h3 className="text-xl font-bold text-white">Latest from Blog</h3>
                  </div>
                  <button
                    onClick={() => onNavigate('blog')}
                    className="text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                  >
                    View all →
                  </button>
                </div>

                <div className="space-y-4">
                  {blogPostsData.slice(0, 2).map((post) => (
                    <div
                      key={post.id}
                      onClick={() => onNavigate('blog')}
                      className="p-5 rounded-xl bg-neutral-950/80 backdrop-blur-md border border-neutral-900/80 hover:border-neutral-700 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                        <span className="text-neutral-300">{post.category}</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h4 className="text-base font-bold text-white group-hover:text-neutral-200 transition-colors">
                        {post.title}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shop Highlight */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-white" />
                    <h3 className="text-xl font-bold text-white">Digital Products</h3>
                  </div>
                  <button
                    onClick={() => onNavigate('shop')}
                    className="text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Browse shop →
                  </button>
                </div>

                <div className="space-y-4">
                  {shopItemsData.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onNavigate('shop')}
                      className="p-5 rounded-xl bg-neutral-950/80 backdrop-blur-md border border-neutral-900/80 hover:border-neutral-700 transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-400">
                          {item.category}
                        </span>
                        <h4 className="text-base font-bold text-white group-hover:text-neutral-200 transition-colors mt-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                      <div className="text-right pl-4">
                        <span className="text-lg font-bold text-white">${item.price}</span>
                        {item.originalPrice && (
                          <span className="block text-xs text-neutral-500 line-through">
                            ${item.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Direct CTA */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
            <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Have a project in mind? Let's build something exceptional.
            </h3>
            <p className="text-neutral-400 text-sm sm:text-base mt-3 max-w-xl mx-auto">
              Currently taking on select design systems, frontend engineering, and WebGL interactive projects.
            </p>
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => onNavigate('contact')}
                className="px-8 py-3.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
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
