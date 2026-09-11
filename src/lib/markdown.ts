// Markdown → HTML untuk isi artikel dan deskripsi proyek.
//
// Kenapa Markdown, bukan editor WYSIWYG atau HTML mentah: yang diketik manusia
// dan yang dikeluarkan model harus sama-sama terbaca APA ADANYA di kotak
// isian — judul, paragraf, daftar, dan kode terlihat berbeda tanpa satu pun
// tag. `## Judul` dan `- butir` adalah cara orang menulis catatan; `<h2>` dan
// `<li>` bukan.
//
// Logika murni, diuji lewat `npx tsx src/lib/markdown.check.ts`.
//
// Cakupannya SUBSET yang dipakai artikel: judul, paragraf, daftar bernomor dan
// berbutir, kutipan, pagar kode dengan bahasa + nama berkas, kode sebaris,
// tebal, miring, tautan. Tidak ada tabel, catatan kaki, daftar bersarang, atau
// HTML sebaris — semua HTML yang diketik dilepas jadi teks biasa.
// ponytail: naikkan ke pustaka `marked` kalau penulis mulai butuh tabel atau
// daftar bersarang; jangan menambal parser ini satu fitur per keluhan.

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Tautan hanya ke skema yang aman; sisanya jadi teks biasa. */
const urlAman = (u: string): boolean => /^(https?:\/\/|mailto:|\/|#)/i.test(u);

// Penanda sementara untuk kode sebaris yang dikeluarkan dari teks selama
// penekanan diproses. Karakter kontrol dipilih karena tidak pernah muncul di
// tulisan; dibangun lewat fromCharCode supaya berkas ini tidak memuat byte NUL.
const TANDA = String.fromCharCode(0);

/**
 * Penanda sebaris pada teks yang SUDAH di-escape.
 *
 * Kode sebaris diambil lebih dulu dan disimpan di luar teks, supaya `*` atau
 * `_` di dalam `` `kode` `` tidak pernah dibaca sebagai penekanan. Penekanan
 * dengan `_` sengaja TIDAK didukung: `snake_case_ini` di kalimat teknis jauh
 * lebih sering daripada _miring_ dengan garis bawah.
 */
export function sebaris(teks: string): string {
  const kode: string[] = [];
  let s = teks.replace(/`([^`\n]+)`/g, (_, isi: string) => {
    kode.push(`<code>${isi}</code>`);
    return `${TANDA}${kode.length - 1}${TANDA}`;
  });
  s = s
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label: string, url: string) =>
      urlAman(url) ? `<a href="${url}" target="_blank" rel="noreferrer noopener">${label}</a>` : m,
    )
    // Bintang pembuka harus langsung diikuti huruf dan penutup langsung
    // didahului huruf: `2 * 3 * 4` adalah perkalian, bukan penekanan.
    .replace(/\*\*(\S(?:[^*\n]*\S)?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*(\S(?:[^*\n]*\S)?)\*(?=[^*\w]|$)/g, '$1<em>$2</em>');
  return s.replace(new RegExp(`${TANDA}(\\d+)${TANDA}`, 'g'), (_, i: string) => kode[Number(i)]);
}

/** Baris info pagar kode → bahasa dan nama berkas: "ts use-theme.ts", "bash Terminal", "ts title=\"x\"". */
function infoPagar(info: string): { bahasa: string; berkas: string } {
  const [bahasa = '', ...sisa] = info.trim().split(/\s+/);
  const berkas = sisa.join(' ').replace(/^(title|file(name)?)\s*=\s*/i, '').replace(/^["']|["']$/g, '');
  return { bahasa: bahasa.toLowerCase(), berkas };
}

export function markdownKeHtml(md: string): string {
  const baris = (md || '').replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;

  const kumpul = (cocok: (b: string) => boolean): string[] => {
    const hasil: string[] = [];
    while (i < baris.length && cocok(baris[i])) hasil.push(baris[i++]);
    return hasil;
  };

  while (i < baris.length) {
    const b = baris[i];

    if (!b.trim()) {
      i++;
      continue;
    }

    // Pagar kode: isinya diambil mentah sampai pagar penutup. Tanpa penutup,
    // sisa dokumen dianggap kode — lebih jujur daripada diam-diam
    // memperlakukan kode sebagai paragraf.
    const pagar = b.match(/^```\s*(.*)$/);
    if (pagar) {
      i++;
      const isi = kumpul((x) => !/^```\s*$/.test(x));
      i++; // pagar penutup (atau akhir dokumen)
      const { bahasa, berkas } = infoPagar(pagar[1]);
      const atribut =
        (bahasa ? ` class="language-${escapeHtml(bahasa)}"` : '') + (berkas ? ` data-file="${escapeHtml(berkas)}"` : '');
      out.push(`<pre><code${atribut}>${escapeHtml(isi.join('\n'))}</code></pre>`);
      continue;
    }

    // Judul. `#` dan `##` sama-sama jadi <h2>: <h1> milik judul halaman, dan
    // penulis yang mengetik satu pagar tidak bermaksud membuat judul kedua.
    const judul = b.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (judul) {
      const tag = judul[1].length <= 2 ? 'h2' : 'h3';
      out.push(`<${tag}>${sebaris(escapeHtml(judul[2]))}</${tag}>`);
      i++;
      continue;
    }

    if (/^>\s?/.test(b)) {
      const isi = kumpul((x) => /^>\s?/.test(x)).map((x) => x.replace(/^>\s?/, ''));
      out.push(`<blockquote><p>${sebaris(escapeHtml(isi.join('\n')))}</p></blockquote>`);
      continue;
    }

    if (/^\s*[-*+]\s+/.test(b)) {
      const isi = kumpul((x) => /^\s*[-*+]\s+/.test(x)).map((x) => x.replace(/^\s*[-*+]\s+/, ''));
      out.push(`<ul>${isi.map((x) => `<li>${sebaris(escapeHtml(x))}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(b)) {
      const isi = kumpul((x) => /^\s*\d+[.)]\s+/.test(x)).map((x) => x.replace(/^\s*\d+[.)]\s+/, ''));
      out.push(`<ol>${isi.map((x) => `<li>${sebaris(escapeHtml(x))}</li>`).join('')}</ol>`);
      continue;
    }

    // Paragraf: baris-baris beruntun sampai baris kosong atau awal blok lain.
    const isi = kumpul(
      (x) => !!x.trim() && !/^(```|#{1,6}\s|>\s?|\s*[-*+]\s+|\s*\d+[.)]\s+)/.test(x),
    );
    if (!isi.length) {
      // Tidak cocok blok mana pun dan bukan paragraf — mustahil dengan aturan
      // di atas, tapi jangan sampai berputar tanpa maju.
      i++;
      continue;
    }
    out.push(`<p>${sebaris(escapeHtml(isi.join('\n')))}</p>`);
  }

  return out.join('\n');
}
