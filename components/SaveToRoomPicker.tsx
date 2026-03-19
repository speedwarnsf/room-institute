/**
 * SaveToRoomPicker — modal picker to save a LookbookEntry to an existing or new room.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Home, Check } from 'lucide-react';
import { Room, LookbookEntry } from '../types';
import { getRooms, createRoom, saveRoom, saveDesignToRoom } from '../services/houseRoomStorage';
import { useI18n } from '../i18n/I18nContext';

interface SaveToRoomPickerProps {
  entry: LookbookEntry;
  /** Optional source image to attach to new rooms */
  sourceImage?: string;
  onClose: () => void;
  onSaved: (room: Room) => void;
}

export const SaveToRoomPicker: React.FC<SaveToRoomPickerProps> = ({ entry, sourceImage, onClose, onSaved }) => {
  const { t } = useI18n();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [savedToId, setSavedToId] = useState<string | null>(null);

  useEffect(() => { getRooms().then(setRooms); }, []);

  const handleSaveToExisting = useCallback(async (roomId: string) => {
    await saveDesignToRoom(roomId, entry);
    setSavedToId(roomId);
    const allRooms = await getRooms();
    const room = allRooms.find(r => r.id === roomId);
    if (room) {
      setTimeout(() => onSaved(room), 600);
    }
  }, [entry, onSaved]);

  const handleCreateAndSave = useCallback(async () => {
    if (!newName.trim()) return;
    const room = createRoom(newName.trim(), sourceImage);
    room.designs.push(entry);
    await saveRoom(room);
    setSavedToId(room.id);
    setTimeout(() => onSaved(room), 600);
  }, [newName, sourceImage, entry, onSaved]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={t('rooms.saveToRoom')} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div
        className="bg-white dark:bg-stone-800 shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-100">Save to Room</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        {/* Room list */}
        <div className="max-h-64 overflow-y-auto p-3 space-y-1">
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => handleSaveToExisting(room.id)}
              disabled={savedToId !== null}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                savedToId === room.id
                  ? 'bg-emerald-50 dark:bg-emerald-900/20'
                  : 'hover:bg-stone-50 dark:hover:bg-stone-700/50'
              }`}
            >
              <div className="w-10 h-10 overflow-hidden bg-stone-100 dark:bg-stone-700 flex-shrink-0">
                {room.sourceImageThumb ? (
                  <img src={room.sourceImageThumb} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-4 h-4 text-stone-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">{room.name}</p>
                <p className="text-xs text-stone-400 dark:text-stone-500">{room.designs.length} design{room.designs.length !== 1 ? 's' : ''}</p>
              </div>
              {savedToId === room.id && (
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              )}
            </button>
          ))}

          {rooms.length === 0 && !isCreating && (
            <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-4">No rooms yet</p>
          )}
        </div>

        {/* New room */}
        <div className="px-3 pb-3">
          {isCreating ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={(t as any)('rooms.roomName')}
                autoFocus
                className="flex-1 px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onKeyDown={e => { if (e.key === 'Enter') handleCreateAndSave(); if (e.key === 'Escape') setIsCreating(false); }}
              />
              <button
                onClick={handleCreateAndSave}
                disabled={!newName.trim() || savedToId !== null}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              disabled={savedToId !== null}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Room
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaveToRoomPicker;
