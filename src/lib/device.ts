/**
 * Deteksi sekali per load: perangkat lemah, atau user minta animasi dikurangi.
 *
 * Dipakai untuk mematikan efek WebGL yang murni dekoratif (SplashCursor,
 * Ballpit, SideRays, LightPillar) di HP dan PC lama. Semua efek itu jalan
 * per-frame di GPU; di perangkat kelas bawah efeknya bukan cuma turun FPS,
 * tapi bikin scroll dan tap ikut tersendat.
 *
 * Sengaja dievaluasi sekali di module scope: kelas perangkat tidak berubah
 * di tengah sesi, jadi tidak perlu hook, state, atau listener.
 */
export const isLowPowerDevice: boolean = (() => {
  const nav = navigator as Navigator & { deviceMemory?: number };

  // Permintaan eksplisit user menang atas tebakan spesifik apa pun.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;

  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) return true;
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4) return true;

  // Layar sentuh kecil: hampir selalu HP kelas menengah ke bawah.
  return window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 768;
})();

/**
 * Perangkat dengan penunjuk presisi (mouse/trackpad) — praktis berarti desktop.
 *
 * Dipakai untuk efek yang memang digerakkan kursor, misalnya SplashCursor: di
 * layar sentuh tidak ada kursor untuk digerakkan, jadi efeknya cuma membakar
 * GPU tanpa pernah terlihat bereaksi.
 */
export const isDesktopPointer: boolean = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
