/**
 * ComparisonHero — Before/after draggable slider
 * Shows an original listing photo vs. a Room Institute redesign.
 * Touch + mouse draggable. No dependencies beyond React.
 */

import { useRef, useState, useCallback, useEffect } from 'react';

export default function ComparisonHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(2, Math.min(98, (x / rect.width) * 100));
    setPosition(pct);
    if (!hasInteracted) setHasInteracted(true);
  }, [hasInteracted]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  }, [isDragging, updatePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    updatePosition(e.touches[0].clientX);
  }, [updatePosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    updatePosition(e.touches[0].clientX);
  }, [isDragging, updatePosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Subtle auto-animation on load to hint at interactivity
  useEffect(() => {
    if (hasInteracted) return;
    const timer = setTimeout(() => {
      let frame = 0;
      const animate = () => {
        frame++;
        if (frame <= 30) {
          setPosition(50 + Math.sin(frame / 5) * 8);
          requestAnimationFrame(animate);
        } else {
          setPosition(50);
        }
      };
      animate();
    }, 2000);
    return () => clearTimeout(timer);
  }, [hasInteracted]);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative w-full aspect-[3/2] sm:aspect-[16/9] overflow-hidden cursor-col-resize select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Redesign (full width, underneath) */}
        <img
          src="/hero-redesign.jpg"
          alt="Room Institute redesign"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Original (clipped by slider position) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <img
            src="/hero-original.jpg"
            alt="Original listing photo"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ width: `${containerRef.current?.offsetWidth || 1000}px`, maxWidth: 'none' }}
            draggable={false}
          />
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 z-10"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-px h-full bg-white/80" />
          {/* Handle */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
            style={{ borderRadius: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5 3L2 8L5 13" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 3L14 8L11 13" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute bottom-4 left-4 z-10">
          <span
            className="bg-black/70 backdrop-blur-sm text-white text-[10px] uppercase tracking-[0.2em] px-3 py-1.5"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            As Listed
          </span>
        </div>
        <div className="absolute bottom-4 right-4 z-10">
          <span
            className="bg-emerald-500/90 backdrop-blur-sm text-stone-950 text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 font-bold"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Reimagined
          </span>
        </div>
      </div>
    </div>
  );
}
