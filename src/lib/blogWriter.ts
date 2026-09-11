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
  '- Keluarkan HANYA isi artikel dalam Markdown. Tanpa pembuka, tanpa penutup,',
  '  tanpa pagar ``` yang membungkus seluruh jawaban.',
  '- Judul bagian: `## Judul`. Sub-bagian: `### Sub judul`. JANGAN memakai `#`',
  '  satu pagar — judul artikel sudah ditampilkan halaman.',
  '- Paragraf dipisah satu baris kosong. Daftar: `- butir` atau `1. langkah`.',
  '- Tebal `**teks**`, miring `*teks*`, kode sebaris `kode`, tautan [teks](https://...).',
  '- DILARANG menulis tag HTML apa pun (<p>, <h2>, <br>); semuanya akan tampil',
  '  sebagai teks mentah, bukan sebagai format.',
  '',
  'KODE DAN PERINTAH — dipakai halaman untuk menggambar kartu kode:',
  '- Setiap kode, perintah terminal, atau berkas konfigurasi ditulis dalam pagar',
  '  tiga backtick dengan BAHASA lalu NAMA BERKAS di baris pembukanya:',
  '  ```ts use-theme.ts',
  '  ```yaml docker-compose.yml',
  '  ```bash Terminal   ← untuk perintah yang diketik di terminal',
  '- Bahasa yang dikenal: ts, tsx, js, jsx, python, bash, json, yaml, sql, css, html.',
  '- Satu pagar = satu berkas atau satu rangkaian perintah utuh, bukan potongan',
  '  satu baris yang berserakan. Kode yang cuma satu istilah pakai `kode sebaris`.',
  '',
  'AKURASI — ini yang membedakan artikel yang berguna dari artikel yang menyesatkan:',
  '- Jangan mengarang versi, angka, harga, tanggal rilis, atau nama perintah.',
  '  Kalau tidak yakin, tulis sifatnya ("perintah pemasangan resminya") dan',
  '  arahkan pembaca ke dokumentasi resmi — jangan menebak nilai spesifik.',
  '- Rujuk sumber primer: dokumentasi resmi proyek, repositori resminya, atau',
  '  rilis resmi vendor. Blog pihak ketiga dan forum bukan rujukan utama.',
  '- Tutup artikel dengan `## Sumber` berisi daftar `- [Judul sumber](URL) — satu',
  '  kalimat isi` untuk tiap sumber yang dipakai.',
  '',
  'SEO — tulis untuk pembaca dulu, mesin pencari mengikuti:',
  '- Kalimat pertama harus sudah menjawab "ini apa", memuat kata kunci utama',
  '  secara wajar, dan berdiri sendiri kalau dikutip sebagai cuplikan hasil pencarian.',
  '- Judul `##` ditulis sebagai pertanyaan atau frasa yang benar-benar diketik orang',
  '  ("Apa itu X", "Cara memasang X", "X vs Y"), bukan label satu kata seperti "Fitur".',
  '- Sebar kata kunci utama dan variasinya secara alami. Mengulang-ulang kata kunci',
  '  merusak tulisan sekaligus peringkatnya — jangan.',
  '- Jawab pertanyaan turunan yang wajar muncul (syarat, harga/lisensi, alternatif),',
  '  karena itu yang dicari orang setelah pertanyaan pertama.',
  '- Baca ulang setiap judul dan kalimat pertama: salah ketik di judul ("Apa Ita")',
  '  ikut masuk ke daftar isi dan hasil pencarian.',
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
          '- Bagian `## Sumber` di akhir memuat SELURUH URL di bahan rujukan.',
          '',
        ]
      : []),
    'Struktur wajib:',
    '1. Paragraf pembuka: jelaskan apa itu dan kenapa pembaca perlu peduli.',
    '2. Minimal 4 bagian `##` yang masing-masing berisi 2-4 paragraf yang benar-benar menjelaskan, bukan daftar poin telanjang.',
    '3. Sertakan hal praktis: cara pakai, syarat, atau langkah — dalam daftar bernomor, atau pagar kode bila memang kode/perintah.',
    '4. Satu bagian yang jujur soal keterbatasan atau kapan TIDAK cocok dipakai.',
    '5. Bagian penutup `## Kesimpulan` berisi 1-2 paragraf yang merangkum dan memberi rekomendasi tegas.',
    '6. Paling akhir `## Sumber` berisi daftar tautan rujukan.',
    '',
    'Panjang sasaran 900-1500 kata. Tulis mengalir seperti penulis manusia:',
    'hindari kalimat template, hindari mengulang kata kunci, dan jangan menutup',
    'setiap bagian dengan ringkasan yang sama.',
    '',
    `Kata kunci utama artikel ini adalah "${topik}".`,
  ].join('\n');
}

/**
 * Rapikan keluaran model jadi Markdown yang siap disimpan.
 *
 * Dua kotoran yang benar-benar sering muncul: pagar ```markdown yang
 * membungkus SELURUH jawaban, dan — dari masa keluaran masih HTML — wrapper
 * <html>/<body>. Selebihnya dibiarkan apa adanya; ini perapih, bukan sanitizer.
 *
 * Pagar pembungkus hanya dikupas kalau pagar pertama ada di baris PERTAMA,
 * pagar terakhir di baris TERAKHIR, dan pagar di antaranya berpasangan. Tanpa
 * syarat ketiga, artikel yang kebetulan DIAKHIRI blok kode akan dikupas dari
 * pagar kode pertamanya sampai penutup terakhir — dan kodenya lenyap.
 */
export function bersihkanKeluaranArtikel(mentah: string): string {
  let s = (mentah || '').replace(/\r\n?/g, '\n').trim();

  const baris = s.split('\n');
  const pagarPertama = /^```\s*(markdown|md|html)?\s*$/i.test(baris[0] ?? '');
  const pagarTerakhir = /^```\s*$/.test(baris[baris.length - 1] ?? '');
  const jumlahPagarDalam = baris.slice(1, -1).filter((b) => /^```/.test(b)).length;
  if (baris.length >= 2 && pagarPertama && pagarTerakhir && jumlahPagarDalam % 2 === 0) {
    s = baris.slice(1, -1).join('\n').trim();
  }

  // Wrapper dokumen penuh dari keluaran HTML lama: ambil isi <body> saja.
  const body = s.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (body) s = body[1].trim();
  s = s.replace(/<\/?(?:html|head|body)[^>]*>/gi, '').trim();

  return s;
}

/** @deprecated nama lama; dipertahankan supaya pemanggil lama tidak putus. */
export const bersihkanHtmlArtikel = bersihkanKeluaranArtikel;

/**
 * Isi artikel ini HTML (baris lama), atau Markdown/teks yang harus diubah dulu?
 *
 * Dinilai dari AWAL dokumen, bukan dari ada-tidaknya tag di mana pun: artikel
 * Markdown tentang HTML wajar memuat `<p>` di dalam pagar kodenya, dan aturan
 * lama ("ada tag <p> di mana saja") akan menyuntikkannya sebagai HTML — isinya
 * lalu hilang, bukan sekadar jelek. Baris lama yang ditulis sebagai HTML
 * selalu dibuka dengan <p>, <h2>, atau tag blok lain.
 */
export const tampakHtml = (isi: string): boolean =>
  /^\s*<(p|h[1-6]|ul|ol|pre|blockquote|div|section|table|figure)\b/i.test(isi || '');

// ── Pemisahan blok kode ────────────────────────────────────────────────────

export type PotonganArtikel =
  | { jenis: 'html'; isi: string }
  | { jenis: 'kode'; bahasa: string; berkas: string; isi: string };

const ENTITAS: Record<string, string> = {
  '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
};

/**
 * Entitas → karakter aslinya.
 *
 * `&amp;` dibuka TERAKHIR: kalau ia dibuka lebih dulu, `&amp;lt;` — cara menulis
 * teks literal "&lt;" — berubah jadi `<` dan tampil sebagai tag, bukan sebagai
 * kode yang memang ingin ditunjukkan penulisnya.
 *
 * Diekspor karena src/lib/riset.ts memakainya untuk membersihkan halaman
 * sumber; aturan urutannya sama persis dan tidak layak ditulis dua kali.
 */
export function nyahEntitas(s: string): string {
  return s
    .replace(/&(?:lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITAS[m])
    .replace(/&#(\d{1,6});/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#[xX]([\da-fA-F]{1,6});/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
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

// ── Daftar isi dari judul bagian ───────────────────────────────────────────

/** Judul bagian → id jangkar: huruf kecil, tanpa tanda baca, spasi jadi strip. */
const idDariJudul = (judul: string): string =>
  judul
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);

/**
 * Isi artikel HTML → HTML yang setiap <h2>-nya punya `id`, plus daftar bagiannya.
 *
 * Halaman detail dulu hanya tahu bagian artikel dari `meta.sections` — kolom
 * yang diisi tangan untuk artikel warisan. Artikel hasil AI (dan artikel HTML
 * tulisan manusia) tidak punya itu, jadi daftar isinya kosong dan tombol
 * lompatnya menunjuk ke mana-mana. Di sini bagiannya dibaca dari judul <h2>
 * yang memang sudah ada di artikelnya sendiri.
 *
 * Dikerjakan dalam SATU lintasan supaya id di HTML dan id di daftar tidak
 * mungkin berbeda — dua fungsi terpisah yang sama-sama mengurai <h2> adalah
 * dua tempat untuk tidak sinkron.
 */
export function susunArtikel(html: string): { html: string; sections: { id: string; title: string; content: string }[] } {
  const sections: { id: string; title: string; content: string }[] = [];
  const terpakai = new Set<string>();
  const hasil = (html || '').replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi, (_, atribut: string, dalam: string) => {
    const title = nyahEntitas(dalam.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
    let id = idDariJudul(title) || `bagian-${sections.length + 1}`;
    // Dua judul yang sama (jarang, tapi "Kesimpulan" bisa muncul dua kali di
    // artikel panjang) tidak boleh berebut satu jangkar.
    for (let n = 2; terpakai.has(id); n++) id = `${idDariJudul(title)}-${n}`;
    terpakai.add(id);
    sections.push({ id, title, content: '' });
    // id lama (kalau penulisnya menulis sendiri) diganti, bukan ditumpuk —
    // dua atribut id pada satu elemen bukan HTML yang sah.
    const bersih = atribut.replace(/\s+id\s*=\s*("[^"]*"|'[^']*'|\S+)/i, '');
    return `<h2 id="${id}"${bersih}>${dalam}</h2>`;
  });
  return { html: hasil, sections };
}
