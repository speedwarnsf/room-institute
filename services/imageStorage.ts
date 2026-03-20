/**
 * Image Storage — upload visualization images via server-side API
 * (which uses Supabase service role to bypass RLS on storage.objects)
 * Returns public URL for the uploaded image.
 */

/**
 * Upload a base64 image and return the public URL.
 * Returns null if upload fails (caller should handle gracefully).
 */
export async function uploadVisualizationImage(
  base64Data: string,
  roomId: string,
  designId: string
): Promise<string | null> {
  try {
    const path = `rooms/${roomId}/${designId}.png`;

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64: base64Data,
        path,
        contentType: 'image/png',
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.warn('imageStorage: upload failed', response.status, err);
      return null;
    }

    const { url } = await response.json();
    return url || null;
  } catch (err) {
    console.warn('imageStorage: upload error', err);
    return null;
  }
}

/**
 * Upload a source image (the original room photo) to storage.
 */
export async function uploadSourceImage(
  base64Data: string,
  roomId: string
): Promise<string | null> {
  try {
    const path = `rooms/${roomId}/source.png`;

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64: base64Data,
        path,
        contentType: 'image/png',
      }),
    });

    if (!response.ok) {
      console.warn('imageStorage: source upload failed', response.status);
      return null;
    }

    const { url } = await response.json();
    return url || null;
  } catch (err) {
    console.warn('imageStorage: source upload error', err);
    return null;
  }
}
