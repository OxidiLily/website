import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Search, X } from 'lucide-react';
import { JALUR_CARI_IKON, labelIkon, nilaiIkon, slugIkon, tautanIkon, type HasilCariIkon } from '../../lib/ikon';
import { ImageInput, inputClass } from './ImageInput';

/**
 * Pemilih ikon dari dashboardicons.com untuk kolom `icon` di panel.
 *
 * Yang disimpan ke database adalah penanda `dashboardicon:<slug>`, bukan URL.
 * Alasannya di kepala src/lib/ikon.ts: origin situs ini bisa berbeda-beda
 * (LAN vs Tailscale), dan URL absolut di database akan rusak bagi pembaca dari
 * origin lain. Berkas SVG-nya sendiri disajikan server ini dari /ikon/svg/... —
 * diambil sekali dari dashboard-icons lalu di-cache.
 *
 * Kolom yang sudah berisi gambar unggahan tetap ditampilkan apa adanya, dan
 * unggahan tetap bisa dipakai: ikon dashboard tidak punya semua merek (Cursor,
 * Astro, dan Bun tidak ada di sana), jadi jalan itu tidak boleh ditutup.
 */
export const IkonInput: React.FC<{ value: string; onChange: (nilai: string) => void; nama?: string }> = ({
  value,
  onChange,
  nama,
}) => {
  const [buka, setBuka] = useState(false);
  const [q, setQ] = useState('');
  const [hasil, setHasil] = useState<HasilCariIkon[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState('');
  const batal = useRef<AbortController | null>(null);

  // ── Isi otomatis dari nama baris ─────────────────────────────────────────
  // Kalau nama barisnya persis ada di katalog dashboard-icons (mis. "7zip"),
  // kolom ikon diisi sendiri supaya yang tersimpan bukan "tidak ada ikon".
  // Syaratnya ketat: HARUS kecocokan persis, tidak boleh tebakan mirip-mirip —
  // ikon yang salah lebih buruk daripada ikon kosong.
  const [otomatis, setOtomatis] = useState('');
  const nilaiKini = useRef(value);
  const ditolakAdmin = useRef(false);

  useEffect(() => {
    nilaiKini.current = value;
  });

  useEffect(() => {
    if (!nama) return;
    // Nama berganti (baris lain dibuka) → percobaan baru lagi; pengosongan
    // manual oleh admin hanya berlaku untuk nama yang sedang dibuka.
    ditolakAdmin.current = false;
    const ac = new AbortController();
    // Jeda kecil: nama baris baru diketik per huruf, dan satu permintaan per
    // huruf itu pemborosan yang tidak menghasilkan apa-apa.
    const jeda = setTimeout(async () => {
      try {
        const res = await fetch(`${JALUR_CARI_IKON}?q=${encodeURIComponent(nama)}&batas=1`, {
          signal: ac.signal,
          headers: { accept: 'application/json' },
        });
        if (!res.ok) return;
        const data = await res.json();
        const tepat: HasilCariIkon | undefined = Array.isArray(data?.hasil)
          ? data.hasil.find((h: HasilCariIkon) => h.persis)
          : undefined;
        // Dua penjaga: kolomnya masih kosong, dan admin belum mengosongkannya sendiri.
        if (tepat && !nilaiKini.current && !ditolakAdmin.current) {
          onChange(nilaiIkon(tepat.slug));
          setOtomatis(tepat.slug);
        }
      } catch {
        // Server tidak menjawab atau katalognya belum dibangun: kolom dibiarkan
        // kosong. Ini bukan galat yang perlu ditampilkan ke admin.
      }
    }, 250);
    return () => {
      clearTimeout(jeda);
      ac.abort();
    };
    // sengaja hanya `nama`: percobaan ulang terjadi saat nama barisnya berganti
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nama]);

  /** Pilihan dari admin sendiri — menghentikan penandaan "otomatis". */
  const pilihIkon = (nilai: string) => {
    ditolakAdmin.current = nilai === '';
    setOtomatis('');
    onChange(nilai);
  };

  const slug = slugIkon(value);
  const tautan = tautanIkon(value);

  // Kotak pencarian diisi nama barisnya saat pemilih pertama dibuka: hampir
  // selalu itu yang dicari, dan mengetik ulang "Proxmox" hanya karena panel
  // tidak mau menebak jelas bukan bantuan.
  useEffect(() => {
    if (buka && !q && nama) setQ(nama);
    // sengaja tanpa `q`: mengisi otomatis hanya sekali, saat pemilih dibuka
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buka, nama]);

  useEffect(() => {
    if (!buka) return;
    const jeda = setTimeout(async () => {
      batal.current?.abort();
      const ac = new AbortController();
      batal.current = ac;
      setMemuat(true);
      try {
        const res = await fetch(`${JALUR_CARI_IKON}?q=${encodeURIComponent(q)}&batas=48`, {
          signal: ac.signal,
          headers: { accept: 'application/json' },
        });
        if (!res.ok) {
          throw new Error(
            res.status === 503
              ? 'Katalog ikon belum dibangun di server ini (node scripts/ikon-katalog.mjs).'
              : `Pencarian ikon gagal (HTTP ${res.status}).`,
          );
        }
        const data = await res.json();
        setHasil(Array.isArray(data?.hasil) ? data.hasil : []);
        setGalat('');
      } catch (e: any) {
        // Permintaan yang dibatalkan bukan kegagalan: itu permintaan yang sudah
        // digantikan ketikan berikutnya.
        if (e?.name !== 'AbortError') {
          setGalat(e?.message ?? 'Gagal memuat daftar ikon.');
          setHasil([]);
        }
      } finally {
        setMemuat(false);
      }
    }, 220);
    return () => clearTimeout(jeda);
  }, [q, buka]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="w-10 h-10 shrink-0 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center">
          {tautan ? (
            <img src={tautan} alt="" className="w-6 h-6 object-contain" loading="lazy" />
          ) : (
            <span className="text-[10px] text-neutral-500">—</span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          {slug ? (
            <p className="text-[11px] text-neutral-300 truncate">
              {labelIkon(slug)} <span className="font-mono text-neutral-500">({slug})</span>
            </p>
          ) : value ? (
            <p className="text-[11px] text-neutral-400 truncate">Gambar sendiri: <span className="font-mono">{value}</span></p>
          ) : (
            <p className="text-[11px] text-neutral-500">
              Belum dipilih — ikon dari dashboardicons diisi sendiri kalau nama barisnya ada di
              katalog (mis. <span className="font-mono">7zip</span>); kalau tidak ada, ikon merek
              bawaan yang dipakai untuk nama yang dikenali.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setBuka((v) => !v)}
          className="px-2.5 py-1.5 rounded-lg border border-neutral-700 text-[11px] text-neutral-200 hover:bg-neutral-900 flex items-center gap-1.5 shrink-0"
        >
          {buka ? <X className="w-3 h-3" /> : <Search className="w-3 h-3" />}
          {buka ? 'Tutup' : 'Pilih ikon'}
        </button>
        {value && (
          <button type="button" onClick={() => pilihIkon('')} className="text-[11px] text-red-400 hover:text-red-300 shrink-0">
            Hapus
          </button>
        )}
      </div>

      {value && otomatis === slug && (
        <p className="text-[10px] text-amber-300/90">
          Ikon diisi otomatis dari nama baris ini (dashboardicons).{' '}
          <button type="button" onClick={() => pilihIkon('')} className="underline hover:text-amber-200">
            Kosongkan
          </button>{' '}
          atau pilih yang lain bila tidak sesuai.
        </p>
      )}

      {buka && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-2.5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari ikon: docker, proxmox, nextcloud…"
              aria-label="Cari ikon dashboard-icons"
              className={inputClass}
            />
            {memuat && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400 shrink-0" />}
          </div>

          {galat && <p className="text-[11px] text-red-300">{galat}</p>}

          {!galat && hasil.length === 0 && !memuat && (
            <p className="text-[11px] text-neutral-500">
              Tidak ada ikon yang cocok. Coba kata lain, atau unggah gambar sendiri di bawah.
            </p>
          )}

          {!galat && hasil.length > 0 && (
            <>
              <p className="text-[10px] text-neutral-500">
                {hasil.length} ikon{q ? ` untuk “${q}”` : ' (semua, terurut abjad)'} · sumber: dashboardicons.com
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-64 overflow-y-auto pr-0.5">
                {hasil.map((h) => {
                  const terpilih = h.slug === slug;
                  return (
                    <button
                      key={h.slug}
                      type="button"
                      title={`${h.label} (${h.slug})${h.kategori.length ? ` — ${h.kategori.join(', ')}` : ''}`}
                      aria-label={`Pilih ikon ${h.label}`}
                      aria-pressed={terpilih}
                      onClick={() => pilihIkon(nilaiIkon(h.slug))}
                      className={`relative flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-colors ${
                        terpilih
                          ? 'border-amber-400/60 bg-amber-400/10'
                          : 'border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900'
                      }`}
                    >
                      <img src={tautanIkon(nilaiIkon(h.slug)) ?? ''} alt="" className="w-6 h-6 object-contain" loading="lazy" />
                      <span className="text-[9px] leading-tight text-neutral-400 truncate w-full text-center">
                        {h.label}
                      </span>
                      {terpilih && <Check className="w-3 h-3 text-amber-300 absolute top-0.5 right-0.5" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      <details className="text-[11px] text-neutral-400">
        <summary className="cursor-pointer hover:text-neutral-200">Pakai gambar sendiri (unggah / URL)</summary>
        <div className="mt-2">
          <ImageInput value={slug ? '' : value} onChange={onChange} />
        </div>
      </details>
      {value && slug && (
        <p className="text-[10px] text-neutral-500">
          Nilai tersimpan: <span className="font-mono">{value}</span>
        </p>
      )}
    </div>
  );
};
