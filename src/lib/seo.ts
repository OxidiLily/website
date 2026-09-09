// Meta mesin pencari & pratinjau tautan, untuk halaman maupun artikel.
//
// index.html hanya memuat nilai awal yang sama untuk SELURUH situs. Tanpa berkas
// ini, membuka satu artikel tetap menyodorkan deskripsi situs ke perayap dan ke
// kartu tautan WhatsApp/Twitter — jadi semua artikel terlihat identik.
//
// Batas yang perlu diketahui: situs ini SPA tanpa SSR. Yang diperbarui di sini
// adalah DOM setelah JavaScript jalan. Google mengeksekusi JS dan ikut membaca,
// tetapi banyak perayap kartu tautan TIDAK — mereka hanya membaca HTML mentah.
// Menutup celah itu perlu prerender/SSR, bukan tambahan di berkas ini.

/** Satu `<meta>`, dikenali lewat `name` (standar/Twitter) atau `property` (Open Graph). */
type Kunci = { name: string } | { property: string };

const SELEKTOR = (k: Kunci): string =>
  'name' in k ? `meta[name="${k.name}"]` : `meta[property="${k.property}"]`;

/**
 * Tulis satu meta; buat elemennya kalau belum ada di index.html.
 *
 * `og:url`, `og:image`, dan canonical memang belum ada di sana — kalau fungsi
 * ini hanya menulis ke elemen yang sudah ada, ketiganya diam-diam tidak pernah
 * terpasang dan kegagalannya tak kelihatan sampai ada yang membagikan tautan.
 */
function setel(k: Kunci, isi: string): void {
  if (!isi) return;
  let el = document.querySelector<HTMLMetaElement>(SELEKTOR(k));
  if (!el) {
    el = document.createElement('meta');
    if ('name' in k) el.setAttribute('name', k.name);
    else el.setAttribute('property', k.property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', isi);
}

export interface MetaHalaman {
  judul: string;
  deskripsi: string;
  /** URL kanonik penuh. Dipakai juga sebagai og:url. */
  url: string;
  gambar?: string;
  tipe?: 'website' | 'article';
}

export function terapkanMeta(m: MetaHalaman): void {
  const deskripsi = ringkasUntukMeta(m.deskripsi);
  setel({ name: 'description' }, deskripsi);
  setel({ property: 'og:description' }, deskripsi);
  setel({ name: 'twitter:description' }, deskripsi);

  setel({ property: 'og:title' }, m.judul);
  setel({ name: 'twitter:title' }, m.judul);

  setel({ property: 'og:type' }, m.tipe ?? 'website');
  setel({ property: 'og:url' }, m.url);
  if (m.gambar) {
    setel({ property: 'og:image' }, m.gambar);
    setel({ name: 'twitter:image' }, m.gambar);
  }

  // Canonical menyatukan varian URL yang isinya sama (dengan/tanpa query
  // pelacak, misalnya) jadi satu alamat di mata mesin pencari.
  let tautan = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tautan) {
    tautan = document.createElement('link');
    tautan.setAttribute('rel', 'canonical');
    document.head.appendChild(tautan);
  }
  tautan.setAttribute('href', m.url);
}

const ID_JSONLD = 'jsonld-halaman';

/**
 * Pasang satu blok JSON-LD, atau lepas kalau `data` null.
 *
 * Selalu MENIMPA blok bertanda id yang sama, tidak menumpuk: berpindah dari
 * satu artikel ke artikel lain tanpa ini meninggalkan data terstruktur artikel
 * lama yang bertentangan dengan isi halaman.
 */
export function terapkanJsonLd(data: unknown | null): void {
  document.getElementById(ID_JSONLD)?.remove();
  if (!data) return;
  const el = document.createElement('script');
  el.id = ID_JSONLD;
  el.type = 'application/ld+json';
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
}

/**
 * Teks bebas → deskripsi meta.
 *
 * Buang tag, rapatkan spasi, lalu potong DI BATAS KATA. Google memotong sekitar
 * 155-160 karakter; memotong di tengah kata membuat cuplikannya terbaca rusak.
 */
export function ringkasUntukMeta(teks: string, maks = 160): string {
  const bersih = (teks || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (bersih.length <= maks) return bersih;
  const potong = bersih.slice(0, maks);
  const spasi = potong.lastIndexOf(' ');
  // Kata tunggal yang lebih panjang dari `maks` tidak punya batas kata untuk
  // dipakai; di situ potongan mentah lebih baik daripada string kosong.
  return `${(spasi > 0 ? potong.slice(0, spasi) : potong).replace(/[.,;:!?-]+$/, '')}…`;
}

export interface ArtikelJsonLd {
  judul: string;
  deskripsi: string;
  url: string;
  penulis: string;
  namaSitus: string;
  terbit?: string;
  diperbarui?: string;
  gambar?: string;
}

/** Data terstruktur schema.org/Article — yang dibaca mesin pencari untuk hasil kaya. */
export function jsonLdArtikel(a: ArtikelJsonLd): Record<string, unknown> {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.judul,
    description: ringkasUntukMeta(a.deskripsi),
    mainEntityOfPage: { '@type': 'WebPage', '@id': a.url },
    url: a.url,
    author: { '@type': 'Person', name: a.penulis },
    publisher: { '@type': 'Organization', name: a.namaSitus },
  };
  // Field tanggal hanya disertakan kalau nilainya benar-benar ada: tanggal
  // kosong atau tak terbaca membuat data terstrukturnya ditolak, bukan diabaikan.
  const terbit = tanggalIso(a.terbit);
  if (terbit) data.datePublished = terbit;
  const ubah = tanggalIso(a.diperbarui) ?? terbit;
  if (ubah) data.dateModified = ubah;
  if (a.gambar) data.image = a.gambar;
  return data;
}

/** Tanggal apa pun → ISO 8601, atau null kalau tidak terbaca. */
export function tanggalIso(nilai?: string): string | null {
  if (!nilai) return null;
  const d = new Date(nilai);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
