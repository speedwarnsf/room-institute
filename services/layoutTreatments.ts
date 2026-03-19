/**
 * Layout Treatment System for ZenSpace Design Studio
 *
 * Maps design tone/palette/mood to editorial presentation styles.
 * Each treatment defines typography, color, and layout parameters
 * that transform the magazine-spread experience per design option.
 */

import type { DesignOption, DesignFramework } from '../types';

export interface LayoutTreatment {
  id: string;
  name: string;
  // Typography
  titleFont: string;
  titleWeight: number;
  titleCase: 'uppercase' | 'capitalize' | 'none';
  titleSize: string;
  bodyFont: string;
  // Colors
  bgColor: string;
  textColor: string;
  accentColor: string;
  // Layout
  heroHeight: string;
  contentPadding: string;
  useDropCap: boolean;
  useTwoColumn: boolean;
  headerStyle: 'overlay' | 'below' | 'split';
}

// ─── Treatment Profiles ────────────────────────────────────────

const BOLD_DARK: LayoutTreatment = {
  id: 'bold-dark',
  name: 'Bold / Dark',
  titleFont: '"Arial Black", "Helvetica Neue", Impact, sans-serif',
  titleWeight: 900,
  titleCase: 'uppercase',
  titleSize: 'clamp(3rem, 8vw, 7rem)',
  bodyFont: '"Helvetica Neue", Arial, sans-serif',
  bgColor: '#0a0a0a',
  textColor: '#f5f5f5',
  accentColor: '#d4af37',
  heroHeight: '95vh',
  contentPadding: '2rem 3rem',
  useDropCap: false,
  useTwoColumn: false,
  headerStyle: 'overlay',
};

const AIRY_LIGHT: LayoutTreatment = {
  id: 'airy-light',
  name: 'Airy / Light',
  titleFont: 'Georgia, "Times New Roman", serif',
  titleWeight: 400,
  titleCase: 'capitalize',
  titleSize: 'clamp(2.5rem, 5vw, 4.5rem)',
  bodyFont: 'Georgia, serif',
  bgColor: '#fafaf8',
  textColor: '#2a2a2a',
  accentColor: '#8ba4b8',
  heroHeight: '70vh',
  contentPadding: '4rem 6rem',
  useDropCap: true,
  useTwoColumn: true,
  headerStyle: 'below',
};

const WARM_ORGANIC: LayoutTreatment = {
  id: 'warm-organic',
  name: 'Warm / Organic',
  titleFont: '"Palatino Linotype", Palatino, Georgia, serif',
  titleWeight: 700,
  titleCase: 'capitalize',
  titleSize: 'clamp(2rem, 5vw, 4rem)',
  bodyFont: '"Segoe UI", Tahoma, sans-serif',
  bgColor: '#f5f0e8',
  textColor: '#3d2e1e',
  accentColor: '#b07d4e',
  heroHeight: '75vh',
  contentPadding: '3.5rem 5rem',
  useDropCap: true,
  useTwoColumn: true,
  headerStyle: 'below',
};

const ECLECTIC_PLAYFUL: LayoutTreatment = {
  id: 'eclectic-playful',
  name: 'Eclectic / Playful',
  titleFont: '"Georgia", "Courier New", serif',
  titleWeight: 800,
  titleCase: 'none',
  titleSize: 'clamp(3rem, 7vw, 6rem)',
  bodyFont: '"Helvetica Neue", Arial, sans-serif',
  bgColor: '#fffef5',
  textColor: '#1a1a2e',
  accentColor: '#e76f51',
  heroHeight: '80vh',
  contentPadding: '2rem 3rem',
  useDropCap: false,
  useTwoColumn: false,
  headerStyle: 'split',
};

const MINIMAL_REFINED: LayoutTreatment = {
  id: 'minimal-refined',
  name: 'Minimal / Refined',
  titleFont: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  titleWeight: 200,
  titleCase: 'uppercase',
  titleSize: 'clamp(1.5rem, 3vw, 2.5rem)',
  bodyFont: '"Helvetica Neue", Helvetica, sans-serif',
  bgColor: '#ffffff',
  textColor: '#333333',
  accentColor: '#999999',
  heroHeight: '60vh',
  contentPadding: '5rem 8rem',
  useDropCap: false,
  useTwoColumn: true,
  headerStyle: 'below',
};

export const TREATMENTS: LayoutTreatment[] = [
  BOLD_DARK,
  AIRY_LIGHT,
  WARM_ORGANIC,
  ECLECTIC_PLAYFUL,
  MINIMAL_REFINED,
];

export const TREATMENTS_BY_ID: Record<string, LayoutTreatment> = Object.fromEntries(
  TREATMENTS.map((t) => [t.id, t]),
);

// ─── Tone Detection ────────────────────────────────────────────

/** Parse a hex color and return relative luminance (0 = black, 1 = white). */
function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  // sRGB linearize
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Average luminance of a palette. */
function avgLuminance(palette: string[]): number {
  if (!palette.length) return 0.5;
  return palette.reduce((sum, h) => sum + luminance(h), 0) / palette.length;
}

/** Pick a mid-range accent from the palette (not darkest, not lightest). */
function pickAccent(palette: string[]): string {
  if (!palette.length) return '#a3a3a3';
  if (palette.length <= 2) return palette[0]!;
  const sorted = [...palette].sort((a, b) => luminance(a) - luminance(b));
  return sorted[Math.floor(sorted.length / 2)] ?? sorted[0]!;
}

/** Keyword sets for mood/framework heuristics. */
const MOOD_DARK = /dark|moody|dramatic|shadow|noir|bold|intense|gothic|midnight/i;
const MOOD_AIRY = /airy|light|bright|clean|fresh|crisp|soft|ethereal|serene/i;
const MOOD_WARM = /warm|earthy|organic|natural|rustic|cozy|terracotta|linen|wood/i;
const MOOD_PLAYFUL = /eclectic|playful|vibrant|fun|pop|mixed|bold color|bohemian|maximalist/i;
const MOOD_MINIMAL = /minimal|refined|quiet|restrained|monochrome|simple|zen|sparse/i;

const FRAMEWORK_SCORES: Record<DesignFramework, Record<string, number>> = {
  'Aesthetic Order': { 'minimal-refined': 2, 'airy-light': 1 },
  'Human-Centric': { 'warm-organic': 2, 'airy-light': 1 },
  'Universal Design': { 'minimal-refined': 1, 'airy-light': 1 },
  'Biophilic': { 'warm-organic': 3, 'airy-light': 1 },
  'Phenomenological': { 'bold-dark': 2, 'eclectic-playful': 1 },
};

/**
 * Detect the best layout treatment for a given DesignOption.
 * Analyzes palette luminance, mood keywords, and framework tags.
 */
export function detectTreatment(option: DesignOption): LayoutTreatment {
  const scores: Record<string, number> = {
    'bold-dark': 0,
    'airy-light': 0,
    'warm-organic': 0,
    'eclectic-playful': 0,
    'minimal-refined': 0,
  };

  const bump = (key: string, pts: number) => { scores[key] = (scores[key] ?? 0) + pts; };

  // 1. Palette luminance
  const lum = avgLuminance(option.palette);
  if (lum < 0.15) bump('bold-dark', 4);
  else if (lum < 0.3) bump('bold-dark', 2);
  else if (lum > 0.7) bump('airy-light', 3);
  else if (lum > 0.55) bump('minimal-refined', 2);
  else bump('warm-organic', 1);

  // 2. Mood text
  const moodText = `${option.name} ${option.mood}`;
  if (MOOD_DARK.test(moodText)) bump('bold-dark', 3);
  if (MOOD_AIRY.test(moodText)) bump('airy-light', 3);
  if (MOOD_WARM.test(moodText)) bump('warm-organic', 3);
  if (MOOD_PLAYFUL.test(moodText)) bump('eclectic-playful', 3);
  if (MOOD_MINIMAL.test(moodText)) bump('minimal-refined', 3);

  // 3. Framework tags
  for (const fw of option.frameworks) {
    const mapping = FRAMEWORK_SCORES[fw];
    if (mapping) {
      for (const [id, pts] of Object.entries(mapping)) {
        bump(id, pts);
      }
    }
  }

  // Pick winner
  let bestId = 'airy-light';
  let bestScore = -1;
  for (const [id, s] of Object.entries(scores)) {
    if (s > bestScore) {
      bestScore = s;
      bestId = id;
    }
  }

  const base = TREATMENTS_BY_ID[bestId] ?? TREATMENTS[0]!;
  const accent = pickAccent(option.palette);

  return { ...base, accentColor: accent } as LayoutTreatment;
}
