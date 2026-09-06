import React, { Suspense, lazy, useState } from 'react';
import { Decor } from '../components/Decor';
import { motion, AnimatePresence } from 'motion/react';
import { CardImage } from '../components/CardImage';
import { projectsData } from '../data/siteData';
import { fetchProjects, useSettings } from '../lib/content';
import { ProjectItem } from '../types';
import { canRenderWebGL } from '../lib/device';

// Aurora (ogl) murni dekorasi — jangan diunduh di perangkat lemah.
const Aurora = lazy(() => import('../components/Aurora').then(m => ({ default: m.Aurora })));
import { ExternalLink, Github, Sparkles, Filter, X, ArrowUpRight } from 'lucide-react';

interface ProjectPageProps {
  initialProjectId?: string | null;
  onSelectProject?: (projectId: string) => void;
  onCloseProject?: () => void;
}

export const ProjectPage: React.FC<ProjectPageProps> = ({
  initialProjectId,
  onSelectProject,
  onCloseProject,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [projects, setProjects] = useState(projectsData);
  const t = useSettings();
  React.useEffect(() => { fetchProjects().then(setProjects).catch(() => {}); }, []);
  const [activeModalProject, setActiveModalProject] = useState<ProjectItem | null>(() => {
    if (initialProjectId) {
      return projects.find((p) => p.id === initialProjectId) || null;
    }
    return null;
  });

  // If initialProjectId changes, open that project
  React.useEffect(() => {
    if (!initialProjectId) {
      // Id hilang dari URL (tombol Back browser) → tutup modalnya.
      setActiveModalProject(null);
      return;
    }
    const found = projects.find((p) => p.id === initialProjectId);
    if (found) {
      setActiveModalProject(found);
    }
    // `projects` ikut jadi dependensi: daftar awalnya data statis lalu diganti
    // hasil Supabase. Tanpa ini, membuka /project/<slug> untuk project yang
    // HANYA ada di database (dibuat lewat panel admin) tidak pernah membuka
    // modalnya, karena efeknya tidak dijalankan ulang saat data tiba.
  }, [initialProjectId, projects]);

  // Judul tab untuk project yang sedang dibuka di modal.
  React.useEffect(() => {
    if (activeModalProject) document.title = `${activeModalProject.title} — OxidiLily`;
  }, [activeModalProject]);

  const categories = ['All', ...Array.from(new Set(projects.map((p) => p.category)))];

  const filteredProjects = selectedCategory === 'All'
    ? projects
    : projects.filter((p) => p.category === selectedCategory);

  return (
    <div className="relative w-full min-h-screen bg-black">
      {/* Background Aurora Layer - Fixed position so it stays in place during scroll */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        {canRenderWebGL && (
          <Decor>
            <Aurora
              colorStops={['#ffffff', '#888888', '#222222']}
              blend={0.65}
              amplitude={1.1}
              speed={1.3}
            />
          </Decor>
        )}
        {/* Subtle dark vignette overlay to keep text ultra crisp */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      </div>

      <div className="relative z-10 w-full pt-16 sm:pt-20 md:pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            {t.project_heading}
          </h1>
          <p className="text-neutral-400 text-xs sm:text-base md:text-lg max-w-2xl leading-relaxed">
            {t.project_intro}
          </p>
        </div>

      {/* Category Filter Pills (Mobile-First Horizontal Swipable Pill Bar) */}
      <div className="relative mb-8 sm:mb-12">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <div className="flex items-center gap-1 text-xs text-neutral-500 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter:</span>
          </div>
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`min-h-[38px] px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer select-none active:scale-95 ${
                  isActive
                    ? 'bg-white text-black shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
        {filteredProjects.map((project, idx) => (
          <motion.div
            key={project.id}
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, delay: idx * 0.04 }}
            onClick={() => onSelectProject?.(project.id)}
            className="group cursor-pointer rounded-2xl bg-neutral-950/90 border border-neutral-800/90 hover:border-neutral-600 active:scale-[0.98] overflow-hidden transition-all duration-300 shadow-xl flex flex-col justify-between"
          >
            <div className="aspect-[16/10] overflow-hidden bg-neutral-900 relative">
              <CardImage
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                logoClassName="w-full h-full object-contain p-10 opacity-90 group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/85 text-[10px] sm:text-[11px] font-medium text-neutral-200 border border-neutral-700">
                {project.category}
              </div>
              <div className="absolute top-2.5 right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/85 flex items-center justify-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity border border-neutral-700">
                <ArrowUpRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-neutral-400 mb-1.5">
                  <span className="font-mono">{project.client}</span>
                  <span className="font-mono">{project.year}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-neutral-200 transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 mt-2 line-clamp-3 leading-relaxed">
                  {project.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-5 pt-3.5 border-t border-neutral-900">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono"
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
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onCloseProject?.()}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 50 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[88vh] flex flex-col"
            >
              {/* Modal Image & Sticky Close Bar */}
              <div className="relative aspect-[16/9] w-full bg-neutral-900 shrink-0">
                <CardImage
                  src={activeModalProject.image}
                  alt={activeModalProject.title}
                  className="w-full h-full object-cover"
                  logoClassName="w-full h-full object-contain p-12 opacity-90"
                />
                <button
                  onClick={() => onCloseProject?.()}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/85 border border-neutral-700 text-white hover:bg-black active:scale-95 transition-all cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 sm:p-8 overflow-y-auto space-y-4 sm:space-y-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mb-2">
                    <span className="px-2.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white text-[11px]">
                      {activeModalProject.category}
                    </span>
                    <span>Client: {activeModalProject.client}</span>
                    <span>•</span>
                    <span>Year: {activeModalProject.year}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                    {activeModalProject.title}
                  </h2>
                </div>

                <p className="text-neutral-300 text-xs sm:text-sm md:text-base leading-relaxed">
                  {activeModalProject.description}
                </p>

                <div>
                  <h4 className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2.5">
                    Technology Stack & Deliverables
                  </h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {activeModalProject.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-[11px] sm:text-xs text-neutral-200 font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-900 flex items-center justify-end gap-3">
                  <button
                    onClick={() => onCloseProject?.()}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-full bg-white text-black text-xs sm:text-sm font-semibold hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
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
