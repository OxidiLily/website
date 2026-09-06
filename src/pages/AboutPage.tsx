import React, { Suspense, lazy } from 'react';
import { Decor } from '../components/Decor';
import { motion } from 'motion/react';
import { AboutMe } from '../components/AboutMe';
import { ToolsAndStack } from '../components/ToolsAndStack';
import { canRenderWebGL } from '../lib/device';
import { useExperiences, useSettings } from '../lib/content';

// SideRays (ogl) murni dekorasi — jangan diunduh di perangkat lemah.
const SideRays = lazy(() => import('../components/SideRays').then(m => ({ default: m.SideRays })));
import { Milestone } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const t = useSettings();
  const milestones = useExperiences();


  return (
    <div className="relative w-full pb-24 overflow-x-clip min-h-screen">
      {/* SideRays React Bits WebGL Component Background (Fixed to Top-Right) */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-100 overflow-hidden">
        {canRenderWebGL && (
        <Decor>
        <SideRays
          speed={2.8}
          rayColor1="#F59E0B"
          rayColor2="#93C5FD"
          intensity={3.2}
          spread={2.8}
          origin="top-right"
          tilt={-4}
          saturation={1.8}
          blend={0.7}
          falloff={1.25}
          opacity={1.0}
        />
        </Decor>
        )}
      </div>

      <div className="relative z-10 space-y-16">
        {/* Primary About Me Component (Workspace & Portrait Photography + Bio) */}
        <AboutMe />

        {/* Tools & Stack / Core Toolkit */}
        <ToolsAndStack />

        {/* Milestones Timeline */}
        <section id="experience-section" className="scroll-mt-24 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="space-y-8">
            <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {t.about_experience_heading}
            </h3>

            <div className="divide-y divide-neutral-900">
              {milestones.map((item) => (
                <div key={item.id} className="py-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div className="sm:w-1/4">
                    <span className="font-mono text-xs sm:text-sm text-neutral-400">{item.year}</span>
                  </div>
                  <div className="sm:w-3/4 space-y-1">
                    <h4 className="text-base sm:text-lg font-bold text-white">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

