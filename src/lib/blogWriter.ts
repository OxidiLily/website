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
].join('\n');

/** Perintah satu artikel penuh. Panjang dan struktur disebut eksplisit karena "artikel lengkap" saja menghasilkan 3 paragraf. */
export function tugasArtikel(topik: string): string {
  return [
    `Tulis artikel blog yang utuh dan mendalam tentang "${topik}".`,
    '',
    'Struktur wajib:',
    '1. Paragraf pembuka: jelaskan apa itu dan kenapa pembaca perlu peduli.',
    '2. Minimal 4 bagian <h2> yang masing-masing berisi 2-4 paragraf <p> yang benar-benar menjelaskan, bukan daftar poin telanjang.',
    '3. Sertakan hal praktis: cara pakai, syarat, atau langkah — dalam <ol> atau <pre><code> bila memang perintah.',
    '4. Satu bagian yang jujur soal keterbatasan atau kapan TIDAK cocok dipakai.',
    '5. Bagian penutup <h2>Kesimpulan</h2> berisi 1-2 paragraf yang merangkum dan memberi rekomendasi tegas.',
    '',
    'Panjang sasaran 900-1500 kata. Tulis mengalir seperti penulis manusia:',
    'hindari kalimat template, hindari mengulang kata kunci, dan jangan menutup',
    'setiap bagian dengan ringkasan yang sama.',
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
