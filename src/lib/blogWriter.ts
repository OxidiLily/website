// Prompt dan pembersih keluaran untuk tombol "Generate dengan AI" di Manage Blog.
//
// Dipisah dari ResourceManager.tsx karena ini logika string murni: bisa diuji
// lewat `npx tsx src/lib/blogWriter.check.ts` tanpa DOM, tanpa jaringan.

/**
 * Peran penulis artikel — TERPISAH dari `ai_system_prompt`.
 *
 * `ai_system_prompt` adalah persona asisten chat publik. Memakainya di sini
 * (dulu: `cfg.systemPrompt || <instruksi ini>`) membuat instruksi penulis
 * hilang begitu admin mengisi persona, dan keluarannya jatuh jadi markdown
 * pendek bergaya jawaban chat.
 */
export const PROMPT_PENULIS_BLOG = [
  'Kamu penulis artikel teknologi berbahasa Indonesia yang menulis untuk pembaca umum.',
  '',
  'ATURAN KELUARAN — tidak bisa ditawar:',
  '- Keluarkan HANYA potongan HTML isi artikel. Tanpa <html>, <head>, <body>.',
  '- Tanpa pagar kode (```). Tanpa penjelasan sebelum atau sesudah HTML.',
  '- Tag yang boleh: <h2> <h3> <p> <ul> <ol> <li> <strong> <em> <blockquote> <pre> <code> <a>.',
  '- DILARANG memakai markdown. `**tebal**` dan `## judul` salah; pakai <strong> dan <h2>.',
  '- Jangan mengulang judul artikel sebagai <h1>; halaman sudah menampilkannya.',
  '',
  'KODE DAN PERINTAH — dipakai halaman untuk menggambar kartu kode:',
  '- Setiap kode, perintah terminal, atau berkas konfigurasi ditulis sebagai',
  '  <pre><code class="language-XXX" data-file="NAMA">…</code></pre>.',
  '- class="language-XXX" wajib: ts, tsx, js, jsx, python, bash, json, yaml, sql, css, html.',
  '- data-file="NAMA" diisi nama berkas yang masuk akal (use-theme.ts, docker-compose.yml).',
  '  Untuk perintah yang diketik di terminal, tulis data-file="Terminal".',
  '- Di dalam <code>, tanda < > & ditulis sebagai &lt; &gt; &amp; supaya tidak',
  '  dibaca sebagai tag dan hilang dari layar.',
  '- Satu blok = satu berkas atau satu rangkaian perintah utuh, bukan potongan',
  '  satu baris yang berserakan. Kode yang cuma satu istilah pakai <code> biasa.',
  '',
  'AKURASI — ini yang membedakan artikel yang berguna dari artikel yang menyesatkan:',
  '- Jangan mengarang versi, angka, harga, tanggal rilis, atau nama perintah.',
  '  Kalau tidak yakin, tulis sifatnya ("perintah pemasangan resminya") dan',
  '  arahkan pembaca ke dokumentasi resmi — jangan menebak nilai spesifik.',
  '- Rujuk sumber primer: dokumentasi resmi proyek, repositori resminya, atau',
  '  rilis resmi vendor. Blog pihak ketiga dan forum bukan rujukan utama.',
  '- Tutup artikel dengan <h2>Sumber</h2> berisi <ol> tautan sumber yang dipakai,',
  '  masing-masing <a href="URL">Judul sumber</a> ditambah satu kalimat isi.',
  '',
  'SEO — tulis untuk pembaca dulu, mesin pencari mengikuti:',
  '- Kalimat pertama harus sudah menjawab "ini apa", memuat kata kunci utama',
  '  secara wajar, dan berdiri sendiri kalau dikutip sebagai cuplikan hasil pencarian.',
  '- Judul <h2> ditulis sebagai pertanyaan atau frasa yang benar-benar diketik orang',
  '  ("Apa itu X", "Cara memasang X", "X vs Y"), bukan label satu kata seperti "Fitur".',
  '- Sebar kata kunci utama dan variasinya secara alami. Mengulang-ulang kata kunci',
  '  merusak tulisan sekaligus peringkatnya — jangan.',
  '- Jawab pertanyaan turunan yang wajar muncul (syarat, harga/lisensi, alternatif),',
  '  karena itu yang dicari orang setelah pertanyaan pertama.',
].join('\n');

/**
 * Perintah satu artikel penuh.
 *
 * Panjang dan struktur disebut eksplisit karena "artikel lengkap" saja
 * menghasilkan 3 paragraf. `sumber` adalah bahan rujukan yang ditempel admin —
 * URL dan/atau kutipan halamannya. Kalau diisi, artikel dirangkum DARI bahan
 * itu, bukan dari ingatan model; itu satu-satunya cara membuat isinya bisa
 * ditelusuri balik oleh pembaca.
 */
export function tugasArtikel(topik: string, sumber = ''): string {
  const bahan = sumber.trim();
  return [
    `Tulis artikel blog yang utuh dan mendalam tentang "${topik}".`,
    '',
    ...(bahan
      ? [
          'BAHAN RUJUKAN — pakai ini sebagai sumber kebenaran, di atas ingatanmu sendiri:',
          '',
          bahan,
          '',
          'Cara memakainya:',
          '- Rangkum dan gabungkan seluruh bahan di atas jadi satu artikel yang mengalir,',
          '  bukan ringkasan per sumber yang ditempel berurutan.',
          '- Kalau dua sumber berbeda isi, sebutkan perbedaannya apa adanya dan',
          '  jelaskan mana yang lebih baru atau lebih resmi.',
          '- Fakta yang TIDAK ada di bahan mana pun jangan ditambahkan. Kalau bagian',
          '  penting tidak tercakup, tulis satu kalimat jujur bahwa itu di luar sumber.',
          '- Bagian <h2>Sumber</h2> di akhir memuat SELURUH URL di bahan rujukan.',
          '',
        ]
      : []),
    'Struktur wajib:',
    '1. Paragraf pembuka: jelaskan apa itu dan kenapa pembaca perlu peduli.',
    '2. Minimal 4 bagian <h2> yang masing-masing berisi 2-4 paragraf <p> yang benar-benar menjelaskan, bukan daftar poin telanjang.',
    '3. Sertakan hal praktis: cara pakai, syarat, atau langkah — dalam <ol> atau blok <pre><code> bila memang kode/perintah.',
    '4. Satu bagian yang jujur soal keterbatasan atau kapan TIDAK cocok dipakai.',
    '5. Bagian penutup <h2>Kesimpulan</h2> berisi 1-2 paragraf yang merangkum dan memberi rekomendasi tegas.',
    '6. Paling akhir <h2>Sumber</h2> berisi <ol> tautan rujukan.',
    '',
    'Panjang sasaran 900-1500 kata. Tulis mengalir seperti penulis manusia:',
    'hindari kalimat template, hindari mengulang kata kunci, dan jangan menutup',
    'setiap bagian dengan ringkasan yang sama.',
    '',
    `Kata kunci utama artikel ini adalah "${topik}".`,
  ].join('\n');
}

/**
 * Rapikan keluaran model jadi HTML yang siap disimpan.
 *
 * Dua kotoran yang benar-benar sering muncul dan merusak tampilan:
 * pagar kode ```html yang ikut tersimpan, dan wrapper <html>/<body> lengkap.
 * Selebihnya dibiarkan apa adanya — ini perapih, bukan sanitizer, dan bukan
 * pengurai markdown.
 */
export function bersihkanHtmlArtikel(mentah: string): string {
  let s = (mentah || '').trim();

  // Pagar kode yang membungkus SELURUH jawaban. Dibatasi pada kasus itu supaya
  // <pre><code> berisi contoh perintah di dalam artikel tidak ikut terkupas.
  const pagar = s.match(/^```[a-zA-Z]*\s*\n([\s\S]*?)\n?```$/);
  if (pagar) s = pagar[1].trim();

  // Wrapper dokumen penuh: ambil isi <body> saja.
  const body = s.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (body) s = body[1].trim();
  s = s.replace(/<\/?(?:html|head|body)[^>]*>/gi, '').trim();

  return s;
}

/**
 * Isi artikel ini HTML, atau teks/markdown warisan?
 *
 * Dipakai halaman detail untuk memutuskan cara render. Baris lama yang
 * terlanjur tersimpan sebagai markdown tidak boleh disuntikkan sebagai HTML —
 * hasilnya justru hilang sama sekali, bukan cuma jelek.
 */
export const tampakHtml = (isi: string): boolean => /<(p|h2|h3|ul|ol|li|pre|blockquote|strong|em)\b[^>]*>/i.test(isi || '');

// ── Pemisahan blok kode ────────────────────────────────────────────────────

export type PotonganArtikel =
  | { jenis: 'html'; isi: string }
  | { jenis: 'kode'; bahasa: string; berkas: string; isi: string };

const ENTITAS: Record<string, string> = {
  '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
};

/** Entitas → karakter aslinya. `&amp;` dibuka terakhir supaya `&amp;lt;` tidak jadi `<`. */
function nyahEntitas(s: string): string {
  return s.replace(/&(?:lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITAS[m]).replace(/&amp;/g, '&');
}

const atributNilai = (atribut: string, nama: string): string =>
  atribut.match(new RegExp(`${nama}\\s*=\\s*"([^"]*)"`, 'i'))?.[1] ??
  atribut.match(new RegExp(`${nama}\\s*=\\s*'([^']*)'`, 'i'))?.[1] ??
  '';

/**
 * Isi artikel → potongan HTML biasa dan blok kode yang berdiri sendiri.
 *
 * Blok kode dikeluarkan dari aliran `dangerouslySetInnerHTML` supaya bisa
 * digambar sebagai kartu React (nomor baris, tombol salin, pewarnaan). Selama
 * ia masih HTML mentah, satu-satunya yang bisa dilakukan cuma mewarnai
 * latarnya lewat CSS.
 */
export function pecahArtikel(html: string): PotonganArtikel[] {
  const teks = html || '';
  const out: PotonganArtikel[] = [];
  const pre = /<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi;
  let akhir = 0;

  for (let m = pre.exec(teks); m; m = pre.exec(teks)) {
    if (m.index > akhir) out.push({ jenis: 'html', isi: teks.slice(akhir, m.index) });

    // Atribut bisa menempel di <pre> ATAU di <code> di dalamnya — kedua bentuk
    // sama-sama keluar dari model, jadi keduanya dibaca lalu digabung.
    let atribut = m[1];
    let dalam = m[2];
    const code = dalam.match(/<code\b([^>]*)>([\s\S]*?)<\/code>/i);
    if (code) {
      atribut += ' ' + code[1];
      dalam = code[2];
    }

    const kelas = atributNilai(atribut, 'class');
    const bahasa =
      kelas.match(/(?:language|lang)-([\w+#-]+)/i)?.[1] ||
      atributNilai(atribut, 'data-language') ||
      atributNilai(atribut, 'data-lang') ||
      '';

    out.push({
      jenis: 'kode',
      bahasa,
      berkas: atributNilai(atribut, 'data-file') || atributNilai(atribut, 'data-filename'),
      // Tag sisa dibuang SEBELUM entitas dibuka: `&lt;div&gt;` yang ditulis
      // model adalah kode yang harus tampil, sedangkan <span> pewarna bawaan
      // model adalah markup yang harus hilang. Urutan terbalik menghapus
      // keduanya.
      isi: nyahEntitas(dalam.replace(/<[^>]*>/g, '')).replace(/^\n+/, '').replace(/\s+$/, ''),
    });
    akhir = m.index + m[0].length;
  }

  if (akhir < teks.length) out.push({ jenis: 'html', isi: teks.slice(akhir) });
  return out;
}
