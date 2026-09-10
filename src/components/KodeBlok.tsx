import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { barisToken, labelBahasa, tebakBahasa } from '../lib/kode';

/**
 * Satu blok kode di dalam artikel, digambar sebagai kartu terang.
 *
 * Sengaja terang di halaman yang gelap: cuplikan kode dibaca beda dari prosa di
 * sekitarnya, dan kontras itu yang membuatnya langsung terlihat sebagai kode,
 * bukan sebagai paragraf berlatar sedikit lain.
 */
export const KodeBlok: React.FC<{ kode: string; bahasa?: string; berkas?: string }> = ({
  kode,
  bahasa = '',
  berkas = '',
}) => {
  const [tersalin, setTersalin] = useState(false);
  // Artikel lama tidak menandai bahasanya sama sekali; hampir semuanya perintah
  // terminal, jadi ditebak dari isinya daripada tampil tanpa warna.
  const lidah = tebakBahasa(kode, bahasa);
  const baris = barisToken(kode, lidah);
  const label = labelBahasa(lidah, berkas);
  const judul = berkas || (lidah === 'bash' ? 'Terminal' : label.toLowerCase());

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(kode);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 1800);
    } catch {
      // Clipboard ditolak (konteks tak aman / izin) — kodenya tetap bisa
      // diblok dan disalin manual, jadi tidak perlu pesan galat.
    }
  };

  return (
    <figure className="blok-kode">
      <figcaption className="blok-kode-kepala">
        <span className="blok-kode-lencana">{label}</span>
        <span className="blok-kode-berkas">{judul}</span>
        <button
          type="button"
          onClick={salin}
          aria-label={tersalin ? 'Kode tersalin' : 'Salin kode'}
          className="blok-kode-salin"
        >
          {tersalin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </figcaption>

      <div className="blok-kode-isi">
        <pre>
          <code>
            {baris.map((t, i) => (
              <span key={i} className="blok-kode-baris">
                <span className="blok-kode-nomor" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="blok-kode-teks">
                  {t.map((tok, j) => (
                    <span key={j} className={`tok-${tok.jenis}`}>
                      {tok.teks}
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </figure>
  );
};

export default KodeBlok;
