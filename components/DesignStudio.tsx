import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Download, Loader2, ShoppingCart } from 'lucide-react';
import { DesignExportMenu } from './DesignExportMenu';
import { ColorPalette } from './ColorPalette';
import { DesignAnnotations, type Annotation } from './DesignAnnotations';
import { RegenerateTweaks } from './RegenerateTweaks';
import { SoIcon } from './SoIcon';
import { ProductShelf } from './ProductShelf';
import { ShoppingList } from './ShoppingList';
import { inferTypeMood, getTypePalette, loadStudioFonts } from '../services/studioTypography';
import { generateShoppingList } from '../services/shoppingListGenerator';
import type { LookbookEntry, TypeMood, ShoppingListData } from '../types';
import type { TypePalette } from '../services/studioTypography';

interface DesignStudioProps {
  entry: LookbookEntry;
  onBack: () => void;
  onIterate?: (prompt: string) => Promise<void>;
  sourceImage?: { base64: string; mimeType: string };
}

/* ═══════════════════════════════════════════════════
   Shared utilities
   ═══════════════════════════════════════════════════ */

function useAccentColor(palette: string[]): string {
  return useMemo(() => {
    if (!palette.length) return '#a3a3a3';
    return palette[Math.floor(palette.length / 2)] ?? palette[0] ?? '#a3a3a3';
  }, [palette]);
}

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   StudioHero — Full-bleed visualization + mood typography
   ═══════════════════════════════════════════════════ */

function StudioHero({
  entry,
  tp,
  accent,
}: {
  entry: LookbookEntry;
  tp: TypePalette;
  accent: string;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);

  const { option } = entry;
  const imgSrc = option.visualizationImage
    ? `data:image/png;base64,${option.visualizationImage}`
    : null;

  const designName = option.name || 'Untitled';
  const firstLetter = designName.charAt(0).toUpperCase();
  const restOfName = designName.slice(1);
  const categoryLabel = option.frameworks?.[0] || '';

  return (
    <>
      {/* Full-bleed hero image */}
      <div ref={heroRef} className="relative h-[70vh] sm:h-screen overflow-hidden">
        {imgSrc ? (
          <motion.div className="absolute inset-0" style={{ y: imageY }}>
            <motion.img
              src={imgSrc}
              alt={option.name}
              className="w-full h-[120%] object-cover"
              style={{ scale: heroScale, opacity: heroOpacity }}
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-neutral-950 to-transparent" />

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="w-[1px] h-8 bg-gradient-to-b from-white/50 to-transparent"
          />
        </motion.div>
      </div>

      {/* Title section — typographically styled */}
      <div className="bg-neutral-950 px-4 sm:px-12 lg:px-20 pt-8 sm:pt-16 pb-6 sm:pb-12">
        {categoryLabel && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="block text-[11px] sm:text-xs uppercase tracking-[0.25em] mb-4"
            style={{ color: accent, fontFamily: tp.body }}
          >
            {categoryLabel}
          </motion.span>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="leading-[0.88] max-w-5xl mb-6"
          style={{
            fontFamily: tp.heading,
            letterSpacing: tp.tracking,
            textTransform: tp.capsHeadings ? 'uppercase' : 'none',
          }}
        >
          <span className="text-5xl sm:text-[120px] lg:text-[160px] font-bold">
            {firstLetter}
          </span>
          <span className="text-3xl sm:text-7xl lg:text-8xl font-bold">
            {restOfName}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-lg sm:text-xl lg:text-2xl text-neutral-300 max-w-2xl leading-relaxed italic"
          style={{ fontFamily: tp.body }}
        >
          {option.mood}
        </motion.p>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   StudioBrief — Editorial layout with pull quote,
   intervention cards, materials, color story
   ═══════════════════════════════════════════════════ */

function StudioBrief({
  entry,
  tp,
  accent,
}: {
  entry: LookbookEntry;
  tp: TypePalette;
  accent: string;
}) {
  const { option } = entry;
  const imgSrc = option.visualizationImage
    ? `data:image/png;base64,${option.visualizationImage}`
    : null;

  // Extract a pull quote from the mood or first sentence of the full plan
  const pullQuote = option.mood.split('.')[0] + '.';

  // Parse materials from full plan (look for material-related keywords)
  const materials = useMemo(() => {
    const matKeywords = /(?:marble|walnut|oak|brass|steel|concrete|linen|velvet|leather|ceramic|stone|wool|cotton|silk|copper|glass|terrazzo|plaster|rattan|cane|teak|bamboo|travertine|onyx|bouclé|mohair|jute|sisal|lacquer)/gi;
    const found = new Set<string>();
    const text = `${option.fullPlan} ${option.keyChanges.join(' ')} ${option.mood}`;
    let match;
    while ((match = matKeywords.exec(text)) !== null) {
      found.add(match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase());
    }
    return Array.from(found).slice(0, 8);
  }, [option]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-12 lg:px-20 py-10 sm:py-24 space-y-14 sm:space-y-28">

      {/* ── Pull Quote ── */}
      <RevealSection>
        <blockquote
          className="text-3xl sm:text-4xl lg:text-5xl leading-[1.2] text-neutral-200 max-w-3xl"
          style={{ fontFamily: tp.heading, letterSpacing: tp.tracking }}
        >
          <span className="text-neutral-600" style={{ fontSize: '1.2em' }}>"</span>
          {pullQuote}
          <span className="text-neutral-600" style={{ fontSize: '1.2em' }}>"</span>
        </blockquote>
      </RevealSection>

      {/* ── Color Story — Full-width gradient bar ── */}
      <RevealSection>
        <h2
          className="text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-6"
          style={{ fontFamily: tp.body }}
        >
          Color Story
        </h2>
        <div className="h-16 sm:h-20 overflow-hidden relative">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${option.palette.join(', ')})`,
            }}
          />
        </div>
        <div className="flex mt-4 gap-3 sm:gap-4">
          {option.palette.map((color, i) => (
            <div key={i} className="flex-1 group cursor-crosshair">
              <div
                className="aspect-square transition-all duration-300 group-hover:scale-[1.05] group-hover:shadow-lg"
                style={{ backgroundColor: color }}
              />
              <span
                className="block text-center text-[10px] font-mono mt-2 text-neutral-600 group-hover:text-neutral-400 transition-colors"
                style={{ fontFamily: tp.mood === 'raw-industrial' ? tp.heading : undefined }}
              >
                {color}
              </span>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* ── Interventions (Key Moves) as cards ── */}
      <RevealSection>
        <h2
          className="text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-10"
          style={{ fontFamily: tp.body }}
        >
          Interventions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {option.keyChanges.map((change, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="bg-neutral-900 border border-neutral-800 p-5 hover:border-neutral-700 transition-colors"
            >
              <span
                className="text-2xl font-bold block mb-3"
                style={{ color: accent, opacity: 0.5, fontFamily: tp.heading }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-sm text-neutral-300 leading-relaxed" style={{ fontFamily: tp.body }}>
                {change}
              </p>
            </motion.div>
          ))}
        </div>
      </RevealSection>

      {/* ── Materials Palette ── */}
      {materials.length > 0 && (
        <RevealSection>
          <h2
            className="text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-8"
            style={{ fontFamily: tp.body }}
          >
            Materials
          </h2>
          <div className="flex flex-wrap gap-3">
            {materials.map((mat) => (
              <span
                key={mat}
                className="px-4 py-2 border border-neutral-800 text-sm text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
                style={{ fontFamily: tp.body }}
              >
                {mat}
              </span>
            ))}
          </div>
        </RevealSection>
      )}

      {/* ── The Full Plan ── */}
      {option.fullPlan && (
        <RevealSection>
          <h2
            className="text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-12"
            style={{ fontFamily: tp.body }}
          >
            The Plan
          </h2>
          <div
            className={`max-w-4xl ${tp.layoutDensity === 'sparse' ? '' : 'lg:columns-2 lg:gap-12'}`}
          >
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h3
                    className="text-lg font-semibold text-neutral-200 mt-10 mb-4 break-after-avoid"
                    style={{ fontFamily: tp.heading, letterSpacing: tp.tracking }}
                  >
                    {children}
                  </h3>
                ),
                h2: ({ children }) => (
                  <h3
                    className="text-lg font-semibold text-neutral-200 mt-10 mb-4 break-after-avoid"
                    style={{ fontFamily: tp.heading, letterSpacing: tp.tracking }}
                  >
                    {children}
                  </h3>
                ),
                h3: ({ children }) => (
                  <h4
                    className="text-base font-semibold text-neutral-300 mt-8 mb-3 break-after-avoid"
                    style={{ fontFamily: tp.heading }}
                  >
                    {children}
                  </h4>
                ),
                h4: ({ children }) => (
                  <h5 className="text-sm font-medium text-neutral-400 tracking-wide mt-6 mb-2 break-after-avoid">
                    {children}
                  </h5>
                ),
                p: ({ children }) => (
                  <p className="text-[15px] leading-[1.9] text-neutral-400 mb-5" style={{ fontFamily: tp.body }}>
                    {children}
                  </p>
                ),
                strong: ({ children }) => <strong className="font-semibold text-neutral-200">{children}</strong>,
                em: ({ children }) => <em className="text-neutral-300" style={{ fontFamily: tp.body }}>{children}</em>,
                ul: ({ children }) => <ul className="mt-3 mb-8 space-y-6 list-none">{children}</ul>,
                ol: ({ children }) => <ol className="mt-3 mb-8 space-y-6 list-decimal list-outside pl-5">{children}</ol>,
                li: ({ children }) => (
                  <li className="text-[15px] leading-[1.85] text-neutral-400 pl-0 flex items-start gap-3">
                    <span className="text-neutral-700 mt-[2px] shrink-0">—</span>
                    <span style={{ fontFamily: tp.body }}>{children}</span>
                  </li>
                ),
                hr: () => <div className="my-10 border-t border-neutral-800/50" />,
              }}
            >{option.fullPlan.replace(/([^\n])(#{1,4}\s)/g, '$1\n\n$2').replace(/\\n/g, '\n')}</ReactMarkdown>
          </div>
        </RevealSection>
      )}

      {/* ── Product Recommendations ── */}
      {option.products && option.products.length > 0 && (
        <RevealSection>
          <ProductShelf products={option.products} title="The Edit" />
        </RevealSection>
      )}

      {/* ── Visualization detail ── */}
      {imgSrc && (
        <RevealSection>
          <div className="relative overflow-hidden">
            <img
              src={imgSrc}
              alt={`${option.name} visualization detail`}
              className="w-full h-auto"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-950/80 to-transparent p-6">
              <span
                className="text-[10px] uppercase tracking-[0.25em] text-neutral-400"
                style={{ fontFamily: tp.body }}
              >
                Visualization — {option.name}
              </span>
            </div>
          </div>
        </RevealSection>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   StudioIterate — Paired iteration controls
   ═══════════════════════════════════════════════════ */

const ITERATION_PAIRS: { left: string; right: string; leftIcon: string; rightIcon: string }[] = [
  { left: 'Warmer', right: 'Cooler', leftIcon: 'like', rightIcon: 'filter' },
  { left: 'More minimal', right: 'More layered', leftIcon: 'shrink-content', rightIcon: 'expand-content' },
  { left: 'Show at night', right: 'Show at golden hour', leftIcon: 'eye', rightIcon: 'stars' },
  { left: 'Bolder color', right: 'More restrained', leftIcon: 'love', rightIcon: 'filter' },
];

function StudioIterate({
  tp,
  onIterate,
  isIterating,
  activeLabel,
}: {
  tp: TypePalette;
  onIterate: (prompt: string) => void;
  isIterating: boolean;
  activeLabel: string | null;
}) {
  const [customPrompt, setCustomPrompt] = useState('');

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-12 lg:px-20 pb-16 sm:pb-24">
      <RevealSection>
        <div className="border-t border-neutral-800/50 pt-14">
          <h2
            className="text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-2"
            style={{ fontFamily: tp.body }}
          >
            Iterate
          </h2>
          <p className="text-sm text-neutral-500 mb-10 italic" style={{ fontFamily: tp.body }}>
            This direction, but…
          </p>

          {/* Paired sliders */}
          <div className="space-y-3 sm:space-y-4 mb-10">
            {ITERATION_PAIRS.map(({ left, right, leftIcon, rightIcon }) => (
              <div key={left} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <button
                  disabled={isIterating}
                  onClick={() => onIterate(left)}
                  className={`flex-1 px-4 py-3 border text-[13px] transition-all duration-300 flex items-center justify-center gap-2 ${
                    isIterating && activeLabel === left
                      ? 'border-white/30 bg-white/10 text-white'
                      : isIterating
                        ? 'border-neutral-800/50 text-neutral-600 cursor-not-allowed'
                        : 'border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:border-neutral-600 hover:text-neutral-200'
                  }`}
                  style={{ fontFamily: tp.body }}
                >
                  {isIterating && activeLabel === left ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <SoIcon name={leftIcon as any} size={14} style={{ filter: `brightness(0) invert(${isIterating ? '0.3' : '0.5'})` }} />
                  )}
                  {left}
                </button>
                <span className="text-neutral-700 text-xs text-center hidden sm:block">or</span>
                <button
                  disabled={isIterating}
                  onClick={() => onIterate(right)}
                  className={`flex-1 px-4 py-3 border text-[13px] transition-all duration-300 flex items-center justify-center gap-2 ${
                    isIterating && activeLabel === right
                      ? 'border-white/30 bg-white/10 text-white'
                      : isIterating
                        ? 'border-neutral-800/50 text-neutral-600 cursor-not-allowed'
                        : 'border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:border-neutral-600 hover:text-neutral-200'
                  }`}
                  style={{ fontFamily: tp.body }}
                >
                  {isIterating && activeLabel === right ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <SoIcon name={rightIcon as any} size={14} style={{ filter: `brightness(0) invert(${isIterating ? '0.3' : '0.5'})` }} />
                  )}
                  {right}
                </button>
              </div>
            ))}
          </div>

          {/* Custom prompt */}
          <div className="flex gap-3">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && customPrompt.trim()) { onIterate(customPrompt); setCustomPrompt(''); } }}
              placeholder="Or describe your own variation…"
              disabled={isIterating}
              aria-label="Custom iteration prompt"
              className="flex-1 bg-transparent border-b border-neutral-800 px-1 py-3 text-sm text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-neutral-500 focus:ring-0 transition-colors disabled:opacity-40"
              style={{ fontFamily: tp.body }}
            />
            <button
              disabled={isIterating || !customPrompt.trim()}
              onClick={() => { onIterate(customPrompt); setCustomPrompt(''); }}
              className="px-6 py-2.5 text-sm font-medium transition-all duration-300 border-b border-neutral-100 text-neutral-100 hover:text-white hover:border-white disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontFamily: tp.body }}
            >
              {isIterating && activeLabel === customPrompt ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PDF + Save helpers
   ═══════════════════════════════════════════════════ */

async function generatePDF(entry: LookbookEntry) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const el = document.getElementById('design-studio-content');
  if (!el) return;
  const canvas = await html2canvas(el, {
    backgroundColor: '#0a0a0a',
    scale: 2,
    useCORS: true,
    logging: false,
    scrollY: -window.scrollY,
    windowHeight: el.scrollHeight,
    height: el.scrollHeight,
  });
  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdfWidth = 210;
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  const pdf = new jsPDF({
    orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [pdfWidth, Math.min(pdfHeight, 297 * 3)],
  });
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${entry.option.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-room-institute.pdf`);
}

function saveVisualization(entry: LookbookEntry) {
  if (!entry.option.visualizationImage) return;
  const link = document.createElement('a');
  link.download = `${entry.option.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-visualization.png`;
  link.href = `data:image/png;base64,${entry.option.visualizationImage}`;
  link.click();
}

/* ═══════════════════════════════════════════════════
   Main DesignStudio Component
   ═══════════════════════════════════════════════════ */

export function DesignStudio({ entry, onBack, onIterate, sourceImage }: DesignStudioProps) {
  const [isIterating, setIsIterating] = useState(false);
  const [activeIterationLabel, setActiveIterationLabel] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingListData | null>(null);
  const [shoppingListLoading, setShoppingListLoading] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const studioTopRef = useRef<HTMLDivElement>(null);

  // Infer type mood and load fonts
  const typeMood = useMemo(() => inferTypeMood(entry.option), [entry.option]);
  const tp = useMemo(() => getTypePalette(typeMood), [typeMood]);
  const accent = useAccentColor(entry.option.palette);

  useEffect(() => {
    loadStudioFonts(typeMood);
  }, [typeMood]);

  // Generate shopping list on entry change
  const handleGenerateShoppingList = useCallback(async () => {
    if (shoppingListLoading) return;
    setShoppingListLoading(true);
    try {
      const sessionId = `studio-${entry.id}-${Date.now()}`;
      const list = await generateShoppingList(
        entry.option.name,
        entry.option.mood,
        entry.option.fullPlan,
        entry.option.keyChanges.join('\n'),
        sessionId
      );
      setShoppingList(list);
    } catch (err) {
      console.error('Shopping list generation failed:', err);
    } finally {
      setShoppingListLoading(false);
    }
  }, [entry, shoppingListLoading]);

  const handleIterate = useCallback(async (prompt: string) => {
    if (!onIterate || isIterating || !prompt.trim()) return;
    setIsIterating(true);
    setActiveIterationLabel(prompt);
    try {
      await onIterate(prompt);
      studioTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Iteration failed:', err);
    } finally {
      setIsIterating(false);
      setActiveIterationLabel(null);
    }
  }, [onIterate, isIterating]);

  const handleShare = useCallback(async () => {
    if (!entry.option.visualizationImage) return;
    setSharing(true);
    try {
      const byteString = atob(entry.option.visualizationImage);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: 'image/png' });
      if (navigator.share) {
        const file = new File([blob], `${entry.option.name}.png`, { type: 'image/png' });
        await navigator.share({ title: entry.option.name, text: entry.option.mood, files: [file] });
      } else {
        const link = document.createElement('a');
        link.download = `${entry.option.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setSharing(false);
    }
  }, [entry.option.name, entry.option.mood, entry.option.visualizationImage]);

  return (
    <AnimatePresence>
      <motion.div
        ref={studioTopRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-neutral-700"
        id="design-studio-content"
        role="article"
        aria-label={`Design Studio: ${entry.option.name}`}
      >
        {/* Iteration loading overlay */}
        {isIterating && (
          <div className="fixed inset-0 z-[60] pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-800 overflow-hidden">
              <motion.div
                className="h-full bg-white/60"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                style={{ width: '40%' }}
              />
            </div>
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-xl border border-white/10 px-5 py-2.5 flex items-center gap-3 pointer-events-auto">
              <Loader2 size={16} className="animate-spin text-white" />
              <span className="text-sm text-neutral-200" style={{ fontFamily: tp.body }}>Iterating…</span>
            </div>
          </div>
        )}

        {/* Fixed Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4" role="navigation" aria-label="Design studio controls">
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Back to lookbook"
          >
            <ArrowLeft size={18} className="text-white" />
          </motion.button>
          <div className="flex items-center gap-3">
            <DesignExportMenu entry={entry} sourceImage={sourceImage} compact />
            <button
              onClick={handleShare}
              disabled={sharing}
              className="w-10 h-10 bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label="Share design"
            >
              <SoIcon name="share" size={18} style={{ filter: 'brightness(0) invert(1)' }} />
            </button>
          </div>
        </nav>

        {/* Hero */}
        <StudioHero entry={entry} tp={tp} accent={accent} />

        {/* Divider */}
        <div className="max-w-5xl mx-auto px-6 sm:px-12 lg:px-20">
          <div className="border-t border-neutral-800" />
        </div>

        {/* Brief */}
        <StudioBrief entry={entry} tp={tp} accent={accent} />

        {/* Color Palette Extractor */}
        {entry.option.visualizationImage && (
          <div className="max-w-5xl mx-auto px-6 sm:px-12 lg:px-20 pb-10">
            <RevealSection>
              <div className="border-t border-neutral-800/50 pt-10">
                <h2
                  className="text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-6"
                  style={{ fontFamily: tp.body }}
                >
                  Extracted Colors
                </h2>
                <div className="[&_h4]:text-neutral-500 [&_span]:text-neutral-500 [&_button]:text-neutral-400 [&_button]:border-neutral-800 [&_button]:bg-neutral-900 [&_button:hover]:border-neutral-600">
                  <ColorPalette imageBase64={entry.option.visualizationImage} />
                </div>
              </div>
            </RevealSection>
          </div>
        )}

        {/* Design Annotations */}
        {entry.option.visualizationImage && (
          <div className="max-w-5xl mx-auto px-6 sm:px-12 lg:px-20 pb-10">
            <RevealSection>
              <div className="border-t border-neutral-800/50 pt-10">
                <div className="[&_h4]:text-neutral-500 [&_button]:text-neutral-300 [&>div>div:first-child_button:last-child]:bg-neutral-800 [&>div>div:first-child_button:last-child]:hover:bg-neutral-700 [&>div>div:first-child_button:last-child.bg-emerald-600]:bg-emerald-600">
                  <DesignAnnotations
                    imageBase64={entry.option.visualizationImage}
                    annotations={annotations}
                    onAnnotationsChange={setAnnotations}
                  />
                </div>
              </div>
            </RevealSection>
          </div>
        )}

        {/* Regenerate with Tweaks */}
        {onIterate && (
          <div className="max-w-5xl mx-auto px-6 sm:px-12 lg:px-20 pb-10">
            <RevealSection>
              <div className="border-t border-neutral-800/50 pt-10">
                <div className="[&_h4]:text-neutral-500 [&_p]:text-neutral-500 [&_button]:border-neutral-800 [&_button]:bg-neutral-900 [&_button]:text-neutral-300 [&_button:hover]:border-neutral-600 [&_input]:bg-neutral-900 [&_input]:border-neutral-800 [&_input]:text-neutral-200 [&_input]:placeholder-neutral-600">
                  <RegenerateTweaks
                    onTweak={handleIterate}
                    designName={entry.option.name}
                  />
                </div>
              </div>
            </RevealSection>
          </div>
        )}

        {/* Iterate */}
        <StudioIterate
          tp={tp}
          onIterate={handleIterate}
          isIterating={isIterating}
          activeLabel={activeIterationLabel}
        />

        {/* Shop This Look */}
        <div className="max-w-5xl mx-auto px-6 sm:px-12 lg:px-20 pb-16">
          <RevealSection>
            <div className="border-t border-neutral-800/50 pt-14">
              <h2
                className="text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-2"
                style={{ fontFamily: tp.body }}
              >
                Shop This Look
              </h2>
              <p className="text-sm text-neutral-500 mb-8 italic" style={{ fontFamily: tp.body }}>
                Everything you need to bring this design to life
              </p>

              {shoppingList ? (
                <div className="[&_section]:bg-neutral-900 [&_section]:border-neutral-800 [&_h2]:text-neutral-100 [&_p]:text-neutral-400">
                  <ShoppingList shoppingList={shoppingList} sessionId={shoppingList.sessionId} />
                </div>
              ) : (
                <button
                  onClick={handleGenerateShoppingList}
                  disabled={shoppingListLoading}
                  className="flex items-center gap-3 px-8 py-4 border border-neutral-800 text-neutral-300 hover:bg-neutral-900 hover:border-neutral-600 transition-all disabled:opacity-50"
                  style={{ fontFamily: tp.body }}
                >
                  {shoppingListLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <ShoppingCart size={18} />
                  )}
                  {shoppingListLoading ? 'Generating shopping list…' : 'Generate Shopping List'}
                </button>
              )}
            </div>
          </RevealSection>
        </div>

        {/* Save / Share / Export bar */}
        <div className="max-w-5xl mx-auto px-6 sm:px-12 lg:px-20 pb-16">
          <RevealSection>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 pb-4">
              <DesignExportMenu entry={entry} sourceImage={sourceImage} />
              <button
                onClick={handleShare}
                disabled={sharing}
                className="w-full sm:w-auto px-8 py-3 border border-neutral-700 text-sm text-neutral-300 hover:bg-neutral-900 hover:border-neutral-500 transition-all flex items-center justify-center gap-2"
                style={{ fontFamily: tp.body }}
              >
                <SoIcon name="share" size={16} style={{ filter: 'brightness(0) invert(0.7)' }} />
                {sharing ? 'Sharing…' : 'Share This Design'}
              </button>
            </div>
          </RevealSection>
        </div>

        <div className="h-24" />
      </motion.div>
    </AnimatePresence>
  );
}

export default DesignStudio;
