/**
 * Generate More Designs — Buyer-facing endpoint
 * Adds 3 new designs to an existing room without deleting current ones.
 * Uses the room's original photo and existing design names to avoid repeats.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

export const maxDuration = 300;

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

    // Generate 3 new design concepts
    const promptText = `You are an award-winning interior designer generating fresh design directions for a ${room.label}.

EXISTING DESIGNS ALREADY CREATED (DO NOT REPEAT THESE — create something completely different):
${existingNames.map(n => `- ${n}`).join('\n')}

Generate 3 completely NEW and DIFFERENT design directions. Each must be dramatically distinct from the existing ones and from each other.
${locale !== 'en' ? `\nLANGUAGE: Write ALL text in ${({fr:'French',de:'German',es:'Spanish',zh:'Mandarin Chinese',pt:'Portuguese',ar:'Arabic'} as Record<string,string>)[locale] || 'English'} — design names, mood descriptions, room reading, key changes, full plan, product descriptions. Keep brand names and product names in their original form. The design direction names should be evocative and punchy in ${({fr:'French',de:'German',es:'Spanish',zh:'Mandarin Chinese',pt:'Portuguese',ar:'Arabic'} as Record<string,string>)[locale] || 'English'}, not translated from English.` : ''}

Return ONLY valid JSON:
{
  "room_reading": "Brief analysis of the space",
  "options": [
    {
      "name": "Short evocative name (2-3 words)",
      "mood": "1-2 sentence mood description",
      "frameworks": ["design framework 1", "framework 2"],
      "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
      "key_changes": ["change 1", "change 2", "change 3"],
      "full_plan": "Detailed design plan in markdown",
      "visualization_prompt": "Detailed prompt to visualize this design direction applied to the room photo",
      "products": [
        {"name": "Product Name", "brand": "Brand", "category": "furniture|lighting|textiles|decor|rugs|hardware", "price_range": "$X-Y", "description": "Why this product", "search_query": "search term"}
      ]
    }
  ]
}`;

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
                text: `REDESIGN THIS ROOM PHOTO. Keep the architectural shell (walls, windows, doors, ceiling, floor material) and similar camera angle.

REARRANGE THE FURNITURE COMPLETELY according to this design vision:
${option.visualization_prompt}

STYLE: Professional interior design portfolio shot — Architectural Digest / Dwell quality.
Rich textures, atmospheric lighting, tactile materials. Be BOLD.
Same room shell and approximate camera angle — recognizable as the same space.`
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

        // Upload to storage
        const imageBuffer = Buffer.from(imageBase64, 'base64');
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
