-- Skema admin OxidiLily untuk Supabase self-hosted.
-- Jalankan sekali: psql "$DATABASE_URL" -f supabase/schema.sql
-- Idempoten: aman dijalankan ulang.

create extension if not exists pgcrypto with schema extensions;

-- ── Peran ────────────────────────────────────────────────────────────────
-- Instance ini membuka pendaftaran (auth/v1/settings → disable_signup:false),
-- jadi "sudah login" TIDAK boleh berarti "boleh menulis". Peran default
-- 'viewer'; hanya baris yang dinaikkan manual ke 'admin' yang punya tulis.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text,
  role       text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- security definer: dipanggil dari dalam policy tabel profiles sendiri, jadi
-- tanpa ini rekursif tak berujung.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ── Sentuh updated_at ────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ── Tabel konten ─────────────────────────────────────────────────────────
create table if not exists public.blog_categories (
  id          bigint generated always as identity primary key,
  name        text not null,
  slug        text not null unique,
  description text,
  color       text not null default 'primary',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.blogs (
  id               bigint generated always as identity primary key,
  blog_category_id bigint not null references public.blog_categories (id) on delete cascade,
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
create index if not exists blogs_status_created_idx on public.blogs (status, created_at desc);

create table if not exists public.project_categories (
  id         bigint generated always as identity primary key,
  name       text not null,
  slug       text not null unique,
  color      text not null default 'primary',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id                  bigint generated always as identity primary key,
  project_category_id bigint not null references public.project_categories (id) on delete cascade,
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

create table if not exists public.shop_categories (
  id         bigint generated always as identity primary key,
  name       text not null,
  slug       text not null unique,
  icon       text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id                 bigint generated always as identity primary key,
  shop_category_id   bigint not null references public.shop_categories (id) on delete cascade,
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

create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  name       text not null check (length(name) between 1 and 255),
  email      text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject    text check (length(subject) <= 255),
  message    text not null check (length(message) between 1 and 5000),
  is_read    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_chat_sessions (
  id              bigint generated always as identity primary key,
  visitor_name    text not null check (length(visitor_name) between 1 and 255),
  visitor_contact text check (length(visitor_contact) <= 255),
  topic           text not null check (length(topic) between 1 and 255),
  messages        jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists ai_chat_sessions_topic_idx on public.ai_chat_sessions (topic);

create table if not exists public.settings (
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
    execute format('drop trigger if exists touch_%1$s on public.%1$I', t);
    execute format('create trigger touch_%1$s before update on public.%1$I
                    for each row execute function public.touch_updated_at()', t);
    execute format('alter table public.%I enable row level security', t);
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
    execute format('drop policy if exists admin_all on public.%I', t);
    execute format('create policy admin_all on public.%I for all to authenticated
                    using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Setiap orang boleh membaca profilnya sendiri (dipakai untuk cek peran
-- setelah login). Peran TIDAK bisa dinaikkan sendiri: tidak ada policy update
-- selain admin_all.
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists blogs_public_read on public.blogs;
create policy blogs_public_read on public.blogs
  for select to anon, authenticated using (status = 'published');

drop policy if exists blog_categories_public_read on public.blog_categories;
create policy blog_categories_public_read on public.blog_categories
  for select to anon, authenticated using (true);

drop policy if exists projects_public_read on public.projects;
create policy projects_public_read on public.projects
  for select to anon, authenticated using (true);

drop policy if exists project_categories_public_read on public.project_categories;
create policy project_categories_public_read on public.project_categories
  for select to anon, authenticated using (true);

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select to anon, authenticated using (is_active);

drop policy if exists shop_categories_public_read on public.shop_categories;
create policy shop_categories_public_read on public.shop_categories
  for select to anon, authenticated using (is_active);

-- Form kontak & log chat AI: publik hanya boleh MENULIS, tidak membaca.
-- Tanpa policy select untuk anon, pengunjung tidak bisa memanen pesan orang lain.
drop policy if exists messages_public_insert on public.messages;
create policy messages_public_insert on public.messages
  for insert to anon, authenticated with check (is_read = false);

drop policy if exists ai_chat_public_insert on public.ai_chat_sessions;
create policy ai_chat_public_insert on public.ai_chat_sessions
  for insert to anon, authenticated with check (true);

-- settings memuat kunci AI (lihat SettingsController::updateAi di repo acuan),
-- jadi TIDAK ada policy baca untuk anon. Hanya admin.

-- ── Seed kategori minimum supaya form CRUD tidak buntu ───────────────────
insert into public.blog_categories (name, slug, color) values
  ('Engineering', 'engineering', 'primary'),
  ('Design',      'design',      'secondary')
on conflict (slug) do nothing;

insert into public.project_categories (name, slug, color) values
  ('Web', 'web', 'primary'),
  ('3D',  '3d',  'secondary')
on conflict (slug) do nothing;

insert into public.shop_categories (name, slug) values
  ('Template', 'template')
on conflict (slug) do nothing;

insert into public.settings (key, value) values
  ('site_tagline',      'OxidiLily — Portfolio'),
  ('site_description',  ''),
  ('site_email',        ''),
  ('site_whatsapp',     ''),
  ('site_location',     'Batang, Jawa Tengah, Indonesia'),
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
insert into public.profiles (id, name, role)
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
alter table public.settings add column if not exists is_public boolean not null default false;

drop policy if exists settings_public_read on public.settings;
create policy settings_public_read on public.settings
  for select to anon, authenticated using (is_public);

-- ── Foto profil admin ────────────────────────────────────────────────────
alter table public.profiles add column if not exists avatar_url text;

-- Admin mengubah namanya/fotonya sendiri lewat panel. admin_all sudah
-- mengizinkannya, tapi policy ini membuatnya tetap jalan kalau suatu saat
-- ada admin yang diturunkan perannya di tengah sesi.
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ── Tools & Stack (halaman About) ────────────────────────────────────────
create table if not exists public.tools (
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
create table if not exists public.experiences (
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
    execute format('drop trigger if exists touch_%1$s on public.%1$I', t);
    execute format('create trigger touch_%1$s before update on public.%1$I
                    for each row execute function public.touch_updated_at()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists admin_all on public.%I', t);
    execute format('create policy admin_all on public.%I for all to authenticated
                    using (public.is_admin()) with check (public.is_admin())', t);
    execute format('drop policy if exists %1$s_public_read on public.%1$I', t);
    execute format('create policy %1$s_public_read on public.%1$I
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
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

-- ── Seed teks halaman ────────────────────────────────────────────────────
-- Nilainya PERSIS seperti yang dulu dipatri di .tsx, jadi menjalankan berkas
-- ini tidak mengubah tampilan situs sedikit pun — hanya memindahkan sumbernya
-- ke tempat yang bisa disunting panel. `on conflict do nothing` menjaga teks
-- yang sudah diedit admin tidak tertimpa saat berkas ini dijalankan ulang.
insert into public.settings (key, value, is_public) values
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
update public.settings set is_public = true
where key in ('site_tagline', 'site_description', 'site_email', 'site_whatsapp', 'site_location',
              'social_github', 'social_linkedin', 'social_facebook', 'blog_heading', 'blog_subtitle');

-- Nilai bawaan untuk kunci lama yang diseed kosong.
update public.settings set value = 'hello@independent-designer.com'
where key = 'site_email' and coalesce(value, '') = '';
update public.settings set value = 'Batang, Jawa Tengah, Indonesia 🇮🇩'
where key = 'site_location' and coalesce(value, '') = '';
update public.settings set value = 'https://github.com'
where key = 'social_github' and coalesce(value, '') = '';
update public.settings set value = 'https://linkedin.com'
where key = 'social_linkedin' and coalesce(value, '') = '';

-- ── Seed Tools & Stack + timeline ────────────────────────────────────────
-- `where not exists` (bukan on conflict): sekali terisi, daftar milik admin.
-- Menghapus satu tool lewat panel tidak boleh dihidupkan lagi oleh migrasi.
insert into public.tools (name, category, sort_order)
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
where not exists (select 1 from public.tools);

insert into public.experiences (year, title, description, sort_order)
select * from (values
  ('2026',        'Independent Creative Director & Developer',        'Crafting bespoke web systems and 3D physics engines for high-impact teams.', 10),
  ('2024 - 2025', 'Staff Design Engineer @ HyperScale',               'Led the multi-platform design token architecture and core component libraries.', 20),
  ('2022 - 2024', 'Senior Frontend Developer @ Sphere Interactive',   'Engineered WebGL interactive canvases, 3D product visualizers, and shader pipelines.', 30),
  ('2020 - 2022', 'Product Designer @ Atelier Studio',                'Designed high-growth SaaS dashboards and brand design systems.', 40)
) as seed(year, title, description, sort_order)
where not exists (select 1 from public.experiences);
