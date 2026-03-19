/**
 * RatingEffects — Visual feedback for rating actions.
 * Gold burst + star particles for THE ONE 
 * Red crumple flash for Never Again
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  delay: number;
  type: 'star' | 'circle' | 'spark';
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 0,
    y: 0,
    angle: (360 / count) * i + Math.random() * 30 - 15,
    distance: 40 + Math.random() * 80,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 0.15,
    type: (['star', 'circle', 'spark'] as const)[Math.floor(Math.random() * 3)] ?? 'star',
  }));
}

export function GoldBurstEffect({ show, onComplete }: { show: boolean; onComplete?: () => void }) {
  const [particles] = useState(() => generateParticles(16));

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => onComplete?.(), 800);
    return () => clearTimeout(timer);
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 z-30 pointer-events-none overflow-visible flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Central flash */}
          <motion.div
            className="absolute w-full h-full bg-yellow-400/30"
            initial={{ opacity: 0.8, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.5 }}
          />

          {/* Ring */}
          <motion.div
            className="absolute w-24 h-24 border-2 border-yellow-400"
            initial={{ opacity: 0.8, scale: 0.3 }}
            animate={{ opacity: 0, scale: 2.5 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />

          {/* Particles */}
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const tx = Math.cos(rad) * p.distance;
            const ty = Math.sin(rad) * p.distance;
            return (
              <motion.div
                key={p.id}
                className="absolute"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: tx, y: ty, opacity: 0, scale: 0.3 }}
                transition={{ duration: 0.6, delay: p.delay, ease: 'easeOut' }}
              >
                {p.type === 'star' ? (
                  <svg width={p.size + 4} height={p.size + 4} viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ) : p.type === 'spark' ? (
                  <svg width={p.size + 2} height={p.size + 2} viewBox="0 0 24 24" fill="currentColor" className="text-yellow-300"><path d="M12 1l3 8h8l-6.5 5 2.5 8L12 17l-7 5 2.5-8L1 9h8z"/></svg>
                ) : (
                  <div
                    className="bg-yellow-400"
                    style={{ width: p.size, height: p.size }}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function NeverAgainEffect({ show, onComplete }: { show: boolean; onComplete?: () => void }) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => onComplete?.(), 500);
    return () => clearTimeout(timer);
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 z-30 pointer-events-none overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Red flash */}
          <motion.div
            className="absolute inset-0 bg-red-500/40"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />

          {/* Crumple lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {[
              'M 20,0 L 45,55 L 10,100',
              'M 60,0 L 40,50 L 70,100',
              'M 80,0 L 55,45 L 90,100',
              'M 0,30 L 50,40 L 100,25',
              'M 0,70 L 50,60 L 100,75',
            ].map((d, i) => (
              <motion.path
                key={i}
                d={d}
                fill="none"
                stroke="rgba(239,68,68,0.4)"
                strokeWidth={0.5}
                initial={{ pathLength: 0, opacity: 0.8 }}
                animate={{ pathLength: 1, opacity: 0 }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
              />
            ))}
          </svg>

          {/* X mark */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0, rotate: -90, opacity: 0.8 }}
            animate={{ scale: 1.5, rotate: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-red-500"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
