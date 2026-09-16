import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export function ChangeInitialPassword({ onChanged }: { onChanged: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 12 || password !== confirm) {
      setError('Minimal 12 karakter; kedua kata sandi harus sama.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await supabase.auth.updateUser({ password });
      if (result.error) throw result.error;
      const { data, error: verifyError } = await supabase.auth.getUser();
      if (verifyError || !data.user || data.user.app_metadata.require_password_change !== false) {
        throw new Error('Belum terverifikasi');
      }
      setPassword(''); setConfirm('');
      onChanged();
    } catch {
      setError('Penggantian belum terverifikasi. Gunakan kata sandi berbeda dari kata sandi awal; periksa migrasi Supabase jika tetap gagal.');
    } finally { setBusy(false); }
  }
  return <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-6">
    <form onSubmit={submit} className="w-full max-w-sm space-y-4">
      <h1 className="text-xl font-bold">Ganti kata sandi awal</h1>
      <p>Panel admin terkunci sampai kata sandi baru tersimpan.</p>
      <label className="block">Kata sandi baru
        <input className="block w-full p-2 text-black bg-white" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)} />
      </label>
      <label className="block">Ulangi kata sandi baru
        <input className="block w-full p-2 text-black bg-white" type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={e => setConfirm(e.target.value)} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button disabled={busy} className="border rounded p-2 disabled:opacity-50">{busy ? 'Menyimpan…' : 'Simpan kata sandi baru'}</button>
      <button type="button" disabled={busy} className="ml-4" onClick={() => supabase.auth.signOut()}>Keluar</button>
    </form>
  </main>;
}
