import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// Vercel serverless config
export const maxDuration = 90;

export default async function handler(req: any, res: any) {
  // CORS — restrict to known origins
  const allowedOrigins = ['https://zenspace.design', 'https://zenspace-two.vercel.app', 'http://localhost:3000'];
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!ai) return res.status(500).json({ error: 'API key not configured on server' });

  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body', code: 'INVALID_INPUT' });
    }

    const { action, model, contents, config: reqConfig, message, chatContext } = body;

    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter', code: 'INVALID_INPUT' });
    }

    if (action === 'chat') {
      const trimmedMessage = (typeof message === 'string' ? message : '').trim();
      if (!trimmedMessage) {
        return res.status(400).json({ error: 'Empty chat message', code: 'INVALID_INPUT' });
      }
      const chat = ai.chats.create({
        model: model || 'gemini-2.0-flash',
        config: { systemInstruction: chatContext || '' }
      });
      const response = await chat.sendMessage({ message: trimmedMessage });
      return res.status(200).json({ text: response.text || '' });
    }

    if (action !== 'generateContent') {
      return res.status(400).json({ error: `Unknown action: ${action}`, code: 'INVALID_INPUT' });
    }

    if (!contents) {
      return res.status(400).json({ error: 'Missing contents', code: 'INVALID_INPUT' });
    }

    // generateContent - pass everything through
    const response = await ai.models.generateContent({
      model: model || 'gemini-2.0-flash',
      contents,
      config: reqConfig,
    });

    // Serialize manually to handle large responses
    const result: any = {
      candidates: response.candidates,
      modelVersion: response.modelVersion,
      usageMetadata: response.usageMetadata,
    };

    // For text responses, also include the text shortcut
    if (response.text) {
      result.text = response.text;
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Gemini proxy error:', JSON.stringify({
      message: error.message,
      status: error.status,
      code: error.code,
    }));
    const status = error.status || error.httpStatusCode || 500;
    return res.status(status).json({ 
      error: error.message || 'Gemini API error',
      code: error.code || 'PROXY_ERROR'
    });
  }
}
