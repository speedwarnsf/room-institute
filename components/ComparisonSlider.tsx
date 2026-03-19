import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  enableZoom?: boolean;
}

/**
 * Before/After comparison slider component
 * Premium feel with smooth dragging and elegant handle
 */
export function ComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel,
  afterLabel,
  className = '',
  enableZoom = false,
}: ComparisonSliderProps) {
  const { t } = useI18n();
  const defaultBeforeLabel = t('comparison.before');
  const defaultAfterLabel = t('comparison.after');
  const finalBeforeLabel = beforeLabel || defaultBeforeLabel;
  const finalAfterLabel = afterLabel || defaultAfterLabel;
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState({ before: false, after: false });

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const isZoomed = zoom > 1;

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!enableZoom) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(prev + 0.25, 4));
    } else {
      setZoom(prev => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPanOffset({ x: 0, y: 0 });
        return next;
      });
    }
  }, [enableZoom]);

  // Pan handlers for zoomed state
  const handlePanStart = useCallback((clientX: number, clientY: number) => {
    if (!isZoomed) return;
    setIsPanning(true);
    panStart.current = { x: clientX, y: clientY, offsetX: panOffset.x, offsetY: panOffset.y };
  }, [isZoomed, panOffset]);

  useEffect(() => {
    if (!isPanning) return;
    const handlePanMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY;
      const dx = clientX - panStart.current.x;
      const dy = clientY - panStart.current.y;
      const maxPan = (zoom - 1) * 150;
      setPanOffset({
        x: Math.max(-maxPan, Math.min(maxPan, panStart.current.offsetX + dx)),
        y: Math.max(-maxPan, Math.min(maxPan, panStart.current.offsetY + dy)),
      });
    };
    const handlePanEnd = () => setIsPanning(false);
    document.addEventListener('mousemove', handlePanMove);
    document.addEventListener('mouseup', handlePanEnd);
    document.addEventListener('touchmove', handlePanMove, { passive: true });
    document.addEventListener('touchend', handlePanEnd);
    return () => {
      document.removeEventListener('mousemove', handlePanMove);
      document.removeEventListener('mouseup', handlePanEnd);
      document.removeEventListener('touchmove', handlePanMove);
      document.removeEventListener('touchend', handlePanEnd);
    };
  }, [isPanning, zoom]);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.min(Math.max((x / rect.width) * 100, 2), 98);
      setSliderPosition(percentage);
      if (!hasInteracted) setHasInteracted(true);
    },
    [hasInteracted]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isZoomed && e.shiftKey) {
      handlePanStart(e.clientX, e.clientY);
      return;
    }
    setIsDragging(true);
    handleMove(e.clientX);
  }, [handleMove, isZoomed, handlePanStart]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isZoomed && e.touches.length === 2) {
      // Two-finger = pan
      if (e.touches[0]) handlePanStart(e.touches[0].clientX, e.touches[0].clientY);
      return;
    }
    setIsDragging(true);
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  }, [handleMove, isZoomed, handlePanStart]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) handleMove(e.touches[0].clientX);
    };
    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMove]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition((prev) => Math.max(prev - 5, 2));
      setHasInteracted(true);
    } else if (e.key === 'ArrowRight') {
      setSliderPosition((prev) => Math.min(prev + 5, 98));
      setHasInteracted(true);
    }
  }, []);

  const allLoaded = isLoaded.before && isLoaded.after;
  const instructionId = 'comparison-slider-instructions';
  const valueText = `${Math.round(sliderPosition)}% ${finalBeforeLabel} / ${Math.round(100 - sliderPosition)}% ${finalAfterLabel}`;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none cursor-ew-resize ${className}`}
      style={{ aspectRatio: '16/9' }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onWheel={enableZoom ? handleWheel : undefined}
      role="slider"
      aria-label={t('analysis.compareBeforeAfter')}
      aria-describedby={instructionId}
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(sliderPosition)}
      aria-valuetext={valueText}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <span id={instructionId} className="sr-only">
        {t('comparison.instructions')}
      </span>

      {/* Loading state */}
      {!allLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100 dark:bg-stone-800">
          <div className="animate-pulse text-stone-500 dark:text-stone-400 text-sm">{t('comparison.loadingComparison')}</div>
        </div>
      )}

      {/* After image (background) */}
      <img
        src={afterImage}
        alt={finalAfterLabel}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${allLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{
          transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.2s ease',
        }}
        onLoad={() => setIsLoaded((prev) => ({ ...prev, after: true }))}
        draggable={false}
      />

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt={finalBeforeLabel}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${allLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            width: containerRef.current ? containerRef.current.offsetWidth : '100%',
            maxWidth: 'none',
            transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.2s ease',
          }}
          onLoad={() => setIsLoaded((prev) => ({ ...prev, before: true }))}
          draggable={false}
        />
      </div>

      {/* Slider handle */}
      {allLoaded && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.3)] transition-shadow"
          style={{ 
            left: `${sliderPosition}%`, 
            transform: 'translateX(-50%)',
          }}
        >
          {/* Handle grip */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
              w-10 h-10 bg-white shadow-lg border border-stone-300
              flex items-center justify-center transition-all duration-200
              ${isDragging ? 'scale-110 shadow-xl border-emerald-400' : 'hover:scale-105 hover:border-emerald-400'}`}
          >
            <ChevronLeft size={14} className="text-stone-600 -mr-0.5" />
            <ChevronRight size={14} className="text-stone-600 -ml-0.5" />
          </div>
        </div>
      )}

      {/* Labels */}
      {allLoaded && (
        <>
          <div
            className={`absolute top-3 left-3 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider
              bg-black/50 text-white backdrop-blur-sm transition-opacity
              ${sliderPosition < 15 ? 'opacity-0' : 'opacity-100'}`}
          >
            {finalBeforeLabel}
          </div>
          <div
            className={`absolute top-3 right-3 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider
              bg-black/50 text-white backdrop-blur-sm transition-opacity
              ${sliderPosition > 85 ? 'opacity-0' : 'opacity-100'}`}
          >
            {finalAfterLabel}
          </div>
        </>
      )}

      {/* Zoom controls */}
      {enableZoom && allLoaded && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
            className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            aria-label={t('comparison.zoomIn')}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
            disabled={zoom <= 1}
            className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-colors disabled:opacity-40"
            aria-label={t('comparison.zoomOut')}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          {isZoomed && (
            <button
              onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
              className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
              aria-label={t('comparison.resetZoom')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          {isZoomed && (
            <span className="px-2 py-1 bg-black/50 text-white text-[10px] font-mono backdrop-blur-sm">
              {Math.round(zoom * 100)}%
            </span>
          )}
        </div>
      )}

      {/* Instruction hint — fades after first interaction */}
      {allLoaded && !hasInteracted && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5
            bg-black/60 text-white text-xs backdrop-blur-sm flex items-center gap-2
            animate-pulse pointer-events-none"
        >
          <ChevronLeft size={12} />
          <span>{t('comparison.dragToCompare')}</span>
          <ChevronRight size={12} />
        </div>
      )}
    </div>
  );
}
