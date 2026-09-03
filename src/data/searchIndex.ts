import { PageId, ProjectItem, BlogPost } from '../types';
import { projectsData, blogPostsData } from './siteData';

export type SearchCategoryFilter = 'all' | 'home' | 'project' | 'blog' | 'about' | 'contact';

export interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  page: PageId;
  pageName: string;
  category: string;
  tags: string[];
  contentSnippets?: string[];
  actionPayload?: {
    type: 'page' | 'project' | 'blog' | 'section';
    targetId?: string;
    sectionId?: string;
  };
}

// Statically compiled search index with deep content across all public pages
export const searchIndex: SearchItem[] = [
  // ================= HOME PAGE ITEMS =================
  {
    id: 'home-hero',
    title: 'Crafting Digital Products with Physics & Precision',
    subtitle: 'Homepage Hero & Interactive Canvas',
    description: 'Building clear, useful products with refined aesthetics, smooth 60fps WebGL simulations, and robust systems.',
    page: 'home',
    pageName: 'Home',
    category: 'Hero',
    tags: ['Hero', 'WebGL', 'Physics', 'Ballpit', 'Interactive', 'Design', 'Intro'],
    contentSnippets: [
      'Interactive 3D ballpit physics simulation background',
      'Refined aesthetics and fast 60fps interactive animations',
      'Explore projects and learn more about design and engineering background',
    ],
    actionPayload: { type: 'page', sectionId: 'hero-section' },
  },
  {
    id: 'home-featured-projects',
    title: 'Featured Projects Showcase',
    subtitle: 'Homepage Selected Highlights',
    description: 'Curated selection of top design systems, WebGL experiments, and mobile fintech applications.',
    page: 'home',
    pageName: 'Home',
    category: 'Projects',
    tags: ['Featured', 'Showcase', 'Kinetic', 'Astral', 'Strata', 'Portfolio'],
    contentSnippets: [
      'Highlights from Kinetic Design System, Astral 3D Physics WebGL, and Strata Banking & Treasury',
    ],
    actionPayload: { type: 'page' },
  },
  {
    id: 'home-scroll-velocity',
    title: 'Scroll Velocity & Physics Marquee',
    subtitle: 'Interactive Typography Component',
    description: 'Dynamic horizontal marquee responding to user scroll velocity and momentum physics.',
    page: 'home',
    pageName: 'Home',
    category: 'Components',
    tags: ['ScrollVelocity', 'React Bits', 'Marquee', 'Typography', 'Physics'],
    contentSnippets: ['React Bits Scroll Velocity — Interactive Physics'],
    actionPayload: { type: 'page' },
  },
  {
    id: 'home-craft-vision',
    title: 'Design & Development Driven by Craft and Autonomy',
    subtitle: 'Homepage OxidiLily Philosophy',
    description: 'Partnering with early-stage teams and visionary founders to take ideas from zero to production launch.',
    page: 'home',
    pageName: 'Home',
    category: 'About OxidiLily',
    tags: ['Philosophy', 'Batang', 'Design Systems', 'Frontend', 'OxidiLily'],
    contentSnippets: [
      'Based in Batang, Jawa Tengah, Indonesia. Fusing meticulous design systems with robust frontend engineering.',
    ],
    actionPayload: { type: 'page' },
  },
  {
    id: 'home-cta',
    title: "Have a project in mind? Let's build something exceptional",
    subtitle: 'Homepage Call To Action',
    description: 'Currently taking on select design systems, frontend engineering, and WebGL interactive projects.',
    page: 'home',
    pageName: 'Home',
    category: 'Contact',
    tags: ['Hire', 'Inquiry', 'Availability', 'Work Together', 'CTA'],
    contentSnippets: ['Get in touch for custom design systems and WebGL interactive builds.'],
    actionPayload: { type: 'page' },
  },

  // ================= PROJECT PAGE ITEMS =================
  ...projectsData.map((project): SearchItem => ({
    id: `project-${project.id}`,
    title: project.title,
    subtitle: `${project.category} • Client: ${project.client} (${project.year})`,
    description: project.description,
    page: 'project',
    pageName: 'Projects',
    category: project.category,
    tags: [...project.tags, project.client, project.year, project.category, 'Portfolio', 'Work', 'Case Study'],
    contentSnippets: [
      project.description,
      `Technologies used: ${project.tags.join(', ')}`,
      `Client: ${project.client}, Year: ${project.year}`,
    ],
    actionPayload: {
      type: 'project',
      targetId: project.id,
    },
  })),

  // ================= BLOG PAGE ITEMS =================
  ...blogPostsData.map((post): SearchItem => ({
    id: `blog-${post.id}`,
    title: post.title,
    subtitle: `${post.category} • ${post.readTime} • ${post.date}`,
    description: post.excerpt || post.subtitle || post.content,
    page: 'blog',
    pageName: 'Blog',
    category: post.category,
    tags: [
      ...post.tags,
      ...(post.topics || []),
      post.category,
      post.guideType || 'Article',
      'Blog',
      'Guide',
      'Article',
    ],
    contentSnippets: [
      post.excerpt,
      ...(post.topics || []),
      ...(post.sections?.map((s) => `${s.title}: ${s.content}`) || []),
    ],
    actionPayload: {
      type: 'blog',
      targetId: post.id,
    },
  })),

  // ================= ABOUT PAGE ITEMS =================
  {
    id: 'about-bio',
    title: 'About the Independent Designer & Developer',
    subtitle: 'Bio, Background & Design Philosophy',
    description: 'Independent designer and developer focused on building clear, useful products. Shipping for startups and teams from concept through launch.',
    page: 'about',
    pageName: 'About',
    category: 'Bio',
    tags: ['About Me', 'Designer', 'Developer', 'Batang', 'Bio', 'Background', 'Experience'],
    contentSnippets: [
      'Based in Batang, Jawa Tengah, Indonesia. Years of experience shipping for startups and high-impact teams.',
      'Taking projects from concept through launch with craftsmanship and autonomy.',
    ],
    actionPayload: { type: 'page' },
  },
  {
    id: 'about-experience-milestones',
    title: 'Career Milestones & Experience Timeline',
    subtitle: 'Work History & Roles',
    description: 'Timeline of staff design engineering, WebGL shader development, and product design leadership.',
    page: 'about',
    pageName: 'About',
    category: 'Experience',
    tags: ['Timeline', 'Career', 'HyperScale', 'Sphere Interactive', 'Atelier Studio', 'Experience', 'Staff Engineer'],
    contentSnippets: [
      '2026: Independent Creative Director & Developer - Crafting bespoke web systems and 3D physics engines.',
      '2024 - 2025: Staff Design Engineer @ HyperScale - Multi-platform design token architecture and core component libraries.',
      '2022 - 2024: Senior Frontend Developer @ Sphere Interactive - WebGL interactive canvases, 3D visualizers, shader pipelines.',
      '2020 - 2022: Product Designer @ Atelier Studio - SaaS dashboards and brand design systems.',
    ],
    actionPayload: { type: 'page' },
  },
  {
    id: 'about-tools-stack',
    title: 'Tools & Technology Stack',
    subtitle: 'Core Toolkit, Frameworks & Libraries',
    description: 'Production toolkit including React, Next.js, TypeScript, Tailwind CSS, Vite, Figma, Three.js, Astro, and Shadcn/ui.',
    page: 'about',
    pageName: 'About',
    category: 'Stack',
    tags: [
      'Figma',
      'React',
      'Next.js',
      'Tailwind CSS',
      'TypeScript',
      'Vite',
      'v0',
      'GitHub',
      'VS Code',
      'Vercel',
      'Notion',
      'Cursor',
      'Astro',
      'Shadcn/ui',
      'Stack',
      'Tools',
    ],
    contentSnippets: [
      'Design Tools: Figma, Notion',
      'Frontend & Full Stack: React, Next.js, TypeScript, Tailwind CSS, Astro, Shadcn/ui',
      'Build & Workflow: Vite, GitHub, Vercel, VS Code, Cursor, v0',
    ],
    actionPayload: { type: 'page' },
  },

  // ================= CONTACT PAGE ITEMS =================
  {
    id: 'contact-direct-info',
    title: 'Direct Contact & Inquiries',
    subtitle: 'Email, Phone & Direct Channel',
    description: 'Get in touch for bespoke product design, design system consulting, and interactive frontend development.',
    page: 'contact',
    pageName: 'Contact',
    category: 'Contact Info',
    tags: ['Email', 'Phone', 'Direct', 'Inquiry', 'Get in Touch', 'hello@independent-designer.com'],
    contentSnippets: [
      'Email: hello@independent-designer.com',
      'Phone: +1 (555) 010-2400',
      'Website: portfolio-atelier.design',
    ],
    actionPayload: { type: 'page' },
  },
  {
    id: 'contact-form',
    title: 'Send Us a Message Form',
    subtitle: 'Interactive Contact & Inquiry Form',
    description: 'Submit an inquiry regarding design systems, 3D WebGL interactions, or contract engineering. We reply within one business day.',
    page: 'contact',
    pageName: 'Contact',
    category: 'Form',
    tags: ['Form', 'Message', 'Inquiry', 'Quote', 'Project Request'],
    contentSnippets: [
      'Fill in your First Name, Last Name, Email, Subject, and Message to start a project conversation.',
    ],
    actionPayload: { type: 'page' },
  },
  {
    id: 'contact-inquiry-types',
    title: 'Sales, Support & General Inquiries',
    subtitle: 'Dedicated Inquiry Categories',
    description: 'Request a demo for our design platform, get technical support, or submit general business partnerships.',
    page: 'contact',
    pageName: 'Contact',
    category: 'Inquiries',
    tags: ['Sales', 'Demo', 'Support', 'Helpdesk', 'Partnerships'],
    contentSnippets: [
      'Sales: Interested in our platform? Request a demo.',
      'Support: Platform FAQs and assistance.',
      'General Inquiries: Business proposals and collaborations.',
    ],
    actionPayload: { type: 'page' },
  },
  {
    id: 'contact-location-batang',
    title: 'Studio & Headquarters — Alun-Alun Batang',
    subtitle: 'Physical Location & Interactive Map',
    description: 'Jl. Veteran, Kauman, Kec. Batang, Kabupaten Batang, Jawa Tengah 51216, Indonesia (-6.9078°, 109.7302°).',
    page: 'contact',
    pageName: 'Contact',
    category: 'Location',
    tags: [
      'Location',
      'OxidiLily',
      'Headquarters',
      'Alun-Alun Batang',
      'Batang',
      'Jawa Tengah',
      'Central Java',
      'Indonesia',
      'Map',
      'Google Maps',
      'Coordinates',
    ],
    contentSnippets: [
      'Headquarters located at Alun-Alun Batang, Central Java, Indonesia.',
      'Interactive Google Maps embed with dark theme styling and external navigation link.',
    ],
    actionPayload: { type: 'page' },
  },
];

// Popular quick search suggestion keywords
export const popularSearchQueries = [
  'React',
  'Three.js',
  'Accessibility',
  'Design System',
  'Tailwind CSS',
  'Performance',
  'Alun-Alun Batang',
  'VS Code',
  'TypeScript',
  'Figma',
];

// Search execution engine with keyword matching and scoring
export function searchAllContent(
  query: string,
  filterCategory: SearchCategoryFilter = 'all'
): SearchItem[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const searchTokens = cleanQuery.split(/\s+/).filter(Boolean);

  const filteredItems = searchIndex.filter((item) => {
    // Apply page category filter
    if (filterCategory !== 'all') {
      if (item.page !== filterCategory) return false;
    }
    return true;
  });

  // Calculate matching scores
  const scoredItems = filteredItems.map((item) => {
    let score = 0;
    const titleLower = item.title.toLowerCase();
    const subtitleLower = (item.subtitle || '').toLowerCase();
    const descLower = item.description.toLowerCase();
    const tagsLower = item.tags.map((t) => t.toLowerCase());
    const snippetsCombined = (item.contentSnippets || []).join(' ').toLowerCase();

    // Exact title match
    if (titleLower === cleanQuery) score += 100;
    else if (titleLower.includes(cleanQuery)) score += 50;

    // Token matches
    for (const token of searchTokens) {
      if (titleLower.includes(token)) score += 25;
      if (subtitleLower.includes(token)) score += 15;
      if (descLower.includes(token)) score += 10;
      if (tagsLower.some((t) => t.includes(token))) score += 20;
      if (snippetsCombined.includes(token)) score += 8;
    }

    return { item, score };
  });

  // Filter out items with 0 score and sort by score descending
  return scoredItems
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
