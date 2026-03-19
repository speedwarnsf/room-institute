/**
 * Curated design inspiration data
 * Static dataset of interior design inspiration organized by style
 */

export interface InspirationImage {
  id: string;
  src: string;
  alt: string;
  style: DesignStyle;
  room: string;
  credit: string;
  tags: string[];
}

export type DesignStyle =
  | 'Modern'
  | 'Traditional'
  | 'Scandinavian'
  | 'Industrial'
  | 'Mid-Century'
  | 'Bohemian'
  | 'Mediterranean';

export interface DesignTip {
  id: string;
  title: string;
  principle: string;
  body: string;
  category: 'Color Theory' | 'Spatial Balance' | 'Lighting' | 'Texture' | 'Proportion';
}

export const DESIGN_STYLES: DesignStyle[] = [
  'Modern',
  'Traditional',
  'Scandinavian',
  'Industrial',
  'Mid-Century',
  'Bohemian',
  'Mediterranean',
];

/**
 * Curated inspiration images — uses Unsplash source for demo purposes.
 * In production, replace with your own CDN URLs.
 */
export const INSPIRATION_IMAGES: InspirationImage[] = [
  // Modern
  { id: 'mod-1', src: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80', alt: 'Modern living room with mustard accent chair, brass floor lamp and abstract art', style: 'Modern', room: 'Living Room', credit: 'Unsplash', tags: ['minimalist', 'neutral', 'clean-lines'] },
  { id: 'mod-2', src: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80', alt: 'Modern bedroom with charcoal headboard, line art prints and brass sconce', style: 'Modern', room: 'Bedroom', credit: 'Unsplash', tags: ['neutral', 'brass-accents', 'minimal'] },
  { id: 'mod-3', src: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80', alt: 'Modern hotel bedroom with tufted headboard and city views', style: 'Modern', room: 'Bedroom', credit: 'Unsplash', tags: ['tufted', 'neutral-palette', 'urban'] },

  // Traditional
  { id: 'trad-1', src: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=600&q=80', alt: 'Traditional living room with exposed beams and arched windows', style: 'Traditional', room: 'Living Room', credit: 'Unsplash', tags: ['classic', 'warm', 'layered'] },
  { id: 'trad-2', src: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80', alt: 'Traditional dining room with wood table and classic chandelier', style: 'Traditional', room: 'Dining Room', credit: 'Unsplash', tags: ['wood', 'elegant', 'formal'] },
  { id: 'trad-3', src: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80', alt: 'Traditional bedroom with upholstered headboard and warm bedding', style: 'Traditional', room: 'Bedroom', credit: 'Unsplash', tags: ['upholstered', 'rich', 'symmetry'] },

  // Scandinavian
  { id: 'scand-1', src: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600&q=80', alt: 'Scandinavian kitchen with white island, light oak flooring and pendant lights', style: 'Scandinavian', room: 'Kitchen', credit: 'Unsplash', tags: ['light-wood', 'white', 'functional'] },
  { id: 'scand-2', src: 'https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=600&q=80', alt: 'Scandinavian bedroom with tufted headboard, brass lamps and neutral textiles', style: 'Scandinavian', room: 'Bedroom', credit: 'Unsplash', tags: ['neutral', 'brass', 'textured'] },
  { id: 'scand-3', src: 'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=600&q=80', alt: 'Scandinavian living room with clean lines, geometric art and minimal furniture', style: 'Scandinavian', room: 'Living Room', credit: 'Unsplash', tags: ['minimal', 'geometric', 'contemporary'] },

  // Industrial
  { id: 'ind-1', src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&q=80', alt: 'Industrial loft with concrete floors, black steel-framed glass partitions, and pendant lighting', style: 'Industrial', room: 'Office', credit: 'Unsplash', tags: ['steel-frames', 'concrete', 'glass-partitions'] },
  { id: 'ind-2', src: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80', alt: 'Industrial open-plan living space with concrete walls and metal staircase', style: 'Industrial', room: 'Living Room', credit: 'Unsplash', tags: ['brick', 'metal', 'loft'] },
  { id: 'ind-3', src: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&q=80', alt: 'Industrial space with exposed concrete ceiling, steel windows, and polished floors', style: 'Industrial', room: 'Living Room', credit: 'Unsplash', tags: ['concrete', 'contrast', 'warm'] },

  // Japandi — removed: previous images were not representative of the style

  // Mid-Century
  { id: 'mid-1', src: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80', alt: 'Mid-century modern living room with brass arc lamp, leather poufs and teak furniture', style: 'Mid-Century', room: 'Living Room', credit: 'Unsplash', tags: ['arc-lamp', 'leather', 'teak'] },
  { id: 'mid-2', src: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=600&q=80', alt: 'Contemporary living room with dark accent wall', style: 'Mid-Century', room: 'Living Room', credit: 'Unsplash', tags: ['walnut', 'hairpin', 'atomic'] },
  { id: 'mid-3', src: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80', alt: 'Mid-century living room with leather sofa and brass chandelier', style: 'Mid-Century', room: 'Living Room', credit: 'Unsplash', tags: ['teak', 'geometric', 'warm'] },

  // Bohemian
  { id: 'boho-1', src: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=600&q=80', alt: 'Bohemian bedroom with gallery wall and layered textiles', style: 'Bohemian', room: 'Bedroom', credit: 'Unsplash', tags: ['layered', 'plants', 'eclectic'] },
  { id: 'boho-2', src: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80', alt: 'Eclectic living corner with bold accent chair and tropical plants', style: 'Bohemian', room: 'Living Room', credit: 'Unsplash', tags: ['macrame', 'rattan', 'texture'] },
  { id: 'boho-3', src: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&q=80', alt: 'Boho-inspired room with sage wall and rattan furniture', style: 'Bohemian', room: 'Living Room', credit: 'Unsplash', tags: ['outdoor', 'pattern', 'relaxed'] },

  // Mediterranean
  { id: 'med-1', src: 'https://images.unsplash.com/photo-1505577058444-a3dab90d4253?w=600&q=80', alt: 'Moroccan interior with horseshoe arches, zellige tile floor and brass lantern', style: 'Mediterranean', room: 'Living Room', credit: 'Unsplash', tags: ['arches', 'zellige', 'moroccan'] },
  { id: 'med-2', src: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&q=80', alt: 'Warm living room with leather sofa and natural light', style: 'Mediterranean', room: 'Living Room', credit: 'Unsplash', tags: ['stone', 'olive', 'courtyard'] },
  { id: 'med-3', src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80', alt: 'Contemporary open-plan living and kitchen with warm timber accents', style: 'Mediterranean', room: 'Living Room', credit: 'Unsplash', tags: ['tile', 'blue', 'rustic'] },
];

/**
 * Design tips — brief educational content about interior design principles
 */
export const DESIGN_TIPS: DesignTip[] = [
  {
    id: 'tip-color-1',
    title: 'The 60-30-10 Rule',
    principle: 'Color Theory',
    category: 'Color Theory',
    body: 'Use your dominant color for 60% of the room (walls, large furniture), a secondary color for 30% (upholstery, curtains), and an accent for the remaining 10% (pillows, art). This creates visual balance without monotony.',
  },
  {
    id: 'tip-color-2',
    title: 'Warm vs Cool Undertones',
    principle: 'Color Theory',
    category: 'Color Theory',
    body: 'Every neutral has an undertone. A "white" wall can lean blue, yellow, or pink. Match undertones across paint, fabric, and wood stain to prevent clashing — pull swatches together in natural light before committing.',
  },
  {
    id: 'tip-balance-1',
    title: 'Visual Weight Distribution',
    principle: 'Spatial Balance',
    category: 'Spatial Balance',
    body: 'Large, dark, or heavily textured items carry more visual weight. Balance a heavy sofa against a wall of floating shelves rather than another heavy piece. Distribute weight across the room to avoid a "tipping" feeling.',
  },
  {
    id: 'tip-balance-2',
    title: 'The Rule of Thirds',
    principle: 'Spatial Balance',
    category: 'Spatial Balance',
    body: 'Divide your wall or shelf into a 3x3 grid. Place focal objects at intersection points rather than dead center. Off-center arrangements feel more dynamic and professional.',
  },
  {
    id: 'tip-light-1',
    title: 'Layer Three Types of Light',
    principle: 'Lighting',
    category: 'Lighting',
    body: 'Every room needs ambient (overhead/general), task (reading lamps, under-cabinet), and accent (wall washers, candles) lighting. Relying on a single ceiling fixture flattens a room — layers create depth and mood.',
  },
  {
    id: 'tip-light-2',
    title: 'Color Temperature Matters',
    principle: 'Lighting',
    category: 'Lighting',
    body: 'Use warm white (2700K) in living rooms and bedrooms for coziness, neutral white (3500K) in kitchens, and cool white (5000K) for task areas. Mixing temperatures in the same sightline creates visual tension.',
  },
  {
    id: 'tip-texture-1',
    title: 'Contrast Rough and Smooth',
    principle: 'Texture',
    category: 'Texture',
    body: 'A polished marble table next to a rough linen sofa creates tactile interest. Rooms that use only one texture — all smooth or all rough — feel flat. Aim for at least three contrasting textures per space.',
  },
  {
    id: 'tip-proportion-1',
    title: 'Scale Furniture to the Room',
    principle: 'Proportion',
    category: 'Proportion',
    body: 'A large sectional overwhelms a small room; a petite loveseat gets lost in a great room. Measure doorways, ceiling height, and floor area. Furniture should fill roughly 60% of usable floor space — the rest is breathing room.',
  },
];

/**
 * Get trending styles — returns styles with highest engagement / seasonal relevance
 */
export function getTrendingStyles(): { style: DesignStyle; descriptionKey: string; imageId: string }[] {
  return [
    { style: 'Mediterranean', descriptionKey: 'trending.mediterraneanDesc', imageId: 'med-1' },
    { style: 'Mid-Century', descriptionKey: 'trending.midcenturyDesc', imageId: 'mid-1' },
    { style: 'Industrial', descriptionKey: 'trending.industrialDesc', imageId: 'ind-1' },
  ];
}

export function getImagesByStyle(style: DesignStyle): InspirationImage[] {
  return INSPIRATION_IMAGES.filter(img => img.style === style);
}

export function getImageById(id: string): InspirationImage | undefined {
  return INSPIRATION_IMAGES.find(img => img.id === id);
}
