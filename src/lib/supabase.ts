import { createClient } from '@supabase/supabase-js';

// Vite hanya mengekspos variabel berawalan VITE_ ke bundel browser. Nama
// NEXT_PUBLIC_* dari dokumentasi Next.js tidak pernah terbaca di sini.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    'VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY belum diisi. Salin .env.example ke .env.',
  );
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Situs ini tidak memakai OAuth redirect; membiarkannya menyala membuat
    // klien memindai setiap URL untuk fragmen token.
    detectSessionInUrl: false,
  },
});

/** Peran dari tabel profiles. RLS-lah penjaga sebenarnya; ini untuk UI. */
export async function fetchRole(userId: string): Promise<string | null> {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  return data?.role ?? null;
}
