-- Skema admin OxidiLily untuk Supabase self-hosted.
-- Jalankan sekali: psql "$DATABASE_URL" -f supabase/schema.sql
-- Idempoten: aman dijalankan ulang.
--
-- Semuanya tinggal di schema `web`, bukan `public`. Instance ini dipakai
-- beberapa layanan, dan `public` adalah tempat semua yang tidak menyebut
-- schema akan mendarat — termasuk objek bawaan ekstensi. Memisahkan sejak awal
-- jauh lebih murah daripada memindahkan belakangan; instance yang terlanjur
-- memakai `public` dipindahkan dengan supabase/migrate-public-to-web.sql.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists web;
grant usage on schema web to anon, authenticated, service_role;

-- PostgREST hanya melayani schema yang disebut di sini. Tanpa baris ini setiap
-- permintaan dijawab 406 PGRST106 "Invalid schema: web". Disetel lewat peran
-- `authenticator` di dalam database, bukan lewat PGRST_DB_SCHEMAS di .env
-- container, supaya ikut volume database dan selamat saat container dibuat
-- ulang. `notify` di akhir berkas yang membuatnya berlaku tanpa restart.
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, web';

-- ── Peran ────────────────────────────────────────────────────────────────
-- Instance ini membuka pendaftaran (auth/v1/settings → disable_signup:false),
-- jadi "sudah login" TIDAK boleh berarti "boleh menulis". Peran default
-- 'viewer'; hanya baris yang dinaikkan manual ke 'admin' yang punya tulis.
create table if not exists web.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text,
  role       text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function web.handle_new_user()
returns trigger language plpgsql security definer set search_path = web as $$
begin
  insert into web.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function web.handle_new_user();

-- security definer: dipanggil dari dalam policy tabel profiles sendiri, jadi
-- tanpa ini rekursif tak berujung.
create or replace function web.is_admin()
returns boolean language sql stable security definer set search_path = web as $$
  select exists (
    select 1 from web.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

revoke execute on function web.is_admin() from public;
grant execute on function web.is_admin() to authenticated;

-- ── Sentuh updated_at ────────────────────────────────────────────────────
create or replace function web.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ── Tabel konten ─────────────────────────────────────────────────────────
create table if not exists web.blog_categories (
  id          bigint generated always as identity primary key,
  name        text not null,
  slug        text not null unique,
  description text,
  color       text not null default 'primary',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists web.blogs (
  id               bigint generated always as identity primary key,
  blog_category_id bigint not null references web.blog_categories (id) on delete cascade,
  title            text not null,
  slug             text not null unique,
  content          text,
  author           text not null default 'Admin',
  status           text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured_image   text,
  reading_time     integer,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists blogs_status_created_idx on web.blogs (status, created_at desc);

create table if not exists web.project_categories (
  id         bigint generated always as identity primary key,
  name       text not null,
  slug       text not null unique,
  color      text not null default 'primary',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists web.projects (
  id                  bigint generated always as identity primary key,
  project_category_id bigint not null references web.project_categories (id) on delete cascade,
  name                text not null,
  slug                text not null unique,
  description         text,
  icon                text,
  status              text not null default 'aktif' check (status in ('aktif', 'dikembangkan', 'selesai', 'pending')),
  start_date          date,
  deadline            date,
  tech_stack          jsonb not null default '[]'::jsonb,
  team_members        jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists web.shop_categories (
  id         bigint generated always as identity primary key,
  name       text not null,
  slug       text not null unique,
  icon       text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists web.products (
  id                 bigint generated always as identity primary key,
  shop_category_id   bigint not null references web.shop_categories (id) on delete cascade,
  name               text not null,
  slug               text not null unique,
  description        text,
  price              bigint not null default 0 check (price >= 0),
  stock              integer not null default 0 check (stock >= 0),
  image              text,
  buy_link_tokopedia text,
  buy_link_shopee    text,
  is_top_seller      boolean not null default false,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists web.messages (
  id         bigint generated always as identity primary key,
  name       text not null check (length(name) between 1 and 255),
  email      text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject    text check (length(subject) <= 255),
  message    text not null check (length(message) between 1 and 5000),
  is_read    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists web.ai_chat_sessions (
  id              bigint generated always as identity primary key,
  visitor_name    text not null check (length(visitor_name) between 1 and 255),
  visitor_contact text check (length(visitor_contact) <= 255),
  topic           text not null check (length(topic) between 1 and 255),
  messages        jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists ai_chat_sessions_topic_idx on web.ai_chat_sessions (topic);

create table if not exists web.settings (
  id         bigint generated always as identity primary key,
  key        text not null unique,
  value      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['profiles','blog_categories','blogs','project_categories','projects',
                           'shop_categories','products','messages','ai_chat_sessions','settings']
  loop
    execute format('drop trigger if exists touch_%1$s on web.%1$I', t);
    execute format('create trigger touch_%1$s before update on web.%1$I
                    for each row execute function web.touch_updated_at()', t);
    execute format('alter table web.%I enable row level security', t);
  end loop;
end $$;

-- ── RLS ──────────────────────────────────────────────────────────────────
-- Pola: publik hanya BACA yang memang terbit; tulis selalu lewat is_admin().
-- `to authenticated` pada policy tulis membuat anon tidak pernah dievaluasi.
do $$
declare t text;
begin
  foreach t in array array['profiles','blog_categories','blogs','project_categories','projects',
                           'shop_categories','products','messages','ai_chat_sessions','settings']
  loop
    execute format('drop policy if exists admin_all on web.%I', t);
    execute format('create policy admin_all on web.%I for all to authenticated
                    using (web.is_admin()) with check (web.is_admin())', t);
  end loop;
end $$;

-- Setiap orang boleh membaca profilnya sendiri (dipakai untuk cek peran
-- setelah login). Peran TIDAK bisa dinaikkan sendiri: tidak ada policy update
-- selain admin_all.
drop policy if exists profiles_self_read on web.profiles;
create policy profiles_self_read on web.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists blogs_public_read on web.blogs;
create policy blogs_public_read on web.blogs
  for select to anon, authenticated using (status = 'published');

drop policy if exists blog_categories_public_read on web.blog_categories;
create policy blog_categories_public_read on web.blog_categories
  for select to anon, authenticated using (true);

drop policy if exists projects_public_read on web.projects;
create policy projects_public_read on web.projects
  for select to anon, authenticated using (true);

drop policy if exists project_categories_public_read on web.project_categories;
create policy project_categories_public_read on web.project_categories
  for select to anon, authenticated using (true);

drop policy if exists products_public_read on web.products;
create policy products_public_read on web.products
  for select to anon, authenticated using (is_active);

drop policy if exists shop_categories_public_read on web.shop_categories;
create policy shop_categories_public_read on web.shop_categories
  for select to anon, authenticated using (is_active);

-- Form kontak & log chat AI: publik hanya boleh MENULIS, tidak membaca.
-- Tanpa policy select untuk anon, pengunjung tidak bisa memanen pesan orang lain.
drop policy if exists messages_public_insert on web.messages;
create policy messages_public_insert on web.messages
  for insert to anon, authenticated with check (is_read = false);

drop policy if exists ai_chat_public_insert on web.ai_chat_sessions;
create policy ai_chat_public_insert on web.ai_chat_sessions
  for insert to anon, authenticated with check (true);

-- settings memuat kunci AI (lihat SettingsController::updateAi di repo acuan),
-- jadi TIDAK ada policy baca untuk anon. Hanya admin.
--
-- Pengecualiannya HANYA setelan yang menerangkan CARA memanggil model, bukan
-- izinnya: asisten di halaman publik perlu tahu apakah AI aktif, ke mana
-- mengarah, format kabelnya, model, dan instruksi sistemnya. `ai_api_key`
-- sengaja TIDAK ada di daftar ini dan tetap tertutup seperti default kolomnya —
-- kuncinya disuntikkan server penyaji di jalur `/ai/*` (lihat vite.config.ts),
-- jadi tidak pernah ada alasan mengirimkannya ke browser pengunjung.
update web.settings set is_public = true
where key in ('ai_enabled', 'ai_endpoint', 'ai_format', 'ai_model', 'ai_system_prompt');

-- ── Seed kategori minimum supaya form CRUD tidak buntu ───────────────────
insert into web.blog_categories (name, slug, color) values
  ('Engineering', 'engineering', 'primary'),
  ('Design',      'design',      'secondary')
on conflict (slug) do nothing;

insert into web.project_categories (name, slug, color) values
  ('Web', 'web', 'primary'),
  ('3D',  '3d',  'secondary')
on conflict (slug) do nothing;

insert into web.shop_categories (name, slug) values
  ('Template', 'template')
on conflict (slug) do nothing;

insert into web.settings (key, value) values
  ('site_tagline',      'OxidiLily — Portfolio'),
  ('site_description',  ''),
  ('site_email',        ''),
  ('site_whatsapp',     ''),
  ('site_location',     'Batang, Jawa Tengah, Indonesia'),
  ('site_favicon',      ''),
  ('social_github',     ''),
  ('social_linkedin',   ''),
  ('social_facebook',   ''),
  ('blog_heading',      'Blog'),
  ('blog_subtitle',     '')
on conflict (key) do nothing;

-- ── Naikkan akun admin ───────────────────────────────────────────────────
-- Tidak melakukan apa pun selama akunnya belum ada, jadi berkas ini aman
-- dijalankan sebelum maupun sesudah user dibuat di Studio → Authentication.
-- Urutan yang praktis: jalankan berkas ini, buat user (centang Auto Confirm),
-- lalu jalankan berkas ini sekali lagi.
insert into web.profiles (id, name, role)
select id, coalesce(raw_user_meta_data ->> 'name', 'OxidiLily'), 'admin'
from auth.users
where email = 'oxidilily@oxidilily.com'
on conflict (id) do update set role = 'admin';

-- ═════════════════════════════════════════════════════════════════════════
-- KONTEN HALAMAN PUBLIK YANG DIKELOLA PANEL
-- ═════════════════════════════════════════════════════════════════════════
-- Sebelum bagian ini, satu-satunya yang bisa diubah dari panel adalah blog,
-- proyek, dan produk. Teks halaman (hero, bio, kontak), daftar Tools & Stack,
-- serta timeline pengalaman masih dipatri di dalam berkas .tsx — mengubahnya
-- berarti build ulang. Tiga blok di bawah memindahkan semuanya ke database.

-- ── settings: mana yang boleh dibaca pengunjung ──────────────────────────
-- Tabel ini menyimpan kunci API AI, jadi TIDAK boleh dibuka seluruhnya ke
-- anon. Penandanya per-baris dan default-nya tertutup: baris baru (termasuk
-- rahasia yang belum terpikirkan hari ini) aman tanpa harus diingat.
alter table web.settings add column if not exists is_public boolean not null default false;

drop policy if exists settings_public_read on web.settings;
create policy settings_public_read on web.settings
  for select to anon, authenticated using (is_public);

-- ── Foto profil admin ────────────────────────────────────────────────────
alter table web.profiles add column if not exists avatar_url text;

-- Admin mengubah namanya/fotonya sendiri lewat panel. admin_all sudah
-- mengizinkannya, tapi policy ini membuatnya tetap jalan kalau suatu saat
-- ada admin yang diturunkan perannya di tengah sesi.
drop policy if exists profiles_self_update on web.profiles;
create policy profiles_self_update on web.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ── Tools & Stack (halaman About) ────────────────────────────────────────
create table if not exists web.tools (
  id         bigint generated always as identity primary key,
  name       text not null unique,
  category   text not null default '',
  icon       text,                                    -- URL gambar; kosong = ikon merek bawaan / logo.png
  link       text,
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Timeline pengalaman (halaman About) ──────────────────────────────────
create table if not exists web.experiences (
  id          bigint generated always as identity primary key,
  year        text not null,
  title       text not null,
  description text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['tools','experiences']
  loop
    execute format('drop trigger if exists touch_%1$s on web.%1$I', t);
    execute format('create trigger touch_%1$s before update on web.%1$I
                    for each row execute function web.touch_updated_at()', t);
    execute format('alter table web.%I enable row level security', t);
    execute format('drop policy if exists admin_all on web.%I', t);
    execute format('create policy admin_all on web.%I for all to authenticated
                    using (web.is_admin()) with check (web.is_admin())', t);
    execute format('drop policy if exists %1$s_public_read on web.%1$I', t);
    execute format('create policy %1$s_public_read on web.%1$I
                    for select to anon, authenticated using (is_active)', t);
  end loop;
end $$;

-- ── Bucket media untuk unggahan gambar panel ─────────────────────────────
-- Dipakai ImageInput (gambar blog/proyek/produk/tool) dan foto profil admin.
-- Baca publik supaya <img> di halaman publik bisa memuatnya; tulis hanya admin.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');

drop policy if exists media_admin_write on storage.objects;
create policy media_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'media' and web.is_admin())
  with check (bucket_id = 'media' and web.is_admin());

-- ── Seed teks halaman ────────────────────────────────────────────────────
-- Nilainya PERSIS seperti yang dulu dipatri di .tsx, jadi menjalankan berkas
-- ini tidak mengubah tampilan situs sedikit pun — hanya memindahkan sumbernya
-- ke tempat yang bisa disunting panel. `on conflict do nothing` menjaga teks
-- yang sudah diedit admin tidak tertimpa saat berkas ini dijalankan ulang.
insert into web.settings (key, value, is_public) values
  ('home_hero_title',       'Crafting Digital Products with Physics & Precision', true),
  ('home_hero_subtitle',    'Building clear, useful products with refined aesthetics, smooth 60fps WebGL simulations, and robust systems.', true),
  ('home_hero_cta_primary', 'Explore Projects', true),
  ('home_hero_cta_secondary','About Me', true),
  ('home_marquee_text',     'React Bits | Scroll Velocity — Interactive Physics', true),
  ('home_featured_heading', 'Featured Projects', true),
  ('home_teaser_badge',     'Batang, Jawa Tengah, Indonesia 🇮🇩', true),
  ('home_teaser_heading',   'Design & Development Driven by Craft and Autonomy', true),
  ('home_teaser_text',      'I partner with early-stage teams and visionary founders to take ideas from zero to production launch, fusing meticulous design systems with robust frontend engineering.', true),
  ('home_teaser_cta',       'Read full story & background', true),
  ('home_teaser_image',     '', true),
  ('home_blog_heading',     'Latest from Blog', true),
  ('home_cta_heading',      'Have a project in mind? Let''s build something exceptional.', true),
  ('home_cta_text',         'Currently taking on select design systems, frontend engineering, and WebGL interactive projects.', true),
  ('home_cta_button',       'Get In Touch', true),

  ('about_heading',            'About Me', true),
  ('about_bio',                'I am an independent designer and developer focused on building clear, useful products. With years of experience shipping for startups and teams, I take on work I can own from concept through launch.', true),
  ('about_philosophy',         'I start from the purpose, the people it serves, and the simplest path forward. Clarity first, then the work gets better.', true),
  ('about_tools_heading',      'Tools & Stack', true),
  ('about_experience_heading', 'Experience & Journey', true),

  ('project_heading', 'Selected Projects', true),
  ('project_intro',   'A showcase of design systems, WebGL physics engines, responsive mobile apps, and scalable web platforms crafted with modern precision.', true),

  ('contact_heading',      'Contact Us', true),
  ('contact_intro',        'Building with cutting-edge design systems and Tailwind? Drop us a line if you need help architecting scalable components, 3D interactions, or wiring bespoke products.', true),
  ('site_phone',           '+1 (555) 010-2400', true),
  ('site_website',         'portfolio-atelier.design', true),
  ('site_website_url',     'https://shadcnblocks.com', true),
  ('contact_form_heading', 'Send us a message', true),
  ('contact_form_note',    'We usually reply within one business day.', true),
  ('contact_cards_eyebrow','Contact us', true),
  ('contact_cards_heading','Get in touch with us today to learn more', true),
  ('contact_sales_title',  'Sales', true),
  ('contact_sales_text',   'Interested in learning more about our platform? Contact our sales team for more information.', true),
  ('contact_sales_cta',    'Request a demo', true),
  ('contact_support_title','Support', true),
  ('contact_support_text', 'We''re here to help with any platform questions. Check out our FAQs and learn more.', true),
  ('contact_support_cta',  'Get support', true),
  ('contact_general_title','General Inquiries', true),
  ('contact_general_text', 'For general inquiries, please reach out to us using the form above.', true),
  ('contact_general_cta',  'Contact us', true),
  ('contact_map_label',    'Studio & Headquarters', true),
  ('contact_map_title',    'Alun-Alun Batang, Central Java', true),
  ('contact_map_address',  'Jl. Veteran, Kauman, Kec. Batang, Kabupaten Batang, Jawa Tengah 51216, Indonesia.', true),
  ('contact_map_lat',      '-6.9078706', true),
  ('contact_map_lng',      '109.7302222', true),
  ('contact_map_link',     'https://maps.app.goo.gl/jDBncCiGNfAWegQ66', true),

  ('blog_hero_title',    'Best Blog Articles', true),
  ('blog_hero_subtitle', 'The best blog is one that captivates readers with engaging, well-researched content presented in a clear and relatable way.', true),

  ('footer_brand',     'OxidiLily • Portfolio', true),
  ('footer_wordmark',  'OxidiLily', true),
  ('footer_base',      'Batang, Jawa Tengah (WIB UTC+7)', true),
  ('footer_copyright', '© 2026 OxidiLily. All rights reserved.', true),
  ('social_twitter',   'https://twitter.com', true),
  ('social_dribbble',  'https://dribbble.com', true)
on conflict (key) do nothing;

-- Kunci yang sudah ada sejak seed awal ikut dibuka ke publik. Kunci ai_* tidak
-- disebut di sini, jadi tetap tertutup seperti default kolomnya.
update web.settings set is_public = true
where key in ('site_tagline', 'site_description', 'site_email', 'site_whatsapp', 'site_location', 'site_favicon',
              'social_github', 'social_linkedin', 'social_facebook', 'blog_heading', 'blog_subtitle');

-- Nilai bawaan untuk kunci lama yang diseed kosong.
update web.settings set value = 'hello@independent-designer.com'
where key = 'site_email' and coalesce(value, '') = '';
update web.settings set value = 'Batang, Jawa Tengah, Indonesia 🇮🇩'
where key = 'site_location' and coalesce(value, '') = '';
update web.settings set value = 'https://github.com'
where key = 'social_github' and coalesce(value, '') = '';
update web.settings set value = 'https://linkedin.com'
where key = 'social_linkedin' and coalesce(value, '') = '';
update web.settings set value = 'Portfolio & digital store modern dengan interactive 3D physics ballpit, scroll velocity banner, serta halaman home, project, blog, shop, contact, dan about.'
where key = 'site_description' and coalesce(value, '') = '';

-- Teks antarmuka (navigasi, pencarian, formulir, label tombol). Dipisah dari
-- blok di atas hanya supaya mudah dibaca; sifatnya sama — publik dan disunting
-- dari panel. Awalan `assistant_` sengaja dipakai untuk asisten di halaman
-- publik: kunci berawalan `ai_` adalah endpoint dan API key yang TIDAK boleh
-- ikut terbuka, dan memisahkan awalannya membuat batas itu terbaca sekilas.
insert into web.settings (key, value, is_public) values
  ('site_name', 'OxidiLily', true),
  ('nav_home', 'Home', true),
  ('nav_project', 'Project', true),
  ('nav_blog', 'Blog', true),
  ('nav_about', 'About', true),
  ('nav_contact', 'Contact', true),
  ('nav_search_label', 'Search', true),
  ('nav_chat_label', 'Chat AI', true),
  ('loading_text', 'Memuat halaman…', true),
  ('title_home', 'OxidiLily — Portfolio', true),
  ('title_project', 'Projects — OxidiLily', true),
  ('title_blog', 'Blog — OxidiLily', true),
  ('title_contact', 'Contact — OxidiLily', true),
  ('title_about', 'About — OxidiLily', true),
  ('title_admin', 'Admin — OxidiLily', true),
  ('search_placeholder', 'Search across Home, Projects, Blog, About, Contact...', true),
  ('search_filter_all', 'All Content', true),
  ('search_filter_home', 'Home', true),
  ('search_filter_project', 'Projects', true),
  ('search_filter_blog', 'Blog', true),
  ('search_filter_about', 'About', true),
  ('search_filter_contact', 'Contact', true),
  ('search_suggestions_label', 'Quick Suggestions', true),
  ('search_nav_hint', 'Use ↑ ↓ keys to navigate', true),
  ('search_found_label', 'Found', true),
  ('search_recommended_label', 'Recommended', true),
  ('search_empty_title', 'No results found', true),
  ('search_empty_text', 'We couldn’t find any content matching "{query}". Try searching for topics like React, Three.js, Accessibility, or Location.', true),
  ('search_clear_label', 'Clear Search', true),
  ('search_hint_select', 'Select', true),
  ('search_hint_navigate', 'Navigate', true),
  ('search_hint_close', 'Press {esc} to close', true),
  ('home_featured_cta', 'View all projects', true),
  ('home_blog_cta', 'View all articles', true),
  ('home_blog_card_cta', 'Read Article', true),
  ('project_filter_label', 'Filter:', true),
  ('project_category_all', 'All', true),
  ('project_modal_stack_heading', 'Technology Stack & Deliverables', true),
  ('project_modal_close', 'Close', true),
  ('blog_category_all', 'All', true),
  ('blog_featured_cta', 'Discover the Future', true),
  ('blog_card_cta', 'Read Guide', true),
  ('blog_load_more', 'Load More', true),
  ('post_jump_label', 'JUMP TO SECTION:', true),
  ('post_toc_label', 'ON THIS PAGE', true),
  ('post_overview', 'Overview', true),
  ('post_main_heading', 'Beginner''s Guide', true),
  ('post_action_default', 'Get Started', true),
  ('post_guide_type_default', 'Gardening Guide', true),
  ('nav_mobile_label', 'Mobile Navigation', true),
  ('search_clear_input_label', 'Clear search input', true),
  ('search_close_label', 'Close search', true),
  ('assistant_close_label', 'Tutup AI modal', true),
  ('assistant_send_label', 'Kirim pesan', true),
  ('project_modal_close_label', 'Close modal', true),
  ('post_last_updated', 'Last Updated', true),
  ('post_back', 'Back to all articles', true),
  ('post_share', 'Share', true),
  ('post_copied', 'Copied', true),
  ('post_bookmark', 'Bookmark article', true),
  ('contact_field_first_name', 'First Name', true),
  ('contact_field_last_name', 'Last Name', true),
  ('contact_field_email', 'Email', true),
  ('contact_field_subject', 'Subject', true),
  ('contact_field_message', 'Message', true),
  ('contact_ph_first_name', 'Jordan', true),
  ('contact_ph_last_name', 'Kim', true),
  ('contact_ph_email', 'you@company.com', true),
  ('contact_ph_subject', 'Question about blocks / project inquiry', true),
  ('contact_ph_message', 'Tell us what you are building...', true),
  ('contact_form_submit', 'Send message', true),
  ('contact_form_sending', 'Mengirim…', true),
  ('contact_success_title', 'Message Received!', true),
  ('contact_success_text', 'Thank you for reaching out, {nama}. We will review your inquiry and get back to you shortly.', true),
  ('contact_success_cta', 'Send another message', true),
  ('contact_map_cta', 'Open in Maps', true),
  ('footer_label_inquiry', 'DIRECT INQUIRY', true),
  ('footer_label_channels', 'CHANNELS', true),
  ('footer_label_base', 'BASE & TIMEZONE', true),
  ('social_twitter_label', 'X / Twitter', true),
  ('social_github_label', 'GitHub', true),
  ('social_dribbble_label', 'Dribbble', true),
  ('social_linkedin_label', 'LinkedIn', true),
  ('social_facebook_label', 'Facebook', true),
  ('assistant_title', 'AI Assistant', true),
  ('assistant_badge', 'Live', true),
  ('assistant_subtitle', 'Interactive Creative Guide', true),
  ('assistant_placeholder', 'Tanyakan sesuatu pada OxidiLily AI...', true),
  ('assistant_greeting', 'Halo! Saya OxidiLily AI Assistant. Saya siap membantu kamu mengeksplorasi portfolio, proyek 3D physics, artikel engineering, atau mendiskusikan peluang kolaborasi.', true),
  ('assistant_reply_project', 'OxidiLily memiliki beberapa proyek unggulan seperti 3D WebGL Ballpit, Design System Neomorphic, dan E-Commerce Platform berkecapatan tinggi.', true),
  ('assistant_action_project', 'Buka Halaman Projects', true),
  ('assistant_reply_stack', 'Stack utama mencakup React 19, TypeScript, Tailwind CSS, Three.js / OGL untuk visual 3D WebGL, Motion, serta Next.js dan Node.js di sisi arsitektur modern.', true),
  ('assistant_action_stack', 'Pelajari di About', true),
  ('assistant_reply_blog', 'Kamu dapat membaca artikel mendalam tentang WebGL Performance, Interactive Physics, dan Modern UI Architecture di halaman Blog.', true),
  ('assistant_action_blog', 'Eksplor Blog', true),
  ('assistant_reply_contact', 'Kami terbuka untuk freelance, proyek studio, dan konsultasi arsitektur frontend. Silakan kirim pesan melalui halaman Contact.', true),
  ('assistant_action_contact', 'Kirim Pesan', true),
  ('assistant_reply_default', 'Terima kasih atas pertanyaannya mengenai "{pertanyaan}". Kamu dapat menjelajahi seluruh bagian website kami untuk melihat detail lebih lengkap.', true),
  ('assistant_action_default', 'Kembali ke Home', true)
on conflict (key) do nothing;

-- ── Seed Tools & Stack + timeline ────────────────────────────────────────
-- `where not exists` (bukan on conflict): sekali terisi, daftar milik admin.
-- Menghapus satu tool lewat panel tidak boleh dihidupkan lagi oleh migrasi.
insert into web.tools (name, category, sort_order)
select * from (values
  ('Figma',        'DESIGN TOOL',           10),
  ('Next.js',      'FULL STACK FRAMEWORK',  20),
  ('v0',           'AI TOOL',               30),
  ('TypeScript',   'PROGRAMMING LANGUAGE',  40),
  ('VS Code',      'CODE EDITOR',           50),
  ('Notion',       'PRODUCTIVITY TOOL',     60),
  ('Astro',        'WEB FRAMEWORK',         70),
  ('React',        'JAVASCRIPT LIBRARY',    80),
  ('Tailwind CSS', 'CSS FRAMEWORK',         90),
  ('Vite',         'BUILD TOOL',           100),
  ('GitHub',       'VERSION CONTROL',      110),
  ('Vercel',       'HOSTING PLATFORM',     120),
  ('Cursor',       'AI CODE EDITOR',       130),
  ('Shadcn/ui',    'COMPONENT LIBRARY',    140)
) as seed(name, category, sort_order)
where not exists (select 1 from web.tools);

insert into web.experiences (year, title, description, sort_order)
select * from (values
  ('2026',        'Independent Creative Director & Developer',        'Crafting bespoke web systems and 3D physics engines for high-impact teams.', 10),
  ('2024 - 2025', 'Staff Design Engineer @ HyperScale',               'Led the multi-platform design token architecture and core component libraries.', 20),
  ('2022 - 2024', 'Senior Frontend Developer @ Sphere Interactive',   'Engineered WebGL interactive canvases, 3D product visualizers, and shader pipelines.', 30),
  ('2020 - 2022', 'Product Designer @ Atelier Studio',                'Designed high-growth SaaS dashboards and brand design systems.', 40)
) as seed(year, title, description, sort_order)
where not exists (select 1 from web.experiences);

-- ── Hak akses schema web ─────────────────────────────────────────────────
-- `public` sudah punya default privileges bawaan Supabase untuk anon dan
-- authenticated; schema baru tidak mewarisinya. Tanpa blok ini PostgREST
-- menjawab "permission denied" untuk setiap tabel. Yang menjaga data tetap
-- RLS di atas — grant ini hanya membuka pintunya.
grant all on all tables in schema web to anon, authenticated, service_role;
grant all on all sequences in schema web to anon, authenticated, service_role;
alter default privileges in schema web grant all on tables to anon, authenticated, service_role;
alter default privileges in schema web grant all on sequences to anon, authenticated, service_role;

notify pgrst, 'reload config';
notify pgrst, 'reload schema';
