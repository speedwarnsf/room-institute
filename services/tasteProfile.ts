/**
 * Taste Profile Engine
 * Calculates aesthetic preferences from lookbook ratings.
 * Every rating is a data point — positive signals from positive and top-rated,
 * negative signals from Never Again (stronger weight).
 */

import type { LookbookEntry, DesignRating } from '../types';

export interface TasteProfile {
  dimensions: {
    warmth: number;      // -1 (cool) to 1 (warm)
    boldness: number;    // -1 (subtle) to 1 (dramatic)
    nature: number;      // -1 (industrial) to 1 (biophilic)
    texture: number;     // -1 (smooth/clean) to 1 (rich/layered)
    minimalism: number;  // -1 (maximalist) to 1 (minimalist)
    symmetry: number;    // -1 (asymmetric) to 1 (symmetric)
  };
  affinities: string[];
  rejections: string[];
  totalRatings: number;
  lastUpdated: number;
}

export type TasteDimension = keyof TasteProfile['dimensions'];

export const DIMENSION_LABELS: Record<TasteDimension, { low: string; high: string; label: string }> = {
  warmth:    { low: 'Cool',       high: 'Warm',       label: 'Warmth' },
  boldness:  { low: 'Subtle',     high: 'Dramatic',   label: 'Boldness' },
  nature:    { low: 'Industrial', high: 'Biophilic',  label: 'Nature' },
  texture:   { low: 'Clean',      high: 'Textured',   label: 'Texture' },
  minimalism:{ low: 'Maximalist', high: 'Minimalist', label: 'Minimalism' },
  symmetry:  { low: 'Asymmetric', high: 'Symmetric',  label: 'Symmetry' },
};

// Signal keywords for each dimension (extracted from design names, moods, key changes)
const DIMENSION_SIGNALS: Record<TasteDimension, { positive: RegExp; negative: RegExp }> = {
  warmth: {
    positive: /warm|cozy|amber|golden|honey|terracotta|earth|wood|rustic|intimate|candlelit|sunset|copper|caramel|ochre/i,
    negative: /cool|crisp|ice|steel|silver|slate|arctic|minimal|clinical|blue-grey|chrome|frost/i,
  },
  boldness: {
    positive: /bold|dramatic|statement|maximalist|vivid|striking|intense|luxe|opulent|jewel|saturated|eclectic|clash/i,
    negative: /subtle|quiet|understated|whisper|muted|restrained|gentle|calm|serene|soft|neutral|pale/i,
  },
  nature: {
    positive: /nature|biophilic|plant|green|garden|botanical|organic|leaf|moss|fern|natural|wabi|stone|earth|living/i,
    negative: /industrial|urban|metal|concrete|synthetic|tech|machine|geometric|artificial|polished|glass|chrome/i,
  },
  texture: {
    positive: /texture|layered|tactile|woven|linen|wool|velvet|bouclé|jute|rattan|rough|handmade|patina|aged|grain/i,
    negative: /smooth|clean|sleek|polished|lacquer|glass|mirror|glossy|flat|uniform|seamless|refined/i,
  },
  minimalism: {
    positive: /minimal|simple|spare|essential|reduct|less|zen|empty|void|breath|uncluttered|airy|open/i,
    negative: /maximal|layered|eclectic|abundant|rich|ornate|decorated|filled|dense|collected|curated|stacked/i,
  },
  symmetry: {
    positive: /symmetric|balanced|centered|aligned|formal|classical|order|grid|mirror|proportion|harmony/i,
    negative: /asymmetr|organic|casual|off-center|dynamic|playful|irregular|informal|scattered|free-form/i,
  },
};

// Rating weights: negative ratings are stronger signals (per vision doc)
const RATING_WEIGHTS: Record<DesignRating, number> = {
  'never':   -1.5,  // strong negative
  'not-now': -0.3,  // mild negative
  'like':     0.5,  // mild positive
  'good':     1.0,  // positive
  'the-one':  1.5,  // strong positive
};

function analyzeText(text: string, dim: TasteDimension): number {
  const { positive, negative } = DIMENSION_SIGNALS[dim];
  const posMatches = (text.match(positive) || []).length;
  const negMatches = (text.match(negative) || []).length;
  const total = posMatches + negMatches;
  if (total === 0) return 0;
  return (posMatches - negMatches) / total; // -1 to 1
}

function getEntryText(entry: LookbookEntry): string {
  const { option } = entry;
  return [option.name, option.mood, ...option.keyChanges, option.fullPlan || ''].join(' ');
}

export function calculateTasteProfile(entries: LookbookEntry[]): TasteProfile {
  const rated = entries.filter(e => e.rating);
  if (rated.length === 0) {
    return {
      dimensions: { warmth: 0, boldness: 0, nature: 0, texture: 0, minimalism: 0, symmetry: 0 },
      affinities: [],
      rejections: [],
      totalRatings: 0,
      lastUpdated: Date.now(),
    };
  }

  const dims: TasteProfile['dimensions'] = { warmth: 0, boldness: 0, nature: 0, texture: 0, minimalism: 0, symmetry: 0 };
  let totalWeight = 0;

  for (const entry of rated) {
    const weight = RATING_WEIGHTS[entry.rating!];
    const text = getEntryText(entry);
    const absWeight = Math.abs(weight);
    totalWeight += absWeight;

    for (const dim of Object.keys(dims) as TasteDimension[]) {
      const signal = analyzeText(text, dim);
      dims[dim] += signal * weight;
    }
  }

  // Normalize to -1..1
  if (totalWeight > 0) {
    for (const dim of Object.keys(dims) as TasteDimension[]) {
      dims[dim] = Math.max(-1, Math.min(1, dims[dim] / totalWeight));
    }
  }

  // Extract affinities and rejections from framework tags
  const affinities: string[] = [];
  const rejections: string[] = [];
  const frameworkScores = new Map<string, number>();

  for (const entry of rated) {
    const weight = RATING_WEIGHTS[entry.rating!];
    for (const fw of entry.option.frameworks) {
      frameworkScores.set(fw, (frameworkScores.get(fw) || 0) + weight);
    }
  }

  for (const [fw, score] of frameworkScores) {
    if (score > 0.5) affinities.push(fw);
    if (score < -0.5) rejections.push(fw);
  }

  return {
    dimensions: dims,
    affinities,
    rejections,
    totalRatings: rated.length,
    lastUpdated: Date.now(),
  };
}

/** Generate a human-readable taste summary */
export function getTasteSummary(profile: TasteProfile): { tendencies: string[]; avoidances: string[] } {
  const tendencies: string[] = [];
  const avoidances: string[] = [];

  for (const [dim, val] of Object.entries(profile.dimensions) as [TasteDimension, number][]) {
    const { low, high } = DIMENSION_LABELS[dim];
    if (val > 0.25) tendencies.push(high.toLowerCase());
    else if (val < -0.25) tendencies.push(low.toLowerCase());
    if (val > 0.5) tendencies.push(`strongly ${high.toLowerCase()}`);
    if (val < -0.5) avoidances.push(high.toLowerCase());
  }

  return { tendencies: [...new Set(tendencies)].slice(0, 4), avoidances: [...new Set(avoidances)].slice(0, 3) };
}

const TASTE_KEY = 'room-institute-taste-profile';

export function saveTasteProfile(profile: TasteProfile): void {
  try {
    localStorage.setItem(TASTE_KEY, JSON.stringify(profile));
  } catch {}
}

export function loadTasteProfile(): TasteProfile | null {
  try {
    const data = localStorage.getItem(TASTE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}
