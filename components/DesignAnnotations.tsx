import { useI18n } from '../i18n/I18nContext';
import { useState, useCallback, useRef } from 'react';
import { X, MessageSquare, Trash2 } from 'lucide-react';

export interface Annotation {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  text: string;
  createdAt: number;
}

interface DesignAnnotationsProps {
  imageBase64: string;
  annotations: Annotation[];
  onAnnotationsChange: (annotations: Annotation[]) => void;
  className?: string;
}

export function DesignAnnotations({
  imageBase64,
  annotations,
  onAnnotationsChange,
  className = '',
}: DesignAnnotationsProps) {
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotating) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingPoint({ x, y });
    setNoteText('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [isAnnotating]);

  const handleAddAnnotation = useCallback(() => {
    if (!pendingPoint || !noteText.trim()) return;
    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      x: pendingPoint.x,
      y: pendingPoint.y,
      text: noteText.trim(),
      createdAt: Date.now(),
    };
    onAnnotationsChange([...annotations, newAnnotation]);
    setPendingPoint(null);
    setNoteText('');
  }, [pendingPoint, noteText, annotations, onAnnotationsChange]);

  const handleDelete = useCallback((id: string) => {
    onAnnotationsChange(annotations.filter(a => a.id !== id));
    if (activeId === id) setActiveId(null);
  }, [annotations, onAnnotationsChange, activeId]);

  const imgSrc = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
          Annotations
        </h4>
        <button
          onClick={() => { setIsAnnotating(!isAnnotating); setPendingPoint(null); }}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            isAnnotating
              ? 'bg-emerald-600 text-white'
              : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
          }`}
        >
          {isAnnotating ? 'Done' : 'Add Notes'}
        </button>
      </div>

      {/* Annotatable image */}
      <div
        ref={containerRef}
        className={`relative overflow-hidden ${isAnnotating ? 'cursor-crosshair' : 'cursor-default'}`}
        onClick={handleImageClick}
      >
        <img
          src={imgSrc}
          alt="Design to annotate"
          className="w-full h-auto"
          draggable={false}
        />

        {/* Existing annotations */}
        {annotations.map(ann => (
          <div
            key={ann.id}
            className="absolute group"
            style={{ left: `${ann.x}%`, top: `${ann.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setActiveId(activeId === ann.id ? null : ann.id); }}
              className={`w-6 h-6 flex items-center justify-center border-2 transition-all ${
                activeId === ann.id
                  ? 'bg-emerald-500 border-white scale-125'
                  : 'bg-white/90 border-emerald-500 hover:scale-110'
              }`}
              style={{ borderRadius: '50%' }}
              aria-label={`Annotation: ${ann.text}`}
            >
              <MessageSquare className="w-3 h-3 text-emerald-700" style={{ display: activeId === ann.id ? 'none' : 'block' }} />
            </button>

            {/* Tooltip */}
            {activeId === ann.id && (
              <div
                className="absolute z-20 bg-white dark:bg-stone-800 shadow-lg border border-stone-200 dark:border-stone-700 p-3 min-w-[160px] max-w-[240px]"
                style={{
                  left: ann.x > 70 ? 'auto' : '100%',
                  right: ann.x > 70 ? '100%' : 'auto',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  marginLeft: ann.x > 70 ? 0 : 8,
                  marginRight: ann.x > 70 ? 8 : 0,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-sm text-stone-700 dark:text-stone-200">{ann.text}</p>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Pending annotation */}
        {pendingPoint && (
          <div
            className="absolute z-20"
            style={{ left: `${pendingPoint.x}%`, top: `${pendingPoint.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-6 h-6 bg-emerald-500 border-2 border-white flex items-center justify-center animate-pulse" style={{ borderRadius: '50%' }}>
              <MessageSquare className="w-3 h-3 text-white" />
            </div>
            <div
              className="absolute z-30 bg-white dark:bg-stone-800 shadow-lg border border-stone-200 dark:border-stone-700 p-2 min-w-[200px]"
              style={{
                left: pendingPoint.x > 60 ? 'auto' : '100%',
                right: pendingPoint.x > 60 ? '100%' : 'auto',
                top: '50%',
                transform: 'translateY(-50%)',
                marginLeft: pendingPoint.x > 60 ? 0 : 8,
                marginRight: pendingPoint.x > 60 ? 8 : 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                ref={inputRef}
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddAnnotation(); if (e.key === 'Escape') setPendingPoint(null); }}
                placeholder={t('annotations.addNote')}
                className="w-full px-2 py-1.5 text-sm bg-transparent border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <div className="flex gap-1 mt-2">
                <button
                  onClick={handleAddAnnotation}
                  disabled={!noteText.trim()}
                  className="flex-1 py-1 text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setPendingPoint(null)}
                  className="flex-1 py-1 text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Annotating hint */}
        {isAnnotating && !pendingPoint && annotations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 px-4 py-2 text-white text-sm backdrop-blur-sm">
              Click anywhere on the image to add a note
            </div>
          </div>
        )}
      </div>

      {/* Annotations list */}
      {annotations.length > 0 && (
        <div className="space-y-1.5">
          {annotations.map((ann, i) => (
            <div
              key={ann.id}
              className={`flex items-start gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                activeId === ann.id
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200'
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
              onClick={() => setActiveId(activeId === ann.id ? null : ann.id)}
            >
              <span className="text-xs font-mono text-stone-400 mt-0.5">{i + 1}</span>
              <span className="flex-1">{ann.text}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(ann.id); }}
                className="text-stone-400 hover:text-red-500 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DesignAnnotations;
