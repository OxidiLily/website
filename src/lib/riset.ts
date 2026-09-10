// Riset sumber untuk penulis artikel AI.
//
// Masalah yang diselesaikan berkas ini: model yang menulis dari ingatannya
// menghasilkan artikel yang terdengar meyakinkan tapi salah versi, salah
// perintah, dan tanpa satu pun tautan yang bisa dicek pembaca. Jawabannya
// bukan prompt yang lebih tegas — melainkan menolak menulis apa pun sebelum
// ada teks halaman sungguhan yang berhasil diunduh.
//
// Seluruh isi berkas ini logika murni (tanpa jaringan, tanpa DOM) supaya bisa
// diuji lewat `npx tsx src/lib/riset.check.ts`. Pengunduhannya sendiri terjadi
// di sisi SERVER — lihat blok `/riset` di vite.config.ts — karena browser
// tidak boleh, dan tidak bisa, mengambil halaman lintas-origin sembarangan.
import { nyahEntitas } from './blogWriter';

export interface SumberRujukan {
  url: string;
  judul: string;
  teks: string;
  /** Kenapa URL ini dianggap layak dipercaya. Ditampilkan ke admin supaya bisa dibantah. */
  alasan: string;
}

/**
 * Penerbit yang isinya dianggap layak jadi rujukan artikel teknologi.
 *
 * Isinya dua jenis: pemilik teknologinya sendiri (mozilla, docker, postgresql)
 * dan penerbit yang menulis panduan teknologi dengan redaksi sungguhan
 * (hostinger, rumahweb, niagahoster, digitalocean). Yang sengaja TIDAK ada:
 * agregator konten, situs tanya-jawab, dan blog pribadi — persis lapisan yang
 * membuat artikel hasil AI selama ini terdengar benar tapi tidak akurat.
 *
 * Dicocokkan sebagai domain atau subdomainnya, jadi `id.wikipedia.org` lolos
 * lewat `wikipedia.org`.
 */
export const DOMAIN_TEPERCAYA = [
  // Standar & referensi web
  'mozilla.org', 'w3.org', 'whatwg.org', 'web.dev', 'wikipedia.org',
  // Penyedia awan & platform
  'google.com', 'googleblog.com', 'microsoft.com', 'amazon.com', 'cloudflare.com',
  'digitalocean.com', 'ibm.com', 'redhat.com', 'oracle.com', 'apple.com', 'android.com',
  // Sistem operasi & distribusi
  'ubuntu.com', 'canonical.com', 'debian.org', 'archlinux.org', 'fedoraproject.org',
  'kernel.org', 'freebsd.org', 'raspberrypi.com',
  // Bahasa, runtime, basis data, infrastruktur
  'python.org', 'nodejs.org', 'php.net', 'golang.org', 'go.dev', 'rust-lang.org',
  'oracle.com', 'postgresql.org', 'mysql.com', 'mariadb.org', 'redis.io', 'mongodb.com',
  'sqlite.org', 'docker.com', 'kubernetes.io', 'nginx.org', 'apache.org', 'letsencrypt.org',
  'openssl.org', 'git-scm.com', 'gnu.org',
  // Kerangka kerja & pustaka
  'react.dev', 'vuejs.org', 'angular.dev', 'svelte.dev', 'nextjs.org', 'vite.dev', 'vitejs.dev',
  'tailwindcss.com', 'typescriptlang.org', 'astro.build', 'laravel.com', 'djangoproject.com',
  // Registri paket & kode sumber
  'npmjs.com', 'pypi.org', 'crates.io', 'packagist.org', 'github.com', 'githubusercontent.com',
  'gitlab.com', 'sourceforge.net',
  // Keamanan
  'owasp.org', 'nist.gov', 'cve.org', 'mitre.org', 'cisa.gov',
  // Penerbit panduan teknologi berbahasa Indonesia dan internasional
  'hostinger.com', 'hostinger.co.id', 'rumahweb.com', 'niagahoster.co.id', 'domainesia.com',
  'dewaweb.com', 'idcloudhost.com', 'cloudflare.com', 'godaddy.com', 'namecheap.com',
  'linode.com', 'akamai.com', 'vultr.com', 'hetzner.com', 'ovhcloud.com', 'siteground.com',
  'bluehost.com', 'hostgator.com', 'kinsta.com', 'cpanel.net', 'plesk.com', 'wordpress.org',
];

/**
 * Subdomain yang menandai halaman dokumentasi resmi milik produknya sendiri.
 *
 * Ini yang membuat dokumentasi produk yang TIDAK mungkin didaftar satu per satu
 * — setiap proyek punya domainnya sendiri — tetap bisa dipercaya tanpa daftar
 * yang harus terus dikejar.
 */
export const AWALAN_DOKUMENTASI = [
  'docs.', 'doc.', 'documentation.', 'wiki.', 'developer.', 'developers.', 'dev.',
  'help.', 'support.', 'learn.', 'manual.', 'devdocs.',
];

const cocokDomain = (host: string, domain: string): boolean =>
  host === domain || host.endsWith('.' + domain);

/**
 * Kenapa URL ini boleh dipakai sebagai rujukan — atau `null` kalau tidak boleh.
 *
 * Mengembalikan ALASAN, bukan boolean, karena alasannya ikut ditampilkan ke
 * admin di panel. Daftar sumber yang tidak bisa dibantah sama saja dengan
 * tidak punya daftar sumber.
 *
 * `situsResmi` diisi pemanggil dengan URL yang provenance-nya sudah terbukti —
 * dalam praktiknya `homepage` dan `html_url` repositori GitHub teratas untuk
 * topik ini. Situs resmi sebuah proyek tidak bisa ditebak dari bentuk
 * domainnya (`casaos.zimaspace.com` tidak menyerupai apa pun), jadi satu-satunya
 * cara jujur mempercayainya adalah lewat asal-usul yang bisa ditunjuk.
 */
export function alasanTepercaya(url: string, situsResmi: string[] = []): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  // http polos ditolak: isinya bisa diubah siapa pun di jalur, dan artikel yang
  // mengutipnya akan salah tanpa ada yang tahu.
  if (u.protocol !== 'https:') return null;

  const host = u.hostname.toLowerCase().replace(/^www\./, '');

  for (const resmi of situsResmi) {
    try {
      const r = new URL(resmi).hostname.toLowerCase().replace(/^www\./, '');
      if (r && cocokDomain(host, r)) return 'situs resmi proyek (menurut repositori GitHub teratas)';
    } catch {
      // Entri situsResmi yang bukan URL diabaikan, bukan menggagalkan penilaian.
    }
  }

  if (AWALAN_DOKUMENTASI.some((a) => u.hostname.toLowerCase().startsWith(a))) {
    return 'subdomain dokumentasi resmi';
  }

  for (const d of DOMAIN_TEPERCAYA) {
    if (cocokDomain(host, d)) return `penerbit tepercaya (${d})`;
  }

  return null;
}

/**
 * HTML halaman → judul dan teks yang bisa dibaca model.
 *
 * Bukan pengurai HTML sungguhan, dan memang tidak perlu: yang dibutuhkan model
 * cuma prosa halamannya. Yang WAJIB benar adalah membuang <script> dan <style>
 * lebih dulu — isinya bukan prosa, dan tanpa dibuang ia menyumbang ribuan token
 * berisi kode minifikasi yang mendorong isi artikel sungguhan keluar dari
 * jendela konteks.
 *
 * ponytail: pemotongan <main>/<article> dilakukan kalau ada, selain itu seluruh
 * <body>. Naikkan ke pengurai DOM sungguhan hanya kalau nanti terbukti ada
 * sumber penting yang navigasinya ikut terbaca sebagai isi.
 */
export function bersihkanHalaman(html: string, batas = 12000): { judul: string; teks: string } {
  const mentah = html || '';
  const judul = nyahEntitas((mentah.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim())
    .replace(/\s+/g, ' ')
    .slice(0, 200);

  let s = mentah
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(nav|header|footer|aside|form)\b[\s\S]*?<\/\1>/gi, ' ');

  const inti = s.match(/<(?:main|article)\b[^>]*>([\s\S]*?)<\/(?:main|article)>/i);
  if (inti) s = inti[1];

  const teks = nyahEntitas(
    s
      // Batas blok jadi baris baru dulu, supaya kalimat dari dua paragraf
      // berbeda tidak menyatu jadi satu kalimat yang tidak pernah ditulis
      // siapa pun — sumber palsu yang lahir dari perapian teks.
      .replace(/<\/(p|div|li|h[1-6]|tr|pre|blockquote|section)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { judul, teks: teks.slice(0, batas) };
}

/** Perintah untuk model: usulkan URL kandidat. Yang diverifikasi nanti server, bukan model. */
export function promptKandidat(topik: string): string {
  return [
    `Sebutkan alamat halaman web yang paling layak dipercaya sebagai rujukan untuk menulis artikel tentang "${topik}".`,
    '',
    'Aturan:',
    '- Utamakan dokumentasi resmi produk/proyeknya sendiri, lalu situs resmi',
    '  pembuatnya, lalu panduan dari penerbit teknologi bereputasi.',
    '- Jangan menyebut blog pribadi, situs agregator, atau forum tanya-jawab.',
    '- Artikelnya berbahasa Indonesia. Sertakan juga panduan dari penerbit',
    '  teknologi berbahasa Indonesia yang bereputasi kalau topiknya memang dibahas',
    '  di sana (mis. Hostinger, RumahWeb, Niagahoster, DomaiNesia).',
    '- Sebutkan 5 sampai 8 alamat, satu per baris, HANYA URL lengkap berawalan',
    '  https:// — tanpa nomor urut, tanpa tanda hubung, tanpa penjelasan.',
    '- Sebutkan alamat halaman yang kamu yakin benar-benar ada. Alamat yang',
    '  tidak bisa diunduh akan dibuang, dan artikel tidak akan ditulis kalau',
    '  tidak ada satu pun yang tersisa.',
  ].join('\n');
}

/**
 * Jawaban model → daftar URL unik. Baris apa pun yang bukan URL diabaikan.
 *
 * Alamat tanpa titik di hostname dibuang: jawaban model kerap terpotong di
 * batas token dan menyisakan `https://www` yang bukan alamat apa pun.
 */
export function uraikanKandidat(jawaban: string): string[] {
  const ketemu = (jawaban || '').match(/https:\/\/[^\s<>"'`)\]]+/g) ?? [];
  const bersih = ketemu
    .map((u) => u.replace(/[.,;:]+$/, ''))
    .filter((u) => {
      try {
        return new URL(u).hostname.includes('.');
      } catch {
        return false;
      }
    });
  return [...new Set(bersih)];
}

const normal = (s: string): string => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Repositori GitHub ini benar-benar MILIK topiknya, atau cuma kebetulan teratas?
 *
 * Tanpa penjaga ini, topik umum menyeret repositori paling populer yang
 * kebetulan cocok dengan katanya — "web hosting" mengembalikan
 * `awesome-selfhosted`, dan README-nya lalu masuk sebagai sumber resmi artikel
 * tentang web hosting. Terukur, bukan dugaan: itu yang terjadi di uji pertama.
 *
 * Yang diterima hanya kalau nama repo dan topiknya benar-benar saling memuat —
 * pola untuk topik yang memang berupa nama produk ("CasaOS", "cara memasang
 * CasaOS"), bukan untuk frasa umum.
 */
export function repoMilikTopik(namaRepo: string, topik: string): boolean {
  const r = normal(namaRepo);
  const t = normal(topik);
  if (r.length < 3 || t.length < 3) return false;
  return r === t || r.includes(t) || t.includes(r);
}

/** Sumber terverifikasi → blok bahan rujukan yang ditempel ke perintah penulisan. */
export function bahanDariSumber(sumber: SumberRujukan[]): string {
  return sumber
    .map((s, i) => [`[SUMBER ${i + 1}] ${s.judul || s.url}`, `URL: ${s.url}`, '', s.teks].join('\n'))
    .join('\n\n———\n\n');
}
