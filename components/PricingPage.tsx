/**
 * PricingPage — Premium two-card pricing with testimonials, before/after showcase, and FAQ
 */

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { createCheckoutSession } from '../services/subscription';
import { X, Check, Sparkles, Zap, Layers, Download, Home, Palette, ArrowRight, ChevronDown, ChevronUp, Quote, Star } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface PricingPageProps {
  onClose: () => void;
  onNeedAuth: () => void;
}

const PRO_FEATURES = [
  { icon: Zap, text: '50 design generations per month', highlight: true },
  { icon: Layers, text: '100 design iterations per month', highlight: true },
  { icon: Palette, text: 'Design Studio — refine any concept', highlight: false },
  { icon: Home, text: 'Save up to 10 rooms', highlight: false },
  { icon: Download, text: 'PDF export and high-res downloads', highlight: false },
  { icon: Sparkles, text: 'Product recommendations with shopping lists', highlight: false },
];

const FREE_LIMITS = [
  '3 lifetime design generations',
  '1 saved room',
  'No Design Studio access',
  'No PDF export',
];

const TESTIMONIALS = [
  {
    quote: 'I uploaded a photo of my cluttered living room and got three completely different design directions in under a minute. One of them became the blueprint for my entire renovation.',
    name: 'Sarah M.',
    location: 'Portland, OR',
    detail: 'Redesigned living room and home office',
  },
  {
    quote: 'The Design Studio let me iterate until the plan was exactly right. I went from "I hate this room" to a space I actually want to spend time in.',
    name: 'James K.',
    location: 'Austin, TX',
    detail: 'Complete bedroom transformation',
  },
  {
    quote: 'What sold me on Pro was the shopping list feature. It turned a vague design concept into an actionable plan with real products and price estimates.',
    name: 'Priya D.',
    location: 'Chicago, IL',
    detail: 'Kitchen and dining area redesign',
  },
  {
    quote: 'I used the free tier for my bedroom and immediately upgraded. The AI understands design theory better than most humans I have worked with.',
    name: 'Marcus T.',
    location: 'Denver, CO',
    detail: 'Whole-home design project',
  },
];

const BEFORE_AFTER_SHOWCASES = [
  {
    title: 'Studio Apartment — From Storage Unit to Sanctuary',
    before: 'A 400 sq ft studio overwhelmed with furniture, no clear zones, and harsh overhead lighting. Clothes piled on every surface.',
    after: 'Defined sleeping, working, and living zones using a low bookshelf divider. Warm layered lighting replaced the single overhead fixture. A capsule storage system cleared every surface.',
    style: 'Japandi Minimalism',
  },
  {
    title: 'Family Living Room — Toy Chaos to Dual-Purpose Calm',
    before: 'An open-plan living room buried under children\'s toys, mismatched furniture, and a TV dominating the wall. No cohesive color story.',
    after: 'Hidden toy storage integrated into a custom media console. A neutral earth-tone palette with textured throws and a statement rug unified the space. The TV was reframed with flanking shelves.',
    style: 'Modern Organic',
  },
  {
    title: 'Home Office — Spare Bedroom to Creative Studio',
    before: 'A guest bedroom repurposed as an office with a folding table as a desk, tangled cables, and zero personality. Poor natural light utilization.',
    after: 'A dedicated L-shaped desk positioned to maximize the window light. Cable management solved with under-desk trays. Gallery wall and plants added warmth without clutter.',
    style: 'Mid-Century Modern',
  },
];

const FAQ_ITEMS = [
  {
    q: 'What counts as a "generation" vs an "iteration"?',
    a: 'A generation is when you upload a new photo and get design concepts. An iteration is when you refine an existing design in the Design Studio — adjusting colors, swapping furniture, or tweaking the layout. Pro includes 50 generations and 100 iterations per month.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel with one click from your account settings. You keep Pro access until the end of your billing period. No questions asked.',
  },
  {
    q: 'What happens to my saved rooms if I downgrade?',
    a: 'Your rooms stay saved. On the free tier you can view all previously saved rooms but can only keep 1 active room for new designs. Upgrade again anytime to unlock them all.',
  },
  {
    q: 'How accurate are the product recommendations and prices?',
    a: 'Product suggestions are based on your specific design plan with real price ranges from major retailers. Prices are estimates and may vary. Shopping links take you directly to retailer search results.',
  },
  {
    q: 'Is there a limit on image uploads?',
    a: 'No limit on uploads themselves. The generation limits apply to AI design analysis. You can re-upload and re-frame your photo as many times as you want before using a generation.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'If you are not satisfied within the first 7 days, contact us for a full refund. After that, you can cancel anytime but refunds are not provided for partial billing periods.',
  },
];

export function PricingPage({ onClose, onNeedAuth }: PricingPageProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const PRO_FEATURES_I18N = [
    { icon: Zap, text: t('pricing.feature.generations'), highlight: true },
    { icon: Layers, text: t('pricing.feature.iterations'), highlight: true },
    { icon: Palette, text: t('pricing.feature.studio'), highlight: false },
    { icon: Home, text: t('pricing.feature.saveRooms'), highlight: false },
    { icon: Download, text: t('pricing.feature.export'), highlight: false },
    { icon: Sparkles, text: t('pricing.feature.products'), highlight: false },
  ];

  const FREE_LIMITS_I18N = [
    t('pricing.free.generations'),
    t('pricing.free.savedRoom'),
    t('pricing.free.noStudio'),
    t('pricing.free.noExport'),
  ];

  const handleCheckout = async (plan: 'monthly' | 'annual') => {
    if (!user) {
      onNeedAuth();
      return;
    }
    setLoading(plan);
    try {
      const url = await createCheckoutSession(plan);
      window.location.href = url;
    } catch (e) {
      console.error('Checkout error:', e);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="relative w-full max-w-3xl mb-12">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-stone-800 border border-stone-600 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
          aria-label="Close pricing"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">Room Pro</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {t('pricing.transformEveryRoom')}
          </h2>
          <p className="text-stone-400 max-w-lg mx-auto">
            {t('pricing.unlimitedDesign')}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Monthly */}
          <div className="bg-stone-900 border border-stone-700 p-6 sm:p-8 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-1">{t('pricing.monthly')}</h3>
            <p className="text-stone-500 text-sm mb-4">{t('pricing.perfectForProject')}</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$10</span>
              <span className="text-stone-400">{t('pricing.perMonth')}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {PRO_FEATURES_I18N.map((f) => (
                <li key={f.text} className="flex items-start gap-2.5 text-sm text-stone-300">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className={f.highlight ? 'font-medium text-white' : ''}>{f.text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('monthly')}
              disabled={!!loading}
              className="w-full py-3 bg-stone-700 text-white font-medium hover:bg-stone-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading === 'monthly' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>{t('pricing.getMonthly')} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

          {/* Annual — recommended */}
          <div className="bg-stone-900 border-2 border-emerald-500/40 p-6 sm:p-8 flex flex-col relative shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider">
              {t('pricing.bestValue')}
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{t('pricing.annual')}</h3>
            <p className="text-stone-500 text-sm mb-4">{t('pricing.forEnthusiasts')}</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$80</span>
              <span className="text-stone-400">{t('pricing.perYear')}</span>
              <span className="text-stone-500 text-sm ml-2 line-through">$120</span>
              <span className="text-emerald-400 text-sm ml-2">$6.67/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {PRO_FEATURES_I18N.map((f) => (
                <li key={f.text} className="flex items-start gap-2.5 text-sm text-stone-300">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className={f.highlight ? 'font-medium text-white' : ''}>{f.text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('annual')}
              disabled={!!loading}
              className="w-full py-3 bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              {loading === 'annual' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>{t('pricing.getAnnual')} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>

        {/* Free tier comparison */}
        <div className="bg-stone-900/50 border border-stone-800 p-5 mb-8">
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">{t('pricing.freeTier')}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FREE_LIMITS_I18N.map(limit => (
              <span key={limit} className="text-xs text-stone-500">{limit}</span>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-6 text-center">{t('pricing.proUsers')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-stone-900/70 border border-stone-800 p-5 flex flex-col">
                <Quote className="w-4 h-4 text-emerald-500/40 mb-3 flex-shrink-0" />
                <p className="text-sm text-stone-300 leading-relaxed flex-1 mb-4">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-2 border-t border-stone-800 pt-3">
                  <div className="w-8 h-8 bg-stone-800 flex items-center justify-center text-xs font-bold text-emerald-400">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">{t.name}</div>
                    <div className="text-[10px] text-stone-500">{t.location} — {t.detail}</div>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Before & After Showcase */}
        <div className="mb-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-6 text-center">{t('pricing.beforeAfter')}</h3>
          <div className="space-y-4">
            {BEFORE_AFTER_SHOWCASES.map((item) => (
              <div key={item.title} className="bg-stone-900/70 border border-stone-800 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5">{item.style}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-2">{t('pricing.before')}</div>
                    <div className="bg-stone-800/50 border border-stone-700 p-4 min-h-[80px] flex items-center">
                      <p className="text-xs text-stone-400 leading-relaxed">{item.before}</p>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70 mb-2">{t('pricing.after')}</div>
                    <div className="bg-emerald-900/10 border border-emerald-800/30 p-4 min-h-[80px] flex items-center">
                      <p className="text-xs text-stone-300 leading-relaxed">{item.after}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-6 text-center">{t('pricing.faq')}</h3>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, idx) => (
              <div key={idx} className="bg-stone-900/50 border border-stone-800">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-800/30 transition-colors"
                  aria-expanded={openFaq === idx}
                >
                  <span className="text-sm text-stone-200 font-medium pr-4">{item.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-stone-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-500 flex-shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 border-t border-stone-800">
                    <p className="text-sm text-stone-400 leading-relaxed pt-3">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mb-4">
          <button
            onClick={() => handleCheckout('annual')}
            disabled={!!loading}
            className="px-8 py-3 bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-50 inline-flex items-center gap-2 shadow-lg shadow-emerald-600/20 mb-4"
          >
            {loading === 'annual' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>{t('pricing.getProAnnual')} <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
          <br />
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 text-sm transition-colors"
          >
            {t('pricing.continueFree')}
          </button>
        </div>

        {/* Fine print */}
        <p className="text-center" style={{ fontSize: '10px', color: 'rgba(148,163,184,0.35)', lineHeight: '1.4' }}>
          {t('pricing.cancelAnytime')}
        </p>
      </div>
    </div>
  );
}
