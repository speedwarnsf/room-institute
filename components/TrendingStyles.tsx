/**
 * Trending Styles section for the home page
 */
import { ArrowRight } from 'lucide-react';
import { getTrendingStyles, getImageById } from '../services/inspirationData';

interface TrendingStylesProps {
  onOpenDiscover: () => void;
}

export function TrendingStyles({ onOpenDiscover }: TrendingStylesProps) {
  const trending = getTrendingStyles();

  return (
    <section className="w-full max-w-5xl mx-auto mt-20 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-serif font-bold text-stone-800 dark:text-stone-200">
          Trending Styles
        </h2>
        <button
          onClick={onOpenDiscover}
          className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
        >
          Explore all
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {trending.map(({ style, description, imageId }) => {
          const image = getImageById(imageId);
          return (
            <button
              key={style}
              onClick={onOpenDiscover}
              className="group text-left bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors"
            >
              {image && (
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    fetchPriority="high"
                  />
                </div>
              )}
              <div className="p-3">
                <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-1">
                  {style}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">
                  {description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
