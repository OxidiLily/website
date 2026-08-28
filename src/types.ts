export type PageId = 'home' | 'project' | 'blog' | 'shop' | 'contact' | 'about';

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
  actionLabel?: string;
  guideType?: string;
  mainHeading?: string;
  iconType?: string;
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
