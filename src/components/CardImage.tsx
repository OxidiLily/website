import React, { useState } from 'react';
import { LOGO } from '../lib/content';
import { tautanAman } from '../lib/sanitasi';

interface CardImageProps {
  src?: string;
  alt: string;
  /** Kelas untuk gambar nyata (biasanya mengisi penuh kotaknya). */
  className?: string;
  /** Kelas saat yang tampil logo situs — dipasang di tengah, bukan dipotong. */
  logoClassName?: string;
}

/**
 * Gambar kartu konten dengan logo situs sebagai penggantinya.
 *
 * Dipakai kartu blog, kartu proyek, dan modal proyek. Sebelumnya tiap kartu
 * blog menggambar SVG geometris yang tidak ada hubungannya dengan isi artikel
 * dan tidak bisa diubah dari panel; sekarang yang tampil adalah gambar yang
 * memang diunggah admin, dan logo hanya mengisi selama belum ada.
 *
 * URL yang mati (berkas terhapus di storage, host luar tumbang) juga jatuh ke
 * logo lewat `onError` — kotak gambar rusak lebih buruk daripada logo.
 */
export const CardImage: React.FC<CardImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  logoClassName = 'w-24 h-24 object-contain',
}) => {
  const [gagal, setGagal] = useState(false);
  // `src` datang dari kolom isi di tabel, bukan dari kode. URL yang skemanya
  // bukan gambar (`javascript:`, `data:text/html`) diperlakukan seperti URL
  // rusak: jatuh ke logo, sama seperti berkas yang sudah terhapus.
  const pakaiLogo = gagal || !src || src === LOGO || !tautanAman(src, { dataGambar: true });

  return (
    <img
      src={pakaiLogo ? LOGO : src}
      alt={alt}
      className={pakaiLogo ? logoClassName : className}
      onError={() => setGagal(true)}
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
    />
  );
};

export default CardImage;
