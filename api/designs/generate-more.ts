/**
 * Generate More Designs — Buyer-facing endpoint
 * Adds 3 new designs to an existing room without deleting current ones.
 * Uses the room's original photo and existing design names to avoid repeats.
 * NOW WITH: v5 rhetorical trope engine (293 devices) + SYSTEM DIRECTIVES lockdown
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

export const maxDuration = 300;

// ====================== RHETORICAL TROPE ENGINE (server-side) ======================
interface TropeEntry { figure_name: string; definition: string; }

let _tropes: TropeEntry[] | null = null;
function loadTropes(): TropeEntry[] {
  if (_tropes) return _tropes;
  const paths = [
    join(process.cwd(), 'data', 'tropes.json'),
    join(process.cwd(), 'api', 'data', 'tropes.json'),
    '/var/task/data/tropes.json',
    '/var/task/api/data/tropes.json',
  ];
  for (const p of paths) {
    try { _tropes = JSON.parse(readFileSync(p, 'utf-8')); console.log(`[TropeEngine API] Loaded ${_tropes!.length} tropes from ${p}`); return _tropes!; } catch {}
  }
  console.warn('[TropeEngine API] Could not load tropes.json, using fallback');
  // Fallback: minimal set
  _tropes = [
    { figure_name: 'chiasmus', definition: 'A reversal of grammatical structure (ABBA) for emphasis or surprise.' },
    { figure_name: 'aposiopesis', definition: 'Deliberate breaking off mid-sentence, trailing into silence for dramatic effect.' },
    { figure_name: 'litotes', definition: 'Understatement by negating the opposite, for ironic emphasis.' },
    { figure_name: 'antithesis', definition: 'Juxtaposition of contrasting ideas in balanced phrases or clauses.' },
    { figure_name: 'synecdoche', definition: 'A part representing the whole, or the whole representing a part.' },
    { figure_name: 'zeugma', definition: 'One verb governing two or more objects in different senses.' },
    { figure_name: 'catachresis', definition: 'Deliberate misuse of words or strained metaphor for rhetorical effect.' },
    { figure_name: 'meiosis', definition: 'Deliberate understatement for rhetorical effect.' },
    { figure_name: 'auxesis', definition: 'Arrangement from least to most important for climactic effect.' },
    { figure_name: 'epanalepsis', definition: 'Beginning and ending a phrase with the same word.' },
  ];
  return _tropes;
}

function selectTropesServer(count: number): Array<{ name: string; definition: string }> {
  const all = loadTropes();
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(t => ({
    name: t.figure_name.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    definition: t.definition,
  }));
}

// ====================== DESIGN SEEDS (same 15 as client-side) ======================
interface DesignSeed { principle: string; approach: string; }
const DESIGN_SEEDS: DesignSeed[] = [
  { principle: 'Compression and release', approach: 'Use color, lighting, and furniture scale to make parts of the room feel intimate and others expansive' },
  { principle: 'Asymmetric balance', approach: 'Off-center focal points, unequal but balanced masses, deliberate visual weight distribution' },
  { principle: 'Scale disruption', approach: 'A monumental light fixture, a tiny chair, an enormous mirror — break expected proportions' },
  { principle: 'Material honesty meets material contrast', approach: 'Raw against refined, soft against hard, matte against gloss' },
  { principle: 'Patina as design', approach: 'Specify materials that develop character over time — unlacquered brass, saddle leather, limewash' },
  { principle: 'Textile architecture', approach: 'Draped canopies, fabric room dividers, upholstered walls, woven screens — textiles that define space' },
  { principle: 'Light as the primary material', approach: 'Layer natural and artificial light deliberately — washing, spotlighting, backlighting' },
  { principle: 'Chromatic boldness', approach: 'Full-wall color drenching, tonal rooms, color blocking as spatial definition' },
  { principle: 'Tonal restraint', approach: 'Monochromatic, with variety through texture, sheen, and material rather than hue shifts' },
  { principle: 'Multi-sensory design', approach: 'Acoustic textures, scented materials, thermal variety — design for touch, smell, sound' },
  { principle: 'Prospect and refuge', approach: 'Reading nooks within open plans, canopy beds, rooms within rooms' },
  { principle: 'Biophilic immersion', approach: 'Fractal patterns, living walls, natural materials at every touch point' },
  { principle: 'Narrative space', approach: 'Every object implies a life lived — collected, eccentric. The room as autobiography' },
  { principle: 'Anti-decoration', approach: 'Remove, reduce, reveal. Let negative space do the heavy lifting' },
  { principle: 'Playful subversion', approach: 'Clashing patterns that work, furniture in wrong rooms, high-low mixing' },
];

const SEED_BUCKETS: Record<string, number[]> = {
  spatial: [0, 1, 2], material: [3, 4, 5], light: [6, 7, 8],
  sensory: [9, 10, 11], conceptual: [12, 13, 14],
};

function getDesignSeeds(): DesignSeed[] {
  const keys = Object.keys(SEED_BUCKETS).sort(() => Math.random() - 0.5).slice(0, 3);
  return keys.map(k => {
    const indices = SEED_BUCKETS[k]!;
    return DESIGN_SEEDS[indices[Math.floor(Math.random() * indices.length)]!]!;
  });
}

const Type = { STRING: 'STRING', NUMBER: 'NUMBER', INTEGER: 'INTEGER', BOOLEAN: 'BOOLEAN', ARRAY: 'ARRAY', OBJECT: 'OBJECT' } as const;

const SUPABASE_URL = 'https://vqkoxfenyjomillmxawh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { roomId, listingId, locale = 'en' } = req.body || {};
  if (!roomId || !listingId) return res.status(400).json({ error: 'roomId and listingId required' });

  try {
    // Get room info
    const { data: room } = await supabase
      .from('listing_rooms')
      .select('id, label, original_photo, listing_id')
      .eq('id', roomId)
      .single();

    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Get existing design names to avoid repeats
    const { data: existingDesigns } = await supabase
      .from('listing_designs')
      .select('name')
      .eq('room_id', roomId);

    const existingNames = (existingDesigns || []).map(d => d.name);

    // Fetch the original room photo
    const photoRes = await fetch(room.original_photo);
    if (!photoRes.ok) return res.status(500).json({ error: 'Could not fetch room photo' });
    const photoBuffer = Buffer.from(await photoRes.arrayBuffer());
    const photoBase64 = photoBuffer.toString('base64');
    const mimeType = photoRes.headers.get('content-type') || 'image/jpeg';

    // v5 TROPE ENGINE — select seeds + tropes
    const seeds = getDesignSeeds();
    const tropes = selectTropesServer(3);
    console.log('[TropeEngine API] Seeds:', seeds.map(s => s.principle));
    console.log('[TropeEngine API] Tropes:', tropes.map(t => t.name));

    // Generate 3 new design concepts with FULL v5 prompt
    const langMap: Record<string, string> = {fr:'French',de:'German',es:'Spanish',zh:'Mandarin Chinese',pt:'Portuguese',ar:'Arabic'};
    const langInstruction = locale !== 'en' && langMap[locale] ? `\nLANGUAGE: Write ALL text in ${langMap[locale]}. Keep brand names in their original form.\n` : '';

    const promptText = `SYSTEM DIRECTIVES (HIGHEST PRIORITY — YOU MUST OBEY THESE EXACTLY. THEY OVERRIDE EVERY OTHER INSTRUCTION.)

You are an avant-garde interior designer. Your sole job is to escape generic outputs for this ${room.label}.

RHETORICAL CONSTRAINTS (non-negotiable — highest priority):
You MUST reshape EVERY design direction by applying its assigned rhetorical trope with FULL STRUCTURAL FIDELITY. Translate the trope's precise linguistic mechanics into at least 5 distinct spatial, material, lighting, circulation, and narrative decisions. DO NOT simplify or resolve any trope to a generic interpretation — preserve full complexity and strangeness.

PRAGMATIC ANCHOR (equally non-negotiable):
Every design must be 100% buildable today — ADA-compliant circulation, ergonomic dimensions, functional lighting/HVAC, durable finishes, code-compliant safety.

If you ignore any SYSTEM DIRECTIVE or rhetorical constraint, the entire output is invalid.
${langInstruction}
EXISTING DESIGNS (DO NOT REPEAT): ${existingNames.map(n => `"${n}"`).join(', ') || 'none'}

3 DESIGN DIRECTIONS:

1. ${seeds[0].principle} — ${seeds[0].approach}
   RHETORICAL CONSTRAINT: Apply "${tropes[0].name}": ${tropes[0].definition}
   Translate into 5+ spatial/material/lighting/circulation/narrative decisions. Preserve full complexity.

2. ${seeds[1].principle} — ${seeds[1].approach}
   RHETORICAL CONSTRAINT: Apply "${tropes[1].name}": ${tropes[1].definition}
   Translate into 5+ spatial/material/lighting/circulation/narrative decisions. Preserve full complexity.

3. ${seeds[2].principle} — ${seeds[2].approach}
   RHETORICAL CONSTRAINT: Apply "${tropes[2].name}": ${tropes[2].definition}
   Translate into 5+ spatial/material/lighting/circulation/narrative decisions. Preserve full complexity.

WRITING RULES:
- Write like a person, not a brochure. Every sentence has a job.
- ZERO BRAND NAMES in mood, full_plan, key_changes, or room_reading. Brands in products array ONLY.
- BANNED: sanctuary, haven, retreat, oasis, embrace, whisper, harmony, serenity, cocoon, ethereal, luminous, curated, sophisticated, timeless, bespoke, nestled, boasts, seamlessly, effortlessly
- Mood: 2 sentences max. What you physically experience + why it works. No poetry.
- NAMING: 2-3 words, concrete. NO style labels (no "Mid-Century", "Art Deco", "Coastal", "Bohemian"). GOOD: "Brass & Shadow", "Raw Linen", "Salt & Iron". BAD: "Modern Zen Oasis", "Coastal Breeze", "Bohemian Retreat"
- Products: 5-8 real products, mixed price points. Products array ONLY — never in editorial text.

Return ONLY valid JSON:
{
  "compliance": [
    "Direction 1: Applied ${tropes[0].name} by [list 3-5 specific mappings]",
    "Direction 2: Applied ${tropes[1].name} by [list 3-5 specific mappings]",
    "Direction 3: Applied ${tropes[2].name} by [list 3-5 specific mappings]"
  ],
  "room_reading": "3-5 sentences about this specific room",
  "options": [
    {
      "name": "2-3 word name (NO style labels)",
      "mood": "2 sentences max",
      "frameworks": ["framework 1", "framework 2"],
      "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
      "key_changes": ["specific change 1", "specific change 2", "specific change 3"],
      "full_plan": "### What Changes\\n- bullet list\\n### Materials\\n- bullet list\\n### Rug\\n- 1 sentence",
      "visualization_prompt": "Detailed prompt with furniture placement, materials, lighting",
      "products": [{"name": "...", "brand": "...", "category": "...", "price_range": "$X-Y", "description": "...", "search_query": "..."}]
    }
  ]
}`;

    const analysisResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
                        name: { type: Type.STRING },
                        brand: { type: Type.STRING },
                        category: { type: Type.STRING },
                        price_range: { type: Type.STRING },
                        description: { type: Type.STRING },
                        search_query: { type: Type.STRING },
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
    if (!analysisText) return res.status(500).json({ error: 'Empty analysis response' });

    const parsed = JSON.parse(analysisText);
    const options = Array.isArray(parsed.options) ? parsed.options.slice(0, 3) : [];
    const roomReading = parsed.room_reading || '';

    // Generate visualizations and save
    const newDesigns: any[] = [];

    for (const option of options) {
      try {
        const vizResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { mimeType, data: photoBase64 } },
              {
                text: `REDESIGN THIS ROOM PHOTO. Keep the architectural shell EXACTLY as shown — walls, windows, doors, ceiling, floor material, and camera angle must match the original photo.

ABSOLUTE ARCHITECTURAL CONSTRAINTS — DO NOT VIOLATE:
- DO NOT move, add, or remove any windows. Window count, size, shape, and position must match the original exactly.
- DO NOT move, add, or remove any doors or doorways.
- DO NOT change wall positions, ceiling height, or room proportions.
- DO NOT change floor material or wall color unless the design vision explicitly calls for it.
- The architectural bones of this room are SACRED. Only furniture, decor, textiles, and lighting fixtures may change.

REARRANGE THE FURNITURE COMPLETELY according to this design vision:
${option.visualization_prompt}

STYLE: Professional interior design portfolio shot — Architectural Digest / Dwell quality.
Rich textures, atmospheric lighting, tactile materials. Be BOLD with furniture and decor — but NEVER with architecture.

FINAL CHECK: Same room shell, same windows, same doors, same camera angle — recognizable as the same space.`
              }
            ]
          },
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          }
        });

        let imageBase64 = '';
        let imageMime = 'image/png';
        const parts = vizResponse.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if ((part as any).inlineData) {
            imageBase64 = (part as any).inlineData.data;
            imageMime = (part as any).inlineData.mimeType || 'image/png';
            break;
          }
        }

        if (!imageBase64) continue;

        const designId = crypto.randomUUID();
        const extension = imageMime.includes('jpeg') || imageMime.includes('jpg') ? 'jpg' : 'png';
        const fileName = `${listingId}/${roomId}/${designId}.${extension}`;

        const rawBuffer = Buffer.from(imageBase64, 'base64');
        // Watermark is MANDATORY — no watermark, no upload
        let imageBuffer: Buffer;
        try {
          const { applyWatermark } = await import('../../services/watermark');
          imageBuffer = await applyWatermark(rawBuffer);
          console.log(`Watermark applied to ${option.name}`);
        } catch (wmErr: any) {
          console.error(`WATERMARK FAILED for ${option.name}:`, wmErr?.message || wmErr);
          // Skip this design entirely — do not upload without watermark
          continue;
        }
        const { error: uploadErr } = await supabase.storage
          .from('listing-designs')
          .upload(fileName, imageBuffer, { contentType: imageMime, upsert: true });

        if (uploadErr) continue;

        const { data: urlData } = supabase.storage
          .from('listing-designs')
          .getPublicUrl(fileName);

        const imageUrl = urlData.publicUrl;

        // Save to DB
        const { error: insertErr } = await supabase
          .from('listing_designs')
          .insert({
            id: designId,
            room_id: roomId,
            listing_id: listingId,
            name: option.name,
            description: option.mood,
            image_url: imageUrl,
            frameworks: option.frameworks || [],
            design_seed: {
              mood: option.mood,
              palette: option.palette,
              key_changes: option.key_changes,
              fullPlan: option.full_plan,
              products: option.products,
              visualization_prompt: option.visualization_prompt,
            },
            room_reading: roomReading,
            is_curated: false,
          });

        if (!insertErr) {
          newDesigns.push({
            id: designId,
            name: option.name,
            description: option.mood,
            imageUrl,
            frameworks: option.frameworks,
            palette: option.palette,
            products: option.products,
          });
        }
      } catch (vizErr) {
        console.error('Viz error for', option.name, vizErr);
      }
    }

    return res.status(200).json({
      designs: newDesigns,
      count: newDesigns.length,
    });

  } catch (err: any) {
    console.error('Generate more error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
