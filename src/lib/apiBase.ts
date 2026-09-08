/**
 * Alamat Supabase yang dipakai BROWSER, beserta kunci publiknya.
 *
 * Sengaja se-origin dengan situsnya, BUKAN `VITE_SUPABASE_URL`. Nilai env itu
 * alamat LAN (`http://192.168.2.99:8000`) dan ikut terpanggang ke dalam bundel,
 * jadi pengunjung yang membuka situs lewat Tailscale — di luar LAN — tidak bisa
 * menjangkaunya. Seluruh fetch gagal diam-diam, halaman jatuh ke data cadangan
 * statis, dan gejalanya persis "datanya berbeda kalau lewat Tailscale" tanpa
 * satu pun pesan error yang muncul.
 *
 * `vite.config.ts` memproksikan `/supabase/*` ke `VITE_SUPABASE_URL` dari sisi
 * SERVER — mesin penyaji memang bisa menjangkau Supabase lewat LAN maupun
 * tailnet. Browser cukup bicara ke origin tempat ia memuat situsnya, jadi jalur
 * mana pun bekerja tanpa perlu tahu alamat internal apa pun.
 *
 * Ditulis absolut lewat `window.location.origin`, bukan `/supabase` saja:
 * supabase-js menolak URL yang tidak diawali `http(s)://` di
 * `validateSupabaseUrl` — dicek langsung di sumbernya, bukan diduga.
 */
export const SUPABASE_URL = `${window.location.origin}/supabase`;

export const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
