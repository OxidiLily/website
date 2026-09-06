import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseOrigin = env.VITE_SUPABASE_URL ? new URL(env.VITE_SUPABASE_URL).origin : '';

  // Origin AI agent yang boleh dihubungi panel admin. Daftar dipisah koma.
  // Wajib diisi kalau endpoint AI di Pengaturan ada di host lain — CSP
  // memblokir fetch ke origin yang tidak terdaftar, dan gejalanya terlihat
  // seperti "AI tidak merespons" tanpa pesan error dari server mana pun.
  const aiOrigins = (env.VITE_AI_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      try { return new URL(s).origin; } catch { return ''; }
    })
    .filter(Boolean);

  // Padanan SecurityHeaders middleware repo acuan. SPA tidak punya middleware,
  // tapi `vite preview` — yang dipakai systemd untuk menyajikan dist/ — bisa
  // memasang header sungguhan, jadi frame-ancestors & nosniff benar-benar
  // terkirim, bukan hanya <meta> yang sebagian arahannya diabaikan browser.
  //
  // TIDAK dipasang, semuanya karena situs ini disajikan lewat HTTP polos di LAN:
  //  - Strict-Transport-Security → akan mengunci browser ke HTTPS yang tak ada.
  //  - Cross-Origin-Opener-Policy → butuh secure context; di HTTP browser
  //    MENGABAIKANNYA sambil mencetak error di konsol tiap kali halaman dibuka,
  //    jadi yang tersisa hanya kebisingannya.
  //  - X-XSS-Protection → sudah dibuang semua browser modern, CSP penggantinya.
  // Ketiganya dipasang di reverse proxy yang menerminasi TLS, bukan di sini.
  const securityHeaders: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Content-Security-Policy': [
      "default-src 'self'",
      // 'wasm-unsafe-eval' wajib: rapier (fisika lanyard) menjalankan WASM.
      "script-src 'self' 'wasm-unsafe-eval' blob:",
      "worker-src 'self' blob:",
      // 'unsafe-inline' style: motion/react dan Tailwind menulis style inline.
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      ['connect-src', "'self'", supabaseOrigin, ...aiOrigins].filter(Boolean).join(' '),
      // Peta lokasi di halaman Contact adalah <iframe> ke maps.google.com.
      // Tanpa frame-src eksplisit, CSP jatuh ke default-src 'self' dan petanya
      // diblokir tanpa jejak selain satu baris di konsol.
      "frame-src https://maps.google.com https://www.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  };

  return {
    assetsInclude: ['**/*.glb'],
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    // Sengaja hanya di preview: server dev Vite menyuntikkan preamble
    // react-refresh sebagai <script> inline, yang ditolak CSP di atas.
    preview: {
      headers: securityHeaders,
    },
  };
});
