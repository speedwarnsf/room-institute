import { Shuffle } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export const DESIGN_STYLES = [
  { id: 'minimalist-scandinavian', label: 'Minimalist / Scandinavian' },
  { id: 'bold-maximalist', label: 'Bold / Maximalist' },
  { id: 'traditional-classic', label: 'Traditional / Classic' },
  { id: 'mid-century-modern', label: 'Mid-Century Modern' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'french-provincial', label: 'French Provincial' },
  { id: 'coastal-beach', label: 'Coastal / Beach' },
  { id: 'bohemian', label: 'Bohemian' },
  { id: 'contemporary', label: 'Contemporary' },
  { id: 'rustic-farmhouse', label: 'Rustic / Farmhouse' },
] as const;

export const ROOM_FUNCTIONS = [
  { id: 'living-room', label: 'Living Room' },
  { id: 'dining-room', label: 'Dining Room' },
  { id: 'bedroom', label: 'Bedroom' },
  { id: 'study-office', label: 'Study / Office' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'bathroom', label: 'Bathroom' },
  { id: 'nursery', label: 'Nursery' },
  { id: 'guest-room', label: 'Guest Room' },
  { id: 'entryway', label: 'Entryway' },
  { id: 'outdoor-patio', label: 'Outdoor / Patio' },
] as const;

export type DesignStyleId = typeof DESIGN_STYLES[number]['id'] | null;
export type RoomFunctionId = typeof ROOM_FUNCTIONS[number]['id'] | null;

interface PreferencesPanelProps {
  selectedStyle: DesignStyleId;
  selectedRoom: RoomFunctionId;
  onStyleChange: (style: DesignStyleId) => void;
  onRoomChange: (room: RoomFunctionId) => void;
}

export function PreferencesPanel({
  selectedStyle,
  selectedRoom,
  onStyleChange,
  onRoomChange,
}: PreferencesPanelProps) {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-2xl space-y-8 animate-in fade-in duration-500">
      {/* Style Picker — always visible */}
      <div>
        <h3 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] mb-3">
          {t('prefs.designStyle')}
        </h3>
        <div
          id="style-picker-grid"
          className="grid grid-cols-2 sm:grid-cols-3 gap-2"
          role="radiogroup"
          aria-label={t('prefs.designStyleLabel')}
        >
          <button
            onClick={() => onStyleChange(null)}
            className={`group relative px-3 py-3 text-xs font-medium text-left border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 flex items-center gap-2 ${
              selectedStyle === null
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-sm shadow-emerald-500/10'
                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-sm'
            }`}
            role="radio"
            aria-checked={selectedStyle === null}
          >
            <Shuffle className="w-3.5 h-3.5 flex-shrink-0" />
            {t('prefs.surpriseMe')}
          </button>
          {DESIGN_STYLES.map(style => (
            <button
              key={style.id}
              onClick={() => onStyleChange(style.id)}
              className={`group relative px-3 py-3 text-xs font-medium text-left border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                selectedStyle === style.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-sm shadow-emerald-500/10'
                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-sm'
              }`}
              role="radio"
              aria-checked={selectedStyle === style.id}
            >
              {style.label}
              {selectedStyle === style.id && (
                <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Room Function Selector — always visible */}
      <div>
        <h3 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] mb-3">
          {t('prefs.roomType')}
        </h3>
        <div
          id="room-picker-grid"
          className="grid grid-cols-2 sm:grid-cols-3 gap-2"
          role="radiogroup"
          aria-label={t('prefs.roomTypeLabel')}
        >
          <button
            onClick={() => onRoomChange(null)}
            className={`group relative px-3 py-3 text-xs font-medium text-left border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 flex items-center gap-2 ${
              selectedRoom === null
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-sm shadow-emerald-500/10'
                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-sm'
            }`}
            role="radio"
            aria-checked={selectedRoom === null}
          >
            <Shuffle className="w-3.5 h-3.5 flex-shrink-0" />
            {t('prefs.autoDetect')}
          </button>
          {ROOM_FUNCTIONS.map(room => (
            <button
              key={room.id}
              onClick={() => onRoomChange(room.id)}
              className={`group relative px-3 py-3 text-xs font-medium text-left border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                selectedRoom === room.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-sm shadow-emerald-500/10'
                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-sm'
              }`}
              role="radio"
              aria-checked={selectedRoom === room.id}
            >
              {room.label}
              {selectedRoom === room.id && (
                <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
