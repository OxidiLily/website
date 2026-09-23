import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { aiComplete, loadAiConfig } from '../../lib/ai';
import { PROMPT_PENULIS_BLOG, tugasArtikel, bersihkanKeluaranArtikel, promptRingkasan, bersihkanRingkasan } from '../../lib/blogWriter';
import { bahanDariSumber, promptKandidat, uraikanKandidat, type SumberRujukan } from '../../lib/riset';
import type { Field, Resource } from './resources';
import { slugify } from './resources';
import { ImageInput, inputClass } from './ImageInput';
import { IkonInput } from './IkonInput';
import { tautanIkon, slugIkon } from '../../lib/ikon';

// ImageInput dulu tinggal di berkas ini. Pemilih ikon dashboard (IkonInput) juga
// memakainya, dan dua modul yang saling mengimpor itu melingkar — jadi ia
// dipindah ke ImageInput.tsx, dan diteruskan dari sini supaya pemanggil lama
// (SettingsForm, SettingsView) tidak perlu diubah.
export { ImageInput } from './ImageInput';

const PAGE_SIZE = 10;

type Row = Record<string, any>;

/** Pesan Postgres/PostgREST → kalimat yang bisa ditindaklanjuti admin. */
function humanError(e: { code?: string; message?: string } | null): string {
  if (!e) return '';
  if (e.code === '23505') return 'Nilai unik (slug) sudah dipakai baris lain. Ubah slug-nya.';
  if (e.code === '23503') return 'Kategori yang dirujuk tidak ada.';
  if (e.code === '23514') return 'Nilai tidak lolos aturan tabel (panjang atau format).';
  if (e.code === '42501' || e.code === 'PGRST301') return 'Ditolak database: akun ini tidak berperan admin.';
  return e.message || 'Gagal.';
}

/**
 * Transkrip percakapan (`[{role, content}]`) → daftarnya; bentuk lain → null.
 *
 * Dikenali dari BENTUK datanya, bukan dari nama kolom atau flag baru di
 * resources.ts: bentuk itu memang kontraknya — AiAssistantModal yang menulis
 * barisnya, dan satu-satunya kolom yang berisi bentuk ini adalah
 * ai_chat_sessions.messages. Kolom larik lain di panel (tech_stack, tags)
 * berisi string, jadi tidak pernah lolos pemeriksaan ini.
 */
function transkrip(v: any): { role: string; content: string }[] | null {
  return Array.isArray(v) &&
    v.length > 0 &&
    v.every((m) => m && typeof m.role === 'string' && typeof m.content === 'string')
    ? v
    : null;
}

/** Nilai apa pun → teks yang bisa dibaca di panel detail. */
function detail(v: any): string {
  if (v === null || v === undefined || v === '') return '—';
  if (Array.isArray(v)) return v.every((x) => typeof x !== 'object') ? v.join(', ') : JSON.stringify(v, null, 2);
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
}

export const ResourceManager: React.FC<{ resource: Resource }> = ({ resource }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [refOptions, setRefOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [editing, setEditing] = useState<Row | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const listFields = useMemo(() => resource.fields.filter((f) => f.list), [resource]);
  const formFields = useMemo(() => resource.fields.filter((f) => f.form !== false), [resource]);
  const filterFields = useMemo(() => resource.fields.filter((f) => f.filter), [resource]);
  const refFields = useMemo(() => resource.fields.filter((f) => f.ref), [resource]);

  // Ganti resource = mulai bersih. Tanpa ini filter kategori blog ikut terbawa
  // ke halaman produk dan kuerinya menabrak kolom yang tidak ada.
  useEffect(() => {
    setPage(0);
    setQuery('');
    setFilters({});
    setExpanded(null);
    setEditing(null);
    setError('');
  }, [resource.table]);

  const selectString = useMemo(
    () => ['*', ...refFields.map((f) => `${f.ref!.table}(${f.ref!.label})`)].join(', '),
    [refFields],
  );

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from(resource.table)
      .select(selectString, { count: 'exact' })
      .order(resource.order.column, { ascending: resource.order.ascending })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (query.trim() && resource.search) q = q.ilike(resource.search, `%${query.trim()}%`);
    for (const [k, v] of Object.entries(filters)) if (v) q = q.eq(k, v);

    const { data, count, error: err } = await q;
    setError(err ? humanError(err) : '');
    setRows(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [resource, selectString, page, query, filters]);

  useEffect(() => {
    const t = setTimeout(load, query ? 300 : 0); // debounce hanya untuk ketikan
    return () => clearTimeout(t);
  }, [load, query]);

  useEffect(() => {
    if (!refFields.length) return;
    let alive = true;
    (async () => {
      const entries = await Promise.all(
        refFields.map(async (f) => {
          const { data } = await supabase
            .from(f.ref!.table)
            .select(`id, ${f.ref!.label}`)
            .order(f.ref!.label);
          return [
            f.name,
            (data ?? []).map((r: Row) => ({ value: String(r.id), label: String(r[f.ref!.label]) })),
          ] as const;
        }),
      );
      if (alive) setRefOptions(Object.fromEntries(entries));
    })();
    return () => {
      alive = false;
    };
  }, [refFields]);

  const save = async (form: Row) => {
    setBusy(true);
    setError('');

    let payload: Row = {};
    const metaBaru: Row = {};
    for (const f of formFields) {
      if (f.meta) metaBaru[f.name] = form[f.name];
      else payload[f.name] = form[f.name];
    }
    // Medan `meta` digabung dengan isi lama, bukan menimpa: baris warisan
    // menyimpan sections/topics di sana, dan menyunting ringkasan tidak boleh
    // menghapus isi artikelnya.
    if (Object.keys(metaBaru).length) payload.meta = { ...(editing?.meta ?? {}), ...metaBaru };
    if (resource.slugFrom && !String(payload.slug || '').trim()) {
      payload.slug = slugify(String(form[resource.slugFrom] || ''));
    }
    if (resource.beforeSave) payload = resource.beforeSave(payload);

    const { error: err } = editing?.id
      ? await supabase.from(resource.table).update(payload).eq('id', editing.id)
      : await supabase.from(resource.table).insert(payload);

    setBusy(false);
    if (err) {
      setError(humanError(err));
      return;
    }
    setEditing(null);
    load();
  };

  const remove = async (row: Row) => {
    if (!window.confirm(`Hapus "${row[listFields[0]?.name ?? 'id'] ?? row.id}"? Tindakan ini permanen.`)) return;
    const { error: err } = await supabase.from(resource.table).delete().eq('id', row.id);
    if (err) setError(humanError(err));
    else load();
  };

  const toggle = async (row: Row, name: string) => {
    const { error: err } = await supabase
      .from(resource.table)
      .update({ [name]: !row[name] })
      .eq('id', row.id);
    if (err) setError(humanError(err));
    else load();
  };

  const cell = (row: Row, f: Field) => {
    if (f.ref) return row[f.ref.table]?.[f.ref.label] ?? '—';
    if (f.type === 'boolean')
      return (
        <button
          onClick={() => toggle(row, f.name)}
          className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
            row[f.name]
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-neutral-800 border-neutral-700 text-neutral-400'
          }`}
        >
          {row[f.name] ? 'ya' : 'tidak'}
        </button>
      );
    if (f.type === 'select' && f.options)
      return f.options.find((o) => o.value === row[f.name])?.label ?? row[f.name] ?? '—';
    // Kolom ikon: yang dibaca admin dari tabel adalah ikonnya sendiri, bukan
    // penanda `dashboardicon:proxmox` — nilai itu ada di tooltip.
    if (f.type === 'ikon') {
      const tautan = tautanIkon(row[f.name]);
      if (!tautan) return '—';
      return (
        <span className="flex items-center gap-1.5" title={String(row[f.name] ?? '')}>
          <img src={tautan} alt="" className="w-4 h-4 object-contain" loading="lazy" />
          <span className="font-mono text-[10px] text-neutral-500">{slugIkon(row[f.name]) ?? 'gambar'}</span>
        </span>
      );
    }
    if (f.type === 'number' && f.name === 'price')
      return new Intl.NumberFormat('id-ID').format(Number(row[f.name] ?? 0));
    const v = row[f.name];
    if (v === null || v === undefined || v === '') return '—';
    return String(v).length > 60 ? `${String(v).slice(0, 60)}…` : String(v);
  };

  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-100">{resource.title}</h1>
          <p className="text-xs text-neutral-400 mt-1">{resource.subtitle}</p>
        </div>
        {resource.canCreate && (
          <button
            onClick={() => setEditing({})}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-100 text-neutral-900 text-xs font-semibold hover:bg-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {resource.search && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              value={query}
              onChange={(e) => {
                setPage(0);
                setQuery(e.target.value);
              }}
              placeholder="Cari…"
              className={`${inputClass} pl-9`}
            />
          </div>
        )}
        {filterFields.map((f) => (
          <select
            key={f.name}
            value={filters[f.name] ?? ''}
            onChange={(e) => {
              setPage(0);
              setFilters((p) => ({ ...p, [f.name]: e.target.value }));
            }}
            className={`${inputClass} w-auto`}
          >
            <option value="">Semua {f.label.toLowerCase()}</option>
            {(f.options ?? refOptions[f.name] ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/80 text-neutral-400">
              <tr>
                {listFields.map((f) => (
                  <th key={f.name} className="px-3 py-2.5 font-medium whitespace-nowrap">
                    {f.label}
                  </th>
                ))}
                <th className="px-3 py-2.5 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading && (
                <tr>
                  <td colSpan={listFields.length + 1} className="px-3 py-8 text-center text-neutral-500">
                    <Loader2 className="w-4 h-4 animate-spin inline" />
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={listFields.length + 1} className="px-3 py-8 text-center text-neutral-500">
                    Belum ada data.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-neutral-900/50 transition-colors">
                      {listFields.map((f) => (
                        <td key={f.name} className="px-3 py-2.5 text-neutral-200 align-top">
                          {cell(row, f)}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                          className="px-2 py-1 rounded text-neutral-400 hover:text-neutral-100 transition-colors"
                        >
                          Detail
                        </button>
                        {resource.canEdit && formFields.length > 0 && (
                          <button
                            onClick={() => setEditing(row)}
                            className="p-1.5 rounded text-neutral-400 hover:text-neutral-100 transition-colors"
                            aria-label="Ubah"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => remove(row)}
                          className="p-1.5 rounded text-red-400 hover:text-red-300 transition-colors"
                          aria-label="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                    {expanded === row.id && (
                      <tr className="bg-neutral-900/40">
                        <td colSpan={listFields.length + 1} className="px-3 py-3">
                          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
                            {resource.fields.map((f) => {
                              // Percakapan dibaca sebagai percakapan, bukan
                              // sebagai JSON mentah: siapa bicara apa, urut,
                              // dengan sisi yang membedakan pengunjung dari
                              // asisten. Gaya gelembungnya sama dengan modal di
                              // halaman publik supaya keduanya terbaca satu
                              // bahasa.
                              const chat = f.ref ? null : transkrip(row[f.name]);
                              if (chat) {
                                return (
                                  <div key={f.name} className="sm:col-span-2 flex flex-col gap-2">
                                    <dt className="text-neutral-500">{f.label}:</dt>
                                    <dd className="flex flex-col gap-2">
                                      {chat.map((m, i) => (
                                        <div
                                          key={i}
                                          className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                          <p
                                            className={`max-w-[82%] rounded-2xl px-3 py-2 leading-relaxed break-words whitespace-pre-wrap ${
                                              m.role === 'user'
                                                ? 'bg-neutral-100 text-neutral-900 font-medium rounded-tr-sm'
                                                : 'bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-tl-sm'
                                            }`}
                                          >
                                            {m.content}
                                          </p>
                                        </div>
                                      ))}
                                    </dd>
                                  </div>
                                );
                              }
                              return (
                                <div key={f.name} className="flex gap-2">
                                  <dt className="text-neutral-500 shrink-0">{f.label}:</dt>
                                  <dd className="text-neutral-200 break-words whitespace-pre-wrap">
                                    {f.ref ? row[f.ref.table]?.[f.ref.label] ?? '—' : detail(row[f.name])}
                                  </dd>
                                </div>
                              );
                            })}
                            <div className="flex gap-2">
                              <dt className="text-neutral-500 shrink-0">Dibuat:</dt>
                              <dd className="text-neutral-200">
                                {new Date(row.created_at).toLocaleString('id-ID')}
                              </dd>
                            </div>
                          </dl>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>
          {total} baris · halaman {page + 1} dari {lastPage + 1}
        </span>
        <div className="flex gap-1">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="p-1.5 rounded border border-neutral-800 disabled:opacity-30 hover:bg-neutral-900 transition-colors"
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="p-1.5 rounded border border-neutral-800 disabled:opacity-30 hover:bg-neutral-900 transition-colors"
            aria-label="Berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {editing && (
        <RowForm
          fields={formFields}
          aiGenerate={resource.aiGenerate}
          refOptions={refOptions}
          initial={editing}
          busy={busy}
          title={editing.id ? `Ubah ${resource.title}` : `Tambah ${resource.title}`}
          onCancel={() => setEditing(null)}
          onSubmit={save}
        />
      )}
    </div>
  );
};

const RowForm: React.FC<{
  fields: Field[];
  aiGenerate?: { from: string; to: string; ringkasan?: string };
  refOptions: Record<string, { value: string; label: string }[]>;
  initial: Row;
  busy: boolean;
  title: string;
  onCancel: () => void;
  onSubmit: (row: Row) => void;
}> = ({ fields, aiGenerate, refOptions, initial, busy, title, onCancel, onSubmit }) => {
  const [form, setForm] = useState<Row>(() => {
    const barisBaru = !initial.id;
    const f: Row = {};
    for (const fd of fields) {
      // `initial` kosong berarti tambah-baru: pakai defaultValue kalau field
      // itu punya, bukan false/'' yang diam-diam menyembunyikan baris baru.
      const v = (fd.meta ? initial.meta?.[fd.name] : initial[fd.name]) ?? (barisBaru ? fd.defaultValue : undefined);
      if (fd.type === 'boolean') f[fd.name] = v ?? false;
      else if (fd.type === 'list') f[fd.name] = Array.isArray(v) ? v.join(', ') : '';
      else f[fd.name] = v ?? '';
    }
    return f;
  });

  const set = (name: string, value: any) => setForm((p) => ({ ...p, [name]: value }));

  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState('');

  // Bahan rujukan TAMBAHAN dari admin, untuk sekali generate — SENGAJA tidak
  // ikut disimpan ke baris. Yang perlu dibaca publik adalah daftar sumber di
  // akhir artikel (dituntut oleh prompt), bukan bahan mentahnya; menyimpannya
  // berarti kolom baru di tabel `blogs` yang tidak pernah ditampilkan di mana
  // pun. Sumber utamanya sekarang datang dari riset otomatis di `/riset`.
  const [sumber, setSumber] = useState('');
  const [aiTahap, setAiTahap] = useState('');
  const [sumberDipakai, setSumberDipakai] = useState<SumberRujukan[]>([]);
  const [sumberDitolak, setSumberDitolak] = useState<{ url: string; tolak: string }[]>([]);

  // `cfg.systemPrompt` SENGAJA tidak dipakai di sini. Isinya persona asisten
  // chat publik (mis. "jawab dengan sesuai yang ada di website"); dulu ia
  // dipasang sebagai `cfg.systemPrompt || <instruksi penulis>`, sehingga begitu
  // admin mengisi persona itu instruksi penulisnya HILANG sama sekali. Yang
  // keluar lalu markdown pendek bergaya jawaban chat (`**Judul**`), bukan HTML
  // artikel — persis keluhan "tulisannya cuma sedikit". Penulis blog dan
  // asisten chat adalah dua peran berbeda, jadi promptnya juga dipisah.
  const generate = async () => {
    if (!aiGenerate) return;
    const topic = String(form[aiGenerate.from] || '').trim();
    if (!topic) return setAiErr(`Isi dulu "${aiGenerate.from}".`);
    setAiErr('');
    setSumberDipakai([]);
    setSumberDitolak([]);
    setAiBusy(true);
    try {
      const cfg = await loadAiConfig();
      if (!cfg.enabled) throw new Error('AI agent belum diaktifkan di Pengaturan.');

      // Tahap 1 — model MENGUSULKAN alamat, bukan menyimpulkan isinya. Usulan
      // yang salah tidak berbahaya di sini: yang menentukan bukan ingatan
      // model, melainkan halaman mana yang benar-benar berhasil diunduh.
      setAiTahap('Mencari alamat sumber…');
      const usul = await aiComplete(cfg, [{ role: 'user', content: promptKandidat(topic) }], {
        maxTokens: 700,
        // Suhu rendah: yang diminta alamat yang benar-benar ada, bukan variasi.
        temperature: 0.1,
      });

      // Tahap 2 — server menelusuri repositori resmi topik ini di GitHub,
      // mengunduh tiap alamat, dan MEMBUANG yang bukan sumber tepercaya atau
      // yang ternyata tidak bisa diunduh. Browser tidak bisa melakukannya
      // sendiri: halaman dokumentasi tidak mengirim header CORS untuk situs ini.
      setAiTahap('Mengunduh & memverifikasi sumber…');
      const res = await fetch('/riset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topik: topic, kandidat: uraikanKandidat(usul) }),
      });
      if (!res.ok) throw new Error(`Riset sumber gagal (HTTP ${res.status}).`);
      const { sumber: terverifikasi = [], ditolak = [] } = await res.json();
      setSumberDipakai(terverifikasi);
      setSumberDitolak(ditolak);

      // Tahap 3 — barulah menulis. Tanpa satu pun bahan, permintaannya
      // DIHENTIKAN, bukan dilanjutkan tanpa sumber: artikel yang ditulis dari
      // ingatan model persis yang membuat isinya meleset selama ini.
      const bahan = [bahanDariSumber(terverifikasi), sumber.trim()].filter(Boolean).join('\n\n———\n\n');
      if (!bahan) {
        throw new Error(
          'Tidak ada satu pun sumber tepercaya yang berhasil diunduh untuk topik ini. ' +
            'Tempel URL dokumentasi resminya (atau kutipan isinya) di kotak "Sumber rujukan", lalu ulangi.',
        );
      }

      setAiTahap(`Menulis artikel dari ${terverifikasi.length} sumber…`);
      const out = await aiComplete(cfg, [
        { role: 'system', content: PROMPT_PENULIS_BLOG },
        { role: 'user', content: tugasArtikel(topic, bahan) },
      ], { maxTokens: 8192 });
      const artikel = bersihkanKeluaranArtikel(out);
      set(aiGenerate.to, artikel);

      // Tahap 4 — satu kalimat pengantar, dari artikel yang BARU jadi (bukan
      // dari topik): tampil di bawah judul, di kartu, dan di hasil pencarian.
      if (aiGenerate.ringkasan) {
        setAiTahap('Menulis ringkasan…');
        const ringkas = await aiComplete(cfg, [{ role: 'user', content: promptRingkasan(topic, artikel) }], {
          maxTokens: 300,
          temperature: 0.3,
        });
        set(aiGenerate.ringkasan, bersihkanRingkasan(ringkas));
      }
    } catch (e: any) {
      setAiErr(e?.message ?? 'Gagal memanggil AI.');
    } finally {
      setAiTahap('');
      setAiBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const out: Row = {};
    for (const fd of fields) {
      const v = form[fd.name];
      if (fd.type === 'number')
        out[fd.name] = v === '' ? (fd.defaultValue ?? null) : Number(v);
      else if (fd.type === 'boolean') out[fd.name] = Boolean(v);
      else if (fd.type === 'list')
        out[fd.name] = String(v).split(',').map((s) => s.trim()).filter(Boolean);
      else if (fd.type === 'date') out[fd.name] = v === '' ? null : v;
      else out[fd.name] = v === '' ? null : v;
    }
    onSubmit(out);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 sm:p-8">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-5 sm:p-6 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-100">{title}</h2>
          <button type="button" onClick={onCancel} aria-label="Tutup" className="text-neutral-500 hover:text-neutral-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {fields.map((f) => {
            const wide = f.type === 'textarea' || f.type === 'image' || f.type === 'ikon';
            return (
              <label key={f.name} className={`flex flex-col gap-1.5 ${wide ? 'sm:col-span-2' : ''}`}>
                <span className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between gap-2">
                  <span>
                    {f.label}
                    {f.required && <span className="text-red-400"> *</span>}
                  </span>
                  {aiGenerate?.to === f.name && (
                    <button
                      type="button"
                      onClick={generate}
                      disabled={aiBusy}
                      className="px-2 py-1 rounded-md border border-neutral-700 text-[11px] font-medium text-neutral-300 hover:bg-neutral-900 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {aiBusy && <Loader2 className="w-3 h-3 animate-spin" />}
                      {aiBusy && aiTahap ? aiTahap : 'Generate dengan AI'}
                    </button>
                  )}
                </span>
                {aiGenerate?.to === f.name && aiErr && (
                  <span className="text-[11px] text-red-300">{aiErr}</span>
                )}
                {/* Daftar sumber yang benar-benar diunduh, beserta ALASAN tiap
                    alamat dianggap layak. Daftar sumber yang tidak bisa
                    dibantah sama saja dengan tidak punya daftar sumber — di
                    sinilah admin memeriksa apakah artikelnya berpijak pada
                    dokumentasi resmi atau pada halaman sembarangan. */}
                {aiGenerate?.to === f.name && sumberDipakai.length > 0 && (
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-2 space-y-1">
                    <div className="text-[10px] font-semibold text-neutral-300">
                      {sumberDipakai.length} sumber dipakai
                    </div>
                    {sumberDipakai.map((s) => (
                      <div key={s.url} className="text-[10px] text-neutral-400 leading-snug">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-blue-300 hover:underline break-all"
                        >
                          {s.judul || s.url}
                        </a>
                        <span className="text-neutral-500"> — {s.alasan}</span>
                      </div>
                    ))}
                  </div>
                )}
                {aiGenerate?.to === f.name && sumberDitolak.length > 0 && (
                  <details className="text-[10px] text-neutral-500">
                    <summary className="cursor-pointer">{sumberDitolak.length} alamat ditolak</summary>
                    <div className="mt-1 space-y-0.5">
                      {sumberDitolak.map((s) => (
                        <div key={s.url} className="break-all leading-snug">
                          {s.url} — {s.tolak}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                {/* Tanpa bahan rujukan, model menulis dari ingatannya sendiri —
                    itulah asal artikel yang terdengar meyakinkan tapi salah
                    versi, salah perintah, dan tanpa sumber yang bisa dicek.
                    Diisi URL dokumentasi resmi (dan kutipannya kalau ada),
                    isinya dirangkum jadi satu dan dicantumkan di bagian
                    "Sumber" di akhir artikel. aria-label dipasang sendiri karena
                    <label> di sekelilingnya sudah menamai medan isi artikel. */}
                {aiGenerate?.to === f.name && (
                  <>
                    <textarea
                      value={sumber}
                      onChange={(e) => setSumber(e.target.value)}
                      rows={3}
                      aria-label="Sumber rujukan untuk artikel yang akan dibuat AI"
                      placeholder={
                        'Sumber tambahan (opsional) — riset otomatis sudah jalan sendiri.\n' +
                        'Tempel di sini kalau ada halaman yang WAJIB dipakai, atau kalau\n' +
                        'sumbernya tidak bisa diunduh: kutipan isinya boleh ditempel apa adanya.'
                      }
                      className={`${inputClass} text-[11px] font-mono`}
                    />
                    <span className="text-[10px] text-neutral-500">
                      Generate akan mencari sendiri dokumentasi resmi dan penerbit tepercaya untuk
                      judul di atas, mengunduh halamannya, lalu merangkum HANYA dari isi yang
                      berhasil diunduh — dan mencantumkannya sebagai daftar &quot;Sumber&quot; di
                      akhir artikel. Kalau tidak ada satu pun sumber yang bisa diunduh, artikel
                      TIDAK ditulis; isi kotak ini lalu ulangi.
                    </span>
                  </>
                )}

                {f.type === 'ikon' ? (
                  <IkonInput
                    value={form[f.name] ?? ''}
                    onChange={(nilai) => set(f.name, nilai)}
                    // Nama barisnya dipakai untuk mengisi kotak pencarian saat
                    // pemilih dibuka; kolomnya tidak selalu bernama `name`.
                    nama={String(form.name ?? form.title ?? '')}
                  />
                ) : f.type === 'image' ? (
                  <ImageInput value={form[f.name] ?? ''} onChange={(url) => set(f.name, url)} />
                ) : f.type === 'textarea' ? (
                  <textarea
                    value={form[f.name] ?? ''}
                    onChange={(e) => set(f.name, e.target.value)}
                    required={f.required}
                    rows={8}
                    className={`${inputClass} font-mono`}
                  />
                ) : f.type === 'select' ? (
                  <select
                    value={form[f.name] ?? ''}
                    onChange={(e) => set(f.name, e.target.value)}
                    required={f.required}
                    className={inputClass}
                  >
                    <option value="">— pilih —</option>
                    {(f.options ?? refOptions[f.name] ?? []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === 'boolean' ? (
                  <input
                    type="checkbox"
                    checked={Boolean(form[f.name])}
                    onChange={(e) => set(f.name, e.target.checked)}
                    className="w-4 h-4 accent-neutral-200"
                  />
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    value={form[f.name] ?? ''}
                    onChange={(e) => set(f.name, e.target.value)}
                    required={f.required}
                    placeholder={f.placeholder}
                    className={inputClass}
                  />
                )}
              </label>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-neutral-700 text-xs text-neutral-300 hover:bg-neutral-900 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-neutral-100 text-neutral-900 text-xs font-semibold hover:bg-white disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Simpan
          </button>
        </div>
      </form>
    </div>
  );
};
