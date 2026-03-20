import React, { useState, useCallback, useEffect } from 'react';
import {
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  DollarSign,
  Sofa,
  Lamp,
  Shrub,
  Palette,
  PackageOpen,
  Flower2,
} from 'lucide-react';
import { ShoppingProduct, ProductCategory, ShoppingListData } from '../types';
import { trackProductClick } from '../services/affiliateTracking';
import { useI18n } from '../i18n/I18nContext';
import { getProductUrl } from '../services/affiliateLinks';

const PURCHASED_KEY = 'room-institute_purchased';

const getCategoryIcon = (cat: ProductCategory): React.ReactNode => {
  switch (cat) {
    case 'furniture': return <Sofa className="w-4 h-4" />;
    case 'lighting': return <Lamp className="w-4 h-4" />;
    case 'textiles': return <Palette className="w-4 h-4" />;
    case 'decor': return <Flower2 className="w-4 h-4" />;
    case 'plants': return <Shrub className="w-4 h-4" />;
    case 'storage': return <PackageOpen className="w-4 h-4" />;
    default: return <PackageOpen className="w-4 h-4" />;
  }
};

const CATEGORY_ORDER: ProductCategory[] = ['furniture', 'lighting', 'textiles', 'decor', 'plants', 'storage'];

interface ShoppingListProps {
  shoppingList: ShoppingListData;
  sessionId: string;
}

function loadPurchased(): Set<string> {
  try {
    const raw = localStorage.getItem(PURCHASED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function savePurchased(ids: Set<string>) {
  try {
    localStorage.setItem(PURCHASED_KEY, JSON.stringify([...ids]));
  } catch { /* ignore */ }
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ shoppingList, sessionId }) => {
  const { t } = useI18n();
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(loadPurchased);
  const [copied, setCopied] = useState(false);

  // Persist purchased state
  useEffect(() => {
    savePurchased(purchasedIds);
  }, [purchasedIds]);

  const items = shoppingList.items;

  // Group by category
  const grouped: Partial<Record<ProductCategory, ShoppingProduct[]>> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category]!.push(item);
  }

  // Budget calculation
  const totalLow = items.reduce((s, i) => s + i.priceEstimate.low * i.quantity, 0);
  const totalHigh = items.reduce((s, i) => s + i.priceEstimate.high * i.quantity, 0);
  const purchasedCount = items.filter(i => purchasedIds.has(i.id)).length;

  const toggleCategory = useCallback((cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }, []);

  const togglePurchased = useCallback((id: string) => {
    setPurchasedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleBuyClick = useCallback((item: ShoppingProduct) => {
    trackProductClick(item.id, item.name, item.designDirection, item.category, sessionId);
  }, [sessionId]);

  const handleCopyList = useCallback(() => {
    const lines: string[] = [`${t('products.shoppingList')}: ${shoppingList.designName}`, ''];
    for (const cat of CATEGORY_ORDER) {
      const catItems = grouped[cat];
      if (!catItems?.length) continue;
      const categoryKey = `category.${cat}` as const;
      lines.push(`## ${t(categoryKey as any)}`);
      for (const item of catItems) {
        const check = purchasedIds.has(item.id) ? '[x]' : '[ ]';
        lines.push(`${check} ${item.name} (x${item.quantity}) — $${item.priceEstimate.low}–$${item.priceEstimate.high}`);
        lines.push(`   ${item.description}`);
      }
      lines.push('');
    }
    lines.push(`${t('products.estimatedTotal')}: $${totalLow.toLocaleString()}–$${totalHigh.toLocaleString()}`);
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shoppingList, grouped, purchasedIds, totalLow, totalHigh, t]);

  return (
    <section
      className="bg-white dark:bg-stone-800 shadow-sm border border-stone-100 dark:border-stone-700 p-6 md:p-8 transition-colors duration-300"
      aria-labelledby="shopping-list-heading"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 border-b border-stone-100 dark:border-stone-700 pb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-emerald-500" aria-hidden="true" />
          <h2 id="shopping-list-heading" className="text-2xl font-bold text-stone-800 dark:text-stone-100 m-0">
            {t('products.shoppingList')}
          </h2>
        </div>
        <button
          onClick={handleCopyList}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-stone-600 dark:text-stone-300"
          aria-label={t('shopping.copyList')}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          {copied ? t('products.copied') : t('products.copyList')}
        </button>
      </div>

      {/* Design context */}
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
        {t('products.curatedFor')} <span className="font-semibold text-stone-700 dark:text-stone-200">{shoppingList.designName}</span> — {shoppingList.designDescription}
      </p>

      {/* Budget summary */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-bold text-emerald-800 dark:text-emerald-200 text-lg">
            ${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}
          </span>
          <span className="text-sm text-emerald-600 dark:text-emerald-400">{t('products.estimatedTotal')}</span>
        </div>
        <div className="text-sm text-stone-500 dark:text-stone-400 ml-auto">
          {purchasedCount}/{items.length} {t('products.itemsCheckedOff')}
        </div>
      </div>

      {/* Category sections */}
      <div className="space-y-4">
        {CATEGORY_ORDER.map(cat => {
          const catItems = grouped[cat];
          if (!catItems?.length) return null;
          const isCollapsed = collapsedCategories.has(cat);
          const categoryKey = `category.${cat}` as const;
          const categoryLabel = t(categoryKey as any);
          const categoryIcon = getCategoryIcon(cat);

          return (
            <div key={cat} className="border border-stone-100 dark:border-stone-700 overflow-hidden">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-stone-50 dark:bg-stone-700/50 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-left"
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                <span className="text-stone-500 dark:text-stone-400">{categoryIcon}</span>
                <span className="font-semibold text-stone-800 dark:text-stone-100">{categoryLabel}</span>
                <span className="text-xs text-stone-400 ml-auto">{catItems.length} item{catItems.length > 1 ? 's' : ''}</span>
              </button>

              {!isCollapsed && (
                <ul className="divide-y divide-stone-100 dark:divide-stone-700 list-none m-0 p-0">
                  {catItems.map(item => {
                    const isPurchased = purchasedIds.has(item.id);
                    return (
                      <li key={item.id} className={`p-4 transition-colors ${isPurchased ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => togglePurchased(item.id)}
                            className={`mt-1 w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isPurchased
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-stone-300 dark:border-stone-600 hover:border-emerald-400'
                            }`}
                            aria-label={isPurchased ? `${t('products.unmark')} ${item.name} ${t('products.asPurchased')}` : `${t('products.mark')} ${item.name} ${t('products.asPurchased')}`}
                          >
                            {isPurchased && <Check className="w-3 h-3" />}
                          </button>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold text-stone-800 dark:text-stone-100 ${isPurchased ? 'line-through opacity-60' : ''}`}>
                                {item.name}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-xs px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400">
                                  ×{item.quantity}
                                </span>
                              )}
                              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                ${item.priceEstimate.low}–${item.priceEstimate.high}
                              </span>
                            </div>
                            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{item.description}</p>
                            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 italic">
                              {item.designTheoryJustification}
                            </p>
                          </div>

                          {/* Buy button */}
                          <a
                            href={getProductUrl(item.name, undefined, item.category)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleBuyClick(item)}
                            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                            aria-label={`${t('products.shopFor')} ${item.name}`}
                          >
                            {t('products.shopButton')} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-stone-400 dark:text-stone-500 italic">
        {t('products.affiliateDisclaimer')}
      </p>
    </section>
  );
};

export default ShoppingList;
