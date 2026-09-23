import React, { useMemo } from 'react';
import { pecahArtikel, tampakHtml } from '../lib/blogWriter';
import { markdownKeHtml } from '../lib/markdown';
import { sanitasiArtikel } from '../lib/sanitasi';
import { KodeBlok } from './KodeBlok';

/**
 * Isi tulisan → HTML siap render.
 *
 * Isi yang disimpan panel adalah Markdown (artikel baru, deskripsi proyek);
 * baris lama masih HTML dan tetap dihormati. Yang memutuskan `tampakHtml()`.
 */
export const keHtml = (isi: string): string => (tampakHtml(isi) ? isi : markdownKeHtml(isi));

/**
 * Merender HTML tulisan: prosa disuntikkan apa adanya, blok kode digambar
 * sebagai kartu. Dipakai halaman artikel dan modal proyek — satu tempat,
 * supaya keduanya tidak pernah berbeda cara menggambar kode.
 *
 * Penyaringnya `sanitasiArtikel()`, dan ia dipasang DI SINI — satu-satunya
 * tempat di seluruh aplikasi yang memanggil `dangerouslySetInnerHTML` — bukan
 * di tiap pemanggil. Alasannya bukan kerapian: isi artikel tidak selalu
 * ketikan manusia. Tombol "Generate dengan AI" mengisi kolom isi dari keluaran
 * model, dan bahan prompt-nya diunduh dari halaman pihak ketiga (`/riset`).
 * Halaman sumber bisa memerintahkan model menulis `<img src=x onerror=...>`,
 * dan tanpa penyaring ini markup itu tersimpan di `web.blogs.content` lalu
 * dieksekusi di browser setiap pengunjung. RLS hanya menjaga siapa yang boleh
 * MENULIS; ia tidak menjaga apa yang boleh dijalankan.
 */
export const IsiKonten: React.FC<{ html: string; className?: string }> = ({ html, className = '' }) => {
  const bagian = useMemo(() => pecahArtikel(sanitasiArtikel(html)), [html]);
  return (
    <div className={`isi-artikel ${className}`.trim()}>
      {bagian.map((b, i) =>
        b.jenis === 'kode' ? (
          <KodeBlok key={i} kode={b.isi} bahasa={b.bahasa} berkas={b.berkas} />
        ) : (
          <div key={i} dangerouslySetInnerHTML={{ __html: b.isi }} />
        ),
      )}
    </div>
  );
};

export default IsiKonten;
