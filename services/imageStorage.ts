/**
 * Image Storage — upload visualization images to Supabase Storage
 * Returns public URL for the uploaded image.
 */
import { supabase } from './auth';

const BUCKET = 'listing-designs';

/**
 * Upload a base64 image to Supabase Storage and return the public URL.
 * Returns null if upload fails (caller should handle gracefully).
 */
export async function uploadVisualizationImage(
  base64Data: string,
  roomId: string,
  designId: string
): Promise<string | null> {
  try {
    // Convert base64 to blob
    const byteString = atob(base64Data);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/png' });

    const path = `rooms/${roomId}/${designId}.png`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.warn('imageStorage: upload failed', error);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.warn('imageStorage: upload error', err);
    return null;
  }
}
