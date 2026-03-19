import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';

interface PortraitCropProps {
  imageUrl: string;
  size: number;
  onCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

/**
 * Circular crop/reposition tool for portrait photos.
 * Drag to pan, scroll/pinch to zoom. Exports a square crop
 * that fills the circle mask.
 */
export default function PortraitCrop({ imageUrl, size, onCrop, onCancel }: PortraitCropProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [loaded, setLoaded] = useState(false);

  const MIN_SCALE = 1;
  const MAX_SCALE = 3;

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setLoaded(true);
    // Start centered, scaled to cover the circle
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Clamp offset so image always covers the circle
  const clampOffset = useCallback((ox: number, oy: number, s: number) => {
    // The image is rendered to cover the container at scale=1.
    // Extra pixels available for panning = (scaledSize - containerSize) / 2
    const extra = (s - 1) * size / 2;
    return {
      x: Math.max(-extra, Math.min(extra, ox)),
      y: Math.max(-extra, Math.min(extra, oy)),
    };
  }, [size]);

  // Mouse/touch drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const newOffset = clampOffset(
      e.clientX - dragStart.x,
      e.clientY - dragStart.y,
      scale
    );
    setOffset(newOffset);
  }, [dragging, dragStart, scale, clampOffset]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Scroll to zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => {
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev + delta));
      // Re-clamp offset for new scale
      setOffset(o => clampOffset(o.x, o.y, next));
      return next;
    });
  }, [clampOffset]);

  // Touch pinch zoom
  const lastTouchDist = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0]!.clientX - e.touches[1]!.clientX,
          e.touches[0]!.clientY - e.touches[1]!.clientY
        );
        if (lastTouchDist.current !== null) {
          const delta = (dist - lastTouchDist.current) * 0.005;
          setScale(prev => {
            const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev + delta));
            setOffset(o => clampOffset(o.x, o.y, next));
            return next;
          });
        }
        lastTouchDist.current = dist;
      }
    };

    const handleTouchEnd = () => {
      lastTouchDist.current = null;
    };

    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [clampOffset]);

  // Export cropped image
  const handleConfirm = useCallback(() => {
    const img = imgRef.current;
    if (!img || !imgNatural.w) return;

    const canvas = document.createElement('canvas');
    const outputSize = 512; // High-res output
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d')!;

    // Calculate source rectangle from the visible circle area
    // The image is displayed as object-cover at `size` px, then scaled and offset.
    // We need to map the visible circle back to natural image coordinates.

    // object-cover: image scaled so shorter side fills container
    const imgAspect = imgNatural.w / imgNatural.h;
    let renderW: number, renderH: number;
    if (imgAspect > 1) {
      // Landscape: height fills, width overflows
      renderH = size;
      renderW = size * imgAspect;
    } else {
      // Portrait or square: width fills, height overflows
      renderW = size;
      renderH = size / imgAspect;
    }

    // Apply scale
    renderW *= scale;
    renderH *= scale;

    // Center of the rendered image relative to the container center
    const centerX = size / 2;
    const centerY = size / 2;

    // Top-left of rendered image in container coords
    const imgLeft = centerX - renderW / 2 + offset.x;
    const imgTop = centerY - renderH / 2 + offset.y;

    // The visible circle is a square crop from (0,0) to (size, size) in container coords
    // Map container (0,0)-(size,size) to image natural coords
    const scaleToNatX = imgNatural.w / renderW;
    const scaleToNatY = imgNatural.h / renderH;

    const srcX = (0 - imgLeft) * scaleToNatX;
    const srcY = (0 - imgTop) * scaleToNatY;
    const srcW = size * scaleToNatX;
    const srcH = size * scaleToNatY;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputSize, outputSize);

    onCrop(canvas.toDataURL('image/jpeg', 0.92));
  }, [imgNatural, scale, offset, size, onCrop]);

  const action = typeof window !== 'undefined' && 'ontouchstart' in window
    ? t('portraitCrop.pinch')
    : t('portraitCrop.scroll');

  return (
    <div className="space-y-6">
      <div className="text-emerald-500 text-sm font-medium tracking-wide uppercase"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}>
        {t('portraitCrop.title')}
      </div>

      <p className="text-stone-400" style={{ fontSize: '13px' }}>
        {t('portraitCrop.instructions').replace('{action}', action)}
      </p>

      {/* Crop area */}
      <div className="flex justify-center">
        <div
          ref={containerRef}
          className="lens-circle relative overflow-hidden border-2 border-emerald-500 cursor-grab active:cursor-grabbing select-none"
          style={{ width: size, height: size, touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-950">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Crop preview"
            crossOrigin="anonymous"
            onLoad={handleImageLoad}
            className="pointer-events-none"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transformOrigin: 'center center',
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-3 max-w-xs mx-auto">
        <span className="text-stone-500 text-xs">-</span>
        <input
          type="range"
          min={MIN_SCALE * 100}
          max={MAX_SCALE * 100}
          value={scale * 100}
          onChange={e => {
            const next = Number(e.target.value) / 100;
            setScale(next);
            setOffset(o => clampOffset(o.x, o.y, next));
          }}
          className="flex-1 accent-emerald-500"
        />
        <span className="text-stone-500 text-xs">+</span>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleConfirm}
          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold py-3 px-6 tracking-wide uppercase transition-colors"
          style={{ borderRadius: 0 }}
        >
          {t('portraitCrop.confirm')}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 border border-stone-600 text-stone-300 hover:text-stone-100 py-3 px-6 tracking-wide uppercase transition-colors"
          style={{ borderRadius: 0 }}
        >
          {t('portraitCrop.back')}
        </button>
      </div>
    </div>
  );
}
