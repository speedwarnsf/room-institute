import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { translations, type SupportedLocale, type Translations } from './translations';

/** RTL locales */
const RTL_LOCALES = new Set<SupportedLocale>(['ar']);

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: keyof Translations) => string;
  /** Get the Gemini language instruction for AI-generated content */
  geminiLanguageInstruction: string;
  /** Whether current locale is RTL */
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

/**
 * Detect locale from browser, URL param, or localStorage
 */
function detectLocale(): SupportedLocale {
  // 1. Check URL param: ?lang=fr
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');
  if (langParam && langParam in translations) {
    return langParam as SupportedLocale;
  }

  // 2. Check localStorage
  const stored = localStorage.getItem('room-institute-locale');
  if (stored && stored in translations) {
    return stored as SupportedLocale;
  }

  // 3. Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (browserLang && browserLang in translations) {
    return browserLang as SupportedLocale;
  }

  return 'en';
}

/**
 * Get Gemini prompt instruction for generating content in target language
 */
function getGeminiLanguageInstruction(locale: SupportedLocale): string {
  const instructions: Record<SupportedLocale, string> = {
    en: 'Write all content in English.',
    fr: 'Écris tout le contenu en français. Write all content in French.',
    de: 'Schreibe alle Inhalte auf Deutsch. Write all content in German.',
    es: 'Escribe todo el contenido en español. Write all content in Spanish.',
    zh: '用中文写所有内容。Write all content in Mandarin Chinese.',
    pt: 'Escreva todo o conteúdo em português. Write all content in Brazilian Portuguese.',
    ar: 'اكتب كل المحتوى باللغة العربية. Write all content in Arabic.',
  };
  return instructions[locale];
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(detectLocale);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem('room-institute-locale', newLocale);
    // Update URL param without reload
    const url = new URL(window.location.href);
    if (newLocale === 'en') {
      url.searchParams.delete('lang');
    } else {
      url.searchParams.set('lang', newLocale);
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  const t = useCallback((key: keyof Translations): string => {
    const dict = translations[locale] || translations.en;
    return (dict as any)[key] || (translations.en as any)[key] || key;
  }, [locale]);

  const geminiLanguageInstruction = getGeminiLanguageInstruction(locale);

  const isRTL = RTL_LOCALES.has(locale);

  // Set html lang + dir attributes
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [locale, isRTL]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, geminiLanguageInstruction, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to access translations
 */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback for components outside provider (shouldn't happen but safe)
    return {
      locale: 'en' as SupportedLocale,
      setLocale: () => {},
      t: (key: keyof Translations) => (translations.en as any)[key] || key,
      geminiLanguageInstruction: 'Write all content in English.',
      isRTL: false,
    };
  }
  return ctx;
}

/**
 * Get translation outside of React context (for class components)
 */
export function getTranslation(key: keyof Translations): string {
  const locale = (localStorage.getItem('room-institute-locale') || 'en') as SupportedLocale;
  const dict = translations[locale] || translations.en;
  return (dict as any)[key] || (translations.en as any)[key] || key;
}

export default I18nProvider;
