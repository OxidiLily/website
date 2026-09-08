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
      // `blob:` WAJIB ada di connect-src: THREE.GLTFLoader memuat tekstur yang
      // tertanam di card.glb lewat blob: URL. Tanpa itu teksturnya diblokir dan
      // kartu lanyard tampil polos tanpa gambar — tanpa error selain satu baris
      // "GLTFLoader: Couldn't load texture blob:..." di konsol.
      ['connect-src', "'self'", 'blob:', 'data:', supabaseOrigin, ...aiOrigins].filter(Boolean).join(' '),
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

  // Browser TIDAK memanggil Supabase langsung; ia memanggil origin situs ini,
  // dan permintaannya diteruskan dari sini. Alamat di `VITE_SUPABASE_URL` cuma
  // terjangkau dari LAN, sementara situsnya juga dibuka lewat Tailscale —
  // memanggangnya ke dalam bundel membuat pengunjung dari luar LAN kehilangan
  // seluruh data tanpa pesan error apa pun. Lihat src/lib/apiBase.ts.
  //
  // `/ai/*` diproksikan ke origin PERTAMA di VITE_AI_ORIGIN dengan alasan kedua
  // yang sama pentingnya: 9router TIDAK menjawab preflight CORS di jalur /v1
  // (`OPTIONS /v1/chat/completions` → 401 tanpa access-control-allow-origin),
  // jadi fetch lintas-origin dari browser SELALU diblokir, berapa pun benarnya
  // kunci dan endpointnya. Lewat proxy, panggilannya jadi se-origin: preflight
  // tidak pernah terjadi dan CSP lolos lewat `'self'`.
  const proxy = {
    ...(env.VITE_SUPABASE_URL
      ? {
          '/supabase': {
            target: env.VITE_SUPABASE_URL,
            changeOrigin: true,
            rewrite: (jalur: string) => jalur.replace(/^\/supabase/, ''),
          },
        }
      : {}),
    ...(aiOrigins[0]
      ? {
          '/ai': {
            target: aiOrigins[0],
            changeOrigin: true,
            rewrite: (jalur: string) => jalur.replace(/^\/ai/, ''),
            // Kunci untuk asisten AI di halaman PUBLIK. Namanya sengaja tanpa
            // awalan `VITE_`: hanya variabel berawalan itu yang ikut ke dalam
            // bundel, jadi kunci ini tidak pernah sampai ke browser pengunjung.
            //
            // Disuntikkan HANYA kalau permintaannya belum membawa auth sendiri.
            // Itu yang memisahkan kedua pemakai jalur ini tanpa rute kedua:
            // panel admin mengirim kunci dari tabel `settings` dan lewat apa
            // adanya, pengunjung tidak mengirim apa pun dan dilengkapi di sini.
            configure: (proxy: any) => {
              proxy.on('proxyReq', (proxyReq: any) => {
                if (!env.AI_API_KEY) return;
                if (proxyReq.getHeader('authorization') || proxyReq.getHeader('x-api-key')) return;
                // Kedua bentuk dikirim sekaligus: jalur /v1/chat/completions
                // membaca Authorization, /v1/messages membaca x-api-key, dan
                // masing-masing mengabaikan yang bukan miliknya.
                proxyReq.setHeader('authorization', `Bearer ${env.AI_API_KEY}`);
                proxyReq.setHeader('x-api-key', env.AI_API_KEY);
              });
            },
          },
        }
      : {}),
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
      proxy,
    },
    // Sengaja hanya di preview: server dev Vite menyuntikkan preamble
    // react-refresh sebagai <script> inline, yang ditolak CSP di atas.
    preview: {
      headers: securityHeaders,
      proxy,
    },
  };
});
