import React from 'react';
import { motion } from 'motion/react';
import aboutMeWorkspace from '../assets/images/about_me_workspace_1787881930509.jpg';
import aboutMePortrait from '../assets/images/about_me_portrait_1787881947027.jpg';

export const AboutMe: React.FC = () => {
  return (
    <section id="about" className="pt-2 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="space-y-10">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            About Me
          </h2>
        </motion.div>

        {/* Primary Banner Image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl"
        >
          <img
            src={aboutMeWorkspace}
            alt="Designer working on laptop with geometric studio setup"
            className="w-full h-auto object-cover object-center aspect-[16/9] sm:aspect-[21/9] lg:aspect-[16/9] hover:scale-[1.01] transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Info Grid (Location & Bio Description) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pt-2 items-start"
        >
          {/* Left Column: Role & Location */}
          <div className="md:col-span-4 space-y-1 text-sm sm:text-base">
            <p className="text-neutral-400 font-normal">Independent Designer</p>
            <p className="text-white font-medium flex items-center gap-1.5">
              San Francisco, CA <span className="inline-block text-base">🇺🇸</span>
            </p>
          </div>

          {/* Right Column: Bio Summary & Portrait Photo */}
          <div className="md:col-span-8 space-y-10">
            <p className="text-neutral-300 text-base sm:text-lg leading-relaxed font-normal">
              I am an independent designer and developer focused on building clear, useful products.
              With years of experience shipping for startups and teams, I take on work I can own
              from concept through launch.
            </p>

            {/* Close-up Portrait Image */}
            <div className="w-full overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl">
              <img
                src={aboutMePortrait}
                alt="Portrait of designer in orange sweater"
                className="w-full h-auto object-cover object-center aspect-[4/3] sm:aspect-[16/10] hover:scale-[1.01] transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutMe;
