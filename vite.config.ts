import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {createHash} from 'node:crypto';
import {lookup} from 'node:dns/promises';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {alasanTepercaya, bersihkanHalaman, ipPrivat, repoMilikTopik, type SumberRujukan} from './src/lib/riset';
import {cariIkon, slugIkonSah, JALUR_CARI_IKON, JALUR_IKON, type KatalogIkon} from './src/lib/ikon';

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
  // `/ai` TIDAK lagi ada di sini. Ia dulu diproksikan apa adanya ke origin
  // PERTAMA di VITE_AI_ORIGIN, dengan kunci server disuntikkan ke setiap
  // permintaan yang belum membawa auth — tapi tanpa batas jalur, batas body,
  // maupun batas laju, jadi siapa pun yang bisa menjangkau situs ini bebas
  // memakai kuota kunci itu, termasuk ke jalur lain di gateway yang sama.
  // Sekarang ia ditangani sendiri oleh `aiProxy()` di bawah, yang memeriksa
  // semuanya SEBELUM kuncinya disuntikkan.
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
  };

  // ── /ai — satu-satunya jalur yang memegang kunci model ───────────────────
  //
  // Kenapa lewat server dan bukan langsung dari browser: 9router TIDAK menjawab
  // preflight CORS di jalur /v1 (`OPTIONS /v1/chat/completions` → 401 tanpa
  // access-control-allow-origin), jadi fetch lintas-origin dari browser SELALU
  // diblokir, berapa pun benarnya kunci dan endpointnya. Lewat jalur se-origin
  // ini preflight tidak pernah terjadi dan CSP lolos lewat `'self'`.
  //
  // Kunci untuk asisten di halaman PUBLIK memang harus hidup di server, dan
  // server ini melayani siapa saja yang bisa menjangkau situsnya — sampai di
  // situ desainnya masih sah. Yang dulu tidak ada adalah pembatas DAMPAK: setiap
  // permintaan ke /ai/* diteruskan ke gateway dengan kunci itu menempel, tanpa
  // batas jalur, batas ukuran, maupun batas laju. Satu perintah curl tanpa login
  // sudah cukup untuk menghabiskan kuota kunci tersebut.
  //
  // Karena itu jalur ini tidak lagi memakai proxy bawaan Vite. Proxy bawaan
  // menyuntikkan header di `proxyReq` — saat permintaannya sudah mengalir ke
  // hulu dan badannya sudah terkirim. Terlalu telat untuk menolak apa pun.
  //
  // Yang diperiksa, semuanya SEBELUM kunci disuntikkan: metode dan jalur yang
  // benar-benar dipakai aplikasi, ukuran badan, batas laju per pemanggil,
  // batas laju menyeluruh, serta `max_tokens` dan panjang pesan. Permintaan
  // yang MEMBAWA auth sendiri (panel admin memakai kunci dari tabel `settings`)
  // tidak pernah diberi kunci server dan tidak dikenai batas per pemanggil;
  // batas menyeluruh tetap berlaku untuk semuanya.
  const angka = (nilai: string | undefined, bawaan: number): number => {
    const n = Number(nilai);
    return Number.isFinite(n) && n > 0 ? n : bawaan;
  };

  /** "30/60" → 30 permintaan per 60 detik. */
  const lajuDari = (nilai: string | undefined, jumlah: number, detik: number) => {
    const m = /^(\d{1,6})\/(\d{1,6})$/.exec((nilai ?? '').trim());
    return m ? { jumlah: Number(m[1]), detik: Number(m[2]) } : { jumlah, detik };
  };

  const BATAS_AI_BODY = angka(env.AI_MAX_BODY_BYTES, 128 * 1024);
  const BATAS_AI_TOKEN = angka(env.AI_MAX_TOKENS, 2048);
  const BATAS_AI_PESAN = angka(env.AI_MAX_MESSAGE_CHARS, 24_000);
  const BATAS_AI_RESPON = angka(env.AI_MAX_RESPONSE_BYTES, 4 * 1024 * 1024);
  const JEDA_AI_MS = angka(env.AI_TIMEOUT_MS, 240_000);
  const LAJU_AI = lajuDari(env.AI_RATE_LIMIT, 30, 60);
  const LAJU_AI_GLOBAL = lajuDari(env.AI_RATE_LIMIT_GLOBAL, 300, 60);
  const AI_PERCAYA_PROXY = env.AI_TRUST_PROXY === '1';

  // Jalur yang benar-benar dipanggil aplikasi: `aiUrl()` menghasilkan
  // `/ai/v1/chat/completions`, `/ai/v1/messages`, atau `/ai/vN/...` kalau admin
  // mengetik versi lain di base_url-nya. Di luar bentuk itu tidak ada yang perlu
  // diteruskan, dan meneruskan "apa saja" berarti membuka seluruh permukaan
  // gateway yang sama — jalur adminnya, unggah berkasnya, kunci-kunci lain.
  const JALUR_AI = /^\/v\d+\/(?:chat\/completions|messages)$/;

  const jejakLaju = new Map<string, number[]>();
  let jejakLajuGlobal: number[] = [];

  /** Sudah melewati batas? `tanda` kosong berarti ember menyeluruh. */
  const lewatBatas = (tanda: string, batas: { jumlah: number; detik: number }): boolean => {
    const sekarang = Date.now();
    const ambang = sekarang - batas.detik * 1000;
    if (tanda === '') {
      jejakLajuGlobal = jejakLajuGlobal.filter((t) => t > ambang);
      if (jejakLajuGlobal.length >= batas.jumlah) return true;
      jejakLajuGlobal.push(sekarang);
      return false;
    }
    // Cap waktu pemanggil lama dibuang sekalian: kalau tidak, tabel ini hanya
    // tumbuh dan batas laju berubah jadi kebocoran memori.
    for (const [k, v] of jejakLaju) {
      const sisa = v.filter((t) => t > ambang);
      if (sisa.length) jejakLaju.set(k, sisa);
      else jejakLaju.delete(k);
    }
    const punya = jejakLaju.get(tanda) ?? [];
    if (punya.length >= batas.jumlah) return true;
    punya.push(sekarang);
    jejakLaju.set(tanda, punya);
    return false;
  };

  /**
   * Siapa pemanggilnya, sejauh yang bisa dipercaya.
   *
   * `x-forwarded-for` hanya dilihat kalau `AI_TRUST_PROXY=1`. Header itu ditulis
   * klien, dan tanpa proxy di depan, mempercayainya berarti memberi setiap
   * penyerang ember batas-lajunya sendiri hanya dengan mengarang header.
   * Sebaliknya, kalau situs ini memang di belakang openresty/Tailscale, setel
   * `AI_TRUST_PROXY=1` — tanpa itu SEMUA pengunjung berbagi satu ember (alamat
   * proxy-nya), termasuk kuota admin sendiri.
   */
  const ipPemanggil = (req: any): string => {
    if (AI_PERCAYA_PROXY) {
      const xff = req.headers?.['x-forwarded-for'];
      const pertama = (Array.isArray(xff) ? xff[0] : xff)?.split(',')[0]?.trim();
      if (pertama) return pertama;
      const nyata = req.headers?.['x-real-ip'];
      if (typeof nyata === 'string' && nyata) return nyata;
    }
    return req.socket?.remoteAddress ?? 'tanpa-alamat';
  };

  /** Badan permintaan → teks, atau alasan penolakan kalau melewati batas. */
  const bacaBadan = async (req: any, batas: number): Promise<{ isi?: string; tolak?: string }> => {
    const kepala = Number(req.headers?.['content-length']);
    if (Number.isFinite(kepala) && kepala > batas) return { tolak: 'badan permintaan terlalu besar' };
    const potong: Buffer[] = [];
    let total = 0;
    for await (const c of req) {
      total += c.length;
      if (total > batas) {
        // Diputus di tengah aliran: sisanya tidak ditampung, dan klien berhenti
        // mengirim. `content-length` tidak wajib ada (badan bisa chunked), jadi
        // hitungan byte ini yang jadi batas sesungguhnya.
        req.destroy?.();
        return { tolak: 'badan permintaan terlalu besar' };
      }
      potong.push(c as Buffer);
    }
    return { isi: Buffer.concat(potong).toString('utf8') };
  };

  /** Badan jawaban hulu → Buffer, atau null kalau melewati batas. */
  const bacaJawaban = async (hulu: any, batas: number): Promise<Buffer | null> => {
    if (!hulu.body) return Buffer.alloc(0);
    const pembaca = hulu.body.getReader();
    const kumpul: Buffer[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await pembaca.read();
      if (done) break;
      total += value.length;
      if (total > batas) {
        await pembaca.cancel();
        return null;
      }
      kumpul.push(Buffer.from(value));
    }
    return Buffer.concat(kumpul);
  };

  const aiProxy = () => {
    const tangani = async (req: any, res: any, next: any) => {
      if (!req.url?.startsWith('/ai') || !aiOrigins[0]) return next();
      const kirim = (kode: number, isi: unknown, kepala: Record<string, string> = {}) => {
        if (res.headersSent) return res.end();
        res.statusCode = kode;
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.setHeader('cache-control', 'no-store');
        for (const [k, v] of Object.entries(kepala)) res.setHeader(k, v);
        res.end(JSON.stringify(isi));
      };
      try {
        if (req.method !== 'POST') return kirim(405, { error: 'hanya menerima POST' }, { allow: 'POST' });

        const lengkap = new URL(req.url, 'http://lokal');
        const jalur = lengkap.pathname.replace(/^\/ai/, '').replace(/\/+$/, '') || '/';
        // Pesannya sengaja tidak menyebut jalur mana yang dilayani: peta
        // gateway bukan urusan pemanggil yang menebak-nebak.
        if (!JALUR_AI.test(jalur)) return kirim(404, { error: 'jalur tidak dilayani' });

        const bawaAuth = Boolean(req.headers?.authorization || req.headers?.['x-api-key']);
        if (!bawaAuth && lewatBatas(ipPemanggil(req), LAJU_AI)) {
          return kirim(429, { error: 'terlalu banyak permintaan, coba lagi sebentar lagi' },
            { 'retry-after': String(LAJU_AI.detik) });
        }
        if (lewatBatas('', LAJU_AI_GLOBAL)) {
          return kirim(429, { error: 'layanan sedang sibuk, coba lagi sebentar lagi' },
            { 'retry-after': String(LAJU_AI_GLOBAL.detik) });
        }

        const baca = await bacaBadan(req, BATAS_AI_BODY);
        if (baca.tolak) return kirim(413, { error: baca.tolak });

        let body: any;
        try {
          body = JSON.parse(baca.isi || '{}');
        } catch {
          return kirim(400, { error: 'badan permintaan bukan JSON' });
        }
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          return kirim(400, { error: 'badan permintaan harus objek JSON' });
        }

        if (!bawaAuth) {
          // Dua penjaga kuota terakhir. Tanpa yang pertama, satu permintaan
          // tanpa auth boleh meminta keluaran sepanjang apa pun — batas laju
          // tidak menolong, kuotanya habis di permintaan pertama.
          const minta = Number(body.max_tokens);
          if (!Number.isFinite(minta) || minta > BATAS_AI_TOKEN) body.max_tokens = BATAS_AI_TOKEN;
          const panjangPesan = JSON.stringify(body.messages ?? body.input ?? '').length;
          if (panjangPesan > BATAS_AI_PESAN) return kirim(413, { error: 'pesan terlalu panjang' });
          // Tanpa kunci server, permintaan publik tidak bisa dilayani sama
          // sekali — jangan diteruskan ke gateway sebagai permintaan anonim.
          if (!aiApiKey) return kirim(503, { error: 'kunci AI belum dipasang di server' });
        }

        const kepala: Record<string, string> = { 'content-type': 'application/json', accept: 'application/json' };
        for (const h of ['authorization', 'x-api-key', 'anthropic-version', 'anthropic-dangerous-direct-browser-access']) {
          const v = req.headers?.[h];
          if (typeof v === 'string' && v) kepala[h] = v;
        }
        if (!bawaAuth && aiApiKey) {
          // Kedua bentuk dikirim sekaligus: jalur /v1/chat/completions membaca
          // Authorization, /v1/messages membaca x-api-key, dan masing-masing
          // mengabaikan yang bukan miliknya.
          kepala.authorization = `Bearer ${aiApiKey}`;
          kepala['x-api-key'] = aiApiKey;
        }

        let hulu: Response;
        try {
          hulu = await fetch(`${aiOrigins[0]}${jalur}${lengkap.search}`, {
            method: 'POST',
            headers: kepala,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(JEDA_AI_MS),
          });
        } catch (e: any) {
          const habis = e?.name === 'TimeoutError' || e?.name === 'AbortError';
          return kirim(
            habis ? 504 : 502,
            { error: habis ? 'gateway tidak menjawab dalam batas waktu' : `gateway tidak terjangkau: ${e?.message ?? e}` },
          );
        }

        const isi = await bacaJawaban(hulu, BATAS_AI_RESPON);
        if (isi === null) return kirim(502, { error: 'jawaban gateway terlalu besar' });
        res.statusCode = hulu.status;
        res.setHeader('content-type', hulu.headers.get('content-type') ?? 'application/json; charset=utf-8');
        res.setHeader('cache-control', 'no-store');
        res.end(isi);
      } catch (e: any) {
        kirim(500, { error: String(e?.message ?? e) });
      }
    };
    return {
      name: 'ai-proxy-terjaga',
      // Badan blok, bukan arrow ringkas — lihat catatan di `riset()`.
      configureServer: (s: any) => {
        s.middlewares.use(tangani);
      },
      configurePreviewServer: (s: any) => {
        s.middlewares.use(tangani);
      },
    };
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

  // Batas untuk jalur ini sendiri. Ia tidak berautentikasi, dan container web
  // dibatasi `mem_limit: 1g` — tanpa batas badan, satu permintaan sebesar apa
  // pun berakhir sebagai container yang di-restart (dan situsnya ikut mati),
  // bukan sebagai error yang rapi.
  const BATAS_RISET_BODY = 256 * 1024; // cukup untuk 8 URL + konteks tambahan
  const BATAS_RISET_TOPIK = 200;
  // Satu riset = satu panggilan GitHub + sampai 8 unduhan keluar. Beberapa
  // permintaan sekaligus berarti puluhan sambungan dari satu container.
  const BATAS_RISET_SERENTAK = 2;
  let risetSerentak = 0;

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
        // Batas ukuran diperiksa DUA kali, dan keduanya perlu: `content-length`
        // menolak lebih awal tanpa menampung apa pun, sementara hitungan byte
        // saat aliran berjalan menangkap badan chunked yang tidak menyebut
        // panjangnya sama sekali.
        const kepala = Number(req.headers?.['content-length']);
        if (Number.isFinite(kepala) && kepala > BATAS_RISET_BODY) {
          return kirim(413, { error: 'badan permintaan terlalu besar' });
        }
        const potong: Buffer[] = [];
        let total = 0;
        for await (const c of req) {
          total += (c as Buffer).length;
          if (total > BATAS_RISET_BODY) {
            req.destroy?.();
            return kirim(413, { error: 'badan permintaan terlalu besar' });
          }
          potong.push(c as Buffer);
        }
        const body = JSON.parse(Buffer.concat(potong).toString('utf8') || '{}');
        const topik = String(body.topik ?? '').trim();
        if (!topik) return kirim(400, { error: 'topik kosong' });
        if (topik.length > BATAS_RISET_TOPIK) {
          return kirim(400, { error: `topik terlalu panjang (maksimal ${BATAS_RISET_TOPIK} karakter)` });
        }
        if (risetSerentak >= BATAS_RISET_SERENTAK) {
          return kirim(429, { error: 'riset lain sedang berjalan, coba lagi sebentar lagi' });
        }

        risetSerentak += 1;
        try {
          const jejak = await jejakGithub(topik);
          const daftar = [
            ...jejak.kandidat,
            // Daftar dari pemanggil dipotong SEBELUM dipetakan: larik sepanjang
            // apa pun dari badan permintaan tidak perlu dibaca seluruhnya.
            ...(Array.isArray(body.kandidat) ? body.kandidat.slice(0, 20).map(String) : []),
          ];
          // Maksimal 8 unduhan per permintaan: cukup untuk artikel, dan menjaga
          // jalur ini tidak bisa dipakai memuntahkan lalu lintas ke pihak lain.
          const unik = [...new Set(daftar)].slice(0, 8);
          const hasil = await Promise.all(unik.map((u) => unduhSumber(u, jejak.situsResmi)));

          kirim(200, {
            sumber: hasil.filter((h): h is SumberRujukan => 'teks' in h),
            ditolak: hasil.filter((h): h is { url: string; tolak: string } => 'tolak' in h),
          });
        } finally {
          // Selalu dilepas, termasuk saat pengunduhan melempar — kalau tidak,
          // dua kegagalan berturut-turut mematikan jalur ini sampai restart.
          risetSerentak -= 1;
        }
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

  // ── /ikon — ikon dari dashboardicons.com (homarr-labs/dashboard-icons) ───
  //
  // Berkas SVG-nya TIDAK ikut repo (3300 ikon, belasan MB). Yang ada di repo
  // hanya katalognya (139 KB, dibuat `node scripts/ikon-katalog.mjs`), dan
  // katalog itu bukan sekadar daftar untuk pencarian — ia BATAS: slug yang tidak
  // ada di dalamnya tidak pernah menjadi alamat yang diunduh server ini. Tanpa
  // batas itu, satu permintaan `/ikon/svg/...` dari siapa pun bisa menyuruh
  // server ini mengambil apa saja dari internet (SSRF), persis lubang yang
  // ditutup pada jalur /riset.
  //
  // Urutan penyajian satu ikon:
  //   1. berkas lokal hasil `node scripts/ikon-ambil.mjs` — ada di `public/ikon/svg/`
  //      saat dev dan di `dist/ikon/svg/` setelah build (vite menyalin public/ ke
  //      dist/); image container hanya punya yang di dist/. Ini yang membuat situs
  //      tetap punya ikonnya tanpa internet;
  //   2. `.ikon-cache/<slug>.svg` — hasil unduhan sebelumnya;
  //   3. CDN dashboard-icons, sekali per slug, lalu disimpan ke (2).
  //
  // Berkas lokal diperiksa DI SINI, bukan diserahkan ke penyaji statis Vite:
  // pada `vite preview` (server yang dipakai produksi) middleware plugin berjalan
  // LEBIH DULU daripada penyaji statis, jadi berkas di public/ tidak akan pernah
  // tersaji kalau tidak dibaca sendiri. Ditemukan lewat uji container dengan CDN
  // yang sengaja dimatikan: ikon hasil salinan tetap 502.
  const DIREKTORI_LOKAL = [
    path.resolve(__dirname, 'public/ikon/svg'),
    path.resolve(__dirname, 'dist/ikon/svg'),
  ];
  const berkasLokal = (slug: string): string => {
    for (const dir of DIREKTORI_LOKAL) {
      const berkas = path.join(dir, `${slug}.svg`);
      if (existsSync(berkas)) return berkas;
    }
    return '';
  };
  const KATALOG: {jumlah: number; komit: string; ikon: KatalogIkon} = (() => {
    try {
      const isi = JSON.parse(readFileSync(path.resolve(__dirname, 'src/data/ikon-katalog.json'), 'utf8'));
      return {jumlah: Number(isi?.jumlah) || 0, komit: String(isi?.komit ?? ''), ikon: isi?.ikon ?? {}};
    } catch (e: any) {
      // Bukan lempar: situsnya harus tetap menyala. Yang mati hanya pemilih ikon
      // di panel, dan sebabnya muncul di log alih-alih sebagai 404 misterius.
      console.warn(`[ikon] katalog tidak terbaca: ${e?.message ?? e}`);
      return {jumlah: 0, komit: '', ikon: {}};
    }
  })();
  const CDN_IKON = env.IKON_CDN || 'https://raw.githubusercontent.com/homarr-labs/dashboard-icons';
  const CACHE_IKON = path.resolve(__dirname, env.IKON_CACHE_DIR || '.ikon-cache');
  const BATAS_IKON_BYTE = angka(env.IKON_MAX_BYTES, 512 * 1024);
  // Batas ini menghitung SATU permintaan per ikon, dan satu kunjungan halaman
  // bisa memuat puluhan ikon sekaligus (setiap kartu tool satu permintaan) —
  // beberapa pengunjung dari satu alamat yang sama (NAT rumah, Tailscale exit
  // node) tidak boleh saling memblokir. 60 permintaan/detik masih menahan
  // pengunduhan massal, tapi tidak lagi menahan pemakaian wajar.
  const LAJU_IKON = lajuDari(env.IKON_RATE_LIMIT, 3600, 60);
  const UA_IKON = 'desain-web-ikon/1.0 (+panel admin)';

  /** Satu unduhan ikon dari CDN. null = jangan disajikan (dan jangan di-cache). */
  const unduhIkon = async (slug: string): Promise<Buffer | null> => {
    if (!KATALOG.komit) return null;
    try {
      const res = await fetch(`${CDN_IKON}/${KATALOG.komit}/svg/${slug}.svg`, {
        headers: {'user-agent': UA_IKON},
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      // Batas ukuran DAN pemeriksaan isi: yang boleh disajikan dari origin ini
      // hanya berkas SVG. Tanpa pemeriksaan ini, halaman HTML dari CDN yang
      // salah alamat akan tersaji sebagai `image/svg+xml` dari origin situs.
      if (!buf.length || buf.length > BATAS_IKON_BYTE) return null;
      if (!/<svg[\s>]/i.test(buf.toString('utf8').slice(0, 4000))) return null;
      try {
        mkdirSync(CACHE_IKON, {recursive: true});
        writeFileSync(path.join(CACHE_IKON, `${slug}.svg`), buf);
      } catch {
        // Cache yang gagal ditulis bukan alasan menolak permintaan: berkasnya
        // sudah ada di memori, dan unduhan berikutnya tinggal mengulang.
      }
      return buf;
    } catch {
      return null;
    }
  };

  const ikonDashboard = () => {
    const tangani = async (req: any, res: any, next: any) => {
      if (!req.url?.startsWith('/ikon')) return next();
      const kirim = (kode: number, isi: unknown, kepala: Record<string, string> = {}) => {
        if (res.headersSent) return res.end();
        res.statusCode = kode;
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.setHeader('cache-control', 'no-store');
        for (const [k, v] of Object.entries(kepala)) res.setHeader(k, v);
        res.end(JSON.stringify(isi));
      };
      try {
        const lengkap = new URL(req.url, 'http://lokal');
        const jalur = lengkap.pathname.replace(/\/+$/, '') || '/';
        // Jalur di bawah /ikon bukan berarti milik plugin ini. Awalannya hanya
        // saringan murah; pemilik yang sesungguhnya adalah dua rute di bawah.
        // `/ikonxyz` atau `/ikon/apa-saja` diserahkan ke penangan berikutnya (SPA
        // punya halaman tidak-ditemukan sendiri) daripada dijawab JSON 404 di sini.
        if (jalur !== JALUR_CARI_IKON && !jalur.startsWith(JALUR_IKON)) return next();

        if (req.method !== 'GET' && req.method !== 'HEAD') {
          return kirim(405, {error: 'hanya menerima GET'}, {allow: 'GET, HEAD'});
        }
        // Katalog kosong = seluruh jalur ini tidak punya daftar putih, jadi
        // tidak ada satu pun slug yang boleh diunduh. Menjawab 503 lebih jujur
        // daripada 404 yang menyiratkan "ikonnya memang tidak ada".
        if (!KATALOG.jumlah) {
          return kirim(503, {error: 'katalog ikon belum ada di server (jalankan: node scripts/ikon-katalog.mjs)'});
        }
        if (lewatBatas(`ikon:${ipPemanggil(req)}`, LAJU_IKON)) {
          return kirim(429, {error: 'terlalu banyak permintaan'}, {'retry-after': String(LAJU_IKON.detik)});
        }

        if (jalur === JALUR_CARI_IKON) {
          const q = (lengkap.searchParams.get('q') ?? '').slice(0, 64);
          const minta = Number(lengkap.searchParams.get('batas'));
          const hasil = cariIkon(KATALOG.ikon, q, Number.isFinite(minta) ? minta : 60);
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json; charset=utf-8');
          // Sebentar di-cache: panel mengetik cepat dan hasil yang sama tidak
          // perlu dihitung ulang, tapi daftar ikon baru tetap segera terlihat.
          res.setHeader('cache-control', 'private, max-age=60');
          return res.end(JSON.stringify({total: hasil.length, hasil}));
        }

        const cocok = /^\/ikon\/svg\/([^/]+)\.svg$/.exec(jalur);
        if (!cocok) return kirim(404, {error: 'tidak ada'});
        let slug: string;
        try {
          slug = decodeURIComponent(cocok[1]).toLowerCase();
        } catch {
          return kirim(400, {error: 'slug tidak sah'});
        }
        // Dua syarat, dan keduanya perlu: bentuknya sah DAN ada di katalog.
        if (!slugIkonSah(slug) || !KATALOG.ikon[slug]) return kirim(404, {error: 'ikon tidak dikenal'});

        let isi: Buffer | null = null;
        // (1) berkas lokal, (2) cache unduhan — keduanya di disk; baru (3) CDN.
        const lokal = berkasLokal(slug);
        const tersimpan = lokal || path.join(CACHE_IKON, `${slug}.svg`);
        if (existsSync(tersimpan)) {
          try {
            isi = readFileSync(tersimpan);
          } catch {
            isi = null; // berkas cache rusak → unduh ulang, jangan gagal
          }
        }
        if (!isi || !isi.length) isi = await unduhIkon(slug);
        if (!isi) {
          return kirim(502, {
            error: 'ikon tidak bisa diambil dari sumbernya',
            saran: 'salin dulu ikonnya ke repo: node scripts/ikon-ambil.mjs <slug>',
          });
        }

        const etag = `"${createHash('sha1').update(isi).digest('hex').slice(0, 16)}"`;
        if (req.headers?.['if-none-match'] === etag) {
          res.statusCode = 304;
          res.setHeader('etag', etag);
          return res.end();
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'image/svg+xml; charset=utf-8');
        res.setHeader('content-length', String(isi.length));
        res.setHeader('etag', etag);
        // TIDAK `immutable`: alamat ikonnya tetap `/ikon/svg/7zip.svg` walau
        // gambarnya berganti saat katalog disegarkan ke commit dashboard-icons
        // yang lebih baru — dengan `immutable` + satu tahun, pengunjung yang
        // pernah membuka situs akan melihat gambar lama selama itu. Tujuh hari
        // cukup untuk menghemat permintaan, dan sesudahnya browser bertanya lagi
        // lewat etag di atas.
        res.setHeader('cache-control', 'public, max-age=604800');
        res.setHeader('x-content-type-options', 'nosniff');
        // Berkas ini datang dari repo pihak ketiga, dan SVG yang dibuka LANGSUNG
        // sebagai dokumen bisa menjalankan skrip di origin ini. Disajikan sebagai
        // gambar, kemampuannya sudah mati; header ini mematikannya juga untuk
        // kasus dibuka langsung di tab.
        res.setHeader('content-security-policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
        res.end(req.method === 'HEAD' ? undefined : isi);
      } catch (e: any) {
        kirim(500, {error: String(e?.message ?? e)});
      }
    };
    return {
      name: 'ikon-dashboard',
      // Badan blok, bukan arrow ringkas — lihat catatan di `riset()`.
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
    plugins: [aiProxy(), ikonDashboard(), react(), tailwindcss(), riset()],
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
