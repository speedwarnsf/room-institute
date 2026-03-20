import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Loader2 } from 'lucide-react';
import GlobalTypeset from './GlobalTypeset';
import { track, trackTimeOnPage, trackVisibility } from '../services/tracking';
import { useI18n } from '../i18n/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { translateRoomLabel } from '../i18n/roomLabels';

/** Tracks time a spread section is visible */
function TrackedSection({
  children,
  section,
  designId,
  className = '',
}: {
  children: React.ReactNode;
  section: string;
  designId: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanup = trackVisibility(ref.current, {
      eventType: 'spread_section',
      designId,
      metadata: { section },
      threshold: 0.3,
    });
    return cleanup;
  }, [designId, section]);

  return <div ref={ref} className={className}>{children}</div>;
}

interface MaterialCallout {
  material: string;
  description: string;
}

interface SpreadData {
  headline: string;
  narrative: string;
  typeMood: string;
  designPhilosophy: string;
  materialCallouts: MaterialCallout[];
  spatialNarrative: string;
  lightStudy: string;
  livingVignette: string;
  pullQuote: string;
}

interface DesignInfo {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  frameworks: string[];
  palette: string[];
  products: Array<{
    name: string;
    brand: string;
    category: string;
    price_range: string;
    description: string;
  }>;
}

interface DesignSpreadProps {
  design: DesignInfo;
  listingAddress: string;
  roomLabel: string;
  onBack: () => void;
}

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const TYPE_FONTS: Record<string, { heading: string; body: string }> = {
  'warm-editorial': { heading: 'Cormorant Garamond, serif', body: 'Nunito, sans-serif' },
  'stark-minimal': { heading: 'Nunito, sans-serif', body: 'Nunito, sans-serif' },
  'bold-expressive': { heading: 'Cormorant Garamond, serif', body: 'Nunito, sans-serif' },
  'classic-refined': { heading: 'Cormorant Garamond, serif', body: 'Nunito, sans-serif' },
  'raw-industrial': { heading: 'Nunito, sans-serif', body: 'Nunito, sans-serif' },
};

export default function DesignSpread({ design, listingAddress, roomLabel, onBack }: DesignSpreadProps) {
  const { t, locale } = useI18n();
  const [spread, setSpread] = useState<SpreadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.3]);

  const accent = useMemo(() => {
    if (!design.palette?.length) return '#a3a3a3';
    return design.palette[Math.floor(design.palette.length / 2)] || design.palette[0] || '#a3a3a3';
  }, [design.palette]);

  const fonts = useMemo(() => TYPE_FONTS[spread?.typeMood || 'warm-editorial'] || TYPE_FONTS['warm-editorial']!, [spread?.typeMood]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetch('/api/designs/spread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designId: design.id, locale }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to generate spread');
        return res.json();
      })
      .then(data => {
        if (!cancelled) {
          setSpread(data.spread);
          track({ eventType: 'spread_loaded', designId: design.id, metadata: { cached: data.cached } });
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [design.id, locale]);

  // Track time on spread
  useEffect(() => {
    if (!spread) return;
    const stop = trackTimeOnPage({ designId: design.id, metadata: { view: 'spread' } });
    return () => { stop(); };
  }, [spread, design.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-6">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-stone-300 text-lg" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {t('spread.loading')}
          </p>
        </div>
      </div>
    );
  }

  if (error || !spread) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error || t('error.generic')}</p>
          <button onClick={onBack} className="text-emerald-500 hover:text-emerald-400 text-sm">
            {t('nav.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900" style={{ fontFamily: fonts.body, fontSize: '14px', lineHeight: '1.6' }}>
      <GlobalTypeset />

      {/* Sticky back button */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-stone-900/80 backdrop-blur-sm border-b border-stone-800/50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-stone-400 hover:text-emerald-500 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            {t('nav.back')}
          </button>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <a href="https://room.institute" className="hover:opacity-80 transition-opacity">
              <img src="/room-logo.png" alt="Room" style={{ height: 20 }} />
            </a>
          </div>
        </div>
      </div>

      {/* Hero — cropped dramatic with parallax */}
      <div ref={heroRef} className="relative h-[85vh] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{ y: heroY }}
        >
          <img
            src={design.imageUrl}
            alt={design.name}
            className="w-full h-full object-cover"
            style={{ minHeight: '110%' }}
          />
        </motion.div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent"
          style={{ opacity: heroOpacity }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="max-w-5xl mx-auto">
            <h1
              className="text-5xl md:text-7xl font-bold text-stone-100 mb-3 leading-[1.05]"
              style={{ fontFamily: fonts.heading }}
            >
              {spread.headline}
            </h1>
            <p className="text-stone-300 text-lg md:text-xl max-w-2xl mb-3" style={{ fontFamily: fonts.heading }}>
              {design.name}
            </p>
            <p className="text-emerald-500 text-xs tracking-widest uppercase" style={{ fontFamily: fonts.body }}>
              {translateRoomLabel(roomLabel, t as (key: string) => string)} — {listingAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Palette strip */}
      {design.palette?.length > 0 && (
        <div className="flex h-2">
          {design.palette.map((color, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: color }} />
          ))}
        </div>
      )}

      {/* Editorial narrative */}
      <TrackedSection section="narrative" designId={design.id}>
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <RevealSection>
          <div className="prose-stone text-stone-300 text-[15px] leading-relaxed space-y-6">
            <ReactMarkdown>{spread.narrative}</ReactMarkdown>
          </div>
        </RevealSection>
      </div>

      </TrackedSection>

      {/* Pull quote */}
      <RevealSection>
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
          <blockquote className="border-l-2 pl-8 md:pl-12" style={{ borderColor: accent }}>
            <p
              className="text-2xl md:text-4xl text-stone-200 leading-snug font-light"
              style={{ fontFamily: fonts.heading }}
            >
              {spread.pullQuote}
            </p>
          </blockquote>
        </div>
      </RevealSection>

      <TrackedSection section="materials" designId={design.id}>
      {/* Material callouts — grid */}
      {spread.materialCallouts?.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 py-12">
          <RevealSection>
            <p className="text-emerald-500 text-xs tracking-widest uppercase mb-8" style={{ fontFamily: fonts.body }}>
              {t('spread.materials')}
            </p>
          </RevealSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {spread.materialCallouts.map((mc, i) => (
              <RevealSection key={i}>
                <div className="border-t border-stone-800 pt-6">
                  <h4
                    className="text-lg font-bold text-stone-200 mb-3"
                    style={{ fontFamily: fonts.heading }}
                  >
                    {mc.material}
                  </h4>
                  <p className="text-stone-400 text-[13px] leading-relaxed">
                    {mc.description}
                  </p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      )}

      </TrackedSection>

      {/* Spatial narrative + Light study — two column */}
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          <RevealSection>
            <p className="text-emerald-500 text-xs tracking-widest uppercase mb-4" style={{ fontFamily: fonts.body }}>
              {t('spread.spatialFlow')}
            </p>
            <p className="text-stone-300 text-[14px] leading-relaxed">
              {spread.spatialNarrative}
            </p>
          </RevealSection>
          <RevealSection>
            <p className="text-emerald-500 text-xs tracking-widest uppercase mb-4" style={{ fontFamily: fonts.body }}>
              {t('spread.lightStudy')}
            </p>
            <p className="text-stone-300 text-[14px] leading-relaxed">
              {spread.lightStudy}
            </p>
          </RevealSection>
        </div>
      </div>

      {/* Design philosophy */}
      <RevealSection>
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          <div className="border border-stone-800 bg-stone-950 p-8 md:p-12">
            <p className="text-emerald-500 text-xs tracking-widest uppercase mb-4" style={{ fontFamily: fonts.body }}>
              {t('spread.designPhilosophy')}
            </p>
            <p className="text-stone-300 text-[14px] leading-relaxed">
              {spread.designPhilosophy}
            </p>
            {design.frameworks?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {design.frameworks.map(f => (
                  <span key={f} className="px-3 py-1 bg-stone-800 text-emerald-500 text-xs font-medium tracking-wide uppercase">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </RevealSection>

      {/* Full frame — the complete design, uncropped */}
      <TrackedSection section="full_frame" designId={design.id}>
        <RevealSection>
          <div className="max-w-5xl mx-auto px-6 py-8">
            <img
              src={design.imageUrl}
              alt={`${design.name} — full frame`}
              className="w-full h-auto"
            />
          </div>
        </RevealSection>
      </TrackedSection>

      {/* Living vignette */}
      <RevealSection>
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          <p className="text-emerald-500 text-xs tracking-widest uppercase mb-6" style={{ fontFamily: fonts.body }}>
            {t('spread.aMoment')}
          </p>
          <p
            className="text-xl md:text-2xl text-stone-200 leading-relaxed font-light italic"
            style={{ fontFamily: fonts.heading }}
          >
            {spread.livingVignette}
          </p>
        </div>
      </RevealSection>

      <TrackedSection section="products" designId={design.id}>
      {/* Products shelf */}
      {design.products?.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <RevealSection>
            <p className="text-emerald-500 text-xs tracking-widest uppercase mb-8" style={{ fontFamily: fonts.body }}>
              {t('spread.specification')}
            </p>
          </RevealSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {design.products.map((p, i) => (
              <RevealSection key={i}>
                <a
                  href={(() => {
                    // Brand-direct linking: design brands go to their own sites
                    const BRAND_URLS: Record<string, string> = {
                      'herman miller': 'hermanmiller.com', 'knoll': 'knoll.com', 'flos': 'usa.flos.com',
                      'hay': 'hay.com', 'cb2': 'cb2.com', 'west elm': 'westelm.com', 'rh': 'rh.com',
                      'restoration hardware': 'rh.com', 'article': 'article.com', 'dwr': 'dwr.com',
                      'design within reach': 'dwr.com', 'vitra': 'vitra.com', 'terrain': 'shopterrain.com',
                      'serena & lily': 'serenaandlily.com', 'pottery barn': 'potterybarn.com',
                    };
                    const brandKey = (p.brand || '').toLowerCase().trim();
                    const brandDomain = BRAND_URLS[brandKey];
                    const q = encodeURIComponent((p.brand ? p.brand + ' ' : '') + p.name);
                    return brandDomain
                      ? `https://www.${brandDomain}/search?q=${q}`
                      : `https://www.google.com/search?q=${q}&tbm=shop`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-stone-800 bg-stone-950 p-6 hover:border-stone-600 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="text-stone-200 font-bold text-sm group-hover:text-emerald-400 transition-colors">{p.name}</h5>
                      <p className="text-stone-500 text-xs">{p.brand}</p>
                    </div>
                    <span className="text-emerald-500 text-xs font-medium">{p.price_range}</span>
                  </div>
                  <p className="text-stone-400 text-[12px] leading-relaxed">{p.description}</p>
                  <p className="text-emerald-500 text-[10px] uppercase tracking-widest mt-3 opacity-0 group-hover:opacity-100 transition-opacity">{t('products.shop')}</p>
                </a>
              </RevealSection>
            ))}
          </div>
        </div>
      )}

      </TrackedSection>

      {/* Design partner — visually separated as advertisement */}
      <div className="border-t-2 border-stone-700 bg-stone-900">
        <p className="text-stone-600 text-[9px] tracking-[0.3em] uppercase text-center pt-4 mb-0">{t('ad.label')}</p>
        <div className="max-w-sm mx-auto px-6 py-8 text-center">
          <h3 className="text-stone-200 text-2xl mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {t('ad.dreaming')}
          </h3>
          <p className="text-emerald-500 text-lg font-bold mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {t('ad.startDesigning')}
          </p>
          <p className="text-stone-400 text-[13px] leading-relaxed mb-6" data-no-smooth>
            {t('ad.description')}
          </p>
          <a
            href="https://www.modtagedesign.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track({ eventType: 'partner_clicked', designId: design.id, metadata: { partner: 'modtage', context: 'spread' } })}
            className="inline-block px-6 pt-[14px] pb-[12px] border border-stone-600 text-stone-300 hover:text-stone-100 hover:border-stone-400 text-xs tracking-widest uppercase transition-colors"
          >
            {t('ad.cta')}
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-800 py-8 mt-8">
        <p className="max-w-5xl mx-auto px-6 text-center text-stone-600 text-xs" data-no-smooth>
          {t('footer.poweredByFull')}
        </p>
      </footer>
    </div>
  );
}
