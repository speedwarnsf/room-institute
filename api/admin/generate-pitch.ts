/**
 * Generate Pitch Narrative — Admin-only endpoint
 * Takes platform data + prospect info, generates editorial pitch via Gemini
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prospectType, prospectName, insights, customContext } = req.body || {};
  if (!prospectType || !insights) return res.status(400).json({ error: 'prospectType and insights required' });

  const prompt = `You are writing a pitch portfolio for Room, a real estate design visualization platform. Room lets homebuyers scan QR codes at open houses and explore AI-generated interior design possibilities for the space they're standing in.

PROSPECT TYPE: ${prospectType}
PROSPECT NAME: ${prospectName || '(unnamed)'}
${customContext ? `ADDITIONAL CONTEXT: ${customContext}` : ''}

PLATFORM DATA:
${JSON.stringify(insights, null, 2)}

BUSINESS MODEL:
- Room is free for homebuyers (QR code scan at open house → explore designs on their phone)
- Revenue comes from: design firm referrals (MODTAGE Design is first partner), agency licensing, data intelligence packages
- Interaction data reveals what styles, palettes, and products resonate with real homebuyers in real spaces
- This data is exclusive and unavailable anywhere else — it's generated from real behavior in real homes

Write a compelling, data-driven pitch narrative for this ${prospectType.replace(/_/g, ' ')}. The tone should be confident, editorial, and specific. Reference actual numbers from the platform data. Explain why this data matters to THEM specifically.

Structure:
1. **Opening Hook** — One powerful sentence about the opportunity
2. **The Problem** — What they're missing without this data
3. **Room Advantage** — What the platform uniquely provides
4. **The Numbers** — Key metrics that matter to this prospect type
5. **The Ask** — Clear next step / partnership proposal

Write in markdown. Be specific, not generic. This is a premium product — the tone should match.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
        }),
      }
    );

    const data = await geminiRes.json();
    const narrative = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!narrative) return res.status(500).json({ error: 'Empty response from Gemini' });

    return res.status(200).json({ narrative });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Generation failed' });
  }
}
