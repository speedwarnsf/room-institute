/**
 * SharePage — Public shareable design view
 * Renders a single design at /share/:id accessible without auth
 */

import { useEffect, useState } from 'react';
import { LayoutGrid, Palette, ArrowRight, Sparkles } from 'lucide-react';
import type { DesignOption } from '../types';
import { supabase } from '../services/auth';
import { useI18n } from '../i18n/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface SharedDesign {
  id: string;
  design_name: string;
  mood: string;
  palette: string[];
  key_changes: string[];
  visualization_thumb?: string;
  framework_rationale?: string;
  created_at: string;
  sharer_name?: string;
}

export function SharePage({ shareId }: { shareId: string }) {
  const { t } = useI18n();
  const [design, setDesign] = useState<SharedDesign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShare() {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('shared_designs')
          .select('*')
          .eq('share_id', shareId)
          .single();

        if (fetchError || !data) {
          setError('This design link is no longer available.');
          return;
        }
        setDesign(data as SharedDesign);
      } catch {
        setError('Failed to load the shared design.');
      } finally {
        setLoading(false);
      }
    }
    loadShare();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center">
        <div className="animate-pulse text-stone-400">{t('loading.room')}</div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">{t('error.notFound')}</h1>
        <p className="text-stone-500 dark:text-stone-400 mb-8 text-center max-w-md">{error}</p>
        <a href="/" className="px-6 py-3 bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2">
          {t('share.designYourRoom')} <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      {/* Header */}
      <header className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <LayoutGrid className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-serif text-lg font-bold text-stone-800 dark:text-stone-100 tracking-tight">ZenSpace</span>
          </a>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <a
              href="/"
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t('share.designYourRoom')}
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero visualization */}
        {design.visualization_thumb && (
          <div className="mb-8 overflow-hidden border border-stone-200 dark:border-stone-700">
            <img
              src={design.visualization_thumb}
              alt={`${design.design_name} visualization`}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Design info */}
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
              {t('share.sharedDesign')}
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 mb-3">
              {design.design_name}
            </h1>
            <p className="text-lg text-stone-600 dark:text-stone-300 leading-relaxed">
              {design.mood}
            </p>
          </div>

          {/* Palette */}
          {design.palette && design.palette.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2">
                <Palette className="w-3.5 h-3.5" /> Color Palette
              </h3>
              <div className="flex gap-2">
                {design.palette.map((color, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 border-2 border-stone-200 dark:border-stone-600" style={{ backgroundColor: color }} />
                    <span className="text-[10px] text-stone-400 font-mono">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key changes */}
          {design.key_changes && design.key_changes.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Key Changes</h3>
              <ul className="space-y-2">
                {design.key_changes.map((change, i) => (
                  <li key={i} className="text-sm text-stone-600 dark:text-stone-400 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">--</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 p-6 text-center mt-8">
            <h3 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
              {t('share.designYourRoom')}
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
              {t('share.createdWith')}
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {t('share.designYourRoom')}
            </a>
          </div>

          {/* Attribution */}
          <p className="text-center text-xs text-stone-400 dark:text-stone-500 mt-8">
            {t('share.createdWith')}
          </p>
        </div>
      </main>
    </div>
  );
}

export default SharePage;
