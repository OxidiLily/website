import React, { useEffect, useState } from 'react';
import { Loader2, Bot } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AI_KEYS, aiComplete, cspAllowsOrigin, loadAiConfig, type AiConfig } from '../../lib/ai';
import { ImageInput } from './ResourceManager';
import { SettingsForm } from './SettingsForm';
import { SITE_KEYS } from './pageContent';

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 ' +
  'placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors';

// Kunci mengikuti SettingsController::updateSite di repo acuan.


const Card: React.FC<{ title: string; desc: string; children: React.ReactNode }> = ({ title, desc, children }) => (
  <section className="rounded-xl border border-neutral-800 p-5 flex flex-col gap-4">
    <div>
      <h2 className="text-sm font-semibold text-neutral-100">{title}</h2>
      <p className="text-[11px] text-neutral-400 mt-0.5">{desc}</p>
    </div>
    {children}
  </section>
);

const Note: React.FC<{ msg: { kind: 'ok' | 'err'; text: string } | null }> = ({ msg }) =>
  msg ? (
    <p
      className={`text-[11px] px-3 py-2 rounded-lg border ${
        msg.kind === 'ok'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-red-500/10 border-red-500/30 text-red-300'
      }`}
    >
      {msg.text}
    </p>
  ) : null;

export const SettingsView: React.FC<{
  email: string;
  name: string;
  onNameChange: (n: string) => void;
  avatar: string;
  onAvatarChange: (url: string) => void;
}> = ({ email, name, onNameChange, avatar, onAvatarChange }) => {
  const [profileName, setProfileName] = useState(name);
  const [profileAvatar, setProfileAvatar] = useState(avatar);
  const [profileMsg, setProfileMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwMsg, setPwMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const [ai, setAi] = useState<AiConfig | null>(null);
  const [aiMsg, setAiMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);


  useEffect(() => {
    loadAiConfig().then(setAi).catch(() => setAi(null));
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileBusy(true);
    const { data: u } = await supabase.auth.getUser();
    // avatar_url dikirim sebagai null saat dikosongkan, bukan string kosong:
    // kolomnya nullable dan '' akan lolos sebagai "ada foto" di pengecekan
    // mana pun yang cuma melihat apakah kolomnya terisi.
    const { error } = await supabase
      .from('profiles')
      .update({ name: profileName, avatar_url: profileAvatar || null })
      .eq('id', u.user!.id);
    setProfileBusy(false);
    setProfileMsg(error ? { kind: 'err', text: error.message } : { kind: 'ok', text: 'Profil tersimpan.' });
    if (!error) {
      onNameChange(profileName);
      onAvatarChange(profileAvatar);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (next.length < 8) return setPwMsg({ kind: 'err', text: 'Password baru minimal 8 karakter.' });
    if (next !== confirm) return setPwMsg({ kind: 'err', text: 'Konfirmasi password tidak cocok.' });

    setPwBusy(true);
    // Verifikasi password lama dengan benar-benar memakainya untuk login ulang.
    // Memeriksanya di sisi klien tidak membuktikan apa pun.
    const { error: reauth } = await supabase.auth.signInWithPassword({ email, password: current });
    if (reauth) {
      setPwBusy(false);
      return setPwMsg({ kind: 'err', text: 'Password saat ini salah.' });
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setPwBusy(false);
    if (error) return setPwMsg({ kind: 'err', text: error.message });
    setCurrent('');
    setNext('');
    setConfirm('');
    setPwMsg({ kind: 'ok', text: 'Password diperbarui.' });
  };

  const saveAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ai) return;
    setAiBusy(true);
    const rows = [
      { key: 'ai_enabled', value: ai.enabled ? '1' : '0' },
      { key: 'ai_endpoint', value: ai.endpoint },
      { key: 'ai_api_key', value: ai.apiKey },
      { key: 'ai_model', value: ai.model },
      { key: 'ai_system_prompt', value: ai.systemPrompt },
      { key: 'ai_greeting', value: ai.greeting },
    ];
    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
    setAiBusy(false);
    setAiMsg(
      error
        ? { kind: 'err', text: error.code === '42501' ? 'Ditolak database: akun ini bukan admin.' : error.message }
        : { kind: 'ok', text: 'Pengaturan AI tersimpan.' },
    );
  };

  const testAi = async () => {
    if (!ai) return;
    setAiTesting(true);
    setAiMsg(null);
    try {
      const reply = await aiComplete(ai, [{ role: 'user', content: 'Balas satu kata: OK' }], { maxTokens: 16 });
      setAiMsg({ kind: 'ok', text: `Terhubung. Balasan model: ${reply.trim().slice(0, 80)}` });
    } catch (err: any) {
      setAiMsg({ kind: 'err', text: err?.message ?? 'Gagal.' });
    } finally {
      setAiTesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-100">Pengaturan</h1>
        <p className="text-xs text-neutral-400 mt-1">Profil admin, password, dan konfigurasi situs.</p>
      </div>

      <Card title="Profil" desc="Email adalah identitas login dan diubah lewat Supabase Auth, bukan di sini.">
        <form onSubmit={saveProfile} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-neutral-300">Email</span>
            <input value={email} readOnly className={`${inputClass} opacity-60`} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-neutral-300">Nama</span>
            <input value={profileName} onChange={(e) => setProfileName(e.target.value)} className={inputClass} required />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-neutral-300">Foto profil</span>
            <ImageInput value={profileAvatar} onChange={setProfileAvatar} />
            <span className="text-[10px] text-neutral-500">
              Unggah, tempel URL, atau tekan Hapus untuk mengosongkan — lalu tekan Simpan profil.
              Kosong → logo situs yang dipakai.
            </span>
          </div>
          <Note msg={profileMsg} />
          <button
            type="submit"
            disabled={profileBusy}
            className="self-start px-4 py-2 rounded-lg bg-neutral-100 text-neutral-900 text-xs font-semibold hover:bg-white disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {profileBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Simpan profil
          </button>
        </form>
      </Card>

      <Card title="Ganti password" desc="Password lama diverifikasi ke server dengan login ulang.">
        <form onSubmit={savePassword} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-neutral-300">Password saat ini</span>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
              className={inputClass}
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-neutral-300">Password baru</span>
              <input
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-neutral-300">Ulangi password baru</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className={inputClass}
              />
            </label>
          </div>
          <Note msg={pwMsg} />
          <button
            type="submit"
            disabled={pwBusy}
            className="self-start px-4 py-2 rounded-lg bg-neutral-100 text-neutral-900 text-xs font-semibold hover:bg-white disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {pwBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Ganti password
          </button>
        </form>
      </Card>

      <Card
        title="AI Agent"
        desc="Endpoint OpenAI-compatible (9router, OpenAI, DeepSeek, gateway lokal). Kunci disimpan di tabel settings yang hanya bisa dibaca admin."
      >
        {!ai ? (
          <p className="text-[11px] text-neutral-500">Memuat…</p>
        ) : (
          <form onSubmit={saveAi} className="flex flex-col gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={ai.enabled}
                onChange={(e) => setAi({ ...ai, enabled: e.target.checked })}
                className="w-4 h-4 accent-neutral-200"
              />
              <span className="text-[11px] font-semibold text-neutral-300">Aktifkan AI agent</span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-neutral-300">Endpoint</span>
              <input
                value={ai.endpoint}
                onChange={(e) => setAi({ ...ai, endpoint: e.target.value })}
                placeholder="/ai/v1/chat/completions"
                className={inputClass}
              />
              <span className="text-[11px] text-neutral-500">
                Pakai jalur proxy <code>/ai/v1/chat/completions</code> — situs meneruskannya ke
                origin di <code>VITE_AI_ORIGIN</code>. URL langsung ke gateway hanya bekerja
                kalau gateway itu menjawab preflight CORS; 9router tidak.
              </span>
            </label>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-neutral-300">API key</span>
                <input
                  type="password"
                  value={ai.apiKey}
                  onChange={(e) => setAi({ ...ai, apiKey: e.target.value })}
                  autoComplete="off"
                  placeholder="sk-…"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-neutral-300">Model</span>
                <input
                  value={ai.model}
                  onChange={(e) => setAi({ ...ai, model: e.target.value })}
                  placeholder="gpt-4o-mini"
                  className={inputClass}
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-neutral-300">System prompt</span>
              <textarea
                value={ai.systemPrompt}
                onChange={(e) => setAi({ ...ai, systemPrompt: e.target.value })}
                rows={3}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-neutral-300">Sapaan pembuka</span>
              <input
                value={ai.greeting}
                onChange={(e) => setAi({ ...ai, greeting: e.target.value })}
                className={inputClass}
              />
            </label>

            {ai.endpoint && !cspAllowsOrigin(ai.endpoint) && (
              <p className="text-[11px] px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200">
                Origin endpoint ini belum diizinkan Content-Security-Policy. Pakai jalur proxy
                <code className="mx-1">/ai/v1/chat/completions</code>, atau tambahkan origin-nya ke
                <code className="mx-1">VITE_AI_ORIGIN</code> di <code>.env</code> lalu build ulang.
              </p>
            )}

            <Note msg={aiMsg} />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={aiBusy}
                className="px-4 py-2 rounded-lg bg-neutral-100 text-neutral-900 text-xs font-semibold hover:bg-white disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {aiBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Simpan AI
              </button>
              <button
                type="button"
                onClick={testAi}
                disabled={aiTesting || !ai.endpoint || !ai.apiKey}
                className="px-4 py-2 rounded-lg border border-neutral-700 text-xs text-neutral-200 hover:bg-neutral-900 disabled:opacity-40 transition-colors flex items-center gap-2"
              >
                {aiTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                Uji koneksi
              </button>
            </div>

            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Panggilan AI berangkat dari browser admin; server penyaji hanya meneruskan jalur
              <code className="mx-1">/ai/*</code> tanpa menyentuh kuncinya.
              Kunci tidak pernah terbaca pengunjung (RLS menutup tabel <code>settings</code> untuk anon),
              tapi tetap sampai ke browser admin. Asisten AI di halaman publik sengaja TIDAK memakai kunci ini.
            </p>
          </form>
        )}
      </Card>

      <SettingsForm
        title="Situs"
        desc="Identitas dasar yang dipakai beberapa halaman sekaligus. Teks per-halaman ada di menu Halaman."
        fields={SITE_KEYS.map(({ key, label, type }) => ({ key, label, type: type as any }))}
      />
    </div>
  );
};
