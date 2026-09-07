-- Pindahkan seluruh objek aplikasi dari schema `public` ke `web`.
-- SEKALI JALAN, untuk instance yang datanya sudah ada di `public`.
-- Pemasangan baru cukup menjalankan supabase/schema.sql, yang sudah menyasar
-- `web` sejak awal.
--
-- Alasan pindah: instance Supabase ini akan dipakai beberapa layanan. `public`
-- adalah schema bawaan tempat ekstensi dan tabel siapa pun mendarat kalau
-- tidak disebut, jadi menumpuk di sana membuat tabel milik situs ini bercampur
-- dengan milik layanan lain — dan tidak ada cara memisahkannya belakangan
-- tanpa migrasi seperti ini juga.
--
-- Jalankan: psql "$DATABASE_URL" -f supabase/migrate-public-to-web.sql
-- Aman diulang: setiap langkah memeriksa keberadaannya lebih dulu.

begin;

create schema if not exists web;
grant usage on schema web to anon, authenticated, service_role;

-- ── Fungsi dipindahkan, BUKAN dibuat ulang ───────────────────────────────
-- Dua belas policy tabel dan tiga policy storage memanggil is_admin(), dan
-- rujukannya disimpan sebagai OID, bukan nama. `alter function … set schema`
-- mempertahankan OID itu sehingga semua policy tetap sah tanpa disentuh.
-- `drop function` akan ditolak database justru karena masih dipakai policy.
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'is_admin') then
    alter function public.is_admin() set schema web;
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'handle_new_user') then
    alter function public.handle_new_user() set schema web;
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'touch_updated_at') then
    alter function public.touch_updated_at() set schema web;
  end if;
end $$;

-- ── Tabel menyusul ───────────────────────────────────────────────────────
-- Sequence milik kolom identity, indeks, constraint, trigger, dan policy
-- semuanya ikut pindah bersama tabelnya.
do $$
declare t text;
begin
  foreach t in array array['profiles','blog_categories','blogs','project_categories','projects',
                           'shop_categories','products','messages','ai_chat_sessions','settings',
                           'tools','experiences']
  loop
    if exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I set schema web', t);
    end if;
  end loop;
end $$;

-- ── Isi fungsi masih menyebut `public.profiles` ──────────────────────────
-- `create or replace` mempertahankan OID yang sama, jadi policy yang menunjuk
-- fungsi ini tetap sah sementara badannya diperbarui ke schema baru.
create or replace function web.is_admin()
returns boolean language sql stable security definer set search_path = web as $$
  select exists (
    select 1 from web.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

revoke execute on function web.is_admin() from public;
grant execute on function web.is_admin() to authenticated;

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

-- ── Hak akses ────────────────────────────────────────────────────────────
-- Di `public`, Supabase sudah memasang default privileges untuk anon dan
-- authenticated. Schema baru tidak mewarisinya, jadi harus disebut sendiri —
-- kalau tidak, PostgREST menjawab "permission denied" untuk semua tabel.
-- Yang menjaga data tetap RLS; grant ini hanya membuka pintunya.
grant all on all tables in schema web to anon, authenticated, service_role;
grant all on all sequences in schema web to anon, authenticated, service_role;
alter default privileges in schema web grant all on tables to anon, authenticated, service_role;
alter default privileges in schema web grant all on sequences to anon, authenticated, service_role;

-- ── PostgREST harus diberi tahu ──────────────────────────────────────────
-- Tanpa ini setiap permintaan ke `web` dijawab 406 PGRST106 "Invalid schema".
-- Disetel lewat peran `authenticator` di dalam database, BUKAN lewat
-- PGRST_DB_SCHEMAS di berkas .env container: cara ini ikut volume database,
-- jadi selamat kalau container dibuat ulang.
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, web';

commit;

notify pgrst, 'reload config';
notify pgrst, 'reload schema';
