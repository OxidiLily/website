import React, { useEffect, useState } from 'react';
import { PageId } from '../../types';
import { fetchProfile, supabase } from '../../lib/supabase';
import { AdminLoginPage } from '../AdminLoginPage';
import { DashboardPage } from '../DashboardPage';

type Admin = { email: string; name: string; avatarUrl: string };

/**
 * Pemulihan sesi + penjaga peran untuk seluruh area /admin.
 *
 * Sengaja dipisah dari App: berkas ini yang mengimpor supabase-js, jadi paket
 * itu ikut chunk admin dan tidak dibayar pengunjung halaman publik.
 */
export const AdminGate: React.FC<{ onNavigate: (page: PageId) => void }> = ({ onNavigate }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;

    const resolve = async (session: { user: { id: string; email?: string; user_metadata?: any } } | null) => {
      if (!session) {
        if (alive) { setAdmin(null); setChecking(false); }
        return;
      }
      const profil = await fetchProfile(session.user.id);
      if (!alive) return;
      if (profil.role !== 'admin') {
        await supabase.auth.signOut();
        setAdmin(null);
      } else {
        setAdmin({
          email: session.user.email ?? '',
          name:
            profil.name ??
            session.user.user_metadata?.name ??
            (session.user.email ?? '').split('@')[0],
          avatarUrl: profil.avatarUrl ?? '',
        });
      }
      setChecking(false);
    };

    supabase.auth.getSession().then(({ data }) => resolve(data.session as any));

    // Token kedaluwarsa atau logout di tab lain harus ikut menutup panel di sini.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') setAdmin(null);
      else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') resolve(session as any);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (checking) return <div className="min-h-screen bg-neutral-950" aria-busy="true" />;

  return admin ? (
    <DashboardPage
      onLogout={() => supabase.auth.signOut().then(() => setAdmin(null))}
      user={admin}
    />
  ) : (
    <AdminLoginPage onLoginSuccess={setAdmin} onNavigate={onNavigate} />
  );
};
