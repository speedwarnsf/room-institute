/**
 * Design generator service
 * Wraps the existing Room generation pipeline for listing rooms
 */

import { generateDesignOptions, generateDesignVisualization } from './geminiService';

import type { DesignFramework, ProductRecommendation } from '../types';

export interface GeneratedDesign {
  name: string;
  description: string;
  imageBase64: string;
  frameworks: DesignFramework[];
  designSeed: {
    palette: string[];
    keyChanges: string[];
    fullPlan: string;
    products?: ProductRecommendation[];
  };
  roomReading: {
    roomReading: string;
    frameworks: DesignFramework[];
    frameworkRationale?: string;
  };
  qualityScore: number;
}

export interface ListingContext {
  neighborhood?: string;
  city: string;
  yearBuilt?: number;
  views?: string;
}

/**
 * Generate design directions for a room in a listing
 * Uses the existing Room prompt system
 */
export async function generateDesignsForRoom(
  photoUrl: string,
  roomType: string,
  listingContext: ListingContext,
  count: number = 5
): Promise<GeneratedDesign[]> {
  // Fetch the photo and convert to base64
  const photoResponse = await fetch(photoUrl);
  if (!photoResponse.ok) {
    throw new Error(`Failed to fetch photo: ${photoResponse.status}`);
  }

  const photoBlob = await photoResponse.blob();
  const photoBuffer = await photoBlob.arrayBuffer();
  const photoBase64 = Buffer.from(photoBuffer).toString('base64');
  const mimeType = photoBlob.type || 'image/jpeg';

  // Generate designs in batches (3 at a time, as per the existing system)
  const designs: GeneratedDesign[] = [];
  const batchCount = Math.ceil(count / 3);

  for (let batch = 0; batch < batchCount; batch++) {
    // Get room analysis and 3 design options
    const analysis = await generateDesignOptions(
      photoBase64,
      mimeType,
      designs.map(d => d.name), // Avoid duplicates
      {
        roomType,
        // No specific style - let the system generate diverse options
      }
    );

    // Generate visualizations for each option
    const batchDesigns = await Promise.all(
      analysis.options.map(async (option) => {
        try {
          const imageBase64 = await generateDesignVisualization(
            option.visualizationPrompt,
            photoBase64,
            mimeType
          );

          const design: GeneratedDesign = {
            name: option.name,
            description: option.mood,
            imageBase64,
            frameworks: option.frameworks,
            designSeed: {
              palette: option.palette,
              keyChanges: option.keyChanges,
              fullPlan: option.fullPlan,
              products: option.products
            },
            roomReading: {
              roomReading: analysis.roomReading,
              frameworks: option.frameworks,
              frameworkRationale: option.frameworkRationale
            },
            qualityScore: 0.85 // Placeholder - could implement scoring later
          };
          return design;
        } catch (error) {
          console.error(`Failed to generate visualization for "${option.name}":`, error);
          return null;
        }
      })
    );

    // Filter out failed generations
    const successfulDesigns = batchDesigns.filter((d): d is GeneratedDesign => d !== null);
    designs.push(...successfulDesigns);

    // Stop if we have enough
    if (designs.length >= count) {
      break;
    }
  }

  return designs.slice(0, count);
}

/**
 * Generate a single design for a specific style direction
 */
export async function generateSingleDesign(
  photoUrl: string,
  roomType: string,
  style: string,
  listingContext: ListingContext
): Promise<GeneratedDesign> {
  // Fetch the photo and convert to base64
  const photoResponse = await fetch(photoUrl);
  if (!photoResponse.ok) {
    throw new Error(`Failed to fetch photo: ${photoResponse.status}`);
  }

  const photoBlob = await photoResponse.blob();
  const photoBuffer = await photoBlob.arrayBuffer();
  const photoBase64 = Buffer.from(photoBuffer).toString('base64');
  const mimeType = photoBlob.type || 'image/jpeg';

  // Generate with style constraint
  const analysis = await generateDesignOptions(
    photoBase64,
    mimeType,
    [],
    {
      roomType,
      style
    }
  );

  // Take the first option (most aligned with requested style)
  const option = analysis.options[0];
  if (!option) {
    throw new Error('Failed to generate design option');
  }

  // Generate visualization
  const imageBase64 = await generateDesignVisualization(
    option.visualizationPrompt,
    photoBase64,
    mimeType
  );

  return {
    name: option.name,
    description: option.mood,
    imageBase64,
    frameworks: option.frameworks,
    designSeed: {
      palette: option.palette,
      keyChanges: option.keyChanges,
      fullPlan: option.fullPlan,
      products: option.products
    },
    roomReading: {
      roomReading: analysis.roomReading,
      frameworks: option.frameworks,
      frameworkRationale: option.frameworkRationale
    },
    qualityScore: 0.85
  };
}
