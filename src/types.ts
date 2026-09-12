export type PageId = 'home' | 'project' | 'blog' | 'contact' | 'about' | 'admin';

export interface BallpitConfig {
  gravity: number;
  friction: number;
  wallBounce: number;
  followCursor: boolean;
  colors: string[];
  count: number;
  minSize: number;
  maxSize: number;
  lightIntensity: number;
}

export interface NavLinkItem {
  id: PageId;
  name: string;
  href: string;
  badge?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: 'Web' | 'Mobile' | 'UI System' | '3D / Physics';
  description: string;
  year: string;
  client: string;
  tags: string[];
  image: string;
  featured?: boolean;
  linkUrl?: string;
  githubUrl?: string;
}

export interface BlogSection {
  id: string;
  title: string;
  content: string;
}

export interface BlogPost {
  id: string;
  title: string;
  breadcrumbTitle?: string;
  subtitle?: string;
  category: 'Productivity' | 'Accessibility' | 'Performance' | 'Engineering' | 'Design System' | 'Creative Coding' | 'Product' | 'Urban Living' | string;
  date: string;
  lastUpdated?: string;
  readTime: string;
  excerpt: string;
  topics?: string[];
  featuredHero?: boolean;
  sections?: BlogSection[];
  content: string;
  tags: string[];
}

export interface ShopItem {
  id: string;
  title: string;
  category: 'Template' | 'Component Pack' | 'Design Kit' | 'Shader & 3D';
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  description: string;
  features: string[];
  badge?: string;
}

/** Satu kartu di "Tools & Stack" halaman About. `icon` kosong = pakai ikon
 *  merek bawaan kalau namanya dikenali, kalau tidak logo situs. */
export interface ToolItem {
  id: string;
  name: string;
  category: string;
  icon?: string;
  link?: string;
}

/** Satu baris di timeline "Experience & Journey". */
export interface ExperienceItem {
  id: string;
  year: string;
  title: string;
  description: string;
}

/** Isi tabel `settings` yang boleh dibaca publik: teks tiap halaman. */
export type SiteSettings = Record<string, string>;
