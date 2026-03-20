import { useState, useCallback, useMemo } from 'react';
import { Lock, Unlock, ChevronRight, Pin } from 'lucide-react';
import type { StructureElement, StructureChoices, KeepMode } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface StructureAssessmentProps {
  /** Detected structural elements */
  elements: StructureElement[];
  /** Callback when user clicks continue */
  onContinue: (choices: StructureChoices) => void;
  /** Whether the user can interact with the component */
  disabled?: boolean;
}

/** Category labels for grouping */
const CATEGORY_LABELS = {
  structural: 'Structural Elements',
  fixture: 'Fixtures & Built-ins', 
  moveable: 'Moveable Elements'
} as const;

/** Category descriptions */
const CATEGORY_DESCRIPTIONS = {
  structural: 'Permanent architectural features — automatically preserved in exact position',
  fixture: 'Semi-permanent installations you can choose to keep or change',
  moveable: 'Items that can be easily rearranged or replaced'
} as const;

/** Get default keep mode for an element */
const getDefaultKeepMode = (element: StructureElement): KeepMode => {
  if (element.category === 'structural') return 'keep-in-place';
  if (element.category === 'fixture') return element.keepByDefault ? 'keep-in-place' : 'change';
  return element.keepByDefault ? 'keep' : 'change';
};

/** Cycle to next mode in the sequence */
const cycleKeepMode = (current: KeepMode, category: 'structural' | 'fixture' | 'moveable'): KeepMode => {
  if (category === 'structural') return 'keep-in-place'; // Structural elements are always fixed
  // For fixtures and moveables: change -> keep -> keep-in-place -> change
  if (current === 'change') return 'keep';
  if (current === 'keep') return 'keep-in-place';
  return 'change';
};

/**
 * Structure assessment component for choosing which elements to keep vs change
 */
export const StructureAssessment: React.FC<StructureAssessmentProps> = ({
  elements,
  onContinue,
  disabled = false
}) => {
  // Initialize choices based on category and keepByDefault values
  const [keepChoices, setKeepChoices] = useState<Record<string, KeepMode>>(() => {
    const initial: Record<string, KeepMode> = {};
    elements.forEach(element => {
      initial[element.id] = getDefaultKeepMode(element);
    });
    return initial;
  });

  // Group elements by category
  const groupedElements = useMemo(() => {
    const groups: Record<string, StructureElement[]> = {
      structural: [],
      fixture: [],
      moveable: []
    };
    
    elements.forEach(element => {
      const cat = element.category;
      if (groups[cat]) groups[cat].push(element);
      else groups[cat] = [element];
    });

    return groups;
  }, [elements]);

  // Toggle element keep mode through the cycle
  const toggleElement = useCallback((elementId: string) => {
    if (disabled) return;

    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    setKeepChoices(prev => ({
      ...prev,
      [elementId]: cycleKeepMode(prev[elementId] || 'change', element.category)
    }));
  }, [disabled, elements]);

  // Create structure choices object for parent
  const createStructureChoices = useCallback((): StructureChoices => {
    const elementsToKeepInPlace = elements.filter(el => keepChoices[el.id] === 'keep-in-place');
    const elementsToKeepFlexible = elements.filter(el => keepChoices[el.id] === 'keep');
    const elementsToChange = elements.filter(el => keepChoices[el.id] === 'change');

    return {
      keepChoices,
      elementsToKeepInPlace,
      elementsToKeepFlexible,
      elementsToChange
    };
  }, [elements, keepChoices]);

  // Handle continue button click
  const handleContinue = useCallback(() => {
    if (disabled) return;
    onContinue(createStructureChoices());
  }, [disabled, onContinue, createStructureChoices]);

  // Count elements by mode for summary
  const summary = useMemo(() => {
    const fixed = elements.filter(el => keepChoices[el.id] === 'keep-in-place').length;
    const flexible = elements.filter(el => keepChoices[el.id] === 'keep').length;
    const toChange = elements.filter(el => keepChoices[el.id] === 'change').length;
    return { fixed, flexible, toChange };
  }, [elements, keepChoices]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
          Structure Assessment
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          Before generating designs, choose which elements to keep as-is versus open to changes. 
          This helps create more targeted recommendations for your space.
        </p>
      </div>

      {/* Category sections */}
      <div className="space-y-8 mb-8">
        {(['structural', 'fixture', 'moveable'] as const).map(category => {
          const categoryElements = groupedElements[category] || [];
          if (categoryElements.length === 0) return null;

          return (
            <div key={category} className="bg-white dark:bg-neutral-800  border border-neutral-200 dark:border-neutral-700">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  {CATEGORY_LABELS[category]}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {CATEGORY_DESCRIPTIONS[category]}
                </p>
              </div>
              
              <div className="p-6 space-y-3">
                {categoryElements.map(element => {
                  const mode = keepChoices[element.id] || 'change';
                  const isStructural = element.category === 'structural';
                  const canToggle = !isStructural; // Structural elements are always fixed

                  // Icon and colors based on mode
                  const { icon: Icon, bgClass, borderClass, textClass, badgeClass, label, description } = (() => {
                    switch (mode) {
                      case 'keep-in-place':
                        return {
                          icon: Pin,
                          bgClass: 'bg-blue-50 dark:bg-blue-950/20',
                          borderClass: 'border-blue-200 dark:border-blue-800',
                          textClass: 'text-blue-700 dark:text-blue-300',
                          badgeClass: 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                          label: 'Keep in Place',
                          description: 'Fixed position'
                        };
                      case 'keep':
                        return {
                          icon: Lock,
                          bgClass: 'bg-emerald-50 dark:bg-emerald-950/20',
                          borderClass: 'border-emerald-200 dark:border-emerald-800',
                          textClass: 'text-emerald-700 dark:text-emerald-300',
                          badgeClass: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
                          label: 'Keep',
                          description: 'Include but can move'
                        };
                      case 'change':
                      default:
                        return {
                          icon: Unlock,
                          bgClass: 'bg-amber-50 dark:bg-amber-950/20',
                          borderClass: 'border-amber-200 dark:border-emerald-700',
                          textClass: 'text-emerald-600 dark:text-emerald-200',
                          badgeClass: 'bg-amber-200 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
                          label: 'Change',
                          description: 'Open to changes'
                        };
                    }
                  })();

                  return (
                    <div
                      key={element.id}
                      className={`flex items-center justify-between p-4 transition-all duration-200 ${bgClass} border ${borderClass} ${
                        canToggle
                          ? 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                          : 'cursor-not-allowed opacity-75'
                      }`}
                      onClick={() => canToggle && toggleElement(element.id)}
                      role={canToggle ? "button" : undefined}
                      tabIndex={canToggle && !disabled ? 0 : -1}
                      onKeyDown={(e) => {
                        if (canToggle && !disabled && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          toggleElement(element.id);
                        }
                      }}
                      aria-label={canToggle ? `Toggle ${element.name}: currently ${label}` : `${element.name}: ${label} (cannot change)`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${textClass}`} />
                        <div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            {element.name}
                            {isStructural && <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">(automatic)</span>}
                          </div>
                          <div className={`text-sm ${textClass}`}>
                            {description}
                          </div>
                        </div>
                      </div>

                      <div className={`px-3 py-1 text-xs font-medium ${badgeClass}`}>
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-neutral-100 dark:bg-neutral-800 p-6 mb-8">
        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Summary</h4>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300">
              {summary.fixed} fixed in place
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-300">
              {summary.flexible} kept but flexible
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-emerald-500 dark:text-emerald-300" />
            <span className="text-emerald-600 dark:text-emerald-200">
              {summary.toChange} open to change
            </span>
          </div>
        </div>
      </div>

      {/* Continue button */}
      <div className="text-center">
        <button
          onClick={handleContinue}
          disabled={disabled}
          className="inline-flex items-center gap-2 px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900  font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label={`Continue to designs with ${summary.fixed} elements fixed, ${summary.flexible} flexible, and ${summary.toChange} open to change`}
        >
          Continue to Designs
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};