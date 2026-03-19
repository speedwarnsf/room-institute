/**
 * My Rooms Gallery — portfolio-style grid of saved design projects
 */

  const { t } = useI18n();
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  X, Trash2, Check, Edit2, Clock, Palette, Star,
  ChevronRight, ShoppingCart, ArrowLeft, CheckCircle2,
  Home, Plus, Search
} from 'lucide-react';
import {
  getRooms, getRoom, deleteRoom, saveRoom
} from '../services/houseRoomStorage';
import { Room, LookbookEntry } from '../types';
import { LazyImage } from './LazyImage';
import { useI18n } from '../i18n/I18nContext';

// ============================================================================
// TYPES
// ============================================================================

interface MyRoomsGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  /** Load a room's chosen design back into the app */
  onLoadRoom: (room: Room, designIndex: number) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MyRoomsGallery: React.FC<MyRoomsGalleryProps> = ({ isOpen, onClose, onLoadRoom }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Refresh room list when gallery opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getRooms().then(roomList => {
        setRooms(roomList);
        setLoading(false);
      }).catch(err => {
        console.error('Failed to load rooms:', err);
        setLoading(false);
      });
      setSelectedRoomId(null);
      setSelectedRoom(null);
    }
  }, [isOpen]);

  const refreshRooms = useCallback(() => {
    setLoading(true);
    getRooms().then(roomList => {
      setRooms(roomList);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to refresh rooms:', err);
      setLoading(false);
    });
  }, []);

  const filteredRooms = useMemo(() => {
    if (!searchQuery) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.designs.some(d => d.option.name.toLowerCase().includes(q) || d.option.mood.toLowerCase().includes(q))
    );
  }, [rooms, searchQuery]);

  const handleSelectRoom = useCallback(async (id: string) => {
    const room = await getRoom(id);
    if (room) {
      setSelectedRoomId(id);
      setSelectedRoom(room);
    }
  }, []);

  const handleBack = useCallback(() => {
    setSelectedRoomId(null);
    setSelectedRoom(null);
    refreshRooms();
  }, [refreshRooms]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteRoom(id);
    setConfirmDeleteId(null);
    if (selectedRoomId === id) handleBack();
    refreshRooms();
  }, [selectedRoomId, handleBack, refreshRooms]);

  const handleRename = useCallback(async (id: string) => {
    if (editName.trim()) {
      const room = await getRoom(id);
      if (room) {
        await saveRoom({ ...room, name: editName.trim(), updatedAt: Date.now() });
        setEditingId(null);
        refreshRooms();
      }
    }
  }, [editName, refreshRooms]);

  const handleChooseDesign = useCallback(async (roomId: string, designIndex: number) => {
    const room = await getRoom(roomId);
    if (room && room.designs[designIndex]) {
      const selectedDesignId = room.designs[designIndex].id;
      await saveRoom({ ...room, selectedDesignId, updatedAt: Date.now() });
      setSelectedRoom({ ...room, selectedDesignId });
      refreshRooms();
    }
  }, [refreshRooms]);

  const handleLoadDesign = useCallback((room: Room, designIndex: number) => {
    onLoadRoom(room, designIndex);
    onClose();
  }, [onLoadRoom, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-stone-800 shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {selectedRoom && (
              <button onClick={handleBack} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
                <ArrowLeft className="w-5 h-5 text-stone-500" />
              </button>
            )}
            <Home className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 font-serif">
              {selectedRoom ? selectedRoom.name : 'My Rooms'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedRoom ? (
            <RoomDetailView
              room={selectedRoom}
              onChooseDesign={handleChooseDesign}
              onLoadDesign={handleLoadDesign}
              onRefresh={async () => {
                const r = await getRoom(selectedRoom.id);
                if (r) setSelectedRoom(r);
              }}
            />
          ) : (
            <GalleryGrid
              rooms={filteredRooms}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectRoom={handleSelectRoom}
              editingId={editingId}
              editName={editName}
              onStartEdit={(r) => { setEditingId(r.id); setEditName(r.name); }}
              onSaveEdit={handleRename}
              onCancelEdit={() => setEditingId(null)}
              onEditNameChange={setEditName}
              confirmDeleteId={confirmDeleteId}
              onConfirmDelete={setConfirmDeleteId}
              onDelete={handleDelete}
              loading={loading}
            />
          )}
        </div>

        {/* Footer */}
        {!selectedRoom && (
          <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-700 text-xs text-stone-400 dark:text-stone-500 flex-shrink-0">
            {rooms.length} room{rooms.length !== 1 ? 's' : ''} saved
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// GALLERY GRID
// ============================================================================

interface GalleryGridProps {
  rooms: Room[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectRoom: (id: string) => void;
  editingId: string | null;
  editName: string;
  onStartEdit: (r: Room) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onEditNameChange: (name: string) => void;
  confirmDeleteId: string | null;
  onConfirmDelete: (id: string | null) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({
  rooms, searchQuery, onSearchChange, onSelectRoom,
  editingId, editName, onStartEdit, onSaveEdit, onCancelEdit, onEditNameChange,
  confirmDeleteId, onConfirmDelete, onDelete, loading
}) => (
  <div className="p-6">
    {/* Search */}
    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
      <input
        type="text"
        placeholder={(t as any)('rooms.searchRooms')}
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
      />
    </div>

    {loading ? (
      <div className="text-center py-16">
        <div className="w-12 h-12 border-4 border-stone-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-stone-500 dark:text-stone-400 text-lg font-medium mb-2">Loading rooms...</p>
      </div>
    ) : rooms.length === 0 ? (
      <div className="text-center py-16">
        <Home className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
        <p className="text-stone-500 dark:text-stone-400 text-lg font-medium mb-2">
          {searchQuery ? 'No rooms found' : 'No rooms saved yet'}
        </p>
        <p className="text-stone-400 dark:text-stone-500 text-sm">
          {searchQuery ? 'Try a different search' : 'Analyze a room and save it to start your portfolio'}
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            onSelect={() => onSelectRoom(room.id)}
            isEditing={editingId === room.id}
            editName={editName}
            onStartEdit={() => onStartEdit(room)}
            onSaveEdit={() => onSaveEdit(room.id)}
            onCancelEdit={onCancelEdit}
            onEditNameChange={onEditNameChange}
            isConfirmingDelete={confirmDeleteId === room.id}
            onConfirmDelete={() => onConfirmDelete(room.id)}
            onCancelDelete={() => onConfirmDelete(null)}
            onDelete={() => onDelete(room.id)}
          />
        ))}
      </div>
    )}
  </div>
);

// ============================================================================
// ROOM CARD
// ============================================================================

interface RoomCardProps {
  room: Room;
  onSelect: () => void;
  isEditing: boolean;
  editName: string;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditNameChange: (name: string) => void;
  isConfirmingDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({
  room, onSelect,
  isEditing, editName, onStartEdit, onSaveEdit, onCancelEdit, onEditNameChange,
  isConfirmingDelete, onConfirmDelete, onCancelDelete, onDelete
}) => {
  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="group relative bg-white dark:bg-stone-700/50 border border-stone-200 dark:border-stone-600 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {/* Thumbnail — clickable */}
      <button onClick={onSelect} className="w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset">
        <div className="relative h-36 bg-stone-100 dark:bg-stone-700">
          <LazyImage src={room.sourceImageThumb || room.sourceImage || ''} alt="" className="w-full h-full object-cover" blurUp />
          {/* Design count badge */}
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 flex items-center gap-1">
            <Palette className="w-3 h-3" />
            {room.designs.length} design{room.designs.length !== 1 ? 's' : ''}
          </div>
          {/* Selected design indicator */}
          {room.selectedDesignId && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 flex items-center gap-1">
              <Star className="w-3 h-3 text-emerald-400 fill-current" />
              Selected
            </div>
          )}
        </div>
      </button>

      {/* Info */}
      <div className="p-3">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editName}
              onChange={e => onEditNameChange(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-stone-300 dark:border-stone-500 bg-white dark:bg-stone-600 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(); if (e.key === 'Escape') onCancelEdit(); }}
            />
            <button onClick={onSaveEdit} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
              <Check className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
        ) : (
          <button onClick={onSelect} className="text-left w-full focus:outline-none">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm truncate">{room.name}</h3>
          </button>
        )}

        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
            <Clock className="w-3 h-3" />
            {formatDate(room.updatedAt)}
          </div>

          {room.selectedDesignId && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Star className="w-3 h-3 fill-current" />
              <span className="truncate max-w-[80px]">
                {room.designs.find(d => d.id === room.selectedDesignId)?.option.name || 'Selected'}
              </span>
            </span>
          )}
        </div>

      </div>

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isConfirmingDelete ? (
          <>
            <button onClick={onDelete} className="p-1.5 bg-red-500 text-white shadow-sm hover:bg-red-600" title={(t as any)('common.confirm')}>
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={onCancelDelete} className="p-1.5 bg-white dark:bg-stone-600 shadow-sm hover:bg-stone-100" title={(t as any)('common.cancel')}>
              <X className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
            </button>
          </>
        ) : (
          <>
            <button onClick={onStartEdit} className="p-1.5 bg-white/90 dark:bg-stone-600/90 shadow-sm hover:bg-white" title="Rename">
              <Edit2 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
            </button>
            <button onClick={onConfirmDelete} className="p-1.5 bg-white/90 dark:bg-stone-600/90 shadow-sm hover:bg-red-50" title="Delete">
              <Trash2 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// ROOM DETAIL VIEW
// ============================================================================

interface RoomDetailViewProps {
  room: Room;
  onChooseDesign: (roomId: string, designIndex: number) => void;
  onLoadDesign: (room: Room, designIndex: number) => void;
  onRefresh: () => void;
}

const RoomDetailView: React.FC<RoomDetailViewProps> = ({ room, onChooseDesign, onLoadDesign, onRefresh }) => {
  const [expandedDesign, setExpandedDesign] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-6">
      {/* Room image */}
      <div className="overflow-hidden h-48 bg-stone-100 dark:bg-stone-700">
        <LazyImage src={room.sourceImage || room.sourceImageThumb || ''} alt={room.name} className="w-full h-full object-cover" blurUp />
      </div>

      {/* Designs */}
      <div>
        <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-emerald-500" />
          Saved Designs
        </h3>

        <div className="space-y-3">
          {room.designs.map((design, designIndex) => {
            const isChosen = room.selectedDesignId === design.id;
            const isExpanded = expandedDesign === design.id;

            return (
              <div
                key={design.id}
                className={`border overflow-hidden transition-colors ${
                  isChosen
                    ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10'
                    : 'border-stone-200 dark:border-stone-600'
                }`}
              >
                {/* Design header */}
                <button
                  onClick={() => setExpandedDesign(isExpanded ? null : design.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                >
                  {/* Mini visualization */}
                  <div className="w-14 h-14 overflow-hidden bg-stone-100 dark:bg-stone-700 flex-shrink-0">
                    {design.option.visualizationImage ? (
                      <LazyImage src={`data:image/png;base64,${design.option.visualizationImage}`} alt="" className="w-full h-full object-cover" blurUp />
                    ) : design.option.visualizationThumb ? (
                      <LazyImage src={design.option.visualizationThumb} alt="" className="w-full h-full object-cover" blurUp />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Palette className="w-5 h-5 text-stone-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-800 dark:text-stone-100 truncate">{design.option.name}</span>
                      {isChosen && (
                        <span className="flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 font-medium">
                          <Star className="w-3 h-3 fill-current" /> Selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">{design.option.mood}</p>

                    {/* Palette dots */}
                    <div className="flex items-center gap-1 mt-1.5">
                      {design.option.palette.map((hex, i) => (
                        <div key={i} className="w-4 h-4 border border-white dark:border-stone-600 shadow-sm" style={{ backgroundColor: hex }} />
                      ))}
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-stone-100 dark:border-stone-700 p-4 space-y-4">
                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {!isChosen && (
                        <button
                          onClick={() => onChooseDesign(room.id, designIndex)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 font-medium transition-colors"
                        >
                          <Star className="w-3.5 h-3.5" /> Set as Selected
                        </button>
                      )}
                      <button
                        onClick={() => onLoadDesign(room, designIndex)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600 font-medium transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" /> Open in Editor
                      </button>
                    </div>

                    {/* Key changes */}
                    <div>
                      <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">Key Changes</h4>
                      <ul className="space-y-1">
                        {design.option.keyChanges.map((c, i) => (
                          <li key={i} className="text-sm text-stone-600 dark:text-stone-300 flex items-start gap-1.5">
                            <span className="text-emerald-500 mt-0.5">•</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Full plan */}
                    {design.option.fullPlan && (
                      <div>
                        <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">Design Plan</h4>
                        <div className="text-sm text-stone-600 dark:text-stone-300 prose prose-sm max-w-none">
                          {design.option.fullPlan}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MyRoomsGallery;
