import { useRef } from 'react';
import type { ProductRecommendation } from '../types';
import { getProductUrl } from '../services/affiliateLinks';
import { useI18n } from '../i18n/I18nContext';

function ProductCard({ product }: { product: ProductRecommendation }) {
  const { t } = useI18n();

  const categoryKey = `category.${product.category}` as const;
  const categoryLabel = t(categoryKey as any);

  return (
    <div className="flex-shrink-0 w-56 sm:w-64 bg-neutral-900 border border-neutral-800 p-4 flex flex-col gap-2.5 snap-start hover:border-neutral-600 transition-colors">
      {/* Category */}
      <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
        {categoryLabel}
      </span>

      {/* Product name */}
      <h4 className="text-sm font-semibold text-neutral-100 leading-snug">
        {product.name}
      </h4>

      {/* Brand */}
      <span className="text-xs text-neutral-500">{product.brand}</span>

      {/* Description */}
      <p className="text-xs text-neutral-400 leading-relaxed flex-1" style={{ fontFamily: 'Georgia, serif' }}>
        {product.description}
      </p>

      {/* Price + Shop */}
      <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
        <span className="text-xs font-medium text-neutral-300">{product.priceRange}</span>
        <a
          href={getProductUrl(product.name, product.brand, product.category)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          {t('products.shop')}
        </a>
      </div>
    </div>
  );
}

interface ProductShelfProps {
  products: ProductRecommendation[];
  title?: string;
  /** Use light theme (for Lookbook modal) vs dark (for DesignStudio) */
  light?: boolean;
}

export function ProductShelf({ products, title, light = false }: ProductShelfProps) {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) return null;

  const displayTitle = title || t('products.theEdit');

  if (light) {
    return (
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          {displayTitle}
        </h4>
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {products.map((product, i) => {
            const categoryKey = `category.${product.category}` as const;
            const categoryLabel = t(categoryKey as any);

            return (
            <div
              key={i}
              className="flex-shrink-0 w-52 bg-stone-50 dark:bg-stone-700/50 border border-stone-200 dark:border-stone-600 p-3.5 flex flex-col gap-2 snap-start"
            >
              <span className="text-[10px] uppercase tracking-[0.15em] text-stone-400 dark:text-stone-500">
                {categoryLabel}
              </span>
              <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-100 leading-snug">
                {product.name}
              </h4>
              <span className="text-xs text-stone-400 dark:text-stone-500">{product.brand}</span>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed flex-1">
                {product.description}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-stone-200 dark:border-stone-600">
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">{product.priceRange}</span>
                <a
                  href={getProductUrl(product.name, product.brand, product.category)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-emerald-500 transition-colors"
                >
                  {t('products.shop')}
                </a>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-[10px] uppercase tracking-[0.25em] text-neutral-600">{displayTitle}</h2>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {products.map((product, i) => (
          <ProductCard key={i} product={product} />
        ))}
      </div>
    </div>
  );
}

export default ProductShelf;
