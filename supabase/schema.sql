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
