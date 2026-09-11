import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {lookup} from 'node:dns/promises';
import {readFileSync} from 'node:fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {alasanTepercaya, bersihkanHalaman, ipPrivat, repoMilikTopik, type SumberRujukan} from './src/lib/riset';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseOrigin = env.VITE_SUPABASE_URL ? new URL(env.VITE_SUPABASE_URL).origin : '';

  // Origin AI agent yang boleh dihubungi panel admin. Daftar dipisah koma.
  // Wajib diisi kalau endpoint AI di Pengaturan ada di host lain — CSP
  // memblokir fetch ke origin yang tidak terdaftar, dan gejalanya terlihat
  // seperti "AI tidak merespons" tanpa pesan error dari server mana pun.
  /**
   * Kunci gateway AI untuk asisten di halaman PUBLIK.
   *
   * Dibaca dari BERKAS kalau `AI_API_KEY_FILE` diisi, dan itulah bentuk yang
   * dipakai docker-compose.yml. Alasannya terukur: nilai yang ditaruh di
   * `environment:` (atau `env_file:`) IKUT TERCETAK oleh
   * `docker compose config` dan `docker inspect` — sekali perintah itu masuk
   * log, kuncinya bocor tanpa ada yang menyadarinya. Compose `secrets:`
   * menaruhnya sebagai berkas di /run/secrets dan tidak pernah
   * memunculkannya di keluaran mana pun.
   *
   * Nilai langsung di `AI_API_KEY` tetap didukung — itu yang dipakai
   * `npm run dev` dan unit systemd di host, yang membaca berkas `.env`.
   */
  const aiApiKey = ((): string => {
    const berkas = env.AI_API_KEY_FILE;
    if (!berkas) return env.AI_API_KEY ?? '';
    try {
      return readFileSync(berkas, 'utf8').trim();
    } catch (e: any) {
      // Bukan lempar: server harus tetap menyala. Asisten publiknya yang
      // mundur ke jawaban cadangan dari panel, dan sebabnya disebut sekali
      // di log alih-alih muncul sebagai 401 yang membingungkan.
      console.warn(`[ai] AI_API_KEY_FILE tidak terbaca (${berkas}): ${e?.message ?? e}`);
      return '';
    }
  })();

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
                if (!aiApiKey) return;
                if (proxyReq.getHeader('authorization') || proxyReq.getHeader('x-api-key')) return;
                // Kedua bentuk dikirim sekaligus: jalur /v1/chat/completions
                // membaca Authorization, /v1/messages membaca x-api-key, dan
                // masing-masing mengabaikan yang bukan miliknya.
                proxyReq.setHeader('authorization', `Bearer ${aiApiKey}`);
                proxyReq.setHeader('x-api-key', aiApiKey);
              });
            },
          },
        }
      : {}),
  };

  // ── /riset — pengunduh sumber untuk penulis artikel AI ───────────────────
  //
  // Kenapa di server dan bukan di browser: halaman dokumentasi tidak mengirim
  // header CORS untuk situs ini, jadi browser tidak akan pernah bisa membaca
  // isinya sendiri. Yang bisa mengunduhnya cuma mesin penyaji.
  //
  // Jalur ini TIDAK berautentikasi — sama seperti /supabase dan /ai — jadi
  // batasannya harus ada di dalam, bukan di depan: satu-satunya URL yang mau
  // diunduhnya adalah yang lolos `alasanTepercaya()`, yaitu https ke daftar
  // penerbit tetap, subdomain dokumentasi, atau situs resmi proyek menurut
  // GitHub. Alamat internal homelab tidak ada di semesta itu, jadi jalur ini
  // tidak bisa dipakai untuk mengintip jaringan dalam.
  const UA = 'desain-web-riset/1.0 (+penulis artikel panel admin)';
  const BATAS_UNDUH = 2_000_000;

  /** Repositori GitHub teratas untuk sebuah topik → situs resmi dan README-nya. */
  async function jejakGithub(topik: string): Promise<{ situsResmi: string[]; kandidat: string[] }> {
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(topik)}&sort=stars&per_page=3`,
        { headers: { 'user-agent': UA, accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(12_000) },
      );
      if (!res.ok) return { situsResmi: [], kandidat: [] };
      const json: any = await res.json();
      // Nama repo harus benar-benar milik topiknya, bukan sekadar repo paling
      // populer yang kebetulan cocok kata kuncinya: untuk "web hosting" GitHub
      // mengembalikan `awesome-selfhosted`, dan tanpa penjaga ini README-nya
      // masuk sebagai sumber resmi artikel tentang web hosting.
      //
      // Ambang bintang menyaring repo tiruan yang namanya memang sama.
      const repo = (json?.items ?? []).find(
        (r: any) => (r?.stargazers_count ?? 0) >= 100 && repoMilikTopik(r?.name ?? '', topik),
      );
      if (!repo) return { situsResmi: [], kandidat: [] };
      const situsResmi = [repo.homepage, repo.html_url].filter(Boolean) as string[];
      return {
        situsResmi,
        kandidat: [
          `https://raw.githubusercontent.com/${repo.full_name}/HEAD/README.md`,
          ...(repo.homepage ? [repo.homepage as string] : []),
        ],
      };
    } catch {
      // GitHub tidak terjangkau atau kena batas laju → riset lanjut tanpa jejak
      // ini. Yang tidak boleh terjadi cuma satu: menulis artikel tanpa sumber.
      return { situsResmi: [], kandidat: [] };
    }
  }

  /**
   * Nama host ini menunjuk ke jaringan dalam?
   *
   * Dinilai dari SEMUA alamat hasil resolusi, bukan dari bentuk namanya:
   * saringan `alasanTepercaya()` meloloskan `docs.apa-saja.xyz`, dan siapa pun
   * bisa mengarahkan nama seperti itu ke alamat homelab. Sebelum ini yang
   * menahannya cuma kegagalan TLS ke layanan internal — pengaman yang tidak
   * disengaja.
   *
   * ponytail: masih ada jendela kecil antara resolusi di sini dan resolusi
   * ulang oleh fetch (DNS rebinding). Menutupnya butuh menyambung ke IP hasil
   * resolusi lewat agen undici kustom; naikkan ke sana kalau situs ini nanti
   * memuat layanan internal bersertifikat sah.
   */
  async function hostJaringanDalam(hostname: string): Promise<boolean> {
    try {
      const alamat = await lookup(hostname, { all: true });
      return alamat.length === 0 || alamat.some((a) => ipPrivat(a.address));
    } catch {
      // Nama yang tidak bisa diresolusi tidak akan bisa diunduh juga; ditolak
      // di sini supaya alasannya jelas, bukan "fetch failed".
      return true;
    }
  }

  /** Satu URL → isi halamannya sebagai teks, atau alasan kenapa ditolak. */
  async function unduhSumber(url: string, situsResmi: string[]): Promise<SumberRujukan | { url: string; tolak: string }> {
    const alasan = alasanTepercaya(url, situsResmi);
    if (!alasan) return { url, tolak: 'bukan sumber tepercaya (bukan https, bukan dokumentasi resmi, bukan penerbit terdaftar)' };
    try {
      // Pengalihan diikuti MANUAL, dinilai satu per satu SEBELUM diikuti.
      // Dengan `redirect: 'follow'`, permintaan ke tujuan pengalihan sudah
      // terkirim sebelum kode ini sempat menilainya — domain tepercaya yang
      // mengalihkan ke alamat jaringan dalam berarti server ini yang mengetuk
      // alamat itu. Penilaian setelah kejadian tidak membatalkan ketukannya.
      let tujuan = url;
      let res: Response;
      for (let lompatan = 0; ; lompatan++) {
        if (await hostJaringanDalam(new URL(tujuan).hostname)) {
          return { url, tolak: 'nama host menunjuk ke alamat jaringan dalam' };
        }
        res = await fetch(tujuan, {
          headers: { 'user-agent': UA, accept: 'text/html,text/plain,text/markdown' },
          redirect: 'manual',
          signal: AbortSignal.timeout(20_000),
        });
        const lokasi = res.headers.get('location');
        if (res.status < 300 || res.status >= 400 || !lokasi) break;
        const berikut = new URL(lokasi, tujuan).toString();
        if (!alasanTepercaya(berikut, situsResmi)) {
          return { url, tolak: `dialihkan ke ${berikut} yang tidak tepercaya` };
        }
        if (lompatan >= 3) return { url, tolak: 'terlalu banyak pengalihan' };
        tujuan = berikut;
      }
      if (!res.ok) return { url, tolak: `halaman menjawab HTTP ${res.status}` };
      const jenis = res.headers.get('content-type') ?? '';
      if (!/text\/(html|plain|markdown)|application\/(xhtml|json)/i.test(jenis)) {
        return { url, tolak: `bukan halaman teks (${jenis || 'tanpa content-type'})` };
      }
      const mentah = (await res.text()).slice(0, BATAS_UNDUH);
      const { judul, teks } = bersihkanHalaman(mentah);
      // Halaman yang isinya baru muncul setelah JavaScript jalan mengembalikan
      // kerangka kosong. Merangkumnya sama saja dengan mengarang.
      if (teks.length < 400) return { url, tolak: 'isi halaman terlalu pendek untuk dirangkum (butuh JavaScript?)' };
      return { url: tujuan, judul, teks, alasan };
    } catch (e: any) {
      return { url, tolak: `gagal diunduh: ${e?.name === 'TimeoutError' ? 'waktu habis' : e?.message ?? e}` };
    }
  }

  const riset = () => {
    const tangani = async (req: any, res: any, next: any) => {
      if (!req.url?.startsWith('/riset') || req.method !== 'POST') return next();
      const kirim = (kode: number, isi: unknown) => {
        res.statusCode = kode;
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(isi));
      };
      try {
        const potong: Buffer[] = [];
        for await (const c of req) potong.push(c);
        const body = JSON.parse(Buffer.concat(potong).toString('utf8') || '{}');
        const topik = String(body.topik ?? '').trim();
        if (!topik) return kirim(400, { error: 'topik kosong' });

        const jejak = await jejakGithub(topik);
        const daftar = [
          ...jejak.kandidat,
          ...(Array.isArray(body.kandidat) ? body.kandidat.map(String) : []),
        ];
        // Maksimal 8 unduhan per permintaan: cukup untuk artikel, dan menjaga
        // jalur ini tidak bisa dipakai memuntahkan lalu lintas ke pihak lain.
        const unik = [...new Set(daftar)].slice(0, 8);
        const hasil = await Promise.all(unik.map((u) => unduhSumber(u, jejak.situsResmi)));

        kirim(200, {
          sumber: hasil.filter((h): h is SumberRujukan => 'teks' in h),
          ditolak: hasil.filter((h): h is { url: string; tolak: string } => 'tolak' in h),
        });
      } catch (e: any) {
        kirim(500, { error: String(e?.message ?? e) });
      }
    };
    return {
      name: 'riset-sumber',
      // Badan blok, BUKAN arrow ringkas: `s.middlewares.use()` mengembalikan
      // aplikasi connect-nya sendiri, dan Vite memperlakukan nilai balik hook
      // ini sebagai post-hook yang lalu dipanggil tanpa argumen — server dev
      // mati saat start dengan "Cannot read properties of undefined (reading
      // 'url')" yang tidak menyebut plugin ini sama sekali.
      configureServer: (s: any) => {
        s.middlewares.use(tangani);
      },
      configurePreviewServer: (s: any) => {
        s.middlewares.use(tangani);
      },
    };
  };

  return {
    assetsInclude: ['**/*.glb'],
    plugins: [react(), tailwindcss(), riset()],
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
