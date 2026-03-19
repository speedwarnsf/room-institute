/**
 * Compass listing scraper
 * Extracts photos and property details from Compass real estate URLs
 */

export interface ScrapedListing {
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  description: string;
  photos: string[]; // URLs
  agentName?: string;
  agentBrokerage?: string;
  neighborhood?: string;
  yearBuilt?: number;
}

/**
 * Scrape a Compass listing URL for photos and property details
 */
export async function scrapeCompassListing(url: string): Promise<ScrapedListing> {
  try {
    // Fetch the listing page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch listing: ${response.status}`);
    }

    const html = await response.text();

    // Extract JSON-LD structured data (most reliable source)
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    let structuredData: any = null;

    if (jsonLdMatch && jsonLdMatch[1]) {
      try {
        const raw = JSON.parse(jsonLdMatch[1]);
        // Compass wraps data in @graph array
        structuredData = raw['@graph'] ? raw['@graph'][0] : raw;
      } catch (e) {
        console.warn('Failed to parse JSON-LD:', e);
      }
    }

    // Extract photo URLs
    // Compass uses /m3/{hash}.jpg (full res) or /m3/{hash}/{WxH}.jpg patterns
    const photoRegex = /https:\/\/(?:www\.)?compass\.com\/m3\/[a-f0-9]+(?:\/[^"'\s]*)?\.(?:jpg|jpeg|png|webp)/gi;
    const photoMatches = html.match(photoRegex) || [];

    // Deduplicate, prefer full-res (no size suffix) or large sizes, skip thumbnails
    const photos = Array.from(new Set(photoMatches))
      .filter(photoUrl => {
        // Skip tiny thumbnails (165x165, etc.)
        return !photoUrl.match(/\/\d{1,3}x\d{1,3}\./);
      })
      .slice(0, 50); // Cap at 50 photos

    // If we didn't find photos via regex, try finding them in window.__INITIAL_STATE__ or similar
    if (photos.length === 0) {
      const initialStateMatch = html.match(/window\.__INITIAL_DATA__\s*=\s*({[\s\S]*?});/);
      if (initialStateMatch && initialStateMatch[1]) {
        try {
          const state = JSON.parse(initialStateMatch[1]);
          // Navigate the state object to find photos
          const media = state?.listing?.media || state?.propertyDetails?.media || [];
          if (Array.isArray(media)) {
            photos.push(...media.map((m: any) => m.url || m.href).filter(Boolean));
          }
        } catch (e) {
          console.warn('Failed to extract photos from state:', e);
        }
      }
    }

    // Extract property details from structured data or HTML
    let address = '';
    let city = '';
    let state = 'CA';
    let zip = '';
    let price = 0;
    let beds = 0;
    let baths = 0;
    let sqft = 0;
    let description = '';
    let agentName = '';
    let agentBrokerage = 'Compass';
    let neighborhood = '';
    let yearBuilt: number | undefined;

    if (structuredData) {
      // JSON-LD structured data
      address = structuredData.address?.streetAddress || '';
      // addressLocality on Compass is often the neighborhood, not the city
      // Extract city from the name field: "1150 Folsom St, Unit 6, San Francisco, CA 94103"
      const nameField = structuredData.name || '';
      const nameParts = nameField.split(',').map((s: string) => s.trim());
      if (nameParts.length >= 3) {
        city = nameParts[nameParts.length - 2] || structuredData.address?.addressLocality || '';
      } else {
        city = structuredData.address?.addressLocality || '';
      }
      // Use addressLocality as neighborhood if it's not the city
      if (structuredData.address?.addressLocality && structuredData.address.addressLocality !== city) {
        neighborhood = structuredData.address.addressLocality;
      }
      state = structuredData.address?.addressRegion || 'CA';
      zip = structuredData.address?.postalCode || '';

      // Price from offers
      const offers = structuredData.offers || {};
      price = parseInt(String(offers.price || structuredData.price || '0').replace(/[^0-9]/g, ''), 10);

      description = structuredData.description || structuredData.accommodationFloorPlan?.description || '';

      // Beds/baths from numberOfRooms
      if (structuredData.numberOfRooms) {
        beds = parseInt(String(structuredData.numberOfRooms).replace(/[^0-9]/g, ''), 10);
      }
      if (structuredData.numberOfBathroomsTotal) {
        baths = parseFloat(String(structuredData.numberOfBathroomsTotal));
      }
      // floorSize can be an array on Compass
      const floorSize = Array.isArray(structuredData.floorSize) ? structuredData.floorSize[0] : structuredData.floorSize;
      if (floorSize) {
        sqft = parseInt(String(floorSize.value || floorSize).replace(/[^0-9]/g, ''), 10);
      }

      // Photos from JSON-LD image array (most reliable source)
      if (Array.isArray(structuredData.image) && structuredData.image.length > 0) {
        const ldPhotos = structuredData.image
          .map((img: { url?: string }) => img.url)
          .filter(Boolean);
        if (ldPhotos.length > 0) {
          photos.length = 0; // Clear regex-found photos, JSON-LD is authoritative
          photos.push(...ldPhotos.slice(0, 50));
        }
      }
    }

    // Fallback: extract from HTML meta tags and content
    if (!address) {
      const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
      if (ogTitleMatch && ogTitleMatch[1]) {
        // Parse address from title like "1177 California Street, Unit 1210, San Francisco, CA 94108"
        const titleParts = ogTitleMatch[1].split(',').map(s => s.trim());
        if (titleParts.length >= 3) {
          address = titleParts.slice(0, -2).join(', ');
          city = titleParts[titleParts.length - 2] || '';
          const stateZip = titleParts[titleParts.length - 1] || '';
          const stateZipMatch = stateZip.match(/([A-Z]{2})\s*(\d{5})/);
          if (stateZipMatch) {
            state = stateZipMatch[1] || 'CA';
            zip = stateZipMatch[2] || '';
          }
        }
      }
    }

    if (!price) {
      const priceMatch = html.match(/\$([0-9,]+)/);
      if (priceMatch && priceMatch[1]) {
        price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      }
    }

    if (!description) {
      const descMatch = html.match(/<meta name="description" content="([^"]+)"/i);
      if (descMatch && descMatch[1]) {
        description = descMatch[1];
      }
    }

    // Extract beds/baths/sqft from common patterns
    if (!beds) {
      const bedsMatch = html.match(/(\d+)\s*(?:bed|br|bedroom)/i);
      if (bedsMatch && bedsMatch[1]) {
        beds = parseInt(bedsMatch[1], 10);
      }
    }

    if (!baths) {
      const bathsMatch = html.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)/i);
      if (bathsMatch && bathsMatch[1]) {
        baths = parseFloat(bathsMatch[1]);
      }
    }

    if (!sqft) {
      const sqftMatch = html.match(/([0-9,]+)\s*(?:sq\.?\s*ft|sqft|square\s*feet)/i);
      if (sqftMatch && sqftMatch[1]) {
        sqft = parseInt(sqftMatch[1].replace(/,/g, ''), 10);
      }
    }

    // Extract agent name
    const agentMatch = html.match(/agent[^>]*>([^<]+)</i) || html.match(/listing\s+agent[^>]*>([^<]+)</i);
    if (agentMatch && agentMatch[1]) {
      agentName = agentMatch[1].trim();
    }

    // Extract neighborhood
    const neighborhoodMatch = html.match(/neighborhood[^>]*>([^<]+)</i);
    if (neighborhoodMatch && neighborhoodMatch[1]) {
      neighborhood = neighborhoodMatch[1].trim();
    }

    // Extract year built
    const yearMatch = html.match(/(?:built|year)[^>]*>(\d{4})</i);
    if (yearMatch && yearMatch[1]) {
      yearBuilt = parseInt(yearMatch[1], 10);
    }

    // Validate we got the minimum required data
    if (!address || photos.length === 0) {
      throw new Error('Could not extract required listing data (address or photos missing)');
    }

    return {
      address,
      city,
      state,
      zip,
      price,
      beds,
      baths,
      sqft,
      description,
      photos,
      agentName,
      agentBrokerage,
      neighborhood,
      yearBuilt
    };
  } catch (error) {
    throw new Error(`Failed to scrape Compass listing: ${error instanceof Error ? error.message : String(error)}`);
  }
}
