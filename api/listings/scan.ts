import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqkoxfenyjomillmxawh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

/**
 * POST /api/listings/scan
 * Track QR code scans and page views for analytics
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { listingId, roomId, source } = req.body;

    if (!listingId) {
      return res.status(400).json({ error: 'listingId required' });
    }

    // Increment scan count on listing
    await supabase.rpc('increment_scan_count', { listing_id: listingId }).catch(() => {
      // Fallback: direct update
      return supabase
        .from('listings')
        .update({ scan_count: supabase.rpc('', {}) as any })
        .eq('id', listingId);
    });

    // Also increment directly as backup
    const { data: listing } = await supabase
      .from('listings')
      .select('scan_count')
      .eq('id', listingId)
      .single();

    if (listing) {
      await supabase
        .from('listings')
        .update({ scan_count: (listing.scan_count || 0) + 1 })
        .eq('id', listingId);
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
