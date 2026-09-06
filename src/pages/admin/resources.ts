// Definisi tabel admin. Satu tempat, dipakai ulang oleh ResourceManager —
// enam entitas CRUD yang bentuknya sama tidak perlu enam komponen.
// Kolom & status mengikuti skema repo acuan (rebuild-oxidililyweb).

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'date' | 'list' | 'image';

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  /** Relasi: pilihan diambil dari tabel lain. */
  ref?: { table: string; label: string };
  required?: boolean;
  /** Tampil sebagai kolom tabel. */
  list?: boolean;
  /** Tampil di form. Default true. */
  form?: boolean;
  /** Jadikan dropdown penyaring di atas tabel. */
  filter?: boolean;
  placeholder?: string;
}

export interface Resource {
  table: string;
  title: string;
  subtitle: string;
  fields: Field[];
  order: { column: string; ascending: boolean };
  canCreate: boolean;
  canEdit: boolean;
  /** Kolom yang dicari kotak pencarian. */
  search?: string;
  /** Kolom sumber slug otomatis. */
  slugFrom?: string;
  /** Penyesuaian terakhir sebelum simpan. */
  beforeSave?: (row: Record<string, any>) => Record<string, any>;
  /** Tombol "Generate dengan AI": isi field `to` dari nilai field `from`. */
  aiGenerate?: { from: string; to: string };
}

const STATUS_BLOG = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Dipublikasikan' },
  { value: 'archived', label: 'Diarsipkan' },
];

const STATUS_PROJECT = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'dikembangkan', label: 'Dikembangkan' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'pending', label: 'Pending' },
];

/** Perkiraan waktu baca — rumus repo acuan: 200 kata per menit, minimum 1. */
const readingTime = (html: string): number =>
  Math.max(1, Math.ceil((html || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length / 200));

export const RESOURCES = {
  blogs: {
    table: 'blogs',
    title: 'Manage Blog',
    subtitle: 'Artikel yang tampil di halaman blog publik.',
    order: { column: 'created_at', ascending: false },
    canCreate: true,
    canEdit: true,
    search: 'title',
    slugFrom: 'title',
    fields: [
      { name: 'title', label: 'Judul', type: 'text', required: true, list: true },
      { name: 'slug', label: 'Slug', type: 'text', placeholder: 'otomatis dari judul' },
      {
        name: 'blog_category_id', label: 'Kategori', type: 'select', required: true, list: true,
        filter: true, ref: { table: 'blog_categories', label: 'name' },
      },
      { name: 'status', label: 'Status', type: 'select', required: true, list: true, filter: true, options: STATUS_BLOG },
      { name: 'author', label: 'Penulis', type: 'text', list: true },
      { name: 'featured_image', label: 'Gambar utama', type: 'image' },
      { name: 'content', label: 'Isi (HTML)', type: 'textarea', required: true },
      { name: 'reading_time', label: 'Waktu baca (menit)', type: 'number', form: false, list: true },
    ],
    beforeSave: (row) => ({ ...row, reading_time: readingTime(row.content) }),
    aiGenerate: { from: 'title', to: 'content' },
  },

  blog_categories: {
    table: 'blog_categories',
    title: 'Kategori Blog',
    subtitle: 'Pengelompokan artikel.',
    order: { column: 'name', ascending: true },
    canCreate: true,
    canEdit: true,
    search: 'name',
    slugFrom: 'name',
    fields: [
      { name: 'name', label: 'Nama', type: 'text', required: true, list: true },
      { name: 'slug', label: 'Slug', type: 'text', placeholder: 'otomatis dari nama' },
      { name: 'description', label: 'Deskripsi', type: 'textarea' },
      { name: 'color', label: 'Warna', type: 'text', list: true },
    ],
  },

  projects: {
    table: 'projects',
    title: 'Manage Proyek',
    subtitle: 'Portofolio pekerjaan.',
    order: { column: 'created_at', ascending: false },
    canCreate: true,
    canEdit: true,
    search: 'name',
    slugFrom: 'name',
    fields: [
      { name: 'name', label: 'Nama', type: 'text', required: true, list: true },
      { name: 'slug', label: 'Slug', type: 'text', placeholder: 'otomatis dari nama' },
      {
        name: 'project_category_id', label: 'Kategori', type: 'select', required: true, list: true,
        filter: true, ref: { table: 'project_categories', label: 'name' },
      },
      { name: 'status', label: 'Status', type: 'select', required: true, list: true, filter: true, options: STATUS_PROJECT },
      { name: 'icon', label: 'Ikon', type: 'text' },
      { name: 'image', label: 'Gambar', type: 'image' },
      { name: 'client', label: 'Klien', type: 'text', list: true },
      { name: 'year', label: 'Tahun', type: 'text', list: true },
      { name: 'start_date', label: 'Mulai', type: 'date', list: true },
      { name: 'deadline', label: 'Tenggat', type: 'date', list: true },
      { name: 'tech_stack', label: 'Tech stack (pisah koma)', type: 'list' },
      { name: 'team_members', label: 'Anggota tim (pisah koma)', type: 'list' },
      { name: 'description', label: 'Deskripsi', type: 'textarea' },
    ],
  },

  project_categories: {
    table: 'project_categories',
    title: 'Kategori Proyek',
    subtitle: 'Pengelompokan portofolio.',
    order: { column: 'name', ascending: true },
    canCreate: true,
    canEdit: true,
    search: 'name',
    slugFrom: 'name',
    fields: [
      { name: 'name', label: 'Nama', type: 'text', required: true, list: true },
      { name: 'slug', label: 'Slug', type: 'text', placeholder: 'otomatis dari nama' },
      { name: 'color', label: 'Warna', type: 'text', list: true },
    ],
  },

  products: {
    table: 'products',
    title: 'Manage Produk',
    subtitle: 'Barang di halaman toko.',
    order: { column: 'created_at', ascending: false },
    canCreate: true,
    canEdit: true,
    search: 'name',
    slugFrom: 'name',
    fields: [
      { name: 'name', label: 'Nama', type: 'text', required: true, list: true },
      { name: 'slug', label: 'Slug', type: 'text', placeholder: 'otomatis dari nama' },
      {
        name: 'shop_category_id', label: 'Kategori', type: 'select', required: true, list: true,
        filter: true, ref: { table: 'shop_categories', label: 'name' },
      },
      { name: 'price', label: 'Harga (Rp)', type: 'number', required: true, list: true },
      { name: 'stock', label: 'Stok', type: 'number', required: true, list: true },
      { name: 'image', label: 'Gambar', type: 'image' },
      { name: 'buy_link_tokopedia', label: 'Tautan Tokopedia', type: 'text' },
      { name: 'buy_link_shopee', label: 'Tautan Shopee', type: 'text' },
      { name: 'is_top_seller', label: 'Terlaris', type: 'boolean', list: true },
      { name: 'is_active', label: 'Aktif', type: 'boolean', list: true },
      { name: 'description', label: 'Deskripsi', type: 'textarea' },
    ],
  },

  shop_categories: {
    table: 'shop_categories',
    title: 'Kategori Toko',
    subtitle: 'Pengelompokan produk.',
    order: { column: 'name', ascending: true },
    canCreate: true,
    canEdit: true,
    search: 'name',
    slugFrom: 'name',
    fields: [
      { name: 'name', label: 'Nama', type: 'text', required: true, list: true },
      { name: 'slug', label: 'Slug', type: 'text', placeholder: 'otomatis dari nama' },
      { name: 'icon', label: 'Ikon', type: 'text' },
      { name: 'image', label: 'Gambar', type: 'image' },
      { name: 'client', label: 'Klien', type: 'text', list: true },
      { name: 'year', label: 'Tahun', type: 'text', list: true },
      { name: 'is_active', label: 'Aktif', type: 'boolean', list: true },
    ],
  },

  messages: {
    table: 'messages',
    title: 'Pesan Masuk',
    subtitle: 'Kiriman form kontak. Hanya bisa dibaca, ditandai, atau dihapus.',
    order: { column: 'created_at', ascending: false },
    canCreate: false,
    canEdit: true,
    search: 'name',
    fields: [
      { name: 'name', label: 'Nama', type: 'text', list: true, form: false },
      { name: 'email', label: 'Email', type: 'text', list: true, form: false },
      { name: 'subject', label: 'Subjek', type: 'text', list: true, form: false },
      { name: 'message', label: 'Pesan', type: 'textarea', form: false },
      { name: 'is_read', label: 'Sudah dibaca', type: 'boolean', list: true },
    ],
  },

  ai_chat_sessions: {
    table: 'ai_chat_sessions',
    title: 'AI Chat',
    subtitle: 'Percakapan pengunjung dengan asisten AI.',
    order: { column: 'created_at', ascending: false },
    canCreate: false,
    canEdit: false,
    search: 'visitor_name',
    fields: [
      { name: 'visitor_name', label: 'Pengunjung', type: 'text', list: true, form: false },
      { name: 'visitor_contact', label: 'Kontak', type: 'text', list: true, form: false },
      { name: 'topic', label: 'Topik', type: 'text', list: true, form: false },
      { name: 'messages', label: 'Percakapan', type: 'textarea', form: false },
    ],
  },
} satisfies Record<string, Resource>;

export type ResourceKey = keyof typeof RESOURCES;

export const slugify = (s: string): string =>
  s.toLowerCase().trim()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
