import React, { Suspense, lazy, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { blogPostsData } from '../data/siteData';
import { fetchBlogPosts } from '../lib/content';
import { BlogPost, PageId } from '../types';
import { BlogPostDetail } from '../components/BlogPostDetail';
import { BlogGeometricGraphic } from '../components/BlogGeometricGraphic';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { isLowPowerDevice } from '../lib/device';

// LightPillar itu raymarching 80 iterasi per piksel — paling berat di halaman ini.
const LightPillar = lazy(() => import('../components/LightPillar'));

interface BlogPageProps {
  onNavigate?: (page: PageId) => void;
  initialPostId?: string | null;
  onSelectPost?: (postId: string) => void;
  onClosePost?: () => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({
  onNavigate,
  initialPostId,
  onSelectPost,
  onClosePost,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [visibleCount, setVisibleCount] = useState<number>(3);
  const [posts, setPosts] = useState(blogPostsData);
  React.useEffect(() => { fetchBlogPosts().then(setPosts).catch(() => {}); }, []);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(() => {
    if (initialPostId) {
      return blogPostsData.find((p) => p.id === initialPostId) || null;
    }
    return null;
  });

  React.useEffect(() => {
    if (!initialPostId) {
      // Id hilang dari URL (tombol Back browser) → tutup detailnya.
      setSelectedPost(null);
      return;
    }
    const found = posts.find((p) => p.id === initialPostId);
    if (found) {
      setSelectedPost(found);
    }
  }, [initialPostId, posts]);

  // Judul tab untuk post yang sedang dibuka. App yang memulihkan judul halaman
  // saat post ditutup, jadi di sini cukup cabang "ada post".
  React.useEffect(() => {
    if (selectedPost) document.title = `${selectedPost.title} — OxidiLily`;
  }, [selectedPost]);

  const categories = ['All', ...Array.from(new Set(posts.map((p) => p.category)))];

  // Identify featured hero post
  const featuredPost =
    posts.find((p) => p.id === 'how-ai-is-transforming-frontend-development') ||
    posts[0];

  // Grid posts: excluding featured hero post for the main grid, or include based on filter
  const gridPosts = posts.filter(
    (post) => post.id !== 'how-ai-is-transforming-frontend-development'
  );

  const filteredPosts = gridPosts.filter((post) => {
    if (selectedCategory === 'All') return true;
    return post.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const displayedPosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setVisibleCount(3); // Reset to initial 3 cards on filter change
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 3);
  };

  const handleSelectPost = (post: BlogPost) => {
    setSelectedPost(post);
    onSelectPost?.(post.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedPost(null);
    onClosePost?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If a post is selected, show the exact screenshot detail view (DO NOT TOUCH BlogPostDetail)
  if (selectedPost) {
    return (
      <BlogPostDetail
        post={selectedPost}
        onBack={handleBackToList}
        onNavigateHome={() => {
          setSelectedPost(null);
          if (onNavigate) onNavigate('home');
        }}
      />
    );
  }

  return (
    <div className="dark min-h-screen bg-[#fafafa] dark:bg-black text-neutral-900 dark:text-white transition-colors duration-200">
      {/* LightPillar React Bits WebGL Background — fixed ke viewport supaya DIAM
          saat halaman di-scroll. Batas bawahnya bukan dari tinggi layer ini,
          tapi dari blok hitam opak "All Blogs" yang naik menutupinya. */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        {!isLowPowerDevice && (
          <Suspense fallback={null}>
            <LightPillar
              topColor="#5227FF"
              bottomColor="#FF9FFC"
              intensity={1.0}
              rotationSpeed={0.25}
              glowAmount={0.005}
              pillarWidth={3.0}
              pillarHeight={0.4}
              noiseIntensity={0.35}
              pillarRotation={32}
              interactive={false}
              quality="medium"
            />
          </Suspense>
        )}
      </div>

      {/* Top Hero Section with Dot Matrix Background */}
      <section className="relative z-10 w-full overflow-hidden pt-16 sm:pt-20 md:pt-24">
        {/* Dot pattern background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
          style={{
            backgroundImage: 'radial-gradient(#71717a 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 sm:py-10 md:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-950 dark:text-white">
                Best Blog Articles
              </h1>

              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-200 max-w-xl leading-relaxed">
                The best blog is one that captivates readers with engaging, well-researched content presented in a clear and relatable way.
              </p>
            </div>

            {/* Hero Right Featured Card */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                onClick={() => handleSelectPost(featuredPost)}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-neutral-400 dark:hover:border-neutral-700 transition-all duration-300 cursor-pointer group flex flex-col"
              >
                {/* Visual Upper Box */}
                <div className="bg-[#f4f4f5] dark:bg-neutral-950/90 h-52 flex items-center justify-center border-b border-neutral-100 dark:border-neutral-800/80 p-6 transition-colors">
                  <BlogGeometricGraphic
                    iconType={featuredPost.iconType || 'iso-striped-cube'}
                    className="w-28 h-28 transform group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Content Lower Box */}
                <div className="p-6 sm:p-7 space-y-3 bg-white dark:bg-neutral-900">
                  <h2 className="text-lg sm:text-xl font-bold text-neutral-950 dark:text-white leading-snug group-hover:text-black dark:group-hover:text-neutral-100 transition-colors">
                    {featuredPost.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-200 leading-relaxed line-clamp-3">
                    {featuredPost.excerpt}
                  </p>

                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white group-hover:gap-2.5 transition-all">
                      <span>{featuredPost.actionLabel || 'Discover the Future'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Blog Grid Section */}
      <div className="relative z-10 w-full bg-[#fafafa] dark:bg-black pb-24">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16">
        {/* Section Header & Radio Filters */}
        <div className="space-y-6 mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
            All Blogs
          </h2>

          {/* Radio Style Categories */}
          <div className="flex flex-wrap items-center gap-5 text-sm">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm cursor-pointer transition-colors group"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'border-neutral-950 dark:border-white'
                        : 'border-neutral-400 dark:border-neutral-400 group-hover:border-neutral-700 dark:group-hover:border-white'
                    }`}
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-neutral-950 dark:bg-white" />
                    )}
                  </span>
                  <span
                    className={`font-medium ${
                      isSelected
                        ? 'text-neutral-950 dark:text-white font-semibold'
                        : 'text-neutral-600 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white'
                    }`}
                  >
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          <AnimatePresence mode="popLayout">
            {displayedPosts.map((post, idx) => (
              <motion.article
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: (idx % 3) * 0.08 }}
                onClick={() => handleSelectPost(post)}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-neutral-400 dark:hover:border-neutral-700 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Top Graphic Panel */}
                  <div className="bg-[#f4f4f5] dark:bg-neutral-950/90 h-48 sm:h-52 flex items-center justify-center border-b border-neutral-100 dark:border-neutral-800/80 p-6 transition-colors">
                    <BlogGeometricGraphic
                      iconType={post.iconType || 'iso-striped-cube'}
                      className="w-24 h-24 transform group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Body Content */}
                  <div className="p-6 sm:p-7 space-y-2.5">
                    <h3 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-white leading-snug group-hover:text-black dark:group-hover:text-neutral-100 transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-200 leading-relaxed line-clamp-2">
                      {post.subtitle || post.excerpt}
                    </p>
                  </div>
                </div>

                {/* Action Link at Bottom */}
                <div className="px-6 pb-6 pt-0">
                  <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-950 dark:text-white group-hover:gap-2.5 transition-all">
                    <span>{post.actionLabel || 'Read Guide'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mt-12 sm:mt-16">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-all duration-200 shadow-sm cursor-pointer active:scale-98"
            >
              Load More
            </button>
          </div>
        )}
      </section>
      </div>
    </div>
  );
};

export default BlogPage;

