import React, { Component, Suspense, type ReactNode } from 'react';

/**
 * Pembungkus untuk layer dekoratif (efek WebGL React Bits).
 *
 * Alasannya bukan kerapian, tapi kegagalan nyata: kalau browser menolak
 * memberi konteks WebGL — Brave dengan Shields "block fingerprinting", GPU
 * di-blacklist, driver bermasalah, atau WebGL dimatikan di flags — three.js
 * melempar "Error creating WebGL context" dan ogl melempar
 * "Cannot set properties of null (setting 'renderer')". Tanpa error boundary,
 * React 19 meng-unmount SELURUH aplikasi, dan yang terlihat pengguna adalah
 * halaman hitam kosong tanpa navbar sama sekali. Terukur di /home, /project,
 * dan /contact.
 *
 * Dekorasi tidak boleh sanggup menjatuhkan situs. Kalau gagal, ia hilang
 * diam-diam (atau digantikan `fallback`) dan sisa halaman tetap utuh.
 */
class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Dicatat, tidak dilempar ulang: ini elemen hiasan.
    console.warn('[Decor] efek dekoratif dinonaktifkan setelah error:', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export const Decor: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <Boundary fallback={fallback}>
    <Suspense fallback={fallback}>{children}</Suspense>
  </Boundary>
);

/**
 * Jaring pengaman untuk isi halaman. Berbeda dari `Decor`: kalau halaman
 * gagal, pengguna harus diberi tahu dan diberi jalan keluar, bukan layar kosong.
 */
export class PageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[PageBoundary]', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-neutral-300">Halaman ini gagal dimuat.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors"
        >
          Muat ulang
        </button>
      </div>
    );
  }
}
