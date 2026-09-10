import React, { useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { barisToken, labelBahasa, tebakBahasa } from '../lib/kode';
import { pilihTeks, salinTeks } from '../lib/salin';

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
  const [status, setStatus] = useState<'' | 'ok' | 'gagal'>('');
  const isiRef = useRef<HTMLElement>(null);
  // Artikel lama tidak menandai bahasanya sama sekali; hampir semuanya perintah
  // terminal, jadi ditebak dari isinya daripada tampil tanpa warna.
  const lidah = tebakBahasa(kode, bahasa);
  const baris = barisToken(kode, lidah);
  const label = labelBahasa(lidah, berkas);
  const judul = berkas || (lidah === 'bash' ? 'Terminal' : label.toLowerCase());

  // Kegagalan TIDAK ditelan diam-diam lagi. Situs ini dibuka lewat alamat LAN
  // tanpa TLS, dan di sana `navigator.clipboard` tidak ada sama sekali; dulu
  // yang terlihat pengguna cuma tombol yang tidak melakukan apa pun. Sekarang
  // ada jalur cadangan, dan kalau itu pun ditolak browser, kodenya dipilihkan
  // supaya Ctrl+C tetap bisa dipakai.
  const salin = async () => {
    const berhasil = await salinTeks(kode);
    if (!berhasil) pilihTeks(isiRef.current);
    setStatus(berhasil ? 'ok' : 'gagal');
    setTimeout(() => setStatus(''), berhasil ? 1800 : 3500);
  };

  return (
    <figure className="blok-kode">
      <figcaption className="blok-kode-kepala">
        <span className="blok-kode-lencana">{label}</span>
        <span className="blok-kode-berkas">{judul}</span>
        {status === 'gagal' && <span className="blok-kode-pesan">tekan Ctrl+C</span>}
        <button
          type="button"
          onClick={salin}
          title={status === 'ok' ? 'Kode tersalin' : 'Salin kode'}
          aria-label={status === 'ok' ? 'Kode tersalin' : 'Salin kode'}
          className="blok-kode-salin"
        >
          {status === 'ok' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </figcaption>

      <div className="blok-kode-isi">
        <pre>
          <code ref={isiRef}>
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
