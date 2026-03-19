import { Home, ArrowLeft } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export function NotFound() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-6xl font-bold text-stone-300 dark:text-stone-700">{t('notFound.404')}</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {t('notFound.title')}
          </h2>
          <p className="text-stone-600 dark:text-stone-400">
            {t('notFound.description')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('notFound.goBack')}
          </button>
          <a
            href="/"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            {t('notFound.home')}
          </a>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
