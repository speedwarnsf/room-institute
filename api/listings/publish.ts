/**
 * Publish Listing API
 * POST endpoint that:
 * 1. Sets approved designs is_curated=true with display_order
 * 2. Sets non-approved designs is_curated=false
 * 3. Updates listing status to 'ready'
 * 4. Generates QR codes for house and rooms
 * 5. Updates hero image
 *
 * SELF-CONTAINED: All logic inlined - no local file imports
 */

import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

export const maxDuration = 60;

// ============================================================================
// SUPABASE ADMIN CLIENT
// ============================================================================
const SUPABASE_URL = 'https://vqkoxfenyjomillmxawh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

// ============================================================================
// TYPES
// ============================================================================
interface PublishRequest {
  listingId: string;
  approvedDesigns: Array<{ id: string; order: number }>;
  heroImage: string;
}

interface PublishResponse {
  success: boolean;
  listingUrl: string;
  qrCodes: {
    house: string;
    rooms: Record<string, string>;
  };
}

interface QRCodeResult {
  houseQR: string;
  roomQRs: Record<string, string>;
}

// ============================================================================
// QR CODE GENERATOR
// ============================================================================
const BASE_URL = 'https://room.institute';

async function generateQRCodesForListing(
  listingId: string,
  roomIds: string[]
): Promise<QRCodeResult> {
  // Generate house QR code
  const houseUrl = `${BASE_URL}/listing/${listingId}`;
  const houseQRSvg = await QRCode.toString(houseUrl, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 512
  });

  // Upload house QR to storage
  const houseQRPath = `listings/${listingId}/qr/house.svg`;
  const { error: houseUploadError } = await supabaseAdmin
    .storage
    .from('listing-assets')
    .upload(houseQRPath, houseQRSvg, {
      contentType: 'image/svg+xml',
      upsert: true
    });

  if (houseUploadError) {
    console.error('Failed to upload house QR:', houseUploadError);
  }

  // Get public URL for house QR
  const { data: houseUrlData } = supabaseAdmin
    .storage
    .from('listing-assets')
    .getPublicUrl(houseQRPath);

  const houseQRUrl = houseUrlData.publicUrl;

  // Generate room QR codes
  const roomQRs: Record<string, string> = {};

  for (const roomId of roomIds) {
    const roomUrl = `${BASE_URL}/listing/${listingId}/room/${roomId}`;
    const roomQRSvg = await QRCode.toString(roomUrl, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 512
    });

    // Upload room QR to storage
    const roomQRPath = `listings/${listingId}/qr/room-${roomId}.svg`;
    const { error: roomUploadError } = await supabaseAdmin
      .storage
      .from('listing-assets')
      .upload(roomQRPath, roomQRSvg, {
        contentType: 'image/svg+xml',
        upsert: true
      });

    if (roomUploadError) {
      console.error(`Failed to upload room QR for ${roomId}:`, roomUploadError);
    }

    // Get public URL for room QR
    const { data: roomUrlData } = supabaseAdmin
      .storage
      .from('listing-assets')
      .getPublicUrl(roomQRPath);

    roomQRs[roomId] = roomUrlData.publicUrl;
  }

  return {
    houseQR: houseQRUrl,
    roomQRs
  };
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
    const body: PublishRequest = req.body;

    if (!body || !body.listingId || !body.approvedDesigns) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { listingId, approvedDesigns, heroImage } = body;

    // Get all designs for this listing
    const { data: allDesigns, error: designsError } = await supabaseAdmin
      .from('listing_designs')
      .select('id, room_id')
      .eq('listing_id', listingId);

    if (designsError) {
      throw new Error(`Failed to fetch designs: ${designsError.message}`);
    }

    // Create a map of approved design IDs
    const approvedMap = new Map(approvedDesigns.map(d => [d.id, d.order]));

    // Update all designs
    for (const design of allDesigns || []) {
      const isApproved = approvedMap.has(design.id);
      const displayOrder = approvedMap.get(design.id) || null;

      await supabaseAdmin
        .from('listing_designs')
        .update({
          is_curated: isApproved,
          display_order: displayOrder
        })
        .eq('id', design.id);
    }

    // Get all visible rooms for QR code generation
    const { data: rooms, error: roomsError } = await supabaseAdmin
      .from('listing_rooms')
      .select('id')
      .eq('listing_id', listingId)
      .neq('status', 'hidden');

    if (roomsError) {
      throw new Error(`Failed to fetch rooms: ${roomsError.message}`);
    }

    const roomIds = (rooms || []).map(r => r.id);

    // Generate QR codes
    const qrCodes = await generateQRCodesForListing(listingId, roomIds);

    // Update listing status and hero image
    await supabaseAdmin
      .from('listings')
      .update({
        status: 'ready',
        hero_image: heroImage || null,
        qr_code_house: qrCodes.houseQR,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId);

    // Update room QR codes
    for (const roomId of roomIds) {
      if (qrCodes.roomQRs[roomId]) {
        await supabaseAdmin
          .from('listing_rooms')
          .update({ qr_code: qrCodes.roomQRs[roomId] })
          .eq('id', roomId);
      }
    }

    return res.status(200).json({
      success: true,
      listingUrl: `/listing/${listingId}`,
      qrCodes: {
        house: qrCodes.houseQR,
        rooms: qrCodes.roomQRs
      }
    });
  } catch (error) {
    console.error('Publish error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
