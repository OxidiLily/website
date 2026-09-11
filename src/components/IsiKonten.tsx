import React, { useMemo } from 'react';
import { pecahArtikel, tampakHtml } from '../lib/blogWriter';
import { markdownKeHtml } from '../lib/markdown';
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
 * Penulisnya hanya admin (RLS menutup tulis untuk selain admin), dan HTML
 * hasil Markdown sudah meng-escape apa pun yang diketik — jadi sumber HTML
 * ini setingkat kepercayaan dengan CMS mana pun.
 */
export const IsiKonten: React.FC<{ html: string; className?: string }> = ({ html, className = '' }) => {
  const bagian = useMemo(() => pecahArtikel(html), [html]);
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
