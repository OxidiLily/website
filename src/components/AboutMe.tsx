import React, { Suspense, lazy } from 'react';
import { Decor } from './Decor';
import { motion } from 'motion/react';
import { hasWebGL, isLowPowerDevice } from '../lib/device';
import { useSettings } from '../lib/content';

// Lanyard = react-three-fiber + drei + rapier (WASM fisika). Paling berat di
// seluruh situs, jadi hanya diunduh kalau perangkatnya sanggup menjalankannya.
const Lanyard = lazy(() => import('./Lanyard'));

export const AboutMe: React.FC = () => {
  const t = useSettings();

  return (
    <section id="about" className="scroll-mt-24 relative w-full bg-transparent text-white min-h-[90vh] lg:min-h-screen overflow-visible">
      {/* Full-width 100% Canvas Layer spanning entire width & height */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
        <div className="w-full h-full pointer-events-auto">
          {!hasWebGL ? (
            // Browser menolak WebGL sama sekali: kosongkan saja. Menaruh gambar
            // pengganti di sini justru mengganggu — Endministrator memintanya
            // TIDAK muncul.
            null
          ) : (
            // Fallback WAJIB terlihat: chunk Lanyard (r3f + drei + rapier) 2,5 MB
            // dan pernah terukur baru siap setelah puluhan detik di mesin lambat.
            // Dengan fallback null, kolom ini kosong selama itu dan halaman
            // About terbaca "tidak load". Kartu statis 18 KB mengisi tempatnya.
            // fallback null: selama chunk lanyard dimuat kolom ini dibiarkan
            // kosong, bukan diisi gambar kartu yang sempat berkedip saat refresh.
            <Decor fallback={null}>
              <Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} reduced={isLowPowerDevice} />
            </Decor>
          )}
        </div>
      </div>

      {/* Foreground Content Layer with higher z-index so card moves behind text */}
      <div className="relative z-10 w-full max-w-[1520px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 xl:gap-20 items-start min-h-[90vh] lg:min-h-screen"
        >
          {/* Left Column Spacer: allows direct click-through to interactive 3D lanyard */}
          <div className="lg:col-span-6 w-full h-[480px] sm:h-[560px] lg:h-full pointer-events-none" />

          {/* Right Column: About Me Heading, Bio, Philosophy Quote & Author Profile */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-8 lg:space-y-12 max-w-2xl pt-8 sm:pt-16 lg:pt-36 pb-16 sm:pb-24 pointer-events-none">
            <div className="pointer-events-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                {t.about_heading}
              </h2>
            </div>

            {/* Primary Bio Paragraph */}
            <p className="text-neutral-300 text-base sm:text-lg lg:text-xl leading-relaxed font-normal pointer-events-auto select-text whitespace-pre-line">
              {t.about_bio}
            </p>

            {/* Bottom Row: Philosophy Statement */}
            <div className="pt-4 items-center pointer-events-auto">
              <p className="text-neutral-400 text-sm sm:text-base leading-relaxed select-text whitespace-pre-line">
                {t.about_philosophy}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutMe;
