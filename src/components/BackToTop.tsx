import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';

export const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Hitung progress scroll (0% - 100%)
      if (docHeight > 0) {
        setScrollProgress((scrollTop / docHeight) * 100);
      }

      // Tampilkan tombol saat scroll > 300px
      setIsVisible(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Lingkaran SVG circumference
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          id="back-to-top-btn"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Kembali ke atas"
          className="fixed bottom-8 right-8 z-40 p-3 rounded-full bg-neutral-900/90 text-white border border-neutral-700/80 shadow-2xl backdrop-blur-md hover:bg-neutral-800 hover:border-neutral-500 transition-colors group flex items-center justify-center cursor-pointer"
        >
          {/* Circular Progress Indicator Ring */}
          <svg className="w-10 h-10 -rotate-90 pointer-events-none absolute" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r={radius}
              className="text-neutral-800"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="22"
              cy="22"
              r={radius}
              className="text-white transition-all duration-100 ease-out"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Arrow Icon */}
          <ArrowUp className="w-5 h-5 text-neutral-300 group-hover:text-white group-hover:-translate-y-0.5 transition-all duration-200" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTop;
