import { createClient } from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL } from './apiBase';

// Vite hanya mengekspos variabel berawalan VITE_ ke bundel browser. Nama
// NEXT_PUBLIC_* dari dokumentasi Next.js tidak pernah terbaca di sini.
//
// Alamatnya se-origin dengan situs dan diproksikan vite.config.ts; alasannya
// ada di src/lib/apiBase.ts.
const url = SUPABASE_URL;
const key = SUPABASE_KEY;

if (!key) {
  throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY belum diisi. Salin .env.example ke .env.');
}

export const supabase = createClient(url, key, {
  // Tabel situs tinggal di schema `web`, bukan `public`. Instance Supabase ini
  // dipakai beberapa layanan, dan `public` adalah tempat semua yang tidak
  // menyebut schema akan menumpuk. Satu baris ini mengarahkan SELURUH
  // supabase.from(...) di panel admin; storage dan auth punya API sendiri dan
  // tidak terpengaruh.
  db: { schema: 'web' },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Situs ini tidak memakai OAuth redirect; membiarkannya menyala membuat
    // klien memindai setiap URL untuk fragmen token.
    detectSessionInUrl: false,
  },
});

export interface AdminProfile {
  role: string | null;
  name: string | null;
  avatarUrl: string | null;
}

/**
 * Profil dari tabel profiles. RLS-lah penjaga sebenarnya; ini untuk UI.
 *
 * Foto dan nama ikut diambil di kueri yang sama dengan peran: ketiganya
 * dibutuhkan pada saat yang persis sama (begitu panel dibuka), jadi memisahnya
 * hanya menambah satu perjalanan bolak-balik sebelum panel bisa digambar.
 */
export async function fetchProfile(userId: string): Promise<AdminProfile> {
  const ambil = (kolom: string) =>
    supabase.from('profiles').select(kolom).eq('id', userId).maybeSingle();

  let { data, error } = await ambil('role, name, avatar_url');

  // avatar_url ditambahkan belakangan oleh supabase/schema.sql. Kalau kode ini
  // sempat tayang sebelum migrasinya dijalankan, PostgREST menolak SELECT-nya
  // (42703) dan `data` jadi null — artinya peran tidak terbaca dan ADMIN
  // TERKUNCI DI LUAR panelnya sendiri. Kolom lama dicoba ulang supaya urutan
  // deploy tidak pernah bisa mengunci akun.
  if (error) ({ data } = await ambil('role, name'));

  const p = data as { role?: string; name?: string; avatar_url?: string } | null;
  return {
    role: p?.role ?? null,
    name: p?.name ?? null,
    avatarUrl: p?.avatar_url ?? null,
  };
}
