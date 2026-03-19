/**
 * Room Presets — pre-configured style + room type combinations
 */

export interface RoomPreset {
  id: string;
  name: string;
  description: string;
  style: string;
  roomType: string;
  palette: string[];
  keywords: string[];
}

export const ROOM_PRESETS: RoomPreset[] = [
  {
    id: 'modern-living',
    name: 'Modern Living Room',
    description: 'Clean lines, neutral tones, statement furniture',
    style: 'Contemporary',
    roomType: 'Living Room',
    palette: ['#2C2C2C', '#E8E4DE', '#8B7355', '#D4C5B2', '#F5F0EB'],
    keywords: ['minimal', 'open', 'sculptural', 'curated'],
  },
  {
    id: 'cozy-bedroom',
    name: 'Cozy Bedroom',
    description: 'Warm layers, soft textiles, ambient lighting',
    style: 'Bohemian',
    roomType: 'Bedroom',
    palette: ['#3D2B1F', '#C4A882', '#E8D5C4', '#F2E8DC', '#8B6F47'],
    keywords: ['layered', 'warm', 'textured', 'intimate'],
  },
  {
    id: 'scandi-kitchen',
    name: 'Scandinavian Kitchen',
    description: 'Light wood, white surfaces, functional beauty',
    style: 'Minimalist / Scandinavian',
    roomType: 'Kitchen',
    palette: ['#FFFFFF', '#F5F0E8', '#C4B9A8', '#8B8178', '#2C2C2C'],
    keywords: ['airy', 'functional', 'natural', 'bright'],
  },
  {
    id: 'industrial-office',
    name: 'Industrial Home Office',
    description: 'Exposed materials, dark tones, raw character',
    style: 'Industrial',
    roomType: 'Study / Office',
    palette: ['#1A1A1A', '#3C3C3C', '#8B7355', '#B8A990', '#E8E4DE'],
    keywords: ['raw', 'functional', 'bold', 'masculine'],
  },
  {
    id: 'french-dining',
    name: 'French Provincial Dining',
    description: 'Elegant curves, soft pastels, vintage charm',
    style: 'French Provincial',
    roomType: 'Dining Room',
    palette: ['#F0EBE3', '#C9B99A', '#8B7D6B', '#D4C5B2', '#FFFFFF'],
    keywords: ['elegant', 'refined', 'romantic', 'classic'],
  },
  {
    id: 'coastal-bathroom',
    name: 'Coastal Bathroom',
    description: 'Ocean-inspired calm, natural stone, soft blues',
    style: 'Coastal / Beach',
    roomType: 'Bathroom',
    palette: ['#E8F0F2', '#B8CDD4', '#7BA3B0', '#D4C5A9', '#FFFFFF'],
    keywords: ['serene', 'fresh', 'organic', 'light'],
  },
  {
    id: 'mcm-lounge',
    name: 'Mid-Century Lounge',
    description: 'Iconic silhouettes, warm wood, bold accent colors',
    style: 'Mid-Century Modern',
    roomType: 'Living Room',
    palette: ['#2C2C2C', '#C17817', '#4A7C59', '#E8D5C4', '#8B6914'],
    keywords: ['iconic', 'warm', 'retro', 'organic'],
  },
  {
    id: 'zen-entryway',
    name: 'Zen Entryway',
    description: 'Minimalist welcome, natural materials, calm transitions',
    style: 'Minimalist / Scandinavian',
    roomType: 'Entryway',
    palette: ['#F5F0E8', '#C4B9A8', '#8B8178', '#E8E4DE', '#3C3C3C'],
    keywords: ['zen', 'uncluttered', 'welcoming', 'serene'],
  },
  {
    id: 'boho-nursery',
    name: 'Bohemian Nursery',
    description: 'Playful textures, earthy tones, whimsical details',
    style: 'Bohemian',
    roomType: 'Nursery',
    palette: ['#F2E8DC', '#C4A882', '#8B7355', '#D4A574', '#E8D5C4'],
    keywords: ['playful', 'warm', 'natural', 'creative'],
  },
  {
    id: 'outdoor-modern',
    name: 'Modern Outdoor Patio',
    description: 'Indoor-outdoor flow, weathered materials, lush plants',
    style: 'Contemporary',
    roomType: 'Outdoor / Patio',
    palette: ['#2C3E2C', '#8B7355', '#E8E4DE', '#4A7C59', '#F5F0EB'],
    keywords: ['outdoor', 'green', 'relaxed', 'modern'],
  },
];
