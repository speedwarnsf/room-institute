import { ROOM_PRESETS, type RoomPreset } from '../services/roomPresets';
import { useI18n } from '../i18n/I18nContext';

interface RoomPresetsProps {
  onSelectPreset: (preset: RoomPreset) => void;
  selectedPresetId?: string | null;
}

export function RoomPresets({ onSelectPreset, selectedPresetId }: RoomPresetsProps) {
  const { t } = useI18n();
  return (
    <div className="w-full max-w-2xl space-y-3">
      <button
        className="w-full flex items-center justify-between text-left px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900"
        onClick={() => {
          const el = document.getElementById('presets-grid');
          if (el) el.classList.toggle('hidden');
        }}
      >
        <div>
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 uppercase tracking-widest">
            {(t as any)('prefs.quickPresets')}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {selectedPresetId
              ? (t as any)(`prefs.preset.${selectedPresetId}`) || ROOM_PRESETS.find(p => p.id === selectedPresetId)?.name
              : (t as any)('prefs.quickPresetsDesc')}
          </p>
        </div>
        <span className="text-stone-400 text-xs">{(t as any)('prefs.browse')}</span>
      </button>

      <div id="presets-grid" className="hidden grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ROOM_PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset)}
            className={`text-left px-4 py-3 border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              selectedPresetId === preset.id
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                selectedPresetId === preset.id
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-stone-800 dark:text-stone-200'
              }`}>
                {(t as any)(`prefs.preset.${preset.id}`) || preset.name}
              </span>
              {/* Mini palette */}
              <div className="flex gap-0.5">
                {preset.palette.slice(0, 5).map((color, i) => (
                  <div
                    key={i}
                    className="w-3 h-3"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">{(t as any)(`prefs.presetDesc.${preset.id}`) || preset.description}</p>
            <div className="flex gap-1.5 mt-2">
              {preset.keywords.map(kw => (
                <span key={kw} className="text-[10px] text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700 px-1.5 py-0.5">
                  {kw}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default RoomPresets;
