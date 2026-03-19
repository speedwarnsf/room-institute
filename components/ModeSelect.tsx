import { useState, lazy, Suspense } from 'react';
import { Palette, Crown } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { PreferencesPanel, type DesignStyleId, type RoomFunctionId } from './PreferencesPanel';
import { ROOM_PRESETS, type RoomPreset } from '../services/roomPresets';
import type { FlowMode } from '../types';

const RoomPresets = lazy(() => import('./RoomPresets'));
const MoodBoard = lazy(() => import('./MoodBoard'));

export interface DesignPreferences {
  style: DesignStyleId;
  roomFunction: RoomFunctionId;
}

interface ModeSelectProps {
  onSelectMode: (mode: FlowMode, preferences: DesignPreferences) => void;
  uploadedImage: string | null;
}

export function ModeSelect({ onSelectMode, uploadedImage }: ModeSelectProps) {
  const { userTier } = useAuth();
  const remaining = userTier.generationsLimit - userTier.generationsUsed;
  const [selectedStyle, setSelectedStyle] = useState<DesignStyleId>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomFunctionId>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const handlePresetSelect = (preset: RoomPreset) => {
    setSelectedPresetId(preset.id);
    // Find matching style/room IDs from the preferences constants
    const { DESIGN_STYLES, ROOM_FUNCTIONS } = require('./PreferencesPanel');
    const styleMatch = DESIGN_STYLES.find((s: any) => preset.style.toLowerCase().includes(s.label.toLowerCase().split(' ')[0]));
    const roomMatch = ROOM_FUNCTIONS.find((r: any) => preset.roomType.toLowerCase() === r.label.toLowerCase());
    if (styleMatch) setSelectedStyle(styleMatch.id);
    if (roomMatch) setSelectedRoom(roomMatch.id);
  };

  const preferences: DesignPreferences = { style: selectedStyle, roomFunction: selectedRoom };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Thumbnail */}
      {uploadedImage && (
        <div className="mb-8">
          <img
            src={uploadedImage}
            alt="Your uploaded room"
            className="w-32 h-32 sm:w-40 sm:h-40 object-cover shadow-md border-2 border-stone-200 dark:border-stone-700"
          />
        </div>
      )}

      <h2 className="text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-100 text-center mb-3 font-serif" style={{ textWrap: 'balance' }}>
        Set your preferences
      </h2>
      <p className="text-stone-500 dark:text-stone-400 text-center mb-4 max-w-md" style={{ textWrap: 'balance' }}>
        Choose a style and room type, or let us surprise you
      </p>

      {/* Usage indicator */}
      {userTier.tier === 'free' && (
        <p className="text-xs text-stone-400 dark:text-stone-500 mb-8">
          {remaining > 0
            ? `${remaining} free design${remaining === 1 ? '' : 's'} remaining`
            : 'No free designs remaining — upgrade to continue'}
        </p>
      )}
      {userTier.tier === 'pro' && (
        <p className="text-xs text-emerald-500 dark:text-emerald-400 mb-8 flex items-center gap-1">
          <Crown className="w-3 h-3" /> Pro — unlimited designs
        </p>
      )}

      {/* Room Presets */}
      <div className="mb-4 w-full flex justify-center">
        <Suspense fallback={null}>
          <RoomPresets
            onSelectPreset={handlePresetSelect}
            selectedPresetId={selectedPresetId}
          />
        </Suspense>
      </div>

      {/* Preferences Panel */}
      <div className="mb-4 w-full flex justify-center">
        <PreferencesPanel
          selectedStyle={selectedStyle}
          selectedRoom={selectedRoom}
          onStyleChange={(s) => { setSelectedStyle(s); setSelectedPresetId(null); }}
          onRoomChange={(r) => { setSelectedRoom(r); setSelectedPresetId(null); }}
        />
      </div>

      {/* Mood Board */}
      <div className="mb-8 w-full flex justify-center">
        <Suspense fallback={null}>
          <MoodBoard compact />
        </Suspense>
      </div>

      <div className="w-full max-w-2xl">
        <button
          onClick={() => onSelectMode('redesign', preferences)}
          className="group relative w-full bg-white dark:bg-stone-800 border-2 border-emerald-400 dark:border-emerald-500 p-10 text-center transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/15 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900"
        >
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/40 w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Palette className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-serif mb-2">
            Design My Space
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
            3 bold design directions grounded in design theory
          </p>
        </button>
      </div>

      {/* What's included hint */}
      {userTier.tier === 'free' && (
        <div className="mt-10 max-w-md w-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">Free vs Pro</h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <span className="text-stone-500 dark:text-stone-400">Designs</span>
            <span className="text-stone-700 dark:text-stone-300">3 free, then Pro</span>
            <span className="text-stone-500 dark:text-stone-400">Design Studio</span>
            <span className="text-stone-700 dark:text-stone-300 flex items-center gap-1"><Crown className="w-3 h-3 text-emerald-500" /> Pro only</span>
            <span className="text-stone-500 dark:text-stone-400">Saved rooms</span>
            <span className="text-stone-700 dark:text-stone-300">1 free, 10 with Pro</span>
            <span className="text-stone-500 dark:text-stone-400">PDF export</span>
            <span className="text-stone-700 dark:text-stone-300 flex items-center gap-1"><Crown className="w-3 h-3 text-emerald-500" /> Pro only</span>
          </div>
        </div>
      )}
    </div>
  );
}
