import React, { Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import { isLowPowerDevice } from '../lib/device';
import cardFront from '../assets/lanyard/card-front.jpg';

// Lanyard = react-three-fiber + drei + rapier (WASM fisika). Paling berat di
// seluruh situs, jadi hanya diunduh kalau perangkatnya sanggup menjalankannya.
const Lanyard = lazy(() => import('./Lanyard'));

export const AboutMe: React.FC = () => {
  return (
    <section id="about" className="relative w-full bg-transparent text-white min-h-[90vh] lg:min-h-screen overflow-visible">
      {/* Full-width 100% Canvas Layer spanning entire width & height */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
        <div className="w-full h-full pointer-events-auto">
          {isLowPowerDevice ? (
            // Perangkat lemah: kartu statis menggantikan simulasi fisika, supaya
            // kolom kiri tidak kosong tanpa menyalakan WebGL sama sekali.
            <div className="w-full h-full flex justify-center lg:justify-start lg:pl-[14%] pt-24 sm:pt-28">
              <div className="flex flex-col items-center">
                <div className="w-px h-16 sm:h-20 bg-white/25" />
                <div className="w-4 h-1.5 rounded-sm bg-white/40" />
                <img
                  src={cardFront}
                  alt="Kartu identitas OxidiLily"
                  className="mt-1 w-36 sm:w-44 rounded-xl shadow-2xl -rotate-3 border border-white/10"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          ) : (
            <Suspense fallback={null}>
              <Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} />
            </Suspense>
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
                About Me
              </h2>
            </div>

            {/* Primary Bio Paragraph */}
            <p className="text-neutral-300 text-base sm:text-lg lg:text-xl leading-relaxed font-normal pointer-events-auto select-text">
              I am an independent designer and developer focused on building clear, useful products.
              With years of experience shipping for startups and teams, I take on work I can own
              from concept through launch.
            </p>

            {/* Bottom Row: Philosophy Statement */}
            <div className="pt-4 border-t border-neutral-800/80 items-center pointer-events-auto">
              <p className="text-neutral-400 text-sm sm:text-base leading-relaxed select-text">
                I start from the purpose, the people it serves, and the simplest path forward.
                Clarity first, then the work gets better.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutMe;
