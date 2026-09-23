// Sanitasi HTML artikel & deskripsi proyek — DAFTAR-PUTIH, bukan daftar-hitam.
//
// Kenapa ada: isi tulisan dirender lewat `dangerouslySetInnerHTML` (IsiKonten),
// dan sebagian isi itu BUKAN ketikan manusia — keluaran model yang bahannya
// diunduh dari halaman pihak ketiga (`/riset`) lalu ditempel ke prompt. Halaman
// sumber bisa memuat instruksi supaya model menulis `<img src=x onerror=...>`,
// dan sebelum berkas ini ada, hasilnya tersimpan apa adanya di `web.blogs.content`
// lalu dieksekusi di browser SETIAP pengunjung. RLS hanya menjaga siapa yang
// boleh MENULIS; ia tidak menjaga apa yang boleh dieksekusi.
//
// Dua jalur yang harus ditutup bersamaan, dan keduanya ada di sini:
//  1. tag/atribut berbahaya (`<script>`, `onerror=`, `javascript:`);
//  2. tag TIDAK TERTUTUP (`<img src=x onerror=alert(1)` tanpa `>`), yang tetap
//     diurai browser sebagai tag lengkap walau akhir dokumen yang menutupnya.
//     Karena itu setiap `<` yang tidak menjadi bagian tag yang kita cetak
//     sendiri di-escape, bukan sekadar dibuang.
//
// Logika murni (tanpa DOM, tanpa jaringan) supaya bisa diuji lewat
// `npx tsx src/lib/sanitasi.check.ts`.
//
// ponytail: parser ini sengaja sederhana dan MENOLAK apa pun yang tidak
// dikenalnya — kegagalan modenya "isi tampil sebagai teks", bukan "skrip jalan".
// Naikkan ke DOMPurify hanya kalau nanti benar-benar perlu mempertahankan
// markup kaya yang tidak ada di daftar ini.

/** Tag yang isinya IKUT dibuang, bukan cuma tagnya. */
const TAG_BUANG_ISI = new Set([
  'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet',
  'svg', 'math', 'template', 'noscript', 'title', 'link', 'meta', 'base', 'param',
  'form', 'input', 'button', 'textarea', 'select', 'option', 'optgroup', 'label',
  'video', 'audio', 'source', 'track', 'canvas', 'marquee', 'plaintext', 'xmp',
  'portal', 'fencedframe',
]);

/**
 * Tag yang DIPERTAHANKAN. Di luar daftar ini tagnya dibuang tapi isinya tetap
 * tampil — `<blink>halo</blink>` jadi `halo`, bukan hilang.
 */
const TAG_SIMPAN = new Set([
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'blockquote', 'pre', 'code', 'kbd', 'samp', 'var',
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark', 'small', 'sub', 'sup',
  'a', 'img', 'figure', 'figcaption', 'abbr', 'cite', 'q', 'time', 'address',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'div', 'span', 'section', 'article', 'header', 'footer', 'main', 'nav', 'aside',
]);

/** Elemen tanpa isi (void): tidak boleh dicetak sebagai tag berpasangan. */
const TAG_KOSONG = new Set(['br', 'hr', 'img', 'col']);

/**
 * Atribut per tag. `*` berlaku untuk semua tag.
 *
 * `class` ada di mana-mana karena CSS `.isi-artikel` memang menyasar kelas, dan
 * nilainya dibatasi ke huruf/angka/strip/underscore/spasi. `style` dan semua
 * `on*` TIDAK ada di sini — bukan karena dilupakan.
 */
const ATRIBUT_SIMPAN: Record<string, Set<string>> = {
  '*': new Set(['class', 'dir', 'lang', 'title']),
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
  pre: new Set(['data-file', 'data-filename', 'data-language', 'data-lang']),
  // Kode bisa keluar dari model dengan penanda menempel di <pre> ATAU di
  // <code> di dalamnya (pecahArtikel membaca keduanya), dan markdownKeHtml
  // menaruhnya di <code>. Daftar-pulih di sini harus mencakup keduanya.
  code: new Set(['data-file', 'data-filename', 'data-language', 'data-lang']),
  ol: new Set(['start', 'type']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  td: new Set(['colspan', 'rowspan']),
  h1: new Set(['id']), h2: new Set(['id']), h3: new Set(['id']),
  h4: new Set(['id']), h5: new Set(['id']), h6: new Set(['id']),
};

/** Pola nilai untuk atribut yang punya bentuk pasti. */
const NILAI_DIGIT = new Set(['width', 'height', 'colspan', 'rowspan', 'start']);
const AMAN_KELAS = /^[A-Za-z0-9 _-]{1,200}$/;
const AMAN_ID = /^[A-Za-z][A-Za-z0-9_-]{0,80}$/;

const escapeTeks = (s: string): string => s.replace(/</g, '&lt;');

/**
 * Nilai atribut → bentuk yang aman dicetak.
 *
 * `&` SENGAJA tidak ikut di-escape. Di dalam nilai ber-tanda-kutip, `&` adalah
 * teks biasa, dan meng-escape-nya merusak entitas yang sudah benar:
 * `?a=1&amp;b=2` akan jadi `?a=1&amp;amp;b=2` dan URL-nya berubah arti.
 */
const escapeAtribut = (s: string): string =>
  s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const ENTITAS_URL: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  colon: ':', tab: '\t', newline: '\n', sol: '/', period: '.',
};

const dariKode = (n: number): string => (Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : '');

/**
 * Nilai URL apa adanya → bentuk yang DILIHAT BROWSER, untuk keperluan penilaian.
 *
 * Browser membuka referensi karakter di dalam atribut sebelum memutuskan skema,
 * jadi `jav&#x61;script:` benar-benar menjadi `javascript:`. Kalau pemeriksaan
 * tidak melakukan hal yang sama, ia menilai teks yang berbeda dari yang akan
 * dijalankan browser — dan itu lubang, bukan detail. Dua putaran dipakai supaya
 * penyamaran berganda (`&amp;#x61;`) ikut terbuka.
 */
export function nilaiTerlihatBrowser(nilai: string): string {
  let s = nilai || '';
  for (let putaran = 0; putaran < 2; putaran++) {
    s = s
      .replace(/&#x([0-9a-f]+);?/gi, (_, h: string) => dariKode(parseInt(h, 16)))
      .replace(/&#(\d+);?/g, (_, d: string) => dariKode(Number(d)))
      .replace(/&([a-z]+);/gi, (m, n: string) => ENTITAS_URL[n.toLowerCase()] ?? m);
  }
  // Karakter kontrol dan spasi di TENGAH skema (`java\tscript:`) juga dibuang
  // browser sebelum skemanya dinilai.
  return s.replace(/[\u0000-\u0020\u007f]/g, '');
}

/**
 * Nilai URL ini aman dipakai sebagai href/src?
 *
 * Dinilai pada bentuk yang dilihat browser, lalu skemanya dibandingkan terhadap
 * daftar-putih. `jav&#x61;script:`, `java\tscript:`, dan `JaVaScRiPt:` tertolak
 * karena semua bentuk itu tetap tidak berawalan skema yang sah.
 */
export function tautanAman(nilai: string, opsi: { dataGambar?: boolean } = {}): boolean {
  const bersih = nilaiTerlihatBrowser(nilai);
  if (!bersih) return false;
  const skema = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(bersih);
  // TANPA skema = jalur relatif, jangkar, atau query. Nilai seperti ini tidak
  // pernah bisa keluar dari origin, dan bentuknya bebas (`logo.png`, `/x`,
  // `#a`) — jadi diloloskan apa adanya.
  if (!skema) return true;
  const s = skema[1].toLowerCase();
  if (s === 'http' || s === 'https' || s === 'mailto' || s === 'tel') return true;
  // `data:` hanya untuk gambar, dan hanya bentuk base64 gambar — bukan
  // `data:text/html` yang mengeksekusi skrip di origin ini.
  if (s === 'data' && opsi.dataGambar) {
    return /^data:image\/(png|jpe?g|gif|webp|avif);base64,[A-Za-z0-9+/=]+$/i.test(bersih);
  }
  return false;
}

/** Nilai URL yang aman dipakai di href/src, atau '' kalau tidak layak dipakai. */
export const tautanBersih = (nilai: string | null | undefined, opsi: { dataGambar?: boolean } = {}): string => {
  const teks = String(nilai ?? '').trim();
  return tautanAman(teks, opsi) ? teks : '';
};

interface Tag {
  tutup: boolean;
  nama: string;
  atribut: string;
  swatutup: boolean;
}

/** `<a href="x">` → { tutup, nama, atribut, swatutup }; null kalau bukan tag yang utuh. */
function uraiTag(mentah: string): Tag | null {
  const m = /^<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9-]*)([\s\S]*?)(\/?)\s*>$/.exec(mentah);
  if (!m) return null;
  return { tutup: m[1] === '/', nama: m[2].toLowerCase(), atribut: m[3], swatutup: m[4] === '/' };
}

/** Cari `>` penutup tag, menghormati nilai atribut ber-tanda-kutip. */
function akhirTag(s: string, mulai: number): number {
  let kutip = '';
  for (let i = mulai + 1; i < s.length; i++) {
    const c = s[i];
    if (kutip) {
      if (c === kutip) kutip = '';
    } else if (c === '"' || c === "'") {
      kutip = c;
    } else if (c === '>') {
      return i;
    }
  }
  return -1;
}

const POLA_ATRIBUT = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/g;

/** Atribut mentah → atribut yang boleh dicetak, sudah di-escape. */
function bersihkanAtribut(tag: Tag): string {
  const bolehUmum = ATRIBUT_SIMPAN['*'];
  const bolehTag = ATRIBUT_SIMPAN[tag.nama] ?? new Set<string>();
  const keluar: string[] = [];
  const nilai: Record<string, string> = {};

  POLA_ATRIBUT.lastIndex = 0;
  for (let m = POLA_ATRIBUT.exec(tag.atribut); m; m = POLA_ATRIBUT.exec(tag.atribut)) {
    const nama = m[1].toLowerCase();
    const isi = m[2] ?? m[3] ?? m[4] ?? '';
    // `on*` (event handler), `style` (CSS), `srcset`, `formaction`, dan
    // `xlink:*` tidak pernah masuk daftar-putih — tidak perlu disebut.
    if (!bolehUmum.has(nama) && !bolehTag.has(nama)) continue;
    if (nama === 'class') { if (!AMAN_KELAS.test(isi)) continue; }
    else if (nama === 'id') { if (!AMAN_ID.test(isi)) continue; }
    else if (NILAI_DIGIT.has(nama)) { if (!/^\d{1,4}$/.test(isi.trim())) continue; }
    else if (nama === 'href' || nama === 'src') {
      if (!tautanAman(isi, { dataGambar: nama === 'src' && tag.nama === 'img' })) continue;
    } else if (nama === 'target') {
      if (isi !== '_blank' && isi !== '_self') continue;
    } else if (nama === 'rel') {
      if (!/^[A-Za-z0-9 _-]{1,100}$/.test(isi)) continue;
    } else if (nama === 'loading') {
      if (isi !== 'lazy' && isi !== 'eager') continue;
    } else if (nama === 'scope') {
      if (!/^(row|col|rowgroup|colgroup)$/.test(isi)) continue;
    }
    nilai[nama] = isi;
  }

  // Tab baru tanpa `noopener` memberi halaman tujuan akses `window.opener`.
  if (nilai.target === '_blank' && !/\bnoopener\b/i.test(nilai.rel ?? '')) {
    nilai.rel = nilai.rel ? `${nilai.rel} noopener noreferrer` : 'noopener noreferrer';
  }

  for (const nama of Object.keys(nilai)) keluar.push(`${nama}="${escapeAtribut(nilai[nama])}"`);
  return keluar.length ? ` ${keluar.join(' ')}` : '';
}

/**
 * HTML dari mana pun → HTML yang aman dirender.
 *
 * Urutan: buang komentar, lalu telusuri tag satu per satu. Setiap potongan teks
 * di antaranya di-escape `<`-nya, jadi tag yang tidak pernah kita cetak tidak
 * bisa lahir dari sisa dokumen.
 */
export function sanitasiArtikel(html: string): string {
  const sumber = (html ?? '').replace(/\u0000/g, '');
  let keluar = '';
  let i = 0;

  while (i < sumber.length) {
    const lt = sumber.indexOf('<', i);
    if (lt === -1) { keluar += escapeTeks(sumber.slice(i)); break; }
    if (lt > i) keluar += escapeTeks(sumber.slice(i, lt));

    // Komentar dibuang utuh — termasuk komentar bersyarat gaya IE.
    if (sumber.startsWith('<!--', lt)) {
      const selesai = sumber.indexOf('-->', lt + 4);
      i = selesai === -1 ? sumber.length : selesai + 3;
      continue;
    }

    const gt = akhirTag(sumber, lt);
    if (gt === -1) {
      // Tidak ada `>` penutup. Browser tetap menganggapnya tag (akhir dokumen
      // yang menutupnya), jadi sisanya di-escape — jangan pernah dicetak.
      keluar += escapeTeks(sumber.slice(lt));
      break;
    }

    const mentah = sumber.slice(lt, gt + 1);
    i = gt + 1;
    const tag = uraiTag(mentah);
    if (!tag) { keluar += escapeTeks(mentah); continue; }

    if (TAG_BUANG_ISI.has(tag.nama)) {
      // Isi tag ini bukan prosa dan tidak boleh sampai ke DOM. Kalau penutupnya
      // tidak ada, cukup tagnya yang dibuang: sisa dokumen tetap ditelusuri
      // dan disaring, bukan ditelan sampai akhir.
      if (!tag.tutup && !tag.swatutup) {
        const penutup = sumber.toLowerCase().indexOf(`</${tag.nama}`, i);
        if (penutup !== -1) {
          const gtPenutup = akhirTag(sumber, penutup);
          i = gtPenutup === -1 ? sumber.length : gtPenutup + 1;
        }
      }
      continue;
    }

    if (!TAG_SIMPAN.has(tag.nama)) continue; // unwrap: tagnya hilang, isinya tetap

    if (TAG_KOSONG.has(tag.nama)) {
      if (!tag.tutup) keluar += `<${tag.nama}${bersihkanAtribut(tag)}>`;
      continue;
    }

    keluar += `<${tag.tutup ? '/' : ''}${tag.nama}${tag.tutup ? '' : bersihkanAtribut(tag)}>`;
  }

  return keluar;
}
