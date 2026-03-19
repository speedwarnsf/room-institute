import { useState, useCallback } from 'react';
import { Loader2, Sun, Moon, Minus, Plus, Paintbrush, Thermometer } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export interface TweakOption {
  id: string;
  labelKey: string;
  prompt: string;
  icon: React.ReactNode;
}

const TWEAKS: TweakOption[] = [
  { id: 'lighter', labelKey: 'tweaks.lighter', prompt: 'Make the overall design lighter and more airy, with brighter tones', icon: <Sun className="w-4 h-4" /> },
  { id: 'darker', labelKey: 'tweaks.darker', prompt: 'Make the design darker and moodier, with deeper tones', icon: <Moon className="w-4 h-4" /> },
  { id: 'minimal', labelKey: 'tweaks.moreMinimal', prompt: 'Simplify the design, remove visual clutter, keep only essential elements', icon: <Minus className="w-4 h-4" /> },
  { id: 'layered', labelKey: 'tweaks.moreLayered', prompt: 'Add more texture, layers, and visual richness to the design', icon: <Plus className="w-4 h-4" /> },
  { id: 'warmer', labelKey: 'tweaks.warmerTones', prompt: 'Shift the color palette warmer — more amber, terracotta, warm wood', icon: <Thermometer className="w-4 h-4" /> },
  { id: 'cooler', labelKey: 'tweaks.coolerTones', prompt: 'Shift the color palette cooler — more blue, grey, cool green', icon: <Paintbrush className="w-4 h-4" /> },
];

interface RegenerateTweaksProps {
  onTweak: (prompt: string) => Promise<void>;
  designName: string;
  className?: string;
}

export function RegenerateTweaks({ onTweak, designName, className = '' }: RegenerateTweaksProps) {
  const { t } = useI18n();
  const [activeTweak, setActiveTweak] = useState<string | null>(null);
  const [customTweak, setCustomTweak] = useState('');

  const handleTweak = useCallback(async (id: string, prompt: string) => {
    if (activeTweak) return;
    setActiveTweak(id);
    try {
      await onTweak(prompt);
    } finally {
      setActiveTweak(null);
    }
  }, [activeTweak, onTweak]);

  const handleCustomTweak = useCallback(async () => {
    if (!customTweak.trim() || activeTweak) return;
    setActiveTweak('custom');
    try {
      await onTweak(customTweak.trim());
      setCustomTweak('');
    } finally {
      setActiveTweak(null);
    }
  }, [customTweak, activeTweak, onTweak]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400 mb-1">
          {(t as any)('tweaks.regenerateWith')}
        </h4>
        <p className="text-xs text-stone-400 dark:text-stone-500">
          {(t as any)('tweaks.keepAdjust').replace('{designName}', designName)}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {TWEAKS.map(tweak => (
          <button
            key={tweak.id}
            onClick={() => handleTweak(tweak.id, tweak.prompt)}
            disabled={!!activeTweak}
            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border transition-all ${
              activeTweak === tweak.id
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : activeTweak
                  ? 'border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-600 cursor-not-allowed opacity-50'
                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600'
            }`}
          >
            {activeTweak === tweak.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              tweak.icon
            )}
            {(t as any)(tweak.labelKey)}
          </button>
        ))}
      </div>

      {/* Custom tweak */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customTweak}
          onChange={(e) => setCustomTweak(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCustomTweak()}
          placeholder={(t as any)('tweaks.customPlaceholder')}
          disabled={!!activeTweak}
          className="flex-1 px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
        />
        <button
          onClick={handleCustomTweak}
          disabled={!customTweak.trim() || !!activeTweak}
          className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {activeTweak === 'custom' ? <Loader2 className="w-4 h-4 animate-spin" /> : (t as any)('tweaks.go')}
        </button>
      </div>
    </div>
  );
}

export default RegenerateTweaks;
