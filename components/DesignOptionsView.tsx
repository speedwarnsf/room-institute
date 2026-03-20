import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Palette, Sparkles, ChevronRight, ArrowLeft, 
  Loader2, Eye, Leaf, Users, Accessibility, 
  Compass, Ruler
} from 'lucide-react';
import { DesignOption, DesignFramework } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface DesignOptionsViewProps {
  /** The 5-framework room reading markdown */
  roomReading: string;
  /** Exactly 3 design options */
  options: [DesignOption, DesignOption, DesignOption];
  /** Called when user picks a design to expand */
  onSelectDesign: (index: number) => void;
  /** Whether visualizations are being generated */
  isGeneratingVisuals: boolean;
}

const frameworkMeta: Record<DesignFramework, { icon: React.ReactNode; color: string; bg: string }> = {
  'Aesthetic Order': { 
    icon: <Ruler className="w-3 h-3" />, 
    color: 'text-violet-700 dark:text-violet-300', 
    bg: 'bg-violet-100 dark:bg-violet-900/40' 
  },
  'Human-Centric': { 
    icon: <Users className="w-3 h-3" />, 
    color: 'text-blue-700 dark:text-blue-300', 
    bg: 'bg-blue-100 dark:bg-blue-900/40' 
  },
  'Universal Design': { 
    icon: <Accessibility className="w-3 h-3" />, 
    color: 'text-teal-700 dark:text-teal-300', 
    bg: 'bg-teal-100 dark:bg-teal-900/40' 
  },
  'Biophilic': { 
    icon: <Leaf className="w-3 h-3" />, 
    color: 'text-emerald-700 dark:text-emerald-300', 
    bg: 'bg-emerald-100 dark:bg-emerald-900/40' 
  },
  'Phenomenological': { 
    icon: <Compass className="w-3 h-3" />, 
    color: 'text-emerald-600 dark:text-emerald-200', 
    bg: 'bg-amber-100 dark:bg-emerald-950/40' 
  },
};

/**
 * Renders 3 design option cards for the user to choose from
 */
export const DesignOptionsView: React.FC<DesignOptionsViewProps> = ({
  roomReading,
  options,
  onSelectDesign,
  isGeneratingVisuals
}) => {
  const [showReading, setShowReading] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Room Reading Toggle */}
      <section className="bg-white dark:bg-stone-800 shadow-sm border border-stone-100 dark:border-stone-700 p-6 md:p-8 transition-colors duration-300">
        <button
          onClick={() => setShowReading(!showReading)}
          className="w-full flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-emerald-500" aria-hidden="true" />
            <div className="text-left">
              <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 font-serif">
                Room Analysis
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Your space through 5 design theory lenses
              </p>
            </div>
          </div>
          <ChevronRight 
            className={`w-5 h-5 text-stone-400 transition-transform duration-200 ${showReading ? 'rotate-90' : ''}`} 
            aria-hidden="true" 
          />
        </button>
        
        {showReading && (
          <div className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-700 prose prose-emerald dark:prose-invert max-w-none prose-headings:font-serif">
            <ReactMarkdown>{roomReading}</ReactMarkdown>
          </div>
        )}
      </section>

      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-100 font-serif mb-3">
          3 Design Directions
        </h2>
        <p className="text-stone-500 dark:text-stone-400 max-w-lg mx-auto">
          Each vision is grounded in academic design theory. Pick the one that speaks to you.
        </p>
      </div>

      {/* 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option, idx) => (
          <DesignCard
            key={idx}
            option={option}
            index={idx}
            onSelect={() => onSelectDesign(idx)}
            isGeneratingVisual={isGeneratingVisuals}
          />
        ))}
      </div>
    </div>
  );
};

interface DesignCardProps {
  option: DesignOption;
  index: number;
  onSelect: () => void;
  isGeneratingVisual: boolean;
}

const cardAccents = [
  'from-violet-500/10 to-purple-500/10 hover:border-violet-300 dark:hover:border-violet-600',
  'from-emerald-500/10 to-teal-500/10 hover:border-emerald-300 dark:hover:border-emerald-600',
  'from-emerald-400/10 to-orange-500/10 hover:border-emerald-200 dark:hover:border-emerald-500',
];

const DesignCard: React.FC<DesignCardProps> = ({ option, index, onSelect, isGeneratingVisual }) => {
  return (
    <button
      onClick={onSelect}
      className={`group relative text-left bg-gradient-to-br ${cardAccents[index]} bg-white dark:bg-stone-800 shadow-sm border border-stone-200 dark:border-stone-700 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900`}
      aria-label={`Select ${option.name} design`}
    >
      {/* Visualization preview */}
      <div className="w-full h-40 mb-5 overflow-hidden bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
        {option.visualizationImage ? (
          <img
            src={`data:image/png;base64,${option.visualizationImage}`}
            alt={`${option.name} preview`}
            className="w-full h-full object-cover"
          />
        ) : isGeneratingVisual ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
            <span className="text-xs text-stone-400">Generating…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Sparkles className="w-8 h-8 text-stone-300 dark:text-stone-500" />
            <span className="text-xs text-stone-400 dark:text-stone-500">AI Preview</span>
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 font-serif mb-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
        {option.name}
      </h3>

      {/* Mood */}
      <p className="text-sm text-stone-600 dark:text-stone-300 mb-4 leading-relaxed line-clamp-2">
        {option.mood}
      </p>

      {/* Color Palette */}
      <div className="flex items-center gap-1.5 mb-4">
        <Palette className="w-4 h-4 text-stone-400 mr-1" aria-hidden="true" />
        {option.palette.map((hex, i) => (
          <div
            key={i}
            className="w-7 h-7 border-2 border-white dark:border-stone-600 shadow-sm"
            style={{ backgroundColor: hex }}
            title={hex}
            aria-label={`Color ${hex}`}
          />
        ))}
      </div>

      {/* Framework Badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {option.frameworks.map((fw) => {
          const meta = frameworkMeta[fw];
          return (
            <span
              key={fw}
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium ${meta.color} ${meta.bg}`}
            >
              {meta.icon}
              {fw}
            </span>
          );
        })}
      </div>

      {/* Key Changes */}
      <ul className="space-y-1 mb-4">
        {option.keyChanges.slice(0, 3).map((change, i) => (
          <li key={i} className="text-xs text-stone-500 dark:text-stone-400 flex items-start gap-1.5">
            <span className="text-emerald-500 mt-0.5">•</span>
            <span className="line-clamp-1">{change}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 group-hover:gap-2 transition-all">
        Explore This Design
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </div>
    </button>
  );
};

// --- Expanded Design Detail View ---

interface DesignDetailViewProps {
  option: DesignOption;
  roomReading: string;
  onBack: () => void;
  onVisualize: () => void;
  isVisualizing: boolean;
  originalImage?: string | null;
}

export const DesignDetailView: React.FC<DesignDetailViewProps> = ({
  option,
  roomReading,
  onBack,
  onVisualize,
  isVisualizing,
  originalImage
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 px-2 py-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to 3 Designs
      </button>

      {/* Hero */}
      <div className="bg-white dark:bg-stone-800 shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden transition-colors duration-300">
        {/* Visualization or generate */}
        <div className="relative h-64 md:h-80 bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
          {option.visualizationImage ? (
            <img
              src={`data:image/png;base64,${option.visualizationImage}`}
              alt={`${option.name} visualization`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              {isVisualizing ? (
                <>
                  <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                  <p className="text-stone-500 dark:text-stone-400 text-sm">Generating visualization…</p>
                </>
              ) : (
                <button
                  onClick={onVisualize}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)] flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Generate Visualization
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-6 md:p-8">
          {/* Title + palette */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-800 dark:text-stone-100 font-serif">
              {option.name}
            </h2>
            <div className="flex items-center gap-1.5">
              {option.palette.map((hex, i) => (
                <div
                  key={i}
                  className="w-8 h-8 border-2 border-white dark:border-stone-600 shadow-sm"
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>
          </div>

          {/* Mood */}
          <p className="text-lg text-stone-600 dark:text-stone-300 mb-6 leading-relaxed italic">
            {option.mood}
          </p>

          {/* Framework badges */}
          <div className="flex flex-wrap gap-2 mb-8">
            {option.frameworks.map((fw) => {
              const meta = frameworkMeta[fw];
              return (
                <span
                  key={fw}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium ${meta.color} ${meta.bg}`}
                >
                  {meta.icon}
                  {fw}
                </span>
              );
            })}
          </div>

          {/* Full plan */}
          <div className="prose prose-stone dark:prose-invert max-w-none
                prose-headings:font-serif prose-headings:tracking-tight
                prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-3
                prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2
                prose-h4:text-base prose-h4:font-semibold prose-h4:mt-5 prose-h4:mb-1.5
                prose-p:text-[15px] prose-p:leading-relaxed prose-p:mb-4
                prose-strong:font-semibold
                prose-li:text-[15px] prose-li:leading-relaxed prose-li:mb-1
                prose-ul:mt-2 prose-ul:mb-4">
            <ReactMarkdown>{option.fullPlan}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};
