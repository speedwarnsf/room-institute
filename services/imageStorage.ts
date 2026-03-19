/**
 * Image storage service
 * Stores generated design images in Supabase Storage
 */

import { supabaseAdmin } from './supabaseAdmin';

const BUCKET_NAME = 'listing-designs';

/**
 * Initialize the storage bucket if it doesn't exist
 */
async function ensureBucket(): Promise<void> {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

  if (!bucketExists) {
    await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
  }
}

/**
 * Upload a design image to Supabase Storage
 * @param listingId - Listing ID
 * @param roomId - Room ID
 * @param designId - Design ID
 * @param imageBase64 - Base64 encoded image
 * @returns Public URL of the uploaded image
 */
export async function uploadDesignImage(
  listingId: string,
  roomId: string,
  designId: string,
  imageBase64: string
): Promise<string> {
  await ensureBucket();

  // Convert base64 to buffer
  const imageBuffer = Buffer.from(imageBase64, 'base64');

  // Determine file extension based on image header
  let extension = 'jpg';
  if (imageBase64.startsWith('iVBORw0KGgo')) {
    extension = 'png';
  } else if (imageBase64.startsWith('UklGR')) {
    extension = 'webp';
  }

  // Create file path
  const fileName = `${listingId}/${roomId}/${designId}.${extension}`;

  // Upload to Supabase
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(fileName, imageBuffer, {
      contentType: `image/${extension}`,
      cacheControl: '31536000', // 1 year
      upsert: true // Overwrite if exists
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Upload a thumbnail version of a design image
 * For now, just stores the same image - could add thumbnail generation later
 */
export async function uploadThumbnail(
  listingId: string,
  roomId: string,
  designId: string,
  imageBase64: string
): Promise<string> {
  await ensureBucket();

  const imageBuffer = Buffer.from(imageBase64, 'base64');

  let extension = 'jpg';
  if (imageBase64.startsWith('iVBORw0KGgo')) {
    extension = 'png';
  } else if (imageBase64.startsWith('UklGR')) {
    extension = 'webp';
  }

  const fileName = `${listingId}/${roomId}/${designId}_thumb.${extension}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(fileName, imageBuffer, {
      contentType: `image/${extension}`,
      cacheControl: '31536000',
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload thumbnail: ${error.message}`);
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Delete all images for a listing
 */
export async function deleteListingImages(listingId: string): Promise<void> {
  const { data: files, error: listError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list(listingId);

  if (listError || !files) {
    return; // Nothing to delete or error listing
  }

  if (files.length === 0) {
    return;
  }

  const filePaths = files.map(file => `${listingId}/${file.name}`);

  const { error: deleteError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove(filePaths);

  if (deleteError) {
    console.error('Failed to delete listing images:', deleteError);
  }
}
