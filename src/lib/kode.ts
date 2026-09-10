// Pewarna sintaks kecil untuk blok kode di artikel blog.
//
// Logika string murni supaya bisa diuji tanpa DOM: `npx tsx src/lib/kode.check.ts`.
// Keluarannya token, BUKAN string HTML — komponen yang merendernya membuat
// <span> React sendiri. Itu yang membuat pewarna ini tidak bisa jadi lubang
// injeksi walau kodenya datang dari isi artikel.

export type JenisToken = 'komentar' | 'teks' | 'angka' | 'kunci' | 'polos';
export interface Token {
  teks: string;
  jenis: JenisToken;
}

const KUNCI_JS = [
  'import', 'from', 'export', 'default', 'const', 'let', 'var', 'function', 'return', 'if', 'else',
  'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'class', 'extends', 'implements',
  'interface', 'type', 'enum', 'namespace', 'declare', 'async', 'await', 'try', 'catch', 'finally',
  'throw', 'typeof', 'instanceof', 'in', 'of', 'as', 'is', 'keyof', 'void', 'null', 'undefined',
  'true', 'false', 'this', 'super', 'yield', 'delete', 'static', 'public', 'private', 'protected',
  'readonly', 'abstract', 'satisfies',
];

const KUNCI_PY = [
  'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue', 'import', 'from', 'as',
  'class', 'try', 'except', 'finally', 'raise', 'with', 'lambda', 'pass', 'global', 'nonlocal',
  'assert', 'yield', 'async', 'await', 'del', 'in', 'is', 'not', 'and', 'or', 'None', 'True', 'False',
  'self',
];

// Hanya kata kunci dan builtin shell — BUKAN nama program seperti sudo, wget,
// atau curl. Mewarnai sebagian nama program membuat barisnya terlihat acak:
// `sudo` biru sementara `wget` di baris yang sama polos, tanpa aturan yang bisa
// ditebak pembaca.
const KUNCI_SH = [
  'if', 'then', 'elif', 'else', 'fi', 'for', 'in', 'do', 'done', 'while', 'until', 'case', 'esac',
  'function', 'return', 'export', 'local', 'source', 'set', 'unset', 'exit',
];

/**
 * Bahasa → keluarga aturan.
 *
 * Yang benar-benar membedakan hasilnya cuma dua hal: penanda komentar dan
 * daftar kata kunci. Membuat satu aturan per bahasa tidak menambah apa pun
 * yang terlihat di layar untuk cuplikan sependek yang muncul di artikel.
 */
function keluarga(bahasa: string): { komentar: string; kunci: string[] } {
  const b = (bahasa || '').toLowerCase();
  if (/^(bash|sh|shell|zsh|console|terminal|cmd|powershell|ps1)$/.test(b)) {
    return { komentar: '#[^\\n]*', kunci: KUNCI_SH };
  }
  if (/^(py|python|yaml|yml|toml|ini|conf|ruby|rb|dockerfile|makefile|r)$/.test(b)) {
    return { komentar: '#[^\\n]*', kunci: KUNCI_PY };
  }
  // ponytail: satu aturan gaya C untuk sisanya (js/ts/go/rust/java/c/css/json).
  // Naikkan ke pustaka highlighter kalau nanti butuh warna per-jenis
  // identifier (nama fungsi, tipe, properti) seperti editor sungguhan.
  return { komentar: '/\\*[\\s\\S]*?\\*/|//[^\\n]*', kunci: KUNCI_JS };
}

/**
 * Kode mentah → daftar token.
 *
 * Urutan alternatif di regex ini yang menjaga hasilnya masuk akal: komentar dan
 * string dicoba lebih dulu, jadi `//` di dalam "https://x" tidak berubah jadi
 * komentar (pemindaian sampai di tanda kutipnya duluan) dan `#` di dalam string
 * tidak memotong barisnya.
 */
export function tokenKode(kode: string, bahasa = ''): Token[] {
  const { komentar, kunci } = keluarga(bahasa);
  const pola = new RegExp(
    [
      `(${komentar})`,
      "('(?:\\\\.|[^'\\\\\\n])*'|\"(?:\\\\.|[^\"\\\\\\n])*\"|`(?:\\\\.|[^`\\\\])*`)",
      '(\\b(?:0[xX][\\da-fA-F]+|\\d[\\d_]*(?:\\.\\d+)?)\\b)',
      `(\\b(?:${kunci.join('|')})\\b)`,
    ].join('|'),
    'g',
  );

  const out: Token[] = [];
  let akhir = 0;
  for (let m = pola.exec(kode); m; m = pola.exec(kode)) {
    if (m.index > akhir) out.push({ teks: kode.slice(akhir, m.index), jenis: 'polos' });
    const jenis: JenisToken = m[1] ? 'komentar' : m[2] ? 'teks' : m[3] ? 'angka' : 'kunci';
    out.push({ teks: m[0], jenis });
    akhir = m.index + m[0].length;
  }
  if (akhir < kode.length) out.push({ teks: kode.slice(akhir), jenis: 'polos' });
  return out;
}

/**
 * Token → baris token, supaya nomor baris bisa digambar di gutter.
 *
 * Pemecahan dilakukan SETELAH tokenisasi, bukan sebelum: komentar blok dan
 * template string yang melintasi baris tetap dikenali utuh, lalu potongannya
 * dibagikan ke baris masing-masing.
 */
export function barisToken(kode: string, bahasa = ''): Token[][] {
  const baris: Token[][] = [[]];
  for (const t of tokenKode(kode, bahasa)) {
    const potong = t.teks.split('\n');
    potong.forEach((p, i) => {
      if (i > 0) baris.push([]);
      if (p) baris[baris.length - 1].push({ teks: p, jenis: t.jenis });
    });
  }
  return baris;
}

/** Label pendek untuk lencana di kepala blok (TS, JS, PY, SH…). */
export function labelBahasa(bahasa: string, berkas = ''): string {
  const b = (bahasa || berkas.split('.').pop() || '').toLowerCase();
  const peta: Record<string, string> = {
    ts: 'TS', typescript: 'TS', tsx: 'TSX', js: 'JS', javascript: 'JS', jsx: 'JSX',
    py: 'PY', python: 'PY', sh: 'SH', bash: 'SH', shell: 'SH', zsh: 'SH', console: 'SH',
    terminal: 'SH', json: 'JSON', yaml: 'YML', yml: 'YML', html: 'HTML', css: 'CSS',
    sql: 'SQL', go: 'GO', rs: 'RS', rust: 'RS', php: 'PHP', java: 'JAVA', c: 'C', cpp: 'C++',
  };
  return peta[b] ?? (b ? b.slice(0, 4).toUpperCase() : 'CODE');
}

/**
 * Bahasa tidak ditandai → tebak dari isinya.
 *
 * Artikel lama tersimpan sebagai <pre><code> telanjang tanpa class, dan itu
 * hampir selalu perintah terminal. Tanpa tebakan ini seluruh artikel warisan
 * tampil tanpa warna dan berlencana "CODE".
 *
 * ponytail: hanya mengenali baris perintah shell. Bahasa lain butuh penanda
 * class dari penulisnya — menebak TS dari JS dari Java lewat regex adalah
 * tebakan yang salahnya tidak terlihat sampai warnanya aneh.
 */
export function tebakBahasa(kode: string, bahasa = ''): string {
  if (bahasa) return bahasa;
  const perintah = /^\s*(?:[$#]\s*)?(?:sudo|curl|wget|apt|apt-get|dnf|pacman|brew|npm|npx|yarn|pnpm|bun|pip|docker|docker-compose|git|cd|ls|mkdir|chmod|chown|systemctl|journalctl|ssh|scp|bash|sh|echo|export|tar|unzip)\b/m;
  return perintah.test(kode) ? 'bash' : '';
}
