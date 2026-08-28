import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { projectsData } from '../data/siteData';
import { ProjectItem } from '../types';
import { Aurora } from '../components/Aurora';
import { ExternalLink, Github, Sparkles, Filter, X, ArrowUpRight } from 'lucide-react';

export const ProjectPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeModalProject, setActiveModalProject] = useState<ProjectItem | null>(null);

  const categories = ['All', 'UI System', '3D / Physics', 'Mobile', 'Web'];

  const filteredProjects = selectedCategory === 'All'
    ? projectsData
    : projectsData.filter((p) => p.category === selectedCategory);

  return (
    <div className="relative w-full min-h-screen bg-black">
      {/* Background Aurora Layer - Fixed position so it stays in place during scroll */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <Aurora
          colorStops={['#ffffff', '#888888', '#222222']}
          blend={0.65}
          amplitude={1.1}
          speed={0.4}
        />
        {/* Subtle dark vignette overlay to keep text ultra crisp */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      </div>

      <div className="relative z-10 w-full pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            Selected Projects
          </h1>
          <p className="text-neutral-400 text-base sm:text-lg max-w-2xl leading-relaxed">
            A showcase of design systems, WebGL physics engines, responsive mobile apps, and scalable web platforms crafted with modern precision.
          </p>
        </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-12">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project, idx) => (
          <motion.div
            key={project.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            onClick={() => setActiveModalProject(project)}
            className="group cursor-pointer rounded-2xl bg-neutral-950 border border-neutral-900 hover:border-neutral-700 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 shadow-xl flex flex-col justify-between"
          >
            <div className="aspect-[16/10] overflow-hidden bg-neutral-900 relative">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[11px] font-medium text-neutral-200 border border-neutral-800">
                {project.category}
              </div>
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-neutral-800">
                <ArrowUpRight className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <span className="font-mono">{project.client}</span>
                  <span className="font-mono">{project.year}</span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-neutral-200 transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 mt-2 line-clamp-3 leading-relaxed">
                  {project.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-neutral-900">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2.5 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {activeModalProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModalProject(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col"
            >
              {/* Modal Image */}
              <div className="relative aspect-[16/9] w-full bg-neutral-900 shrink-0">
                <img
                  src={activeModalProject.image}
                  alt={activeModalProject.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => setActiveModalProject(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/70 border border-neutral-700 text-white hover:bg-black transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
                <div>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 mb-2">
                    <span className="px-2.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white">
                      {activeModalProject.category}
                    </span>
                    <span>Client: {activeModalProject.client}</span>
                    <span>•</span>
                    <span>Year: {activeModalProject.year}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    {activeModalProject.title}
                  </h2>
                </div>

                <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
                  {activeModalProject.description}
                </p>

                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-3">
                    Technology Stack & Deliverables
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeModalProject.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-900 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setActiveModalProject(null)}
                    className="px-5 py-2.5 rounded-full bg-neutral-900 text-neutral-300 text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};
