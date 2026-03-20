/**
 * RoomManager — browse saved rooms and their per-room design history timeline.
 * Dark theme, consistent with the rest of the Room UI.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Plus, Trash2, ArrowLeft, Star, Check, X, Palette, Clock, Calendar } from 'lucide-react';
import { Room, LookbookEntry } from '../types';
import {
  getRooms,
  deleteRoom as deleteRoomFromStorage,
  updateRoom,
} from '../services/houseRoomStorage';
import { loadAllVisualizationImages } from '../services/lookbookStorage';
import { useI18n } from '../i18n/I18nContext';

interface RoomManagerProps {
  onAddRoom: () => void;
  onOpenDesign: (entry: LookbookEntry, room: Room) => void;
  onBack: () => void;
}

export const RoomManager: React.FC<RoomManagerProps> = ({ onAddRoom, onOpenDesign, onBack }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const refresh = useCallback(() => { getRooms().then(setRooms); }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || null;

  const handleDelete = useCallback((id: string) => {
    deleteRoomFromStorage(id).then(() => {
      setConfirmDeleteId(null);
      if (selectedRoomId === id) setSelectedRoomId(null);
      refresh();
    });
  }, [selectedRoomId, refresh]);

  const handleSelectDesign = useCallback((room: Room, designId: string) => {
    updateRoom(room.id, { selectedDesignId: designId });
    refresh();
  }, [refresh]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={selectedRoom ? () => setSelectedRoomId(null) : onBack}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-500 dark:text-stone-400" />
          </button>
          <Home className="w-6 h-6 text-emerald-500" />
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {selectedRoom ? selectedRoom.name : 'My Rooms'}
          </h2>
        </div>

        {!selectedRoom && (
          <button
            onClick={onAddRoom}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Room</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>

      {/* Room List */}
      {!selectedRoom && (
        <>
          {rooms.length === 0 ? (
            <div className="text-center py-20">
              <Home className="w-16 h-16 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-stone-500 dark:text-stone-400 mb-2">No rooms yet</p>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6 max-w-xs mx-auto">
                Upload a photo and save designs to start building your room portfolio
              </p>
              <button
                onClick={onAddRoom}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
              >
                Add Your First Room
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {rooms.map(room => (
                  <motion.div
                    key={room.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer focus-within:ring-2 focus-within:ring-emerald-500"
                    onClick={() => setSelectedRoomId(room.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open room: ${room.name}, ${room.designs.length} designs`}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedRoomId(room.id); } }}
                  >
                    {/* Thumbnail */}
                    <div className="h-36 sm:h-40 bg-stone-100 dark:bg-stone-700 overflow-hidden relative">
                      {room.sourceImageThumb ? (
                        <img src={room.sourceImageThumb} alt={`Room: ${room.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-10 h-10 text-stone-300 dark:text-stone-600" />
                        </div>
                      )}
                      {/* Design count badge */}
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 flex items-center gap-1">
                        <Palette className="w-3 h-3" />
                        {room.designs.length} design{room.designs.length !== 1 ? 's' : ''}
                      </div>
                      {/* Hover gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Info */}
                    <div className="p-3 sm:p-4">
                      <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm truncate">{room.name}</h3>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(room.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {room.selectedDesignId && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1.5">
                          <Star className="w-3 h-3 fill-current" />
                          Chosen design
                        </span>
                      )}
                    </div>

                    {/* Delete button */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {confirmDeleteId === room.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(room.id); }}
                            className="p-1.5 bg-red-500 text-white shadow-sm hover:bg-red-600"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className="p-1.5 bg-white dark:bg-stone-600 shadow-sm"
                          >
                            <X className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(room.id); }}
                          className="p-1.5 bg-white/90 dark:bg-stone-600/90 shadow-sm hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* Room Detail — timeline view */}
      {selectedRoom && (
        <RoomDesignTimeline
          room={selectedRoom}
          onOpenDesign={(entry) => onOpenDesign(entry, selectedRoom)}
          onSelectDesign={(designId) => handleSelectDesign(selectedRoom, designId)}
        />
      )}
    </div>
  );
};

// ============================================================================
// Room Design Timeline — shows all designs for a room in chronological order
// ============================================================================

const RoomDesignTimeline: React.FC<{
  room: Room;
  onOpenDesign: (entry: LookbookEntry) => void;
  onSelectDesign: (designId: string) => void;
}> = ({ room, onOpenDesign, onSelectDesign }) => {
  const [vizImages, setVizImages] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const ids = room.designs.map(d => d.id);
    if (ids.length === 0) return;
    loadAllVisualizationImages(ids).then(setVizImages);
  }, [room.designs]);

  if (room.designs.length === 0) {
    return (
      <div className="text-center py-16">
        <Palette className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
        <p className="text-stone-500 dark:text-stone-400">No designs saved to this room yet</p>
        <p className="text-sm text-stone-400 dark:text-stone-500 mt-1">
          Generate designs and use "Save to Room" to add them here
        </p>
      </div>
    );
  }

  // Sort designs by generatedAt (newest first)
  const sortedDesigns = [...room.designs].sort((a, b) => b.generatedAt - a.generatedAt);

  // Group by date
  const grouped = new Map<string, LookbookEntry[]>();
  for (const entry of sortedDesigns) {
    const dateKey = new Date(entry.generatedAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(entry);
  }

  const getImageSrc = (entry: LookbookEntry) => {
    const viz = vizImages.get(entry.id);
    if (viz) return `data:image/png;base64,${viz}`;
    if (entry.option.visualizationImage) return `data:image/png;base64,${entry.option.visualizationImage}`;
    if (entry.option.visualizationThumb) return entry.option.visualizationThumb;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Chosen design prominently */}
      {room.selectedDesignId && (() => {
        const chosen = room.designs.find(d => d.id === room.selectedDesignId);
        if (!chosen) return null;
        const imgSrc = getImageSrc(chosen);
        return (
          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border-2 border-emerald-300 dark:border-emerald-600 overflow-hidden">
            <div className="p-3 flex items-center gap-2 border-b border-emerald-200 dark:border-emerald-700">
              <Star className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-current" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Chosen Design</span>
            </div>
            <button
              onClick={() => onOpenDesign(chosen)}
              className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              <div className="w-full sm:w-32 h-32 sm:h-24 overflow-hidden bg-stone-100 dark:bg-stone-700 flex-shrink-0">
                {imgSrc ? (
                  <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Palette className="w-6 h-6 text-stone-300" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg font-bold text-stone-800 dark:text-stone-100">{chosen.option.name}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">{chosen.option.mood}</p>
                <div className="flex gap-1 mt-2">
                  {chosen.option.palette.map((c, i) => (
                    <div key={i} className="w-4 h-4 border border-stone-200 dark:border-stone-600" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </button>
          </div>
        );
      })()}

      {/* Timeline header */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-stone-400" />
        <h4 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
          Design Timeline ({room.designs.length} total)
        </h4>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-stone-200 dark:bg-stone-700" />

        {Array.from(grouped.entries()).map(([date, entries]) => (
          <div key={date} className="relative mb-8">
            {/* Date marker */}
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-8 sm:w-12 h-8 sm:h-12 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              </div>
              <span className="text-sm font-medium text-stone-600 dark:text-stone-300">{date}</span>
            </div>

            {/* Design cards for this date */}
            <div className="pl-10 sm:pl-16 space-y-3">
              {entries.map(entry => {
                const isChosen = room.selectedDesignId === entry.id;
                const imgSrc = getImageSrc(entry);
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`bg-white dark:bg-stone-800 border overflow-hidden transition-all group hover:shadow-md ${
                      isChosen
                        ? 'border-emerald-300 dark:border-emerald-600'
                        : 'border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Thumbnail */}
                      <button
                        onClick={() => onOpenDesign(entry)}
                        className="w-full sm:w-40 h-32 sm:h-auto overflow-hidden bg-stone-100 dark:bg-stone-700 flex-shrink-0 relative"
                      >
                        {imgSrc ? (
                          <img src={imgSrc} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full min-h-[80px] flex items-center justify-center">
                            <Palette className="w-8 h-8 text-stone-300 dark:text-stone-600" />
                          </div>
                        )}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Open</span>
                        </div>
                      </button>

                      {/* Content */}
                      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <button onClick={() => onOpenDesign(entry)} className="text-left flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-stone-800 dark:text-stone-100 truncate">{entry.option.name}</h3>
                              <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5">{entry.option.mood}</p>
                            </button>
                            {isChosen && (
                              <Star className="w-4 h-4 text-emerald-500 fill-current flex-shrink-0 mt-0.5" />
                            )}
                          </div>
                          {/* Palette */}
                          <div className="flex gap-1 mt-2">
                            {entry.option.palette.map((c, i) => (
                              <div key={i} className="w-3.5 h-3.5 border border-stone-200 dark:border-stone-600" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100 dark:border-stone-700">
                          <span className="text-[10px] text-stone-400 dark:text-stone-500">
                            {new Date(entry.generatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          <div className="flex gap-2">
                            {!isChosen && (
                              <button
                                onClick={() => onSelectDesign(entry.id)}
                                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                              >
                                <Star className="w-3 h-3" /> Set as chosen
                              </button>
                            )}
                            <button
                              onClick={() => onOpenDesign(entry)}
                              className="text-[11px] text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 font-medium"
                            >
                              Open in Studio
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomManager;
