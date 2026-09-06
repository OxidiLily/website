import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft, Loader2, Lock } from 'lucide-react';
import { PageId } from '../types';
import { fetchRole, supabase } from '../lib/supabase';

interface AdminLoginPageProps {
  onLoginSuccess: (user: { email: string; name: string }) => void;
  onNavigate?: (page: PageId) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error || !data.user) {
      setIsLoading(false);
      // Pesan sengaja seragam: membedakan "email tidak ada" dari "password
      // salah" memberi tahu penyerang akun mana yang nyata.
      setErrorMessage(
        error?.status === 429
          ? 'Terlalu banyak percobaan. Tunggu sebentar.'
          : 'Email atau password salah.',
      );
      return;
    }

    // Pendaftaran terbuka di instance ini, jadi "berhasil login" belum berarti
    // berhak. Peran dicek lagi di sisi database lewat RLS; ini supaya panel
    // tidak terbuka kosong untuk akun biasa.
    const role = await fetchRole(data.user.id);
    if (role !== 'admin') {
      await supabase.auth.signOut();
      setIsLoading(false);
      setErrorMessage('Akun ini tidak berperan admin.');
      return;
    }

    setIsLoading(false);
    onLoginSuccess({
      email: data.user.email ?? email,
      name: (data.user.user_metadata?.name as string) ?? (data.user.email ?? '').split('@')[0],
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-20">
        <button
          onClick={() => onNavigate && onNavigate('home')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/90 text-neutral-600 hover:text-neutral-900 border border-neutral-200 shadow-xs backdrop-blur-md transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke situs</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[390px] bg-white rounded-2xl border border-neutral-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-7 sm:p-8 flex flex-col relative z-10"
      >
        <div className="flex items-center justify-center gap-2.5 mb-1">
          <div className="w-6 h-6 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-black fill-current" aria-hidden="true">
              <path d="M12 1.5L2.5 7v10L12 22.5l9.5-5.5V7L12 1.5zm0 2.3l6.5 3.77-2.3 1.33-6.5-3.77L12 3.8zM4.5 8.17l6.5 3.77v6.86l-6.5-3.77V8.17zm8.5 10.63v-6.86l6.5-3.77v6.86L13 18.8z" />
            </svg>
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-neutral-900">OxidiLily</span>
        </div>
        <p className="text-center text-[11px] text-neutral-500 mb-6">Masuk ke panel admin</p>

        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-email" className="text-xs font-semibold text-neutral-800 text-left">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@domain.com"
              autoComplete="username"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 text-xs sm:text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="admin-password" className="text-xs font-semibold text-neutral-800 text-left">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 text-xs sm:text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Masuk</span>}
          </button>
        </form>

        <p className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-1 text-[11px] text-neutral-500">
          <Lock className="w-3 h-3 text-neutral-400" />
          Akses dibatasi akun berperan admin.
        </p>
      </motion.div>
    </div>
  );
};
