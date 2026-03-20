import { useTheme } from './ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'system':
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return (t as any)('theme.lightMode');
      case 'dark':
        return (t as any)('theme.darkMode');
      case 'system':
        return (t as any)('theme.systemTheme');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      aria-label={(t as any)('theme.currentClickToChange').replace('{mode}', getLabel())}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  );
}
