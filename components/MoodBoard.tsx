  const { t } = useI18n();
import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, X, Image as ImageIcon, FolderOpen, Trash2 } from 'lucide-react';
import { MoodBoard as MoodBoardType, MoodBoardImage, saveMoodBoard, loadMoodBoards, deleteMoodBoard, createThumbnail } from '../services/moodBoardStorage';
import { useI18n } from '../i18n/I18nContext';

interface MoodBoardProps {
  onSelectImages?: (images: MoodBoardImage[]) => void;
  compact?: boolean;
}

export function MoodBoard({ onSelectImages, compact = false }: MoodBoardProps) {
  const [boards, setBoards] = useState<MoodBoardType[]>([]);
  const [activeBoard, setActiveBoard] = useState<MoodBoardType | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMoodBoards().then(b => {
      setBoards(b);
      if (b.length > 0 && !activeBoard) setActiveBoard(b[0]!);
    });
  }, []);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    const board: MoodBoardType = {
      id: `board-${Date.now()}`,
      name: newName.trim(),
      images: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveMoodBoard(board);
    setBoards(prev => [...prev, board]);
    setActiveBoard(board);
    setCreating(false);
    setNewName('');
  }, [newName]);

  const handleDelete = useCallback(async (boardId: string) => {
    await deleteMoodBoard(boardId);
    setBoards(prev => prev.filter(b => b.id !== boardId));
    if (activeBoard?.id === boardId) setActiveBoard(null);
  }, [activeBoard]);

  const handleAddImages = useCallback(async (files: FileList) => {
    if (!activeBoard) return;
    const newImages: MoodBoardImage[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const thumbnail = await createThumbnail(dataUrl);
      newImages.push({
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        dataUrl,
        thumbnail,
        label: file.name.replace(/\.[^.]+$/, ''),
        addedAt: Date.now(),
      });
    }
    const updated = {
      ...activeBoard,
      images: [...activeBoard.images, ...newImages],
      updatedAt: Date.now(),
    };
    await saveMoodBoard(updated);
    setActiveBoard(updated);
    setBoards(prev => prev.map(b => b.id === updated.id ? updated : b));
  }, [activeBoard]);

  const handleRemoveImage = useCallback(async (imageId: string) => {
    if (!activeBoard) return;
    const updated = {
      ...activeBoard,
      images: activeBoard.images.filter(img => img.id !== imageId),
      updatedAt: Date.now(),
    };
    await saveMoodBoard(updated);
    setActiveBoard(updated);
    setBoards(prev => prev.map(b => b.id === updated.id ? updated : b));
  }, [activeBoard]);

  const handleUseForGeneration = useCallback(() => {
    if (activeBoard && onSelectImages) {
      onSelectImages(activeBoard.images);
    }
  }, [activeBoard, onSelectImages]);

  if (compact && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-colors"
      >
        <ImageIcon className="w-4 h-4" />
        Mood Board{activeBoard ? ` (${activeBoard.images.length})` : ''}
      </button>
    );
  }

  return (
    <div className={`bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 ${compact ? 'fixed inset-4 z-50 shadow-2xl flex flex-col' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700">
        <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 uppercase tracking-widest">
          Mood Board
        </h3>
        <div className="flex items-center gap-2">
          {onSelectImages && activeBoard && activeBoard.images.length > 0 && (
            <button
              onClick={handleUseForGeneration}
              className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Use as Reference
            </button>
          )}
          {compact && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className={`flex ${compact ? 'flex-1 overflow-hidden' : ''}`}>
        {/* Board list sidebar */}
        <div className={`w-48 border-r border-stone-200 dark:border-stone-700 p-3 space-y-2 ${compact ? 'overflow-y-auto' : ''}`}>
          {boards.map(board => (
            <div
              key={board.id}
              className={`flex items-center justify-between gap-1 px-3 py-2 text-sm cursor-pointer transition-colors ${
                activeBoard?.id === board.id
                  ? 'bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-medium'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700/50'
              }`}
              onClick={() => setActiveBoard(board)}
            >
              <div className="flex items-center gap-2 truncate">
                <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{board.name}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(board.id); }}
                className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-0.5 text-stone-400 hover:text-red-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {creating ? (
            <div className="space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder={(t as any)('mood.boardName')}
                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
              <div className="flex gap-1">
                <button onClick={handleCreate} className="flex-1 px-2 py-1 text-xs bg-emerald-600 text-white hover:bg-emerald-700">Create</button>
                <button onClick={() => { setCreating(false); setNewName(''); }} className="flex-1 px-2 py-1 text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Board
            </button>
          )}
        </div>

        {/* Image grid */}
        <div className={`flex-1 p-4 ${compact ? 'overflow-y-auto' : ''}`}>
          {activeBoard ? (
            <div className="space-y-4">
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleAddImages(e.target.files)}
              />
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {activeBoard.images.map(img => (
                  <div key={img.id} className="relative group aspect-square">
                    <img
                      src={img.thumbnail}
                      alt={img.label}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveImage(img.id)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/50 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-white truncate block">{img.label}</span>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-stone-300 dark:border-stone-600 flex flex-col items-center justify-center gap-1 text-stone-400 dark:text-stone-500 hover:border-emerald-400 hover:text-emerald-500 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[10px]">Add</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-stone-400 dark:text-stone-500 py-12">
              <ImageIcon className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Create a board to start collecting inspiration</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MoodBoard;
