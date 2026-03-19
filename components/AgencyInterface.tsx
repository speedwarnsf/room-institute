import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import GlobalTypeset from './GlobalTypeset';
import { QrCode, Smartphone, BarChart3, ArrowRight, Clock, Eye, Layers } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Agency Interface — the sales page for real estate brokerages.
 * Shows value prop, engagement proof, agent workflow demo, and QR card product.
 */
export function AgencyInterface() {
  const { t } = useI18n();

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Nunito:wght@300;400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200" style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', lineHeight: '1.6' }}>
      <GlobalTypeset />

      {/* ═══ Hero ═══ */}
      <section className="relative min-h-[80vh] flex items-end">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-900" />
        <div className="relative max-w-5xl mx-auto px-6 pb-16 pt-32 md:pb-24">
          <p className="text-emerald-500 text-sm tracking-widest uppercase mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {t('agency.forBrokerages')}
          </p>
          <h1
            className="text-5xl md:text-7xl font-bold text-stone-100 leading-[1.05] mb-6"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            {t('agency.hero')}
          </h1>
          <p className="text-stone-400 text-lg md:text-xl max-w-2xl mb-10">
            {t('agency.heroDescription')}
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#how-it-works"
              className="px-8 py-4 bg-emerald-500 text-stone-900 font-bold hover:bg-emerald-400 transition-colors text-sm tracking-wide uppercase"
            >
              {t('agency.seeHowItWorks')}
            </a>
            <a
              href="#results"
              className="px-8 py-4 border border-stone-600 text-stone-300 hover:text-stone-100 hover:border-stone-400 transition-colors text-sm tracking-wide uppercase"
            >
              {t('agency.viewEngagementData')}
            </a>
          </div>
        </div>
      </section>

      {/* ═══ Value Props ═══ */}
      <section className="max-w-5xl mx-auto px-6 py-20 md:py-28">
        <Reveal>
          <p className="text-emerald-500 text-xs tracking-widest uppercase mb-6">{t('agency.whatChanges')}</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <Reveal>
            <div>
              <Clock className="w-6 h-6 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-stone-100 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {t('agency.longerVisits')}
              </h3>
              <p className="text-stone-400 text-[13px] leading-relaxed">
                {t('agency.longerVisitsDesc')}
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div>
              <Eye className="w-6 h-6 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-stone-100 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {t('agency.deeperEngagement')}
              </h3>
              <p className="text-stone-400 text-[13px] leading-relaxed">
                {t('agency.deeperEngagementDesc')}
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div>
              <Layers className="w-6 h-6 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-stone-100 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {t('agency.brandElevated')}
              </h3>
              <p className="text-stone-400 text-[13px] leading-relaxed">
                {t('agency.brandElevatedDesc')}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ How It Works (for agents) ═══ */}
      <section id="how-it-works" className="bg-stone-950 border-y border-stone-800">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
          <Reveal>
            <p className="text-emerald-500 text-xs tracking-widest uppercase mb-4">{t('agency.forYourAgents')}</p>
            <h2 className="text-3xl md:text-5xl font-bold text-stone-100 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {t('agency.threeSteps')}
            </h2>
            <p className="text-stone-500 text-sm mb-12 max-w-xl">
              {t('agency.noSkillsNeeded')}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Reveal>
              <div className="border border-stone-800 bg-stone-900 p-8">
                <div className="text-emerald-500 text-4xl font-bold mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>1</div>
                <h3 className="text-lg font-bold text-stone-200 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {t('agency.step1Title')}
                </h3>
                <p className="text-stone-400 text-[13px] leading-relaxed">
                  {t('agency.step1Desc')}
                </p>
              </div>
            </Reveal>
            <Reveal>
              <div className="border border-stone-800 bg-stone-900 p-8">
                <div className="text-emerald-500 text-4xl font-bold mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>2</div>
                <h3 className="text-lg font-bold text-stone-200 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {t('agency.step2Title')}
                </h3>
                <p className="text-stone-400 text-[13px] leading-relaxed">
                  {t('agency.step2Desc')}
                </p>
              </div>
            </Reveal>
            <Reveal>
              <div className="border border-stone-800 bg-stone-900 p-8">
                <div className="text-emerald-500 text-4xl font-bold mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>3</div>
                <h3 className="text-lg font-bold text-stone-200 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {t('agency.step3Title')}
                </h3>
                <p className="text-stone-400 text-[13px] leading-relaxed">
                  {t('agency.step3Desc')}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ The QR Card Product ═══ */}
      <section className="max-w-5xl mx-auto px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div>
              <p className="text-emerald-500 text-xs tracking-widest uppercase mb-4">{t('agency.physicalProduct')}</p>
              <h2 className="text-3xl md:text-4xl font-bold text-stone-100 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {t('agency.cardsFeel')}
              </h2>
              <p className="text-stone-400 text-[13px] leading-relaxed mb-6">
                {t('agency.cardsDesc1')}
              </p>
              <p className="text-stone-400 text-[13px] leading-relaxed mb-6">
                {t('agency.cardsDesc2')}
              </p>
              <div className="space-y-3 text-stone-500 text-[13px]">
                <div className="flex items-start gap-3">
                  <div className="w-1 h-1 bg-emerald-500 mt-2 flex-shrink-0" />
                  <span>{t('agency.cardFeature1')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1 h-1 bg-emerald-500 mt-2 flex-shrink-0" />
                  <span>{t('agency.cardFeature2')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1 h-1 bg-emerald-500 mt-2 flex-shrink-0" />
                  <span>{t('agency.cardFeature3')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1 h-1 bg-emerald-500 mt-2 flex-shrink-0" />
                  <span>{t('agency.cardFeature4')}</span>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal>
            {/* Card mockup */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Back card (shadow) */}
                <div
                  className="absolute top-3 left-3 bg-stone-800 border border-stone-700"
                  style={{ width: 256, height: 256, transform: 'rotate(3deg)' }}
                />
                {/* Front card */}
                <div
                  className="relative bg-stone-950 border border-stone-700 flex flex-col items-center justify-between p-6"
                  style={{ width: 256, height: 256 }}
                >
                  <div className="text-center">
                    <p className="text-emerald-500 text-[10px] tracking-widest uppercase mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Room
                    </p>
                    <p className="text-stone-300 text-xs font-medium">Living Room</p>
                  </div>

                  {/* QR placeholder */}
                  <div className="w-32 h-32 border border-stone-700 bg-stone-900 flex items-center justify-center">
                    <QrCode className="w-20 h-20 text-stone-600" />
                  </div>

                  <div className="text-center">
                    <p className="text-stone-500 text-[10px]">1150 Folsom St</p>
                    <p className="text-stone-600 text-[9px] mt-0.5">Scan to explore design possibilities</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ Engagement Results ═══ */}
      <section id="results" className="bg-stone-950 border-y border-stone-800">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
          <Reveal>
            <p className="text-emerald-500 text-xs tracking-widest uppercase mb-4">{t('agency.measuredImpact')}</p>
            <h2 className="text-3xl md:text-5xl font-bold text-stone-100 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {t('agency.numbersTitle')}
            </h2>
            <p className="text-stone-500 text-sm mb-12 max-w-xl">
              {t('agency.numbersDesc')}
            </p>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { value: '—', label: t('agency.avgTime'), note: t('agency.dataCollecting') },
              { value: '—', label: t('agency.qrScans'), note: t('agency.dataCollecting') },
              { value: '—', label: t('agency.goDeeper'), note: t('agency.dataCollecting') },
              { value: '—', label: t('agency.returnVisits'), note: t('agency.dataCollecting') },
            ].map(stat => (
              <Reveal key={stat.label}>
                <div className="border border-stone-800 bg-stone-900 p-5 text-center">
                  <div className="text-3xl font-bold text-emerald-500 mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-stone-400 mb-2">{stat.label}</div>
                  <div className="text-[10px] text-stone-600">{stat.note}</div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="border border-stone-800 bg-stone-900 p-8">
              <p className="text-stone-400 text-[13px] leading-relaxed" data-no-smooth>
                {t('agency.metricsNote')}
              </p>
              <p className="text-stone-500 text-[13px] mt-3 leading-relaxed" data-no-smooth>
                {t('agency.proofNote')}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ Your Listings, Your Brand ═══ */}
      <section className="max-w-5xl mx-auto px-6 py-20 md:py-28">
        <Reveal>
          <p className="text-emerald-500 text-xs tracking-widest uppercase mb-4">{t('agency.integration')}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-100 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {t('agency.linksBackToYou')}
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Reveal>
            <div className="border border-stone-800 bg-stone-950 p-6">
              <h4 className="text-stone-200 font-bold mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{t('agency.listingsFeatured')}</h4>
              <p className="text-stone-400 text-[13px] leading-relaxed">
                {t('agency.listingsFeaturedDesc')}
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="border border-stone-800 bg-stone-950 p-6">
              <h4 className="text-stone-200 font-bold mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{t('agency.linksToBrokerage')}</h4>
              <p className="text-stone-400 text-[13px] leading-relaxed">
                {t('agency.linksToBrokerageDesc')}
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="border border-stone-800 bg-stone-950 p-6">
              <h4 className="text-stone-200 font-bold mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{t('agency.qrCardsIdentity')}</h4>
              <p className="text-stone-400 text-[13px] leading-relaxed">
                {t('agency.qrCardsIdentityDesc')}
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="border border-stone-800 bg-stone-950 p-6">
              <h4 className="text-stone-200 font-bold mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{t('agency.designPartner')}</h4>
              <p className="text-stone-400 text-[13px] leading-relaxed">
                {t('agency.designPartnerDesc')}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="bg-stone-950 border-t border-stone-800">
        <div className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-bold text-stone-100 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {t('agency.readyToSee')}
            </h2>
            <p className="text-stone-400 mb-10 max-w-xl mx-auto" data-no-smooth>
              {t('agency.deployNote')}
            </p>
            <a
              href="mailto:dustin@room.institute"
              className="inline-block px-10 py-4 bg-emerald-500 text-stone-900 font-bold hover:bg-emerald-400 transition-colors text-sm tracking-wide uppercase"
            >
              {t('agency.startConversation')}
            </a>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-800 py-8">
        <p className="max-w-5xl mx-auto px-6 text-center text-stone-600 text-xs" data-no-smooth>
          {t('agency.footerText')}
        </p>
      </footer>
    </div>
  );
}
