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

// Hanya kunci yang dipakai LEBIH DARI SATU halaman. Teks khusus satu halaman
// ada di menu Halaman, dan kunci lama yang tidak menggerakkan apa pun
// (site_tagline, site_whatsapp, blog_subtitle) sengaja tidak ditampilkan lagi:
// medan yang tidak mengubah apa-apa di situs lebih membingungkan daripada
// tidak ada medannya sama sekali.
export const SITE_KEYS: { key: string; label: string; type?: string }[] = [
  { key: 'site_name', label: 'Nama situs' },
  { key: 'site_description', label: 'Deskripsi situs (SEO & pratinjau tautan)' },
  { key: 'site_favicon', label: 'Ikon tab browser', type: 'image' },
  { key: 'site_location', label: 'Lokasi' },
  { key: 'site_email', label: 'Email kontak', type: 'email' },
  { key: 'site_phone', label: 'Telepon' },
  { key: 'site_website', label: 'Situs (teks tampil)' },
  { key: 'site_website_url', label: 'Situs (alamat tautan)', type: 'url' },
];

export const PAGE_EDITORS = {
  page_nav: {
    title: 'Navigasi & judul tab',
    subtitle: 'Nama menu di navbar, footer, dan tab pencarian — semuanya dari kunci yang sama.',
    cards: [
      {
        title: 'Menu',
        desc: 'Dipakai bersamaan oleh navbar atas, dock mobile, tautan footer, dan tab penyaring pencarian.',
        fields: [
          { key: 'site_name', label: 'Nama situs (wordmark)' },
          { key: 'nav_home', label: 'Menu Home' },
          { key: 'nav_project', label: 'Menu Project' },
          { key: 'nav_blog', label: 'Menu Blog' },
          { key: 'nav_about', label: 'Menu About' },
          { key: 'nav_contact', label: 'Menu Contact' },
          { key: 'nav_search_label', label: 'Tombol pencarian' },
          { key: 'nav_chat_label', label: 'Tombol Chat AI' },
          { key: 'nav_mobile_label', label: 'Label dock mobile (pembaca layar)' },
          { key: 'loading_text', label: 'Teks saat halaman dimuat' },
        ],
      },
      {
        title: 'Judul tab browser',
        desc: 'Yang tertulis di tab dan jadi judul bookmark.',
        fields: [
          { key: 'title_home', label: 'Home' },
          { key: 'title_project', label: 'Project' },
          { key: 'title_blog', label: 'Blog' },
          { key: 'title_about', label: 'About' },
          { key: 'title_contact', label: 'Contact' },
          { key: 'title_admin', label: 'Admin' },
        ],
      },
    ],
  },

  page_search: {
    title: 'Pencarian',
    subtitle: 'Teks di dalam modal pencarian global.',
    cards: [
      {
        title: 'Kotak & petunjuk',
        desc: 'Yang tampil sebelum dan selama mengetik.',
        fields: [
          { key: 'search_placeholder', label: 'Contoh isian kotak cari' },
          { key: 'search_filter_all', label: 'Tab "semua konten"' },
          { key: 'search_filter_home', label: 'Tab Home' },
          { key: 'search_filter_project', label: 'Tab Project' },
          { key: 'search_filter_blog', label: 'Tab Blog' },
          { key: 'search_filter_about', label: 'Tab About' },
          { key: 'search_filter_contact', label: 'Tab Contact' },
          { key: 'search_suggestions_label', label: 'Judul saran cepat' },
          { key: 'search_suggestions', label: 'Saran cepat', hint: 'Kata kunci yang jadi tombol di kotak pencarian, dipisah koma. Kosong = bagian saran tidak tampil.' },
          { key: 'search_found_label', label: 'Awalan jumlah hasil', hint: 'Angkanya ditambahkan otomatis.' },
          { key: 'search_recommended_label', label: 'Judul hasil rekomendasi' },
          { key: 'search_nav_hint', label: 'Petunjuk tombol panah' },
          { key: 'search_hint_select', label: 'Label tombol Enter' },
          { key: 'search_hint_navigate', label: 'Label tombol panah' },
          { key: 'search_hint_close', label: 'Petunjuk menutup', hint: 'Tulis {esc} di tempat tombol ESC muncul.' },
        ],
      },
      {
        title: 'Saat tidak ada hasil',
        desc: 'Ditampilkan kalau kata kunci tidak cocok dengan apa pun.',
        fields: [
          { key: 'search_empty_title', label: 'Judul' },
          { key: 'search_empty_text', label: 'Keterangan', type: 'textarea', hint: 'Tulis {query} di tempat kata kunci pengunjung muncul.' },
          { key: 'search_clear_label', label: 'Tombol bersihkan' },
          { key: 'search_clear_input_label', label: 'Tombol kosongkan kotak (pembaca layar)' },
          { key: 'search_close_label', label: 'Tombol tutup pencarian (pembaca layar)' },
        ],
      },
    ],
  },

  page_assistant: {
    title: 'Asisten AI (halaman publik)',
    subtitle: 'Jendela Chat AI untuk pengunjung. Endpoint dan API key-nya ada di Pengaturan → AI Agent dan TIDAK pernah dibaca pengunjung.',
    cards: [
      {
        title: 'Tampilan',
        desc: 'Kepala jendela dan kotak ketik.',
        fields: [
          { key: 'assistant_title', label: 'Judul' },
          { key: 'assistant_badge', label: 'Lencana status' },
          { key: 'assistant_subtitle', label: 'Subjudul' },
          { key: 'assistant_placeholder', label: 'Contoh isian kotak ketik' },
          { key: 'assistant_close_label', label: 'Tombol tutup (pembaca layar)' },
          { key: 'assistant_send_label', label: 'Tombol kirim (pembaca layar)' },
          { key: 'assistant_greeting', label: 'Sapaan pembuka', type: 'textarea' },
        ],
      },
      {
        title: 'Jawaban bawaan',
        desc: 'Dipakai saat pertanyaan pengunjung mengandung kata kuncinya. Tiap jawaban punya satu tombol arah.',
        fields: [
          { key: 'assistant_reply_project', label: 'Jawaban: proyek', type: 'textarea' },
          { key: 'assistant_action_project', label: 'Tombol: proyek' },
          { key: 'assistant_reply_stack', label: 'Jawaban: teknologi', type: 'textarea' },
          { key: 'assistant_action_stack', label: 'Tombol: teknologi' },
          { key: 'assistant_reply_blog', label: 'Jawaban: blog', type: 'textarea' },
          { key: 'assistant_action_blog', label: 'Tombol: blog' },
          { key: 'assistant_reply_contact', label: 'Jawaban: kontak', type: 'textarea' },
          { key: 'assistant_action_contact', label: 'Tombol: kontak' },
          { key: 'assistant_reply_default', label: 'Jawaban lain-lain', type: 'textarea', hint: 'Tulis {pertanyaan} di tempat pertanyaan pengunjung muncul.' },
          { key: 'assistant_action_default', label: 'Tombol lain-lain' },
        ],
      },
    ],
  },

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
        title: 'Tautan & tombol',
        desc: 'Teks tautan di sudut tiap bagian.',
        fields: [
          { key: 'home_featured_cta', label: 'Tautan "lihat semua proyek"' },
          { key: 'home_blog_cta', label: 'Tautan "lihat semua artikel"' },
          { key: 'home_blog_card_cta', label: 'Tautan di kartu artikel' },
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
      {
        title: 'Penyaring & modal',
        desc: 'Label penyaring kategori dan isi jendela detail proyek.',
        fields: [
          { key: 'project_filter_label', label: 'Label penyaring' },
          { key: 'project_category_all', label: 'Nama kategori "semua"' },
          { key: 'project_modal_stack_heading', label: 'Judul daftar teknologi' },
          { key: 'project_modal_close', label: 'Tombol tutup' },
          { key: 'project_modal_close_label', label: 'Tombol tutup pojok (pembaca layar)' },
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
          { key: 'blog_category_all', label: 'Nama kategori "semua"' },
          { key: 'blog_load_more', label: 'Tombol muat lebih banyak' },
          { key: 'blog_featured_cta', label: 'Tautan kartu utama', hint: 'Dipakai kalau artikelnya tidak punya label sendiri.' },
          { key: 'blog_card_cta', label: 'Tautan kartu biasa', hint: 'Dipakai kalau artikelnya tidak punya label sendiri.' },
        ],
      },
      {
        title: 'Halaman detail artikel',
        desc: 'Label di sekitar isi artikel yang sedang dibaca.',
        fields: [
          { key: 'post_toc_label', label: 'Judul daftar isi' },
          { key: 'post_jump_label', label: 'Judul lompat bagian (mobile)' },
          { key: 'post_overview', label: 'Nama bagian bawaan' },
          { key: 'post_action_default', label: 'Tombol ke bagian pertama' },
          { key: 'post_conclusion', label: 'Tombol ke kesimpulan' },
          { key: 'post_last_updated', label: 'Label terakhir diperbarui' },
          { key: 'post_back', label: 'Tautan kembali' },
          { key: 'post_share', label: 'Tombol bagikan' },
          { key: 'post_copied', label: 'Tombol bagikan setelah disalin' },
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
          { key: 'contact_field_first_name', label: 'Label nama depan' },
          { key: 'contact_ph_first_name', label: 'Contoh nama depan' },
          { key: 'contact_field_last_name', label: 'Label nama belakang' },
          { key: 'contact_ph_last_name', label: 'Contoh nama belakang' },
          { key: 'contact_field_email', label: 'Label email' },
          { key: 'contact_ph_email', label: 'Contoh email' },
          { key: 'contact_field_subject', label: 'Label subjek' },
          { key: 'contact_ph_subject', label: 'Contoh subjek' },
          { key: 'contact_field_message', label: 'Label pesan' },
          { key: 'contact_ph_message', label: 'Contoh pesan' },
          { key: 'contact_form_submit', label: 'Tombol kirim' },
          { key: 'contact_form_sending', label: 'Tombol saat mengirim' },
        ],
      },
      {
        title: 'Setelah pesan terkirim',
        desc: 'Yang menggantikan formulir begitu pesan masuk.',
        fields: [
          { key: 'contact_success_title', label: 'Judul' },
          { key: 'contact_success_text', label: 'Keterangan', type: 'textarea', hint: 'Tulis {nama} di tempat nama pengirim muncul.' },
          { key: 'contact_success_cta', label: 'Tombol kirim lagi' },
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
          { key: 'contact_map_link', label: 'Alamat tautan peta', type: 'url' },
          { key: 'contact_map_cta', label: 'Teks tombol peta' },
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
          { key: 'footer_label_inquiry', label: 'Judul kolom email' },
          { key: 'footer_label_channels', label: 'Judul kolom kanal' },
          { key: 'footer_label_base', label: 'Judul kolom lokasi' },
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
          { key: 'social_twitter_label', label: 'Kanal 1 — nama' },
          { key: 'social_twitter', label: 'Kanal 1 — alamat', type: 'url' },
          { key: 'social_github_label', label: 'Kanal 2 — nama' },
          { key: 'social_github', label: 'Kanal 2 — alamat', type: 'url' },
          { key: 'social_dribbble_label', label: 'Kanal 3 — nama' },
          { key: 'social_dribbble', label: 'Kanal 3 — alamat', type: 'url' },
          { key: 'social_linkedin_label', label: 'Kanal 4 — nama' },
          { key: 'social_linkedin', label: 'Kanal 4 — alamat', type: 'url' },
          { key: 'social_facebook_label', label: 'Kanal 5 — nama' },
          { key: 'social_facebook', label: 'Kanal 5 — alamat', type: 'url' },
        ],
      },
    ],
  },
} satisfies Record<string, PageEditor>;

export type PageEditorKey = keyof typeof PAGE_EDITORS;
