import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export async function createAdmin(env = process.env) {
  const url = new URL(env.VITE_SUPABASE_URL);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('VITE_SUPABASE_URL tidak valid.');
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
  if (user) {
    // Admin yang sudah ada tidak direset atau diuji dengan password awal lagi.
    const profiles = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`, {
      headers: { 'Accept-Profile': 'web' },
    });
    if (profiles[0]?.role !== 'admin') throw new Error('Akun sudah ada tetapi bukan admin. Perubahan peran perlu dilakukan manual.');
  } else {
    user = await request('/auth/v1/admin/users', {
      method: 'POST', body: JSON.stringify({ email, password, email_confirm: true, app_metadata: { require_password_change: true } }),
    });
    if (!user.id) throw new Error('Supabase tidak mengembalikan ID akun.');
    await request('/rest/v1/profiles?on_conflict=id', {
      method: 'POST',
      headers: { 'Content-Profile': 'web', Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ id: user.id, role: 'admin' }),
    });
  }
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
