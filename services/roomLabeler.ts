/**
 * Room labeler service
 * Uses Gemini vision to identify room types from listing photos
 */

export interface LabeledPhoto {
  url: string;
  index: number;
  roomType: string; // "Living Room", "Kitchen", "Bedroom", etc.
  confidence: number;
  isPrimary: boolean; // Best photo for this room type
}

/**
 * Label photos with room types using Gemini vision
 * Server-side only - uses GEMINI_API_KEY directly
 */
export async function labelPhotos(photoUrls: string[]): Promise<LabeledPhoto[]> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const results: LabeledPhoto[] = [];

  // Process photos in batches to avoid rate limits
  const BATCH_SIZE = 10;
  for (let i = 0; i < photoUrls.length; i += BATCH_SIZE) {
    const batch = photoUrls.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (url, batchIndex) => {
        const index = i + batchIndex;
        try {
          const roomType = await identifyRoomType(url, GEMINI_API_KEY);
          return {
            url,
            index,
            roomType,
            confidence: 1.0,
            isPrimary: false // Will be set later
          };
        } catch (error) {
          console.warn(`Failed to label photo ${index}:`, error);
          return {
            url,
            index,
            roomType: 'Unknown',
            confidence: 0,
            isPrimary: false
          };
        }
      })
    );

    results.push(...batchResults);
  }

  // Group by room type and select primary photo for each
  const roomGroups = new Map<string, LabeledPhoto[]>();
  results.forEach(photo => {
    if (photo.roomType !== 'Unknown') {
      const group = roomGroups.get(photo.roomType) || [];
      group.push(photo);
      roomGroups.set(photo.roomType, group);
    }
  });

  // Mark the first photo of each room type as primary
  roomGroups.forEach(photos => {
    if (photos.length > 0) {
      photos[0]!.isPrimary = true;
    }
  });

  return results;
}

/**
 * Identify room type for a single photo URL
 */
async function identifyRoomType(photoUrl: string, apiKey: string): Promise<string> {
  // Fetch the image and convert to base64
  const imageResponse = await fetch(photoUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status}`);
  }

  const imageBlob = await imageResponse.blob();
  const imageBuffer = await imageBlob.arrayBuffer();
  const imageBase64 = Buffer.from(imageBuffer).toString('base64');
  const mimeType = imageBlob.type || 'image/jpeg';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `What room type is shown in this real estate listing photo? Respond with ONLY the room type from this list (no explanation, just the room name):

Living Room
Kitchen
Master Bedroom
Bedroom
Bathroom
Dining Room
Office
Balcony
Terrace
View
Exterior
Hallway
Closet
Laundry
Garage
Gym
Library
Media Room
Wine Cellar
Other

If the photo shows multiple rooms or an unclear space, pick the most prominent feature.`
            },
            {
              inlineData: {
                mimeType,
                data: imageBase64
              }
            }
          ]
        }]
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Unknown';

  // Clean up response - remove any extra text
  const roomType = text
    .split('\n')[0] // Take first line only
    ?.trim()
    .replace(/^(The room is|This is|Room type:)/i, '')
    .trim();

  return roomType || 'Unknown';
}

/**
 * Get the best photo for each unique room type
 */
export function getPrimaryPhotosPerRoom(labeledPhotos: LabeledPhoto[]): LabeledPhoto[] {
  return labeledPhotos.filter(photo => photo.isPrimary);
}
