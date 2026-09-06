// Peta "apa yang bisa disunting di tiap halaman publik".
//
// Setiap entri di sini menunjuk kunci baris tabel `settings` yang dibaca
// halaman itu lewat useSettings(). Menambah teks yang bisa disunting berarti
// tiga langkah yang harus dilakukan bersama, kalau tidak medannya jadi kolom
// yang tidak pernah muncul di situs:
//   1. seed kuncinya di supabase/schema.sql (dengan is_public = true),
//   2. beri nilai cadangannya di defaultSettings (src/data/siteData.ts),
//   3. daftarkan di berkas ini supaya muncul di panel.
import type { SettingField } from './SettingsForm';

export interface PageEditor {
  title: string;
  subtitle: string;
  cards: { title: string; desc: string; fields: SettingField[] }[];
}

export const PAGE_EDITORS = {
  page_home: {
    title: 'Halaman Home',
    subtitle: 'Teks hero, sorotan, dan ajakan di halaman depan.',
    cards: [
      {
        title: 'Hero',
        desc: 'Bagian paling atas, di depan simulasi bola.',
        fields: [
          { key: 'home_hero_title', label: 'Judul', type: 'textarea' },
          { key: 'home_hero_subtitle', label: 'Subjudul', type: 'textarea' },
          { key: 'home_hero_cta_primary', label: 'Tombol utama' },
          { key: 'home_hero_cta_secondary', label: 'Tombol kedua' },
          {
            key: 'home_marquee_text',
            label: 'Teks marquee berjalan',
            hint: 'Pisahkan beberapa teks dengan tanda | ',
          },
        ],
      },
      {
        title: 'Sorotan & teaser',
        desc: 'Judul daftar proyek pilihan dan kartu perkenalan singkat.',
        fields: [
          { key: 'home_featured_heading', label: 'Judul proyek pilihan' },
          { key: 'home_teaser_badge', label: 'Label lokasi' },
          { key: 'home_teaser_heading', label: 'Judul teaser' },
          { key: 'home_teaser_text', label: 'Isi teaser', type: 'textarea' },
          { key: 'home_teaser_cta', label: 'Tautan teaser' },
          {
            key: 'home_teaser_image',
            label: 'Foto teaser',
            type: 'image',
            hint: 'Kosong → foto bawaan yang ikut dibundel.',
          },
          { key: 'home_blog_heading', label: 'Judul artikel terbaru' },
        ],
      },
      {
        title: 'Ajakan penutup',
        desc: 'Blok terakhir sebelum footer.',
        fields: [
          { key: 'home_cta_heading', label: 'Judul', type: 'textarea' },
          { key: 'home_cta_text', label: 'Keterangan', type: 'textarea' },
          { key: 'home_cta_button', label: 'Tombol' },
        ],
      },
    ],
  },

  page_project: {
    title: 'Halaman Project',
    subtitle: 'Judul halaman portofolio. Daftar proyeknya diurus menu Proyek.',
    cards: [
      {
        title: 'Kepala halaman',
        desc: 'Teks di atas penyaring kategori.',
        fields: [
          { key: 'project_heading', label: 'Judul' },
          { key: 'project_intro', label: 'Keterangan', type: 'textarea' },
        ],
      },
    ],
  },

  page_blog: {
    title: 'Halaman Blog',
    subtitle: 'Judul halaman blog. Artikelnya diurus menu Blog.',
    cards: [
      {
        title: 'Kepala halaman',
        desc: 'Hero dan judul daftar artikel.',
        fields: [
          { key: 'blog_hero_title', label: 'Judul hero' },
          { key: 'blog_hero_subtitle', label: 'Keterangan hero', type: 'textarea' },
          { key: 'blog_heading', label: 'Judul daftar artikel' },
        ],
      },
    ],
  },

  page_about: {
    title: 'Halaman About',
    subtitle: 'Bio dan judul bagian. Isi Tools & Stack dan timeline punya menunya sendiri.',
    cards: [
      {
        title: 'Bio',
        desc: 'Teks di samping kartu lanyard 3D.',
        fields: [
          { key: 'about_heading', label: 'Judul' },
          { key: 'about_bio', label: 'Paragraf utama', type: 'textarea' },
          { key: 'about_philosophy', label: 'Kalimat prinsip', type: 'textarea' },
        ],
      },
      {
        title: 'Judul bagian',
        desc: 'Kepala dua daftar di bawah bio.',
        fields: [
          { key: 'about_tools_heading', label: 'Judul Tools & Stack' },
          { key: 'about_experience_heading', label: 'Judul timeline' },
        ],
      },
    ],
  },

  page_contact: {
    title: 'Halaman Contact',
    subtitle: 'Kontak langsung, kartu jenis pertanyaan, dan peta.',
    cards: [
      {
        title: 'Kontak langsung',
        desc: 'Tiga baris di kiri formulir. Email dan telepon ini juga dipakai footer.',
        fields: [
          { key: 'contact_heading', label: 'Judul halaman' },
          { key: 'contact_intro', label: 'Pengantar', type: 'textarea' },
          { key: 'site_phone', label: 'Telepon', hint: 'Ditulis apa adanya; tautan tel: dibersihkan otomatis.' },
          { key: 'site_email', label: 'Email', type: 'email' },
          { key: 'site_website', label: 'Situs (teks tampil)' },
          { key: 'site_website_url', label: 'Situs (alamat tautan)', type: 'url' },
        ],
      },
      {
        title: 'Formulir',
        desc: 'Judul kotak kiriman pesan.',
        fields: [
          { key: 'contact_form_heading', label: 'Judul' },
          { key: 'contact_form_note', label: 'Catatan waktu balasan' },
        ],
      },
      {
        title: 'Kartu jenis pertanyaan',
        desc: 'Tiga kartu di bawah formulir.',
        fields: [
          { key: 'contact_cards_eyebrow', label: 'Label kecil' },
          { key: 'contact_cards_heading', label: 'Judul', type: 'textarea' },
          { key: 'contact_sales_title', label: 'Kartu 1 — judul' },
          { key: 'contact_sales_text', label: 'Kartu 1 — isi', type: 'textarea' },
          { key: 'contact_sales_cta', label: 'Kartu 1 — tautan' },
          { key: 'contact_support_title', label: 'Kartu 2 — judul' },
          { key: 'contact_support_text', label: 'Kartu 2 — isi', type: 'textarea' },
          { key: 'contact_support_cta', label: 'Kartu 2 — tautan' },
          { key: 'contact_general_title', label: 'Kartu 3 — judul' },
          { key: 'contact_general_text', label: 'Kartu 3 — isi', type: 'textarea' },
          { key: 'contact_general_cta', label: 'Kartu 3 — tautan' },
        ],
      },
      {
        title: 'Peta & alamat',
        desc: 'Koordinat menentukan titik peta yang tersemat sekaligus angka yang tertulis di kartunya.',
        fields: [
          { key: 'contact_map_label', label: 'Label' },
          { key: 'contact_map_title', label: 'Nama tempat' },
          { key: 'contact_map_address', label: 'Alamat', type: 'textarea' },
          { key: 'contact_map_lat', label: 'Lintang (latitude)' },
          { key: 'contact_map_lng', label: 'Bujur (longitude)' },
          { key: 'contact_map_link', label: 'Tautan "Open in Maps"', type: 'url' },
        ],
      },
    ],
  },

  page_footer: {
    title: 'Footer & identitas',
    subtitle: 'Bagian putih di kaki semua halaman publik.',
    cards: [
      {
        title: 'Teks footer',
        desc: 'Email footer mengikuti Email di halaman Contact.',
        fields: [
          { key: 'footer_brand', label: 'Label kiri atas' },
          { key: 'site_location', label: 'Lokasi (kanan atas)' },
          { key: 'footer_wordmark', label: 'Tulisan besar' },
          { key: 'footer_base', label: 'Basis & zona waktu' },
          { key: 'footer_copyright', label: 'Hak cipta' },
        ],
      },
      {
        title: 'Kanal sosial',
        desc: 'Yang dikosongkan tidak ditampilkan di footer.',
        fields: [
          { key: 'social_twitter', label: 'X / Twitter', type: 'url' },
          { key: 'social_github', label: 'GitHub', type: 'url' },
          { key: 'social_dribbble', label: 'Dribbble', type: 'url' },
          { key: 'social_linkedin', label: 'LinkedIn', type: 'url' },
          { key: 'social_facebook', label: 'Facebook', type: 'url' },
        ],
      },
    ],
  },
} satisfies Record<string, PageEditor>;

export type PageEditorKey = keyof typeof PAGE_EDITORS;
