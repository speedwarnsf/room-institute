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

  const { designId, locale = 'en', designData: clientDesignData } = req.body;
  if (!designId) {
    return res.status(400).json({ error: 'designId required' });
  }

  try {
    // 1. Fetch the design from DB
    const { data: dbDesign, error: designErr } = await supabase
      .from('listing_designs')
      .select('id, name, description, image_url, frameworks, design_seed, room_reading, style_analysis, spread_data')
      .eq('id', designId)
      .single();

    // Fall back to client-provided design data (for seed/demo listings)
    const design = dbDesign || (clientDesignData ? {
      id: designId,
      name: clientDesignData.name || '',
      description: clientDesignData.description || '',
      frameworks: clientDesignData.frameworks || [],
      design_seed: {
        mood: clientDesignData.mood || '',
        palette: clientDesignData.palette || [],
        keyChanges: clientDesignData.keyChanges || [],
        fullPlan: clientDesignData.fullPlan || '',
        products: clientDesignData.products || [],
      },
      room_reading: clientDesignData.roomReading || '',
      spread_data: null,
    } : null);

    if (!design) {
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
      ar: 'اكتب كل المحتوى باللغة العربية. Write all content in Arabic.',
    };
    const languageInstruction = languageInstructions[locale] || languageInstructions.en;

    const prompt = `You are a direct-response copywriter who knows interiors. Every sentence has a job. If it doesn't tell the reader something useful about this room, cut it.

${languageInstruction}

DESIGN: ${design.name}
MOOD: ${seed.mood || design.description || ''}
FRAMEWORKS: ${(design.frameworks || []).join(', ')}
PALETTE: ${(seed.palette || []).join(', ')}
KEY CHANGES: ${(seed.key_changes || seed.keyChanges || []).join('\n')}
FULL PLAN: ${seed.fullPlan || seed.full_plan || ''}
ROOM READING: ${typeof roomReading === 'string' ? roomReading : JSON.stringify(roomReading)}

WRITING RULES (non-negotiable):
- ZERO BRAND NAMES anywhere. Describe materials and objects by what they ARE, not who made them. "Polished concrete floor" not "a Crate & Barrel concrete finish." "Chrome cantilever chair" not "Knoll's chrome frame chair."
- Short sentences. Concrete. Physical. Every sentence does one job: says what changed, what it feels like, or why it matters.
- BANNED: embracing, evoking, channeling, curated, sophisticated, elevating, sanctuary, haven, retreat, pulsates, symphony, harmonious, respite, refuge, emerges, transforms, transcends, nestled, boasts, seamlessly, effortlessly, timeless, bespoke, metamorphosis, ephemeral, luminosity
- No hedging: no "perhaps", "maybe", "might", "could be"
- No purple prose. If it sounds like a hotel brochure, rewrite it.
- Narrative: 2 SHORT paragraphs max. 3-4 sentences each. Say what the room does, not what it "evokes."
- Material callouts: the material, how it feels, how it ages. One sentence each. No poetry.
- Spatial narrative: 2-3 sentences. Where your eye goes first, where you end up, why.
- Light study: 2-3 sentences. Morning vs evening. Be specific about direction and quality.
- Living vignette: 2 sentences. One specific moment. No "steaming mug of tea" clichés.
- Pull quote: One sharp sentence. Not a metaphor. A statement about what the room actually does.

Return ONLY valid JSON:
{
  "headline": "4-6 words. Concrete. Not poetic.",
  "narrative": "2 short paragraphs, markdown. No brands. Describe materials and space, not feelings.",
  "typeMood": "one of: warm-editorial, stark-minimal, bold-expressive, classic-refined, raw-industrial",
  "designPhilosophy": "3-4 sentences about the design thinking. Reference frameworks by name. No fluff.",
  "materialCallouts": [
    {"material": "Material name", "description": "How it feels and ages. One sentence."},
    {"material": "Material name", "description": "One sentence."},
    {"material": "Material name", "description": "One sentence."}
  ],
  "spatialNarrative": "2-3 sentences. Where you look, where you walk, where you sit.",
  "lightStudy": "2-3 sentences. Morning light vs evening light. Specific.",
  "livingVignette": "2 sentences. One real moment. No clichés.",
  "pullQuote": "One declarative sentence about what the room does."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
