/**
 * Design Studio Typography System
 * Maps type_mood to font pairings, accent styles, and layout density
 */
import type { TypeMood, DesignOption } from '../types';

export interface TypePalette {
  mood: TypeMood;
  heading: string;       // CSS font-family for headings
  body: string;          // CSS font-family for body
  googleFonts: string[]; // Font names to load from Google Fonts
  tracking: string;      // letter-spacing for headings
  capsHeadings: boolean; // uppercase section headers?
  layoutDensity: 'sparse' | 'balanced' | 'dense';
}

const TYPE_PALETTES: Record<TypeMood, TypePalette> = {
  'warm-editorial': {
    mood: 'warm-editorial',
    heading: "'Playfair Display', Georgia, serif",
    body: "'Source Serif 4', Georgia, serif",
    googleFonts: ['Playfair+Display:wght@400;700;900', 'Source+Serif+4:ital,wght@0,400;0,600;1,400'],
    tracking: '-0.02em',
    capsHeadings: false,
    layoutDensity: 'balanced',
  },
  'stark-minimal': {
    mood: 'stark-minimal',
    heading: "'Inter', system-ui, sans-serif",
    body: "'Space Grotesk', system-ui, sans-serif",
    googleFonts: ['Inter:wght@300;400;700', 'Space+Grotesk:wght@400;500;700'],
    tracking: '0.05em',
    capsHeadings: true,
    layoutDensity: 'sparse',
  },
  'bold-expressive': {
    mood: 'bold-expressive',
    heading: "'Bebas Neue', Impact, sans-serif",
    body: "'DM Sans', system-ui, sans-serif",
    googleFonts: ['Bebas+Neue', 'DM+Sans:wght@400;500;700'],
    tracking: '0.03em',
    capsHeadings: true,
    layoutDensity: 'dense',
  },
  'classic-refined': {
    mood: 'classic-refined',
    heading: "'Cormorant Garamond', Georgia, serif",
    body: "'Lato', system-ui, sans-serif",
    googleFonts: ['Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400', 'Lato:wght@300;400;700'],
    tracking: '0em',
    capsHeadings: false,
    layoutDensity: 'balanced',
  },
  'raw-industrial': {
    mood: 'raw-industrial',
    heading: "'Space Mono', monospace",
    body: "'IBM Plex Sans', system-ui, sans-serif",
    googleFonts: ['Space+Mono:wght@400;700', 'IBM+Plex+Sans:wght@300;400;600'],
    tracking: '0.08em',
    capsHeadings: true,
    layoutDensity: 'sparse',
  },
};

/**
 * Infer type_mood from a design option's characteristics
 */
export function inferTypeMood(option: DesignOption): TypeMood {
  const text = `${option.name} ${option.mood} ${option.keyChanges.join(' ')}`.toLowerCase();
  const frameworks = option.frameworks.map(f => f.toLowerCase());

  // Scoring
  const scores: Record<TypeMood, number> = {
    'warm-editorial': 0,
    'stark-minimal': 0,
    'bold-expressive': 0,
    'classic-refined': 0,
    'raw-industrial': 0,
  };

  // Warm keywords
  if (/warm|cozy|amber|terracotta|velvet|linen|organic|earth|wood|natural|hygge|wabi/i.test(text)) scores['warm-editorial'] += 3;
  if (/biophilic|phenomenological/i.test(frameworks.join(' '))) scores['warm-editorial'] += 2;

  // Minimal keywords
  if (/minimal|clean|stark|austere|white|mono|simple|reduction|less|pure|void/i.test(text)) scores['stark-minimal'] += 3;
  if (/aesthetic order/i.test(frameworks.join(' '))) scores['stark-minimal'] += 2;

  // Bold keywords
  if (/bold|dramatic|vivid|statement|loud|maximalist|eclectic|clash|pop|neon|saturated/i.test(text)) scores['bold-expressive'] += 3;

  // Classic keywords
  if (/classic|timeless|traditional|elegant|refined|heritage|antique|period|georgian|victorian|art deco/i.test(text)) scores['classic-refined'] += 3;
  if (/universal design/i.test(frameworks.join(' '))) scores['classic-refined'] += 1;

  // Industrial keywords
  if (/industrial|raw|concrete|steel|exposed|brutalist|loft|urban|metal|utilitarian|workshop/i.test(text)) scores['raw-industrial'] += 3;

  // Check palette warmth
  const avgWarmth = getAverageWarmth(option.palette);
  if (avgWarmth > 0.6) scores['warm-editorial'] += 2;
  if (avgWarmth < 0.3) scores['stark-minimal'] += 1;

  // Find winner
  let best: TypeMood = 'warm-editorial';
  let bestScore = 0;
  for (const [mood, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = mood as TypeMood;
    }
  }

  return best;
}

function getAverageWarmth(palette: string[]): number {
  if (!palette.length) return 0.5;
  let totalWarmth = 0;
  for (const hex of palette) {
    const r = parseInt(hex.slice(1, 3), 16) || 128;
    const b = parseInt(hex.slice(5, 7), 16) || 128;
    totalWarmth += r / (r + b + 1);
  }
  return totalWarmth / palette.length;
}

export function getTypePalette(mood: TypeMood): TypePalette {
  return TYPE_PALETTES[mood];
}

let loadedFonts = new Set<string>();

export function loadStudioFonts(mood: TypeMood): void {
  const palette = TYPE_PALETTES[mood];
  const key = palette.googleFonts.join(',');
  if (loadedFonts.has(key)) return;
  loadedFonts.add(key);

  const families = palette.googleFonts.join('&family=');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
  document.head.appendChild(link);
}
