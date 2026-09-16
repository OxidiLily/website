-- Terapkan setelah schema.sql, sebelum deploy dengan admin-init.
-- Penanda hanya boleh ditulis lewat Admin API (app_metadata), bukan user_metadata.
create or replace function web.is_admin()
returns boolean language sql stable security definer set search_path = web as $$
  select exists (
    select 1 from web.profiles p join auth.users u on u.id = p.id
    where p.id = auth.uid() and p.role = 'admin'
      and coalesce(u.raw_app_meta_data ->> 'require_password_change', 'false') = 'false'
  )
$$;
revoke execute on function web.is_admin() from public;
grant execute on function web.is_admin() to authenticated, service_role;

-- GoTrue menulis hash baru setelah memvalidasi perubahan password.
-- Membaca auth.users langsung di is_admin membuat JWT lama tidak bisa
-- melewati pembatasan sebelum password benar-benar diganti.
create or replace function web.password_changed()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.raw_app_meta_data ->> 'require_password_change' = 'true'
     and new.encrypted_password is distinct from old.encrypted_password
     and coalesce(new.encrypted_password, '') <> '' then
    new.raw_app_meta_data = jsonb_set(
      coalesce(new.raw_app_meta_data, '{}'::jsonb),
      '{require_password_change}', 'false'::jsonb
    );
  end if;
  return new;
end $$;
drop trigger if exists web_password_changed on auth.users;
create trigger web_password_changed before update of encrypted_password on auth.users
  for each row execute function web.password_changed();
notify pgrst, 'reload schema';
