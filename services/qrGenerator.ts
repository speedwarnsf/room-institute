/**
 * QR Code Generator Service
 * Generates SVG QR codes for listings and rooms
 * Stores them in Supabase storage
 */

import QRCode from 'qrcode';
import { supabaseAdmin } from './supabaseAdmin';

const BASE_URL = 'https://zenspace.design';

interface QRCodeResult {
  houseQR: string;
  roomQRs: Record<string, string>;
}

/**
 * Generate QR codes for a listing and all its rooms
 */
export async function generateQRCodesForListing(
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

/**
 * Generate a single QR code for a URL
 */
export async function generateQRCode(url: string): Promise<string> {
  return await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 512
  });
}
