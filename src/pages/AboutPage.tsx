import React from 'react';
import { motion } from 'motion/react';
import { AboutMe } from '../components/AboutMe';
import { SideRays } from '../components/SideRays';
import { ToolsAndStack } from '../components/ToolsAndStack';
import { Milestone } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const milestones = [
    { year: '2026', title: 'Independent Creative Director & Developer', desc: 'Crafting bespoke web systems and 3D physics engines for high-impact teams.' },
    { year: '2024 - 2025', title: 'Staff Design Engineer @ HyperScale', desc: 'Led the multi-platform design token architecture and core component libraries.' },
    { year: '2022 - 2024', title: 'Senior Frontend Developer @ Sphere Interactive', desc: 'Engineered WebGL interactive canvases, 3D product visualizers, and shader pipelines.' },
    { year: '2020 - 2022', title: 'Product Designer @ Atelier Studio', desc: 'Designed high-growth SaaS dashboards and brand design systems.' },
  ];

  return (
    <div className="relative w-full pt-28 sm:pt-32 pb-24 overflow-hidden min-h-screen">
      {/* SideRays React Bits WebGL Component Background (Fixed to Top-Right) */}
      <div className="fixed top-0 right-0 w-full h-[900px] sm:h-[1050px] pointer-events-none z-0 opacity-100 overflow-hidden">
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
      </div>

      <div className="relative z-10 space-y-16">
        {/* Primary About Me Component (Workspace & Portrait Photography + Bio) */}
        <AboutMe />

        {/* Tools & Stack / Core Toolkit */}
        <ToolsAndStack />

        {/* Milestones Timeline */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="space-y-8">
            <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Experience & Journey
            </h3>

            <div className="divide-y divide-neutral-900">
              {milestones.map((item) => (
                <div key={item.title} className="py-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div className="sm:w-1/4">
                    <span className="font-mono text-xs sm:text-sm text-neutral-400">{item.year}</span>
                  </div>
                  <div className="sm:w-3/4 space-y-1">
                    <h4 className="text-base sm:text-lg font-bold text-white">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">{item.desc}</p>
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

