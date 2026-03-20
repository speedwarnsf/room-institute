/**
 * Server-side image upload to Supabase Storage.
 * Client sends base64 image data; server uploads with service role key
 * (bypasses RLS policies on storage.objects).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqkoxfenyjomillmxawh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BUCKET = 'listing-designs';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { base64, path, contentType } = req.body as {
    base64?: string;
    path?: string;
    contentType?: string;
  };

  if (!base64 || !path) {
    return res.status(400).json({ error: 'Missing base64 or path' });
  }

  const mime = contentType || 'image/png';
  if (!mime.startsWith('image/')) {
    return res.status(400).json({ error: 'Only image uploads allowed' });
  }

  // Validate path is within rooms/ prefix
  if (!path.startsWith('rooms/')) {
    return res.status(400).json({ error: 'Path must start with rooms/' });
  }

  try {
    const buffer = Buffer.from(base64, 'base64');

    // Max 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image too large (max 10MB)' });
    }

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: mime,
        upsert: true,
      });

    if (error) {
      console.error('Upload failed:', error);
      return res.status(500).json({ error: 'Upload failed' });
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    return res.status(200).json({ url: data.publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
