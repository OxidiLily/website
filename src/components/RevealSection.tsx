import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface RevealSectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  delay?: number;
}

export const RevealSection: React.FC<RevealSectionProps> = ({
  children,
  id,
  className = '',
  threshold = 0.15,
  rootMargin = '0px 0px -50px 0px',
  delay = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = elementRef.current;
    if (!target) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, we can unobserve to keep the animation stable
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return (
    <motion.section
      ref={elementRef}
      id={id}
      initial={{ opacity: 0, y: 50 }}
      animate={
        isVisible
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: 50 }
      }
      transition={{
        duration: 0.75,
        delay,
        ease: [0.16, 1, 0.3, 1], // Smooth cubic-bezier for refined slide-up
      }}
      className={className}
    >
      {children}
    </motion.section>
  );
};
