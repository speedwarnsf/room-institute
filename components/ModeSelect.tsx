import { useState, lazy, Suspense } from 'react';
import { Sparkles, Palette, Crown } from 'lucide-react';
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
        What would you like to do?
      </h2>
      <p className="text-stone-500 dark:text-stone-400 text-center mb-4 max-w-md" style={{ textWrap: 'balance' }}>
        Choose a path for your space
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

      <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-6 w-full max-w-2xl">
        {/* Redesign My Space — Primary */}
        <button
          onClick={() => onSelectMode('redesign', preferences)}
          className="group relative bg-white dark:bg-stone-800 border-2 border-violet-400 dark:border-violet-500 p-10 text-left transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/15 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900"
        >
          <span className="absolute top-0 right-0 text-[10px] font-bold uppercase tracking-widest text-white bg-violet-600 px-3 py-1">
            Recommended
          </span>
          <div className="bg-violet-100 dark:bg-violet-900/40 w-16 h-16 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
            <Palette className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-serif mb-2" style={{ textWrap: 'balance' }}>
            Redesign My Space
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-3">
            3 bold design directions grounded in design theory
          </p>
          <span className="inline-block text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5">
            Included free
          </span>
        </button>

        {/* Clean My Space — Secondary */}
        <button
          onClick={() => onSelectMode('clean', preferences)}
          className="group relative bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-400 dark:hover:border-emerald-500 p-6 text-left transition-all duration-300 hover:shadow-md hover:shadow-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900"
        >
          <div className="bg-emerald-100 dark:bg-emerald-900/40 w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif mb-2" style={{ textWrap: 'balance' }}>
            Clean My Space
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-3">
            Decluttering plan and organization tips
          </p>
          <span className="inline-block text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5">
            Included free
          </span>
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
