// Menyalin teks ke papan klip, termasuk di halaman yang BUKAN konteks aman.
//
// Ini bukan kehati-hatian berlebih. Situs ini dibuka lewat alamat LAN dan
// tailnet tanpa TLS (`http://192.168.2.11:3000`), dan di sana
// `navigator.clipboard` tidak ada sama sekali — `window.isSecureContext`
// bernilai false, jadi seluruh API papan klip modern tidak didaftarkan browser.
// Terukur di Chromium: `{"secure":false,"adaClipboard":false}` untuk alamat LAN,
// sementara `http://127.0.0.1:3000` justru dianggap aman dan berfungsi. Itu
// yang membuat tombol salin terlihat mati hanya di sebagian cara membuka situs.
//
// `document.execCommand('copy')` sudah usang tapi masih ada di semua browser
// arus utama, dan ia satu-satunya jalan di halaman tanpa TLS.

/** Pilih seluruh isi sebuah elemen, supaya pembaca bisa menekan Ctrl+C sendiri. */
export function pilihTeks(el: Element | null): void {
  if (!el) return;
  const pilihan = window.getSelection();
  if (!pilihan) return;
  const jangkauan = document.createRange();
  jangkauan.selectNodeContents(el);
  pilihan.removeAllRanges();
  pilihan.addRange(jangkauan);
}

/**
 * Salin lewat <textarea> sementara.
 *
 * Elemennya TIDAK boleh `display:none` atau `visibility:hidden` — teks yang
 * tak terender tidak bisa dipilih, dan `execCommand` mengembalikan false.
 * Karena itu ia dipasang benar-benar di layar tapi tak terlihat, dan
 * `position: fixed` menjaga halaman tidak ikut melompat saat browser
 * memfokuskannya.
 */
function salinCaraLama(teks: string): boolean {
  const fokusSebelumnya = document.activeElement as HTMLElement | null;
  const ta = document.createElement('textarea');
  ta.value = teks;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;';
  document.body.appendChild(ta);
  try {
    ta.select();
    // iOS mengabaikan select() pada textarea readonly; jangkauannya harus
    // disebut eksplisit.
    ta.setSelectionRange(0, teks.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(ta);
    fokusSebelumnya?.focus?.();
  }
}

/**
 * Salin `teks`. Mengembalikan apakah benar-benar tersalin.
 *
 * Nilai baliknya WAJIB dipakai pemanggil: dulu kegagalannya ditelan `catch`
 * kosong, dan yang terlihat pengguna cuma tombol yang tidak melakukan apa pun.
 *
 * Ketersediaan API diperiksa secara SINKRON sebelum `await` mana pun. Jalur
 * cadangan `execCommand` hanya sah selama masih di dalam tugas gerakan
 * pengguna, dan satu `await` yang keliru di depannya sudah cukup membuat
 * browser menolaknya.
 */
export async function salinTeks(teks: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(teks);
      return true;
    } catch {
      // Izin ditolak pengguna atau dokumen tidak fokus → coba cara lama.
      return salinCaraLama(teks);
    }
  }
  return salinCaraLama(teks);
}
