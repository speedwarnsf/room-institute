import { useState, useEffect, useCallback } from 'react';
import { Loader2, Copy, Check } from 'lucide-react';
import { extractColors, type ExtractedColor } from '../services/colorExtractor';

interface ColorPaletteProps {
  /** Base64-encoded image (with or without data: prefix) */
  imageBase64: string;
  className?: string;
}

export function ColorPalette({ imageBase64, className = '' }: ColorPaletteProps) {
  const [colors, setColors] = useState<ExtractedColor[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleExtract = useCallback(async () => {
    if (extracted || loading) return;
    setLoading(true);
    try {
      const result = await extractColors(imageBase64, 6);
      setColors(result);
      setExtracted(true);
    } catch (err) {
      console.error('Color extraction failed:', err);
    } finally {
      setLoading(false);
    }
  }, [imageBase64, extracted, loading]);

  // Auto-extract when image changes
  useEffect(() => {
    setExtracted(false);
    setColors([]);
  }, [imageBase64]);

  const handleCopy = useCallback((hex: string, idx: number) => {
    navigator.clipboard?.writeText(hex);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }, []);

  if (!extracted) {
    return (
      <button
        onClick={handleExtract}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-colors ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Analyzing colors...
          </>
        ) : (
          'Extract Color Palette'
        )}
      </button>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
        Extracted Palette
      </h4>
      <div className="flex gap-2">
        {colors.map((color, i) => (
          <button
            key={i}
            onClick={() => handleCopy(color.hex, i)}
            className="group flex-1 min-w-0"
            title={`${color.name} - ${color.hex} (${color.percentage}%)`}
          >
            <div
              className="aspect-square w-full transition-transform duration-200 group-hover:scale-105"
              style={{ backgroundColor: color.hex }}
            >
              {copiedIdx === i && (
                <div className="w-full h-full flex items-center justify-center bg-black/40">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="mt-1.5 text-center">
              <span className="block text-[9px] font-mono text-stone-500 dark:text-stone-400">
                {color.hex}
              </span>
              <span className="block text-[9px] text-stone-400 dark:text-stone-500">
                {color.name}
              </span>
              <span className="block text-[8px] text-stone-300 dark:text-stone-600">
                {color.percentage}%
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ColorPalette;
