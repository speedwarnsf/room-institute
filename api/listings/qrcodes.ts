import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const SUPABASE_URL = 'https://vqkoxfenyjomillmxawh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const BASE_URL = 'https://zenspace.design';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ─── Ensure storage bucket exists ───

async function ensureBucket(name: string) {
  const { data } = await supabase.storage.getBucket(name);
  if (!data) {
    await supabase.storage.createBucket(name, { public: true });
  }
}

// ─── Generate styled SVG QR code ───

async function generateStyledQR(url: string): Promise<string> {
  // Generate raw SVG from qrcode lib
  const rawSvg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 0,
    width: 512,
    color: {
      dark: '#1c1917',   // stone-900
      light: '#00000000' // transparent background
    }
  });

  return rawSvg;
}

// ─── Handler ───

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({ error: 'listingId required' });
    }

    // Fetch listing and rooms
    const { data: listing, error: listingErr } = await supabase
      .from('listings')
      .select('id, address')
      .eq('id', listingId)
      .single();

    if (listingErr || !listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const { data: rooms, error: roomsErr } = await supabase
      .from('listing_rooms')
      .select('id, label')
      .eq('listing_id', listingId)
      .neq('status', 'hidden')
      .order('label');

    if (roomsErr) {
      return res.status(500).json({ error: 'Failed to fetch rooms' });
    }

    await ensureBucket('listing-assets');

    // Generate house QR
    const houseUrl = `${BASE_URL}/listing/${listingId}?source=qr`;
    const houseSvg = await generateStyledQR(houseUrl);
    const housePath = `listings/${listingId}/qr/house.svg`;

    const { error: houseUpErr } = await supabase.storage
      .from('listing-assets')
      .upload(housePath, houseSvg, {
        contentType: 'image/svg+xml',
        upsert: true,
      });

    if (houseUpErr) {
      console.error('House QR upload error:', houseUpErr);
    }

    const { data: houseUrlData } = supabase.storage
      .from('listing-assets')
      .getPublicUrl(housePath);

    // Generate room QRs
    const roomQRs: Array<{
      roomId: string;
      roomType: string;
      url: string;
      qrUrl: string;
    }> = [];

    for (const room of (rooms || [])) {
      const roomUrl = `${BASE_URL}/listing/${listingId}/room/${room.id}?source=qr`;
      const roomSvg = await generateStyledQR(roomUrl);
      const roomPath = `listings/${listingId}/qr/room-${room.id}.svg`;

      const { error: roomUpErr } = await supabase.storage
        .from('listing-assets')
        .upload(roomPath, roomSvg, {
          contentType: 'image/svg+xml',
          upsert: true,
        });

      if (roomUpErr) {
        console.error(`Room QR upload error for ${room.label}:`, roomUpErr);
      }

      const { data: roomUrlData } = supabase.storage
        .from('listing-assets')
        .getPublicUrl(roomPath);

      roomQRs.push({
        roomId: room.id,
        roomType: room.label,
        url: roomUrl,
        qrUrl: roomUrlData.publicUrl,
      });
    }

    // Update listing with QR URLs
    const qrData = {
      house_qr_url: houseUrlData.publicUrl,
      room_qr_urls: Object.fromEntries(
        roomQRs.map(r => [r.roomId, r.qrUrl])
      ),
    };

    await supabase
      .from('listings')
      .update({ qr_codes: qrData })
      .eq('id', listingId);

    return res.status(200).json({
      listing: listing.address,
      houseQR: {
        url: houseUrl,
        qrUrl: houseUrlData.publicUrl,
      },
      roomQRs,
      total: 1 + roomQRs.length,
    });

  } catch (err: any) {
    console.error('QR generation error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
