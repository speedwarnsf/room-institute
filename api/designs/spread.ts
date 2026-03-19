import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const SUPABASE_URL = 'https://vqkoxfenyjomillmxawh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

/**
 * POST /api/designs/spread
 *
 * Generate (or return cached) magazine-spread data for a listing design.
 * First click generates and caches. Subsequent clicks return cached.
 *
 * Body: { designId: string }
 * Returns: { spread: SpreadData, cached: boolean }
 */

interface SpreadData {
  /** Editorial headline for the spread */
  headline: string;
  /** Magazine-style editorial narrative (2-3 paragraphs, markdown) */
  narrative: string;
  /** Typography mood for rendering */
  typeMood: 'warm-editorial' | 'stark-minimal' | 'bold-expressive' | 'classic-refined' | 'raw-industrial';
  /** Design philosophy / theory callout */
  designPhilosophy: string;
  /** Material & texture closeup descriptions (for callout cards) */
  materialCallouts: Array<{ material: string; description: string; }>;
  /** Spatial flow description — how you move through the room */
  spatialNarrative: string;
  /** Light study — how light works in this design through the day */
  lightStudy: string;
  /** Living scenario — a short vignette of life in this space */
  livingVignette: string;
  /** Pull quote — one striking sentence for a typographic callout */
  pullQuote: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { designId, locale = 'en' } = req.body;
  if (!designId) {
    return res.status(400).json({ error: 'designId required' });
  }

  try {
    // 1. Fetch the design
    const { data: design, error: designErr } = await supabase
      .from('listing_designs')
      .select('id, name, description, image_url, frameworks, design_seed, room_reading, style_analysis, spread_data')
      .eq('id', designId)
      .single();

    if (designErr || !design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    // 2. Return cached if exists for this locale
    const existingData = design.spread_data || {};
    if (existingData[locale]) {
      return res.status(200).json({ spread: existingData[locale], cached: true });
    }

    // 3. Generate the spread
    if (!GEMINI_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const seed = design.design_seed || {};
    const roomReading = design.room_reading || '';

    // Language instruction based on locale
    const languageInstructions: Record<string, string> = {
      en: 'Write all content in English.',
      fr: 'Écris tout le contenu en français. Write all content in French.',
      de: 'Schreibe alle Inhalte auf Deutsch. Write all content in German.',
      es: 'Escribe todo el contenido en español. Write all content in Spanish.',
      zh: '用中文写所有内容。Write all content in Mandarin Chinese.',
      pt: 'Escreva todo o conteúdo em português. Write all content in Brazilian Portuguese.',
    };
    const languageInstruction = languageInstructions[locale] || languageInstructions.en;

    const prompt = `You are an editorial director for an award-winning interior design magazine — think Architectural Digest meets Kinfolk. You're writing a magazine spread about this specific design concept for a real estate listing.

${languageInstruction}

DESIGN NAME: ${design.name}
DESCRIPTION: ${design.description || ''}
MOOD: ${seed.mood || ''}
FRAMEWORKS: ${(design.frameworks || []).join(', ')}
PALETTE: ${(seed.palette || []).join(', ')}
KEY CHANGES: ${(seed.key_changes || seed.keyChanges || []).join('\n')}
FULL PLAN: ${seed.fullPlan || seed.full_plan || ''}
ROOM READING: ${typeof roomReading === 'string' ? roomReading : JSON.stringify(roomReading)}
PRODUCTS: ${JSON.stringify(seed.products || [])}

When writing about PRODUCTS: Translate all product names and descriptions to the target language. Keep brand names in their original form (e.g., "Herman Miller" stays "Herman Miller", but "Aeron Chair" becomes the translated version).

Write a magazine-quality editorial spread. This should feel like turning a page in a physical magazine — editorial, evocative, specific. Not generic marketing copy. Reference the actual materials, products, and spatial decisions in the design.

CRITICAL RULES:
- Write with AUTHORITY. Never use "perhaps", "maybe", "might", "could be", "possibly", or any hedging language.
- If a specific product or brand is listed in PRODUCTS above, name it directly and confidently.
- If you don't know a specific product, describe the material and texture without guessing at brands. Say "a deep matte wall finish" not "perhaps a Farrow & Ball shade."
- This is a magazine editorial, not a suggestion. State things as fact. Be declarative.

Return ONLY valid JSON matching this exact schema:
{
  "headline": "short, evocative editorial headline (5-8 words, no quotes)",
  "narrative": "2-3 paragraphs of editorial prose about this design, in markdown. Reference specific materials, brands, and spatial decisions. Written like AD or Dwell, not a product listing.",
  "typeMood": "one of: warm-editorial, stark-minimal, bold-expressive, classic-refined, raw-industrial",
  "designPhilosophy": "1 paragraph about the design theory/philosophy behind this direction. Reference specific frameworks if applicable.",
  "materialCallouts": [
    {"material": "Material name", "description": "Sensory description — how it looks, feels, ages"},
    {"material": "Material name", "description": "Sensory description"},
    {"material": "Material name", "description": "Sensory description"}
  ],
  "spatialNarrative": "How you move through this room. What draws your eye first, where you settle, how the space flows.",
  "lightStudy": "How light works in this design — morning, afternoon, evening. How the materials respond to changing light.",
  "livingVignette": "A 3-4 sentence vignette of a moment of life in this space. Specific, sensory, human.",
  "pullQuote": "One striking sentence that captures the essence of this design. Magazine pull-quote style."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!text) {
      return res.status(500).json({ error: 'Empty response from model' });
    }

    const spreadData: SpreadData = JSON.parse(text);

    // 4. Cache it in Supabase (per locale)
    const updatedData = { ...existingData, [locale]: spreadData };
    const { error: updateErr } = await supabase
      .from('listing_designs')
      .update({ spread_data: updatedData })
      .eq('id', designId);

    if (updateErr) {
      console.error('Failed to cache spread:', updateErr);
      // Still return the data even if caching fails
    }

    return res.status(200).json({ spread: spreadData, cached: false });

  } catch (err: any) {
    console.error('Spread generation error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
