import { useI18n } from '../i18n/I18nContext';
/**
 * Discover Page — curated design inspiration feed
 * Available to all users. Saving to mood board requires Pro.
 */
import { useState, useCallback } from 'react';
import { ArrowLeft, Bookmark, BookmarkCheck, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { DESIGN_STYLES, INSPIRATION_IMAGES, DESIGN_TIPS, getImagesByStyle, type DesignStyle, type InspirationImage, type DesignTip } from '../services/inspirationData';
import { useAuth } from './AuthProvider';
import { canSaveToMoodBoard } from '../services/gating';
import { saveMoodBoard, loadMoodBoards, createThumbnail, type MoodBoard } from '../services/moodBoardStorage';

interface DiscoverPageProps {
  onBack: () => void;
  onShowUpgrade: (feature: string) => void;
}

export default function DiscoverPage({ onBack, onShowUpgrade }: DiscoverPageProps) {
  const { t } = useI18n();
  const { userTier } = useAuth();
  const [activeStyle, setActiveStyle] = useState<DesignStyle | 'all'>('all');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const filteredImages = activeStyle === 'all'
    ? INSPIRATION_IMAGES
    : getImagesByStyle(activeStyle);

  const handleSaveToMoodBoard = useCallback(async (image: InspirationImage) => {
    if (!canSaveToMoodBoard(userTier)) {
      onShowUpgrade('mood_board');
      return;
    }

    try {
      const boards = await loadMoodBoards();
      let board: MoodBoard;

      if (boards.length > 0) {
        board = boards[0]!;
      } else {
        board = {
          id: `board-${Date.now()}`,
          name: 'My Inspiration',
          images: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }

      // Don't add duplicates
      if (board.images.some(img => img.id === image.id)) {
        setSavedIds(prev => { const s = new Set(prev); s.delete(image.id); return s; });
        board.images = board.images.filter(img => img.id !== image.id);
        await saveMoodBoard(board);
        setSaveStatus(t('discover.removeFromBoard' as any));
      } else {
        const thumbnail = await createThumbnail(image.src, 200);
        board.images.push({
          id: image.id,
          dataUrl: image.src,
          thumbnail,
          label: `${image.style} ${image.room}`,
          addedAt: Date.now(),
        });
        board.updatedAt = Date.now();
        await saveMoodBoard(board);
        setSavedIds(prev => new Set(prev).add(image.id));
        setSaveStatus(t('discover.savedToBoard' as any));
      }

      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error('Failed to save to mood board:', err);
    }
  }, [userTier, onShowUpgrade]);

  const toggleTip = useCallback((tipId: string) => {
    setExpandedTipId(prev => prev === tipId ? null : tipId);
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
          aria-label={t('discover.backToHome')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {t('discover.title')}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {t('discover.subtitle')}
          </p>
        </div>
      </div>

      {/* Style filter tabs */}
      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide" role="tablist" aria-label={t('discover.filterByStyle')}>
        <button
          role="tab"
          aria-selected={activeStyle === 'all'}
          onClick={() => setActiveStyle('all')}
          className={`flex-shrink-0 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
            activeStyle === 'all'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
          }`}
        >
          {t('discover.allStyles')}
        </button>
        {DESIGN_STYLES.map(style => (
          <button
            key={style}
            role="tab"
            aria-selected={activeStyle === style}
            onClick={() => setActiveStyle(style)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeStyle === style
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            {(t as any)(`style.${style.toLowerCase().replace(/[- ]/g, '')}`) || style}
          </button>
        ))}
      </div>

      {/* Save status toast */}
      {saveStatus && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 px-4 py-2 text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          {saveStatus}
        </div>
      )}

      {/* Inspiration grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16" role="tabpanel">
        {filteredImages.map(image => (
          <div
            key={image.id}
            className="group bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 overflow-hidden"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              {/* Save to mood board button */}
              <button
                onClick={() => handleSaveToMoodBoard(image)}
                className={`absolute top-3 right-3 p-2 transition-all ${
                  savedIds.has(image.id)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/80 dark:bg-stone-900/80 text-stone-600 dark:text-stone-300 sm:opacity-0 sm:group-hover:opacity-100'
                }`}
                aria-label={savedIds.has(image.id) ? t('discover.removeFromBoard') : t('discover.saveToBoard')}
                title={savedIds.has(image.id) ? t('discover.savedToBoard') : t('discover.saveToBoard')}
              >
                {savedIds.has(image.id) ? (
                  <BookmarkCheck className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>
              {/* Pro badge on save button for free users */}
              {!canSaveToMoodBoard(userTier) && (
                <span className="absolute top-3 right-14 bg-amber-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-200 text-[10px] font-bold px-1.5 py-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                  Pro
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {(t as any)(`style.${image.style.toLowerCase().replace(/[- ]/g, '')}`) || image.style}
                </span>
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  {(t as any)(`room.${image.room.replace(/\s+(.)/g, (_, c) => c.toUpperCase()).replace(/^./, c => c.toLowerCase())}`) || image.room}
                </span>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                {image.alt}
              </p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {image.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Design Tips Section */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <Lightbulb className="w-5 h-5 text-emerald-400" />
          <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {t('discover.designPrinciples')}
          </h2>
        </div>
        <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-2xl">
          {t('discover.designPrinciplesDesc')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DESIGN_TIPS.map((tip: DesignTip) => (
            <div
              key={tip.id}
              className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-5"
            >
              <button
                onClick={() => toggleTip(tip.id)}
                className="w-full flex items-start justify-between gap-3 text-left"
                aria-expanded={expandedTipId === tip.id}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                    {tip.category}
                  </span>
                  <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 mt-1">
                    {tip.title}
                  </h3>
                </div>
                {expandedTipId === tip.id ? (
                  <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0 mt-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0 mt-1" />
                )}
              </button>
              {expandedTipId === tip.id && (
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-3 leading-relaxed animate-in fade-in duration-200">
                  {tip.body}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
