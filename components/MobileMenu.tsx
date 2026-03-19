/**
 * MobileMenu — slide-out hamburger menu for mobile navigation
 * Renders below sm breakpoint only. Desktop keeps inline nav.
 */
import { useState } from 'react';
import { Menu, X, Palette, Home, FolderOpen, ArrowLeft } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { NetworkStatus } from './NetworkStatus';
import { UserMenu } from './UserMenu';
import { useI18n } from '../i18n/I18nContext';

interface MobileMenuProps {
  onNavigate: (target: string) => void;
  onReset: () => void;
  showBack: boolean;
  showSave: boolean;
  isSaved: boolean;
  onSave: () => void;
  onOpenPricing: () => void;
  onOpenAuth: () => void;
  canProject: boolean;
  onUpgradeProject: () => void;
}

export function MobileMenu({
  onNavigate,
  onReset,
  showBack,
  showSave,
  isSaved,
  onSave,
  onOpenPricing,
  onOpenAuth,
  canProject,
  onUpgradeProject,
}: MobileMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const go = (target: string) => {
    onNavigate(target);
    setOpen(false);
  };

  return (
    <div className="sm:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        aria-label={t('nav.openMenu')}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay + Panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={() => setOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-stone-800 z-[70] shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-stone-200 dark:border-stone-700">
              <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                aria-label={t('nav.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-2">
              {showBack && (
                <button
                  onClick={() => { onReset(); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>{(t as any)('app.button.new')}</span>
                </button>
              )}

              <button
                onClick={() => go('DISCOVER')}
                className="w-full flex items-center gap-3 px-4 py-3 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
              >
                <Palette className="w-5 h-5" />
                <span>{(t as any)('app.button.discover')}</span>
              </button>

              <button
                onClick={() => go('ROOMS')}
                className="w-full flex items-center gap-3 px-4 py-3 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
              >
                <Home className="w-5 h-5" />
                <span>{(t as any)('app.button.rooms')}</span>
              </button>

              <button
                onClick={() => {
                  if (!canProject) {
                    onUpgradeProject();
                    setOpen(false);
                    return;
                  }
                  go('PROJECTS');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
              >
                <FolderOpen className="w-5 h-5" />
                <span>{(t as any)('app.button.projects')}</span>
              </button>

              {showSave && (
                <button
                  onClick={() => { onSave(); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 ${
                    isSaved
                      ? 'text-stone-600 dark:text-stone-300'
                      : 'text-emerald-700 dark:text-emerald-400'
                  } hover:bg-stone-100 dark:hover:bg-stone-700`}
                >
                  <Home className="w-5 h-5" />
                  <span>{isSaved ? (t as any)('app.button.saved') : (t as any)('app.button.save')}</span>
                </button>
              )}

              {/* Divider */}
              <div className="my-2 mx-4 border-t border-stone-200 dark:border-stone-700" />

              {/* Settings */}
              <div className="px-4 py-3">
                <LanguageSwitcher />
              </div>
              <div className="px-4 py-3">
                <ThemeToggle />
              </div>
              <div className="px-4 py-3">
                <NetworkStatus showIndicator={true} />
              </div>

              {/* Divider */}
              <div className="my-2 mx-4 border-t border-stone-200 dark:border-stone-700" />

              {/* User */}
              <div className="px-4 py-3">
                <UserMenu
                  onOpenPricing={() => { onOpenPricing(); setOpen(false); }}
                  onOpenAuth={() => { onOpenAuth(); setOpen(false); }}
                />
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
