/**
 * Regenerate Room API
 * POST endpoint that regenerates all designs for a specific room
 * Deletes old designs, generates 5 new ones, stores them
 *
 * SELF-CONTAINED: All logic inlined - no local file imports
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

// Inline enum values (like api/gemini.ts does)
const Type = { STRING: 'STRING', NUMBER: 'NUMBER', INTEGER: 'INTEGER', BOOLEAN: 'BOOLEAN', ARRAY: 'ARRAY', OBJECT: 'OBJECT' } as const;
const Modality = { TEXT: 'TEXT', IMAGE: 'IMAGE', AUDIO: 'AUDIO' } as const;

export const maxDuration = 300;

// ============================================================================
// SUPABASE ADMIN CLIENT
// ============================================================================
const SUPABASE_URL = 'https://vqkoxfenyjomillmxawh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

// ============================================================================
// LOCALE MAP
// ============================================================================
const LOCALE_LANGUAGE_MAP: Record<string, string> = {
  en: 'English', fr: 'French', de: 'German', es: 'Spanish', zh: 'Mandarin Chinese', pt: 'Portuguese',
};

// ============================================================================
// TYPES
// ============================================================================
interface RegenerateRequest {
  listingId: string;
  roomId: string;
  locale?: string;
  addMore?: boolean; // If true, add designs without deleting existing ones
}

interface RegenerateResponse {
  success: boolean;
  designs: Array<{
    id: string;
    name: string;
    imageUrl: string;
  }>;
}

interface GeneratedDesign {
  name: string;
  description: string;
  imageBase64: string;
  frameworks: string[];
  designSeed: any;
  roomReading: any;
  qualityScore: number;
}

// ============================================================================
// DESIGN SEEDS (Full engine from promptTemplates.ts)
// ============================================================================
interface DesignSeed {
  principle: string;
  approach: string;
  thinkers: string;
  rug: string;
}

const DESIGN_SEEDS: DesignSeed[] = [
  // --- SPATIAL & STRUCTURAL ---
  { principle: 'Compression and release — manipulate ceiling height, narrowness, and openness to create emotional rhythm through a room',
    approach: 'Use color, lighting, and furniture scale to make parts of the room feel intimate and others expansive',
    thinkers: 'Frank Lloyd Wright (prairie compression), Luis Barragán (color volumes), Peter Zumthor (atmospheric density)',
    rug: 'deep-pile wool runner that defines the "release" zone, pulling the eye toward openness' },
  { principle: 'Asymmetric balance — reject mirror symmetry for dynamic visual tension that still feels resolved',
    approach: 'Off-center focal points, unequal but balanced masses, deliberate visual weight distribution',
    thinkers: 'Eileen Gray (asymmetric screens), Charlotte Perriand (sculptural arrangement), Isamu Noguchi (balanced tension)',
    rug: 'asymmetrically patterned hand-knotted wool — one side dense, the other sparse, creating visual pull' },
  { principle: 'Scale disruption — use one dramatically oversized or undersized element to reframe everything else',
    approach: 'A monumental light fixture, a tiny chair, an enormous mirror — break expected proportions to create wonder',
    thinkers: 'Gaetano Pesce (oversized resin), Faye Toogood (chunky sculptural scale), Claes Oldenburg (the power of wrong scale)',
    rug: 'an unexpectedly massive rug that climbs 6 inches up the walls, blurring floor and wall boundaries' },

  // --- MATERIAL & TEXTURE ---
  { principle: 'Material honesty meets material contrast — celebrate what things are made of by placing opposites together',
    approach: 'Raw against refined, soft against hard, matte against gloss — every surface tells a story through juxtaposition',
    thinkers: 'Vincenzo De Cotiis (oxidized metal + marble), Axel Vervoordt (raw plaster + aged wood), John Pawson (stone purity)',
    rug: 'hand-felted wool with visible fiber structure, undyed, next to polished concrete or stone floor' },
  { principle: 'Patina as design — age, wear, and imperfection as deliberate aesthetic choices, not flaws to hide',
    approach: 'Specify materials that develop character over time — unlacquered brass, saddle leather, limewash, living finishes',
    thinkers: 'Wabi-sabi philosophy, Axel Vervoordt, Bijoy Jain / Studio Mumbai (handcraft + time)',
    rug: 'antique hand-repaired textile — visible mending as design feature, silk-wool blend with natural patina' },
  { principle: 'Textile architecture — fabric and fiber as structural, spatial elements, not just soft accessories',
    approach: 'Draped canopies, fabric room dividers, upholstered walls, woven screens — textiles that define space',
    thinkers: 'Anni Albers (textile as art), Christo (wrapped environments), Ilse Crawford (sensory richness)',
    rug: 'hand-tufted sculptural rug with 3 different pile heights creating a topographic landscape underfoot' },

  // --- LIGHT & COLOR ---
  { principle: 'Light as the primary material — design the room around how light enters, bounces, pools, and retreats',
    approach: 'Layer natural and artificial light deliberately — washing, spotlighting, backlighting, candlelight as architecture',
    thinkers: 'James Turrell (light as medium), Tadao Ando (light cuts), Olafur Eliasson (color-spectrum light)',
    rug: 'light-reflective silk-cotton blend in pale champagne — designed to catch and amplify ambient light' },
  { principle: 'Chromatic boldness — use saturated, unexpected color as the primary design move, not an accent',
    approach: 'Full-wall color drenching, tonal rooms (all one hue at different saturations), color blocking as spatial definition',
    thinkers: 'India Mahdavi (joyful color), Luis Barragán (emotional color planes), Pierre Yovanovitch (moody palettes)',
    rug: 'saturated solid-color hand-tufted wool — one bold hue that anchors the entire room\'s palette' },
  { principle: 'Tonal restraint — a single color family explored in maximum depth, creating richness through subtlety',
    approach: 'Monochromatic or near-monochromatic, with variety through texture, sheen, and material rather than hue shifts',
    thinkers: 'Joseph Dirand (tonal Paris), Vincent Van Duysen (Belgian warmth), John Pawson (monastic minimalism)',
    rug: 'tone-on-tone hand-loomed wool in three closely related values — visible only up close, felt from across the room' },

  // --- SENSORY & EXPERIENTIAL ---
  { principle: 'Multi-sensory design — design for touch, smell, sound, and temperature, not just sight',
    approach: 'Acoustic textures, scented materials (cedar, leather, beeswax), thermal variety (cool stone near warm textiles)',
    thinkers: 'Ilse Crawford (humanistic design), Peter Zumthor (thermal baths as architecture), Juhani Pallasmaa (eyes of the skin)',
    rug: 'deep hand-knotted Moroccan wool — thick enough to muffle footsteps, warm enough to sit on' },
  { principle: 'Prospect and refuge — create spaces that balance openness (seeing out) with enclosure (feeling protected)',
    approach: 'Reading nooks within open plans, canopy beds, high-backed settees, rooms within rooms',
    thinkers: 'Christopher Alexander (pattern language), Frank Lloyd Wright (inglenook), Ilse Crawford (nesting instinct)',
    rug: 'round hand-woven rug defining a "refuge" zone — like a campfire circle within the larger room' },
  { principle: 'Biophilic immersion — not just "add a plant" but fundamentally connect the room to living systems and natural pattern',
    approach: 'Fractal patterns, water features, living walls, natural materials at every touch point, views framed as landscape',
    thinkers: 'Kengo Kuma (organic structure), Bijoy Jain (earth + craft), Stephen Kellert (biophilic theory)',
    rug: 'hand-woven jute and seagrass with irregular organic edge — no straight lines, mimicking natural growth patterns' },

  // --- CONCEPTUAL & PROVOCATIVE ---
  { principle: 'Narrative space — design the room as if it tells a story or belongs to a fictional character',
    approach: 'Every object implies a life lived — collected, curated, eccentric. The room as autobiography, not catalog',
    thinkers: 'Kelly Wearstler (fearless curation), Jacques Garcia (theatrical), Tony Duquette (fantasy environments)',
    rug: 'vintage overdyed Persian — a rug with history, possibly mismatched with everything else, but that\'s the point' },
  { principle: 'Anti-decoration — strip away everything decorative and find beauty in pure function, structure, and void',
    approach: 'Remove, reduce, reveal. Expose structure, eliminate ornament, let negative space do the heavy lifting',
    thinkers: 'Donald Judd (Marfa minimalism), Tadao Ando (concrete poetry), Pawson (less is enough)',
    rug: 'a single sheepskin on raw concrete — the refusal to fill space IS the design statement' },
  { principle: 'Playful subversion — break the "rules" of good taste deliberately, with confidence and humor',
    approach: 'Clashing patterns that work, furniture in wrong rooms, high-low mixing (plastic chairs + marble table), irreverence as style',
    thinkers: 'Memphis Group / Sottsass (design as provocation), Gaetano Pesce (anti-perfection), India Mahdavi (serious play)',
    rug: 'a deliberately "ugly" bold-patterned rug that somehow becomes the most magnetic thing in the room' },
];

const SEED_BUCKETS: Record<string, number[]> = {
  spatial_structural:       [0, 1, 2],
  material_texture:         [3, 4, 5],
  light_color:              [6, 7, 8],
  sensory_experiential:     [9, 10, 11],
  conceptual_provocative:   [12, 13, 14],
};

function getDesignSeed(): DesignSeed[] {
  const bucketKeys = Object.keys(SEED_BUCKETS).sort(() => Math.random() - 0.5);
  const pickedBuckets = bucketKeys.slice(0, 3);
  return pickedBuckets.map(key => {
    const indices = SEED_BUCKETS[key]!;
    const idx = indices[Math.floor(Math.random() * indices.length)]!;
    return DESIGN_SEEDS[idx]!;
  });
}

// ============================================================================
// DESIGN ANALYSIS PROMPT (Full engine from promptTemplates.ts)
// ============================================================================
function createDesignAnalysisPrompt(roomType: string, previousDesigns: string[] = [], locale: string = 'en'): string {
  const seeds = getDesignSeed() as [DesignSeed, DesignSeed, DesignSeed];

  return `You are a sharp, opinionated interior design critic. You write like Dwell meets Rolling Stone — precise, physical, zero filler.

FRAMEWORKS (use 2-3 per design, by exact name):
- "Aesthetic Order" — proportion, rhythm, architectural integrity
- "Human-Centric" — ergonomics, how the body moves through space
- "Universal Design" — inclusive without feeling clinical
- "Biophilic" — nature, organic forms, living materials, light
- "Phenomenological" — multi-sensory experience, emotional resonance

NEVER mention designer names, style labels, or movement names. No "wabi-sabi," no "Scandinavian," no "Parisian salon." Describe what the room LOOKS, FEELS, and SMELLS like.

ROOM CONTEXT:
- Room type: ${roomType}. Include furniture and fixtures appropriate for a ${roomType}.

STEP 1 — ROOM READING
Analyze this ${roomType} honestly. What works, what doesn't. Be specific about what you see. 2-3 short paragraphs.

STEP 2 — 3 DESIGN DIRECTIONS
Each driven by a different principle:
1. ${seeds[0].principle} — ${seeds[0].approach}
2. ${seeds[1].principle} — ${seeds[1].approach}
3. ${seeds[2].principle} — ${seeds[2].approach}

DIVERSITY RULES (CRITICAL — THIS IS THE MOST IMPORTANT RULE):

LAYOUT DIVERSITY (most important — users see through color swaps):
- Each option MUST have a fundamentally different SPATIAL ARRANGEMENT. Not just different furniture in the same spots — different LAYOUTS entirely.
- Option 1: e.g., seating centered on a focal wall, symmetrical
- Option 2: e.g., seating arranged for conversation (facing each other), asymmetric, angled to windows
- Option 3: e.g., zones — reading nook by window, separate lounging area, unconventional flow
- Different focal points: one oriented to a wall/fireplace, one to the window/view, one creating an interior island
- Different sofa configurations: L-shape, two facing sofas, single sofa + multiple chairs, daybed, sectional in different orientations
- The visualization_prompt MUST explicitly describe WHERE each piece goes in the room (e.g., "sofa along the north wall facing the window" vs "two loveseats facing each other in the center")

FURNITURE & MATERIAL DIVERSITY:
- The 3 options MUST use completely different furniture pieces. NO shared coffee tables, chairs, sofas, or lighting between options. If option 1 suggests a Noguchi table, options 2 and 3 CANNOT use any Noguchi table.
- Different color temperatures: one warm, one cool, one wild/unexpected.
- Different densities: one maximal/layered, one minimal/spare, one mid.
- Different material families: one textile-dominant, one hard-surface-dominant, one organic/natural.
- Different eras/sensibilities: one contemporary, one vintage-influenced, one future-forward.
- One option should be genuinely radical — something the user would never think of but might love.
- The visualization_prompt for each option MUST describe SPECIFIC, DIFFERENT furniture pieces AND their spatial positions. Never reuse the same item description or layout across options.

WRITING RULES:
- Short sentences. Punchy. One adjective per noun max.
- Lead bullets with the MOVE: "Rip out the overhead light. Three mismatched pendants at different heights."
- Name materials and finishes specifically: "limewashed plaster, chalky to the touch"
- Banned words: embracing, evoking, channeling, curated, sophisticated, elevating, creating a sense of, a nod to, steeped in, imbued with, pays homage to
- Never repeat a phrase within the response
- Mood: 2-3 sentences. What it feels like to stand in the room, one unforgettable sensory detail, and why it works for this space.

Each design MUST include a specific high-end rug (material, weave, pattern — not just "add a rug").

NAMING RULES (CRITICAL):
- Names must be exactly 2-3 words. No more.
- Concrete and evocative. Think magazine headline, not poetry.
- No repeating ANY word across the 3 option names.
- GOOD names: "Brass & Shadow", "Velvet Archive", "Raw Linen", "Smoked Oak", "Salt & Iron", "Warm Void", "Tangerine Dusk"
- BAD names (DO NOT do this): "Cocooned Horizon Slumber", "Ethereal Woven Sanctuary", "Luminous Organic Retreat", "Serene Botanical Haven", "Tranquil Whisper Abode"
- No abstract filler words: sanctuary, haven, retreat, embrace, whisper, harmony, essence, serenity, oasis, cocoon, ethereal, luminous

PER OPTION: name (2-3 punchy words — see rules above), mood (2-3 sentences), frameworks (2-3), palette (5 hex), key_changes (3-5 bullets — specific enough to act on, with material/finish details), full_plan (markdown with ### headings, bullet lists, 250-400 words), visualization_prompt (detailed, keep room geometry), products (5-8 REAL product recommendations).

PRODUCT RECOMMENDATIONS (per option):
- 5-8 SPECIFIC, REAL products — actual product names from actual brands. Not "minimalist oak table" — real items like "Noguchi Coffee Table" by Herman Miller or "Arco Floor Lamp" by Flos.
- Brands to draw from: DWR, RH, Serena & Lily, Article, CB2, Rejuvenation, Schoolhouse, Lulu & Georgia, West Elm, Knoll, Fritz Hansen, Menu/Audo, HAY, Muuto, Tom Dixon, Flos, Artemide, 1stDibs
- Each product: { name, brand, category (furniture|lighting|textiles|decor|rugs|hardware), price_range ("$X-Y"), description (one line — why it works HERE), search_query (e.g. "Herman Miller Noguchi Coffee Table") }
- Products must relate to THIS specific design direction, not generic picks. Match the palette, materials, and mood.

Full plan structure: ### Design Thesis (2-3 sentences) → ### Interventions (bullet list) → ### Materials (bullet list) → ### Rug (2-3 sentences). No prose paragraphs longer than 3 sentences.
${previousDesigns.length > 0 ? `\nALREADY SEEN (avoid these): ${previousDesigns.map(d => `"${d}"`).join(', ')}` : ''}

VISUALIZATION PROMPT RULES:
Each design's visualization_prompt MUST include:
- Specific furniture placement and layout description
- Material and finish specifications
- Lighting and atmosphere details
- The specific rug description from your design
- MANDATORY: "Remove all logos, watermarks, and text overlays from the image. No brokerage branding."

Return ONLY valid JSON: { "room_reading": "...", "options": [{name, mood, frameworks, palette, key_changes, full_plan, visualization_prompt, products}, ...] }
${locale !== 'en' ? `\nLANGUAGE: Write ALL text in ${LOCALE_LANGUAGE_MAP[locale] || 'English'} — design names, mood descriptions, room reading, key changes, full plan, product descriptions. Keep brand names and product names in their original form. The design direction names should be evocative and punchy in ${LOCALE_LANGUAGE_MAP[locale] || 'English'}, not translated from English.` : ''}`;
}

// ============================================================================
// DESIGN GENERATOR (Full Room engine)
// ============================================================================
async function generateDesignsForRoom(
  photoUrl: string,
  roomType: string,
  listingContext: { city: string; neighborhood?: string; yearBuilt?: number },
  count: number,
  locale: string = 'en'
): Promise<GeneratedDesign[]> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Fetch photo
  const photoResponse = await fetch(photoUrl);
  if (!photoResponse.ok) {
    throw new Error(`Failed to fetch photo: ${photoResponse.status}`);
  }

  const photoBlob = await photoResponse.blob();
  const photoBuffer = await photoBlob.arrayBuffer();
  const photoBase64 = Buffer.from(photoBuffer).toString('base64');
  const mimeType = photoBlob.type || 'image/jpeg';

  const designs: GeneratedDesign[] = [];
  const previousNames: string[] = [];

  // Generate in 2 batches: first 3, then next 2 (to accumulate names and avoid repetition)
  const batches = count === 5 ? [3, 2] : [count];

  for (const batchSize of batches) {
    const batchDesigns = await generateDesignBatch(
      ai,
      photoBase64,
      mimeType,
      roomType,
      previousNames,
      batchSize,
      locale
    );

    designs.push(...batchDesigns);
    previousNames.push(...batchDesigns.map(d => d.name));
  }

  return designs;
}

async function generateDesignBatch(
  ai: GoogleGenAI,
  photoBase64: string,
  mimeType: string,
  roomType: string,
  previousDesigns: string[],
  count: number,
  locale: string = 'en'
): Promise<GeneratedDesign[]> {
  const designs: GeneratedDesign[] = [];

  try {
    // Step 1: Analysis with structured JSON output
    const promptText = createDesignAnalysisPrompt(roomType, previousDesigns, locale);

    const analysisResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: photoBase64 } },
          { text: promptText }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            room_reading: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  mood: { type: Type.STRING },
                  frameworks: { type: Type.ARRAY, items: { type: Type.STRING } },
                  palette: { type: Type.ARRAY, items: { type: Type.STRING } },
                  key_changes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  full_plan: { type: Type.STRING },
                  visualization_prompt: { type: Type.STRING },
                  products: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: 'Real product name' },
                        brand: { type: Type.STRING, description: 'Brand name' },
                        category: { type: Type.STRING, description: 'furniture|lighting|textiles|decor|rugs|hardware' },
                        price_range: { type: Type.STRING, description: 'e.g. $800-1,200' },
                        description: { type: Type.STRING, description: 'Why this product works in this design' },
                        search_query: { type: Type.STRING, description: 'Search query for this product' }
                      },
                      required: ['name', 'brand', 'category', 'price_range', 'description', 'search_query']
                    }
                  }
                },
                required: ['name', 'mood', 'frameworks', 'palette', 'key_changes', 'full_plan', 'visualization_prompt', 'products']
              }
            }
          },
          required: ['room_reading', 'options']
        }
      }
    });

    const analysisText = analysisResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!analysisText) {
      throw new Error('Empty analysis response');
    }

    const parsed = JSON.parse(analysisText);
    const roomReading = parsed.room_reading || '';
    const options = Array.isArray(parsed.options) ? parsed.options.slice(0, count) : [];

    // Step 2: Generate visualizations for each option
    for (const option of options) {
      try {
        const vizPrompt = option.visualization_prompt || '';

        const vizResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { mimeType, data: photoBase64 } },
              {
                text: `REDESIGN THIS ROOM PHOTO. Keep the architectural shell (walls, windows, doors, ceiling, floor material) and similar camera angle so the user recognizes their space.

REARRANGE THE FURNITURE COMPLETELY according to this design vision:
${vizPrompt.trim()}

CRITICAL — LAYOUT MATTERS MOST:
- Follow the layout/arrangement described above EXACTLY. If it says "sofa facing the window," put the sofa facing the window — even if the original photo has it against a wall.
- REMOVE all existing furniture and REPLACE with the pieces described, in the positions described.
- The furniture arrangement should look DIFFERENT from the original photo. Same room shell, totally different interior.

STYLE DIRECTION:
- Professional interior design portfolio shot — Architectural Digest / Dwell quality
- Rich textures, interesting lighting, layered details
- Atmospheric lighting (warm pools of light, shadows, depth)
- Tactile materials (velvet, wood grain, woven textiles, metal patina)
- THE RUG IS CRITICAL: Follow the rug description EXACTLY. If it says "jute herringbone," show jute herringbone — NOT Persian. Match material, pattern, and color precisely.

RULES:
- Same room shell and approximate camera angle — recognizable as the same space
- Be BOLD — this should feel like a dramatic transformation. Make the user excited about the possibility.
- REMOVE ALL LOGOS AND WATERMARKS — no real estate brokerage logos (Compass, Sotheby's, etc.), no photographer watermarks, no text overlays. The output image must be completely clean.`
              }
            ]
          },
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE]
          }
        });

        const parts = vizResponse.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p?.inlineData?.data);
        const imageBase64 = imagePart?.inlineData?.data;

        if (!imageBase64) {
          console.error('No visualization generated for', option.name);
          continue;
        }

        designs.push({
          name: option.name || 'Untitled Design',
          description: option.mood || '',
          imageBase64,
          frameworks: Array.isArray(option.frameworks) ? option.frameworks : [],
          designSeed: {
            palette: option.palette || [],
            keyChanges: option.key_changes || [],
            fullPlan: option.full_plan || '',
            products: option.products || []
          },
          roomReading: {
            roomReading,
            frameworks: Array.isArray(option.frameworks) ? option.frameworks : []
          },
          qualityScore: 0.85
        });

      } catch (vizError) {
        console.error('Visualization error for option:', option.name, vizError);
      }
    }

  } catch (error) {
    console.error('Design batch generation error:', error);
  }

  return designs;
}

// ============================================================================
// IMAGE STORAGE
// ============================================================================
const BUCKET_NAME = 'listing-designs';

async function ensureBucket(): Promise<void> {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

  if (!bucketExists) {
    await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
  }
}

async function uploadDesignImage(
  listingId: string,
  roomId: string,
  designId: string,
  imageBase64: string
): Promise<string> {
  await ensureBucket();

  const imageBuffer = Buffer.from(imageBase64, 'base64');

  let extension = 'jpg';
  if (imageBase64.startsWith('iVBORw0KGgo')) {
    extension = 'png';
  } else if (imageBase64.startsWith('UklGR')) {
    extension = 'webp';
  }

  const fileName = `${listingId}/${roomId}/${designId}.${extension}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(fileName, imageBuffer, {
      contentType: `image/${extension}`,
      cacheControl: '31536000',
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return publicUrl;
}

async function uploadThumbnail(
  listingId: string,
  roomId: string,
  designId: string,
  imageBase64: string
): Promise<string> {
  await ensureBucket();

  const imageBuffer = Buffer.from(imageBase64, 'base64');

  let extension = 'jpg';
  if (imageBase64.startsWith('iVBORw0KGgo')) {
    extension = 'png';
  } else if (imageBase64.startsWith('UklGR')) {
    extension = 'webp';
  }

  const fileName = `${listingId}/${roomId}/${designId}_thumb.${extension}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(fileName, imageBuffer, {
      contentType: `image/${extension}`,
      cacheControl: '31536000',
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload thumbnail: ${error.message}`);
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return publicUrl;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================
export default async function handler(req: any, res: any) {
  // CORS
  const allowedOrigins = ['https://room.institute', 'https://room-institute-two.vercel.app', 'http://localhost:3000'];
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body: RegenerateRequest = req.body;

    if (!body || !body.listingId || !body.roomId) {
      return res.status(400).json({ error: 'Missing listingId or roomId' });
    }

    const { listingId, roomId } = body;

    // Get the listing for context
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('city, neighborhood, year_built')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return res.status(404).json({ error: 'Listing not found', detail: listingError?.message, hasKey: !!SUPABASE_SERVICE_KEY, keyLen: SUPABASE_SERVICE_KEY.length, keyPrefix: SUPABASE_SERVICE_KEY.substring(0, 10), listingId });
    }

    // Get the room
    const { data: room, error: roomError } = await supabaseAdmin
      .from('listing_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Delete old designs (unless addMore mode)
    if (!body.addMore) {
      await supabaseAdmin
        .from('listing_designs')
        .delete()
        .eq('room_id', roomId);
    }

    // Update room status
    await supabaseAdmin
      .from('listing_rooms')
      .update({ status: 'generating' })
      .eq('id', roomId);

    // Generate new designs
    const designs = await generateDesignsForRoom(
      room.original_photo,
      room.label,
      {
        city: listing.city,
        neighborhood: listing.neighborhood,
        yearBuilt: listing.year_built
      },
      5,
      body.locale || 'en'
    );

    // Store new designs
    const storedDesigns = [];
    for (const design of designs) {
      const designId = crypto.randomUUID();

      // Upload image to storage
      const imageUrl = await uploadDesignImage(listingId, roomId, designId, design.imageBase64);
      const thumbnailUrl = await uploadThumbnail(listingId, roomId, designId, design.imageBase64);

      // Create design record
      await supabaseAdmin.from('listing_designs').insert({
        id: designId,
        room_id: roomId,
        listing_id: listingId,
        name: design.name,
        description: design.description,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        frameworks: design.frameworks,
        design_seed: design.designSeed,
        room_reading: design.roomReading,
        quality_score: design.qualityScore,
        is_curated: false,
        created_at: new Date().toISOString()
      });

      storedDesigns.push({
        id: designId,
        name: design.name,
        imageUrl
      });
    }

    // Update room status
    await supabaseAdmin
      .from('listing_rooms')
      .update({ status: 'ready' })
      .eq('id', roomId);

    return res.status(200).json({
      success: true,
      designs: storedDesigns
    });
  } catch (error) {
    console.error('Regenerate room error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
