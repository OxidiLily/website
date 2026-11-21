import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * Host ini jelas di jaringan lokal (atau di mesin ini sendiri)?
 *
 * Dipakai untuk memutuskan apakah `http:` polos boleh. Supabase homelab memang
 * dilayani tanpa TLS (`http://supabase.home:8000`), dan menuntut https berarti
 * mematikan skrip ini di lingkungan yang justru memakainya. Yang tidak boleh
 * adalah mengirim kunci service-role DAN kata sandi admin dalam teks terbuka ke
 * alamat yang bisa disadap di jalan — dan itu yang terjadi begitu hostnya
 * berupa nama domain publik.
 */
export function hostLokal(hostname) {
  const h = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (!h) return false;
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  // Domain yang secara konvensi hanya hidup di jaringan lokal.
  if (/\.(local|home|lan|internal|home\.arpa)$/.test(h)) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) {
    const [a, b] = h.split('.').map(Number);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT/Tailscale
    return false;
  }
  if (h.includes(':')) {
    if (h === '::1' || /^f[cd]/.test(h) || /^fe[89ab]/.test(h)) return true;
    return false;
  }
  // Nama TANPA titik = nama host internal (`supabase`), bukan nama publik.
  return !h.includes('.');
}

export async function createAdmin(env = process.env) {
  const url = new URL(env.VITE_SUPABASE_URL);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('VITE_SUPABASE_URL tidak valid.');
  }
  if (url.protocol === 'http:' && !hostLokal(url.hostname)) {
    throw new Error(
      `VITE_SUPABASE_URL memakai http polos ke ${url.hostname} yang bukan host lokal. ` +
        'Kunci service-role dan kata sandi admin akan terkirim tanpa TLS — pakai https.',
    );
  }
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL wajib berupa email valid.');
  }
  const key = readFileSync(env.SUPABASE_SERVICE_ROLE_KEY_FILE, 'utf8').trim();
  const password = readFileSync(env.ADMIN_PASSWORD_FILE, 'utf8').replace(/\r?\n$/, '');
  if (!key || password.length < 12) throw new Error('Kunci wajib diisi; kata sandi minimal 12 karakter.');
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  async function request(path, options = {}) {
    const response = await fetch(`${url.href.replace(/\/$/, '')}${path}`, {
      ...options, headers: { ...headers, ...options.headers },
      redirect: 'error', signal: AbortSignal.timeout(30000),
    });
    // Jangan cetak respons server: bisa memuat token atau data akun.
    if (!response.ok) throw new Error(`Supabase ${options.method || 'GET'} ${path.split('?')[0]}: HTTP ${response.status}`);
    return response.json();
  }
  // Service role memverifikasi akun lama tanpa reset atau kenaikan peran.
  let user;
  for (let page = 1; !user; page++) {
    const result = await request(`/auth/v1/admin/users?page=${page}&per_page=100`);
    if (!Array.isArray(result.users)) throw new Error('Daftar akun Supabase tidak valid.');
    user = result.users.find((item) => item.email?.toLowerCase() === email);
    if (result.users.length < 100) break;
  }
  if (!user) {
    user = await request('/auth/v1/admin/users', {
      method: 'POST', body: JSON.stringify({ email, password, email_confirm: true, app_metadata: { require_password_change: true } }),
    });
  }
  if (!user.id) throw new Error('Supabase tidak mengembalikan ID akun.');
  // Recover a missing profile for this configured admin only. Ignore conflicts:
  // never replace an existing profile or elevate its role implicitly.
  await request('/rest/v1/profiles?on_conflict=id', {
    method: 'POST',
    headers: { 'Content-Profile': 'web', Prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify({ id: user.id, role: 'admin' }),
  });
  const profiles = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`, {
    headers: { 'Accept-Profile': 'web' },
  });
  if (profiles[0]?.role !== 'admin') throw new Error('Verifikasi peran admin gagal.');
  console.log('[✓] Akun admin terverifikasi.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createAdmin().catch((error) => {
    console.error(error instanceof Error && !error.message.includes('fetch') ? error.message : 'Koneksi Supabase gagal.');
    process.exitCode = 1;
  });
}
