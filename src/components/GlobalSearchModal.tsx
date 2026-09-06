import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchBlogPosts, fetchProjects, fetchSettings } from '../lib/content';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  Home, 
  Layers, 
  BookOpen, 
  User, 
  Mail, 
  ArrowRight, 
  CornerDownLeft, 
  Sparkles,
  Command,
  Tag,
  Clock,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import { PageId } from '../types';
import { 
  SearchItem, 
  SearchCategoryFilter, 
  searchAllContent, 
  popularSearchQueries,
  searchIndex,
  mergeLiveContent,
} from '../data/searchIndex';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId, sectionId?: string) => void;
  onSelectBlog?: (postId: string) => void;
  onSelectProject?: (projectId: string) => void;
}

const categoryFilters: { id: SearchCategoryFilter; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'all', label: 'All Content', icon: Sparkles },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'project', label: 'Projects', icon: Layers },
  { id: 'blog', label: 'Blog', icon: BookOpen },
  { id: 'about', label: 'About', icon: User },
  { id: 'contact', label: 'Contact', icon: Mail },
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectBlog,
  onSelectProject,
}) => {
  // Indeks pencarian mengikuti isi database, bukan hanya siteData.ts statis.
  // Diambil sekali saat modal pertama dibuka supaya halaman publik tidak
  // membayar permintaan ini kalau pencarian tidak pernah dipakai.
  const [index, setIndex] = useState(searchIndex);
  const sudahAmbil = useRef(false);
  useEffect(() => {
    if (!isOpen || sudahAmbil.current) return;
    sudahAmbil.current = true;
    Promise.all([fetchProjects(), fetchBlogPosts(), fetchSettings()])
      .then(([pr, po, st]) => setIndex(mergeLiveContent(searchIndex, pr, po, st)))
      .catch(() => {});
  }, [isOpen]);

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Focus input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveCategory('all');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Global hotkey listener for Cmd+K / Ctrl+K and ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Perform multi-page search
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      // When query is empty, show curated highlights or filter by active category
      if (activeCategory === 'all') {
        return index.slice(0, 6);
      }
      return index.filter((item) => item.page === activeCategory);
    }
    return searchAllContent(query, activeCategory, index);
  }, [query, activeCategory, index]);

  // Keep selected index in bound
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  // Keyboard navigation within search results
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0 && searchResults[selectedIndex]) {
        handleSelectItem(searchResults[selectedIndex]);
      }
    }
  };

  const handleSelectItem = (item: SearchItem) => {
    onClose();

    if (item.actionPayload?.type === 'blog' && item.actionPayload.targetId) {
      if (onSelectBlog) {
        onSelectBlog(item.actionPayload.targetId);
      } else {
        onNavigate('blog');
      }
    } else if (item.actionPayload?.type === 'project' && item.actionPayload.targetId) {
      if (onSelectProject) {
        onSelectProject(item.actionPayload.targetId);
      } else {
        onNavigate('project');
      }
    } else {
      // Entri halaman statis (Home/About/Contact). `sectionId` menunjuk
      // jangkar bagian yang dimaksud entri itu; tanpa meneruskannya, mengklik
      // hasil selagi sudah berada di halaman yang sama tidak mengubah apa pun
      // di layar dan terbaca sebagai tombol mati.
      onNavigate(item.page, item.actionPayload?.sectionId);
    }
  };

  const getPageIcon = (page: PageId) => {
    switch (page) {
      case 'home':
        return <Home className="w-3.5 h-3.5 text-indigo-400" />;
      case 'project':
        return <Layers className="w-3.5 h-3.5 text-cyan-400" />;
      case 'blog':
        return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
      case 'about':
        return <User className="w-3.5 h-3.5 text-purple-400" />;
      case 'contact':
        return <Mail className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getPageBadgeClass = (page: PageId) => {
    switch (page) {
      case 'home':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80';
      case 'project':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80';
      case 'blog':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/80';
      case 'about':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/80';
      case 'contact':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
    }
  };

  // Highlight matching text fragments
  const renderHighlighted = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-amber-400/30 text-amber-200 font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="global-search-modal"
          className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 md:p-6 pt-12 sm:pt-20 overflow-y-auto"
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-xl -z-10"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl bg-[#0c0c0e] border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[82vh]"
          >
            {/* Header: Search Input Bar */}
            <div className="relative flex items-center px-4 sm:px-6 py-4 border-b border-neutral-800/90 bg-[#121216]">
              <Search className="w-5 h-5 text-neutral-400 shrink-0 mr-3" />
              
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search across Home, Projects, Blog, About, Contact..."
                className="w-full bg-transparent text-white placeholder-neutral-500 text-sm sm:text-base font-normal focus:outline-none tracking-tight"
              />

              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search input"
                  className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors mr-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onClose}
                aria-label="Close search"
                className="px-2 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400 hover:text-white hover:border-neutral-700 transition-all cursor-pointer shrink-0"
              >
                ESC
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="px-4 sm:px-6 py-2.5 bg-[#0e0e12] border-b border-neutral-850 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {categoryFilters.map((filter) => {
                const isSelected = activeCategory === filter.id;
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveCategory(filter.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800/80'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Results List or Suggestions */}
            <div 
              ref={resultsContainerRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 no-scrollbar"
            >
              {/* Popular Query Chips (When search input is empty) */}
              {!query.trim() && (
                <div className="px-2 pt-1 pb-3">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono uppercase tracking-wider mb-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Suggestions</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {popularSearchQueries.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setQuery(tag);
                          inputRef.current?.focus();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-white hover:border-neutral-700 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-neutral-500" />
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Result Items */}
              {searchResults.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="px-2 py-1 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>
                      {query.trim()
                        ? `Found ${searchResults.length} result${searchResults.length > 1 ? 's' : ''}`
                        : `Recommended (${searchResults.length})`}
                    </span>
                    <span className="hidden sm:inline">Use ↑ ↓ keys to navigate</span>
                  </div>

                  {searchResults.map((item, index) => {
                    const isSelected = selectedIndex === index;
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleSelectItem(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        // Hasil pencarian adalah div ber-onClick: tanpa role,
                        // tabIndex, dan handler keyboard, pengguna keyboard dan
                        // pembaca layar tidak punya cara memilihnya sama sekali.
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectItem(item);
                          }
                        }}
                        className={`group relative p-3 sm:p-3.5 rounded-xl transition-all duration-150 cursor-pointer flex items-start justify-between gap-3 border ${
                          isSelected
                            ? 'bg-neutral-900/90 border-neutral-700 shadow-md'
                            : 'bg-neutral-950/40 border-neutral-900 hover:border-neutral-800 hover:bg-neutral-900/50'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Top Tag & Page Indicator */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${getPageBadgeClass(
                                item.page
                              )}`}
                            >
                              {getPageIcon(item.page)}
                              <span>{item.pageName}</span>
                            </span>

                            {item.subtitle && (
                              <span className="text-[11px] text-neutral-400 font-mono truncate">
                                {item.subtitle}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h4 className="text-sm sm:text-base font-semibold text-white group-hover:text-white leading-snug">
                            {renderHighlighted(item.title, query)}
                          </h4>

                          {/* Description */}
                          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                            {renderHighlighted(item.description, query)}
                          </p>

                          {/* Tag Chips */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {item.tags.slice(0, 4).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-neutral-800/80 font-mono"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Arrow Right Indicator */}
                        <div className="shrink-0 flex items-center self-center pl-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-white text-black translate-x-0'
                                : 'bg-neutral-900 text-neutral-400 -translate-x-1 group-hover:text-white group-hover:translate-x-0'
                            }`}
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* No Results Empty State */
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                    <Search className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-white">No results found</h4>
                  <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto">
                    We couldn't find any content matching "<span className="text-white font-medium">{query}</span>". Try searching for topics like React, Three.js, Accessibility, or Location.
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setQuery('');
                        setActiveCategory('all');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-white hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      Clear Search
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Shortcut Helper */}
            <div className="px-4 sm:px-6 py-2.5 bg-[#0a0a0c] border-t border-neutral-850 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white">↵</kbd> Select
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white">↓</kbd> Navigate
                </span>
              </div>
              <div>
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white">ESC</kbd> to close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
