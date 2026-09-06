import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { defaultSettings } from '../../data/siteData';
import { ImageInput } from './ResourceManager';

export interface SettingField {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'image' | 'email' | 'url' | 'number';
  hint?: string;
}

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 ' +
  'placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors';

/**
 * Formulir untuk sekumpulan baris `settings`.
 *
 * Satu komponen ini dipakai kartu "Situs" di Pengaturan DAN semua penyunting
 * teks per-halaman — bentuknya sama persis (baca key/value, ubah, upsert),
 * jadi menuliskannya per halaman berarti enam salinan logika simpan yang harus
 * diperbaiki enam kali.
 *
 * `isPublic` ikut dikirim pada payload dengan sengaja: kolom itu default-nya
 * false demi kunci AI, jadi kunci teks halaman yang belum ada barisnya akan
 * tersimpan sebagai rahasia dan tak pernah terbaca pengunjung. Menyertakannya
 * membuat baris baru langsung terbit.
 */
export const SettingsForm: React.FC<{
  title: string;
  desc: string;
  fields: SettingField[];
  isPublic?: boolean;
}> = ({ title, desc, fields, isPublic = true }) => {
  const [value, setValue] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setMsg(null);
    supabase
      .from('settings')
      .select('key, value')
      .in('key', fields.map((f) => f.key))
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setMsg({ kind: 'err', text: error.message });

        // Kunci yang belum punya baris diisi dari defaultSettings, bukan
        // dibiarkan kosong. Halaman publik memakai nilai cadangan itu selama
        // barisnya belum ada, jadi medan kosong akan berbohong tentang apa
        // yang sedang tayang — dan menekan Simpan akan menulis '' ke seluruh
        // kunci, mengosongkan teks yang sebelumnya terlihat baik-baik saja.
        const dariDb = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value ?? '']));
        setValue(
          Object.fromEntries(
            fields.map((f) => [f.key, dariDb[f.key] ?? defaultSettings[f.key] ?? '']),
          ),
        );
        setLoading(false);
      });
    return () => {
      alive = false;
    };
    // Kunci yang diurus form ini menentukan apa yang dibaca; jadikan satu
    // string supaya pindah halaman memuat ulang, tapi render biasa tidak.
  }, [fields.map((f) => f.key).join(',')]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.from('settings').upsert(
      fields.map((f) => ({ key: f.key, value: value[f.key] ?? '', is_public: isPublic })),
      { onConflict: 'key' },
    );
    setBusy(false);
    setMsg(
      error
        ? {
            kind: 'err',
            text:
              error.code === '42501'
                ? 'Ditolak database: akun ini bukan admin.'
                : error.message,
          }
        : { kind: 'ok', text: 'Tersimpan. Muat ulang halaman publik untuk melihatnya.' },
    );
  };

  const set = (key: string, v: string) => setValue((p) => ({ ...p, [key]: v }));

  return (
    <form onSubmit={submit} className="rounded-xl border border-neutral-800 p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-neutral-100">{title}</h2>
        <p className="text-[11px] text-neutral-400 mt-0.5">{desc}</p>
      </div>

      {loading ? (
        <p className="text-[11px] text-neutral-500 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat…
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {fields.map((f) => {
            const wide = f.type === 'textarea' || f.type === 'image';
            return (
              <label key={f.key} className={`flex flex-col gap-1.5 ${wide ? 'sm:col-span-2' : ''}`}>
                <span className="text-[11px] font-semibold text-neutral-300">{f.label}</span>
                {f.type === 'image' ? (
                  <ImageInput value={value[f.key] ?? ''} onChange={(url) => set(f.key, url)} />
                ) : f.type === 'textarea' ? (
                  <textarea
                    value={value[f.key] ?? ''}
                    onChange={(e) => set(f.key, e.target.value)}
                    rows={4}
                    className={inputClass}
                  />
                ) : (
                  <input
                    type={f.type ?? 'text'}
                    value={value[f.key] ?? ''}
                    onChange={(e) => set(f.key, e.target.value)}
                    className={inputClass}
                  />
                )}
                {f.hint && <span className="text-[10px] text-neutral-500">{f.hint}</span>}
              </label>
            );
          })}
        </div>
      )}

      {msg && (
        <p
          className={`text-[11px] px-3 py-2 rounded-lg border ${
            msg.kind === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {msg.text}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || loading}
        className="self-start px-4 py-2 rounded-lg bg-neutral-100 text-neutral-900 text-xs font-semibold hover:bg-white disabled:opacity-60 transition-colors flex items-center gap-2"
      >
        {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Simpan
      </button>
    </form>
  );
};

/** Semua kartu penyunting satu halaman publik, ditumpuk dalam satu tampilan. */
export const PageEditorView: React.FC<{
  editor: { title: string; subtitle: string; cards: { title: string; desc: string; fields: SettingField[] }[] };
}> = ({ editor }) => (
  <div className="flex flex-col gap-5 max-w-3xl">
    <div>
      <h1 className="text-xl font-bold text-neutral-100">{editor.title}</h1>
      <p className="text-xs text-neutral-400 mt-1">{editor.subtitle}</p>
    </div>
    {editor.cards.map((c) => (
      <SettingsForm key={c.title} title={c.title} desc={c.desc} fields={c.fields} />
    ))}
  </div>
);
