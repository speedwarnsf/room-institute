import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { LOCALE_NAMES, type SupportedLocale } from '../i18n/translations';

/**
 * Compact language switcher — globe icon with dropdown
 * Designed to sit in the header bar of buyer-facing pages
 */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  const locales = Object.entries(LOCALE_NAMES) as [SupportedLocale, string][];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-stone-400 hover:text-stone-200 transition-colors p-1"
        aria-label={t('nav.changeLanguage')}
      >
        <Globe className="w-4 h-4" />
        <span className="text-[10px] uppercase tracking-wider">{locale}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-stone-900 border border-stone-700 shadow-xl z-50 min-w-[140px]">
          {locales.map(([code, name]) => (
            <button
              key={code}
              onClick={() => {
                setLocale(code);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                code === locale
                  ? 'text-emerald-400 bg-stone-800'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-stone-100'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
