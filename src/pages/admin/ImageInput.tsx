import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/** Gaya input bersama panel admin. */
export const inputClass =
  'w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 ' +
  'placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors';

/**
 * Unggah gambar ke bucket Supabase Storage `media`, simpan jalan relatifnya ke
 * kolom teks. Bucket public-read; tulis dibatasi policy `media_admin_write`
 * (bucket_id='media' AND public.is_admin()), jadi pengunjung tidak bisa
 * menitipkan berkas walau tahu endpoint-nya.
 *
 * Berkas ini dipisah dari ResourceManager karena dipakai juga oleh pemilih ikon
 * dashboard (IkonInput) — kalau keduanya saling mengimpor, modulnya melingkar.
 */
export const ImageInput: React.FC<{ value: string; onChange: (url: string) => void }> = ({ value, onChange }) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setErr('');
    if (!file.type.startsWith('image/')) return setErr('Berkas harus gambar.');
    if (file.size > 5 * 1024 * 1024) return setErr('Maksimal 5 MB.');

    setBusy(true);
    // Nama diacak: nama asli bisa mengandung spasi/unicode dan bisa bentrok.
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type,
    });
    setBusy(false);
    if (error) return setErr(error.message.includes('row-level security') ? 'Ditolak: akun ini bukan admin.' : error.message);
    // Yang DISIMPAN adalah jalur relatif-akar, bukan URL lengkap. `getPublicUrl`
    // mengembalikan alamat berisi origin yang kebetulan dipakai admin saat
    // mengunggah; kalau itu yang masuk database, gambarnya rusak bagi siapa pun
    // yang membuka situs lewat origin lain — persis cacat yang baru diperbaiki
    // pada pemanggilan API. Jalur relatif ikut origin pembacanya sendiri.
    const publik = supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
    onChange(new window.URL(publik).pathname);
  };

  return (
    <div className="flex flex-col gap-2">
      {value && (
        <img src={value} alt="" className="h-24 w-auto rounded-lg border border-neutral-700 object-cover" />
      )}
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => pick(e.target.files?.[0])}
          disabled={busy}
          className="text-[11px] text-neutral-400 file:mr-2 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-neutral-800 file:text-neutral-200 file:text-[11px] file:cursor-pointer"
        />
        {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />}
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-[11px] text-red-400 hover:text-red-300">
            Hapus
          </button>
        )}
      </div>
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="atau tempel URL gambar"
        className={inputClass}
      />
      {err && <p className="text-[11px] text-red-300">{err}</p>}
    </div>
  );
};
