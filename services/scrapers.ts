/**
 * Multi-Platform Real Estate Listing Scrapers
 * 
 * Supports: Compass, Zillow, Redfin, Realtor.com, and generic fallback.
 * Each scraper extracts: address, photos, price, beds/baths/sqft, agent info.
 * 
 * Usage: Called by api/listings/intake.ts based on URL pattern detection.
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
  photos: string[];
  agentName?: string;
  agentBrokerage?: string;
  neighborhood?: string;
  yearBuilt?: number;
  platform: string;
}

type ScraperFn = (url: string, html: string) => ScrapedListing;

/**
 * Detect which platform a URL belongs to
 */
export function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('compass.com')) return 'compass';
  if (u.includes('zillow.com')) return 'zillow';
  if (u.includes('redfin.com') || u.includes('redfin.ca')) return 'redfin';
  if (u.includes('realtor.com')) return 'realtor';
  if (u.includes('realtor.ca')) return 'realtor_ca';
  if (u.includes('trulia.com')) return 'trulia';
  if (u.includes('coldwellbanker.com') || u.includes('cbhome.com')) return 'coldwellbanker';
  if (u.includes('sothebysrealty.com') || u.includes('sothebys')) return 'sothebys';
  if (u.includes('elliman.com')) return 'elliman';
  if (u.includes('theagencyre.com')) return 'theagency';
  if (u.includes('kw.com')) return 'kw';
  if (u.includes('engelvoelkers') || u.includes('evrealestate.com')) return 'engelvolkers';
  return 'generic';
}

/**
 * Fetch HTML from a listing URL with browser-like headers
 */
export async function fetchListingHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch listing: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

// ============================================================================
// JSON-LD PARSER (shared across platforms)
// ============================================================================

function extractJsonLd(html: string): any | null {
  const matches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  if (!matches) return null;

  for (const match of matches) {
    try {
      const jsonStr = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      const parsed = JSON.parse(jsonStr);
      
      // Handle @graph arrays (Compass, some others)
      if (parsed['@graph']) {
        const listing = parsed['@graph'].find((item: any) => 
          item['@type'] === 'SingleFamilyResidence' || 
          item['@type'] === 'Apartment' ||
          item['@type'] === 'House' ||
          item['@type'] === 'Product' ||
          item['@type'] === 'RealEstateListing' ||
          item['@type']?.includes?.('Residence')
        );
        if (listing) return listing;
        return parsed['@graph'][0];
      }
      
      // Direct type
      if (parsed['@type'] && (
        typeof parsed['@type'] === 'string' && (
          parsed['@type'].includes('Residence') ||
          parsed['@type'].includes('House') ||
          parsed['@type'].includes('Apartment') ||
          parsed['@type'].includes('Product') ||
          parsed['@type'].includes('RealEstate')
        )
      )) {
        return parsed;
      }
      
      // Array of types
      if (Array.isArray(parsed)) {
        const listing = parsed.find((item: any) => 
          item['@type']?.includes?.('Residence') || item['@type']?.includes?.('House')
        );
        if (listing) return listing;
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

// ============================================================================
// OPEN GRAPH PARSER (fallback)
// ============================================================================

function extractOpenGraph(html: string): Record<string, string> {
  const og: Record<string, string> = {};
  const regex = /<meta\s+(?:property|name)="(og:[^"]+)"\s+content="([^"]*)"/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    og[match[1]!] = match[2]!;
  }
  return og;
}

// ============================================================================
// PHOTO EXTRACTORS
// ============================================================================

function extractPhotosFromHtml(html: string, patterns: RegExp[]): string[] {
  const photos = new Set<string>();
  
  for (const pattern of patterns) {
    const matches = html.match(pattern);
    if (matches) {
      matches.forEach(url => {
        // Filter out tiny images, icons, logos
        if (!url.match(/\/\d{1,2}x\d{1,2}[./]/) && 
            !url.includes('logo') && 
            !url.includes('icon') &&
            !url.includes('favicon') &&
            url.length > 20) {
          photos.add(url);
        }
      });
    }
  }
  
  return Array.from(photos).slice(0, 50);
}

// ============================================================================
// COMMON FIELD EXTRACTORS
// ============================================================================

function extractPrice(html: string, structured?: any): number {
  if (structured?.offers?.price) return parseInt(String(structured.offers.price).replace(/[^0-9]/g, ''), 10);
  if (structured?.price) return parseInt(String(structured.price).replace(/[^0-9]/g, ''), 10);
  
  const priceMatch = html.match(/\$([0-9,]{4,})/);
  if (priceMatch?.[1]) return parseInt(priceMatch[1].replace(/,/g, ''), 10);
  return 0;
}

function extractBeds(html: string, structured?: any): number {
  if (structured?.numberOfRooms) return parseInt(String(structured.numberOfRooms), 10);
  if (structured?.numberOfBedrooms) return parseInt(String(structured.numberOfBedrooms), 10);
  const match = html.match(/(\d+)\s*(?:bed|br|bedroom)/i);
  return match?.[1] ? parseInt(match[1], 10) : 0;
}

function extractBaths(html: string, structured?: any): number {
  if (structured?.numberOfBathroomsTotal) return parseFloat(String(structured.numberOfBathroomsTotal));
  const match = html.match(/(\d+(?:\.\d+)?)\s*(?:bath(?:room)?s?\b)/i);
  return match?.[1] ? parseFloat(match[1]) : 0;
}

function extractSqft(html: string, structured?: any): number {
  const floorSize = Array.isArray(structured?.floorSize) ? structured.floorSize[0] : structured?.floorSize;
  if (floorSize?.value) return parseInt(String(floorSize.value).replace(/[^0-9]/g, ''), 10);
  
  const match = html.match(/([0-9,]+)\s*(?:sq\.?\s*ft|sqft|square\s*feet)/i);
  return match?.[1] ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
}

function extractDescription(html: string, structured?: any): string {
  if (structured?.description) return structured.description;
  const meta = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return meta?.[1] || '';
}

function extractAddress(html: string, structured?: any): { address: string; city: string; state: string; zip: string } {
  if (structured?.address) {
    return {
      address: structured.address.streetAddress || '',
      city: structured.address.addressLocality || '',
      state: structured.address.addressRegion || '',
      zip: structured.address.postalCode || '',
    };
  }
  
  // Try og:title
  const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
  if (ogTitle?.[1]) {
    const parts = ogTitle[1].split(',').map((s: string) => s.trim());
    if (parts.length >= 3) {
      const stateZip = parts[parts.length - 1]?.match(/([A-Z]{2})\s*(\d{5})/);
      return {
        address: parts.slice(0, -2).join(', '),
        city: parts[parts.length - 2] || '',
        state: stateZip?.[1] || '',
        zip: stateZip?.[2] || '',
      };
    }
  }
  
  return { address: '', city: '', state: '', zip: '' };
}

// ============================================================================
// PLATFORM-SPECIFIC SCRAPERS
// ============================================================================

function scrapeCompass(url: string, html: string): ScrapedListing {
  const structured = extractJsonLd(html);
  const addr = extractAddress(html, structured);
  
  // Compass-specific photo extraction
  const photoPatterns = [
    /https:\/\/(?:www\.)?compass\.com\/m3\/[a-f0-9]+(?:\/[^"'\s]*)?\.(?:jpg|jpeg|png|webp)/gi,
  ];
  
  let photos: string[] = [];
  
  // Try JSON-LD images first
  if (structured?.image && Array.isArray(structured.image)) {
    photos = structured.image.map((img: any) => img.url || img).filter(Boolean).slice(0, 50);
  }
  
  if (photos.length === 0) {
    photos = extractPhotosFromHtml(html, photoPatterns);
  }
  
  // Extract neighborhood from Compass-specific patterns
  let neighborhood = '';
  if (structured?.address?.addressLocality && structured.address.addressLocality !== addr.city) {
    neighborhood = structured.address.addressLocality;
  }
  
  return {
    ...addr,
    price: extractPrice(html, structured),
    beds: extractBeds(html, structured),
    baths: extractBaths(html, structured),
    sqft: extractSqft(html, structured),
    description: extractDescription(html, structured),
    photos,
    agentBrokerage: 'Compass',
    neighborhood,
    platform: 'compass',
  };
}

function scrapeZillow(url: string, html: string): ScrapedListing {
  const structured = extractJsonLd(html);
  const addr = extractAddress(html, structured);
  
  // Zillow photo patterns
  const photoPatterns = [
    /https:\/\/photos\.zillowstatic\.com\/fp\/[a-f0-9]+-[a-z0-9_]+\.jpg/gi,
    /https:\/\/photos\.zillowstatic\.com\/[^"'\s]+\.(?:jpg|jpeg|webp)/gi,
  ];
  
  let photos: string[] = [];
  if (structured?.image && Array.isArray(structured.image)) {
    photos = structured.image.map((img: any) => img.url || img).filter(Boolean).slice(0, 50);
  }
  if (photos.length === 0) {
    photos = extractPhotosFromHtml(html, photoPatterns);
  }
  
  // Zillow-specific: extract from __NEXT_DATA__ or preloaded state
  if (photos.length === 0) {
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch?.[1]) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const media = nextData?.props?.pageProps?.componentProps?.gdpClientCache;
        if (media) {
          const cacheData = JSON.parse(Object.values(media as Record<string, string>)[0] || '{}');
          const propertyPhotos = cacheData?.property?.responsivePhotos || cacheData?.property?.photos || [];
          photos = propertyPhotos.map((p: any) => p.mixedSources?.jpeg?.[0]?.url || p.url).filter(Boolean).slice(0, 50);
        }
      } catch (e) {
        // Fall through to pattern matching
      }
    }
  }
  
  return {
    ...addr,
    price: extractPrice(html, structured),
    beds: extractBeds(html, structured),
    baths: extractBaths(html, structured),
    sqft: extractSqft(html, structured),
    description: extractDescription(html, structured),
    photos,
    agentBrokerage: 'Zillow',
    platform: 'zillow',
  };
}

function scrapeRedfin(url: string, html: string): ScrapedListing {
  const structured = extractJsonLd(html);
  const addr = extractAddress(html, structured);
  
  // Redfin photo patterns
  const photoPatterns = [
    /https:\/\/ssl\.cdn-redfin\.com\/photo\/[^"'\s]+\.(?:jpg|jpeg|webp)/gi,
    /https:\/\/[^"'\s]*\.redfin\.com\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi,
  ];
  
  let photos: string[] = [];
  if (structured?.image && Array.isArray(structured.image)) {
    photos = structured.image.map((img: any) => img.url || img).filter(Boolean).slice(0, 50);
  }
  if (photos.length === 0) {
    photos = extractPhotosFromHtml(html, photoPatterns);
  }
  
  // Redfin includes initial data in a script tag
  if (photos.length === 0) {
    const dataMatch = html.match(/window\.__reactServerState\s*=\s*({[\s\S]*?});/);
    if (dataMatch?.[1]) {
      try {
        const data = JSON.parse(dataMatch[1]);
        // Navigate Redfin's data structure for photos
        const photosData = data?.payload?.mediaBrowserInfo?.photos || [];
        photos = photosData.map((p: any) => p.photoUrls?.fullScreenPhotoUrl || p.photoUrls?.nonFullScreenPhotoUrl).filter(Boolean).slice(0, 50);
      } catch (e) {}
    }
  }
  
  return {
    ...addr,
    price: extractPrice(html, structured),
    beds: extractBeds(html, structured),
    baths: extractBaths(html, structured),
    sqft: extractSqft(html, structured),
    description: extractDescription(html, structured),
    photos,
    agentBrokerage: 'Redfin',
    platform: 'redfin',
  };
}

function scrapeRealtor(url: string, html: string): ScrapedListing {
  const structured = extractJsonLd(html);
  const addr = extractAddress(html, structured);
  
  // Realtor.com photo patterns
  const photoPatterns = [
    /https:\/\/ap\.rdcpix\.com\/[^"'\s]+\.(?:jpg|jpeg|webp)/gi,
    /https:\/\/[^"'\s]*rdcpix\.com\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi,
  ];
  
  let photos: string[] = [];
  if (structured?.image && Array.isArray(structured.image)) {
    photos = structured.image.map((img: any) => img.url || img).filter(Boolean).slice(0, 50);
  }
  if (photos.length === 0) {
    photos = extractPhotosFromHtml(html, photoPatterns);
  }
  
  return {
    ...addr,
    price: extractPrice(html, structured),
    beds: extractBeds(html, structured),
    baths: extractBaths(html, structured),
    sqft: extractSqft(html, structured),
    description: extractDescription(html, structured),
    photos,
    agentBrokerage: 'Realtor.com',
    platform: 'realtor',
  };
}

function scrapeRealtorCa(url: string, html: string): ScrapedListing {
  const structured = extractJsonLd(html);
  const addr = extractAddress(html, structured);
  
  const photoPatterns = [
    /https:\/\/[^"'\s]*\.realtor\.ca\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi,
    /https:\/\/cdn\.realtor\.ca\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi,
  ];
  
  let photos: string[] = [];
  if (structured?.image && Array.isArray(structured.image)) {
    photos = structured.image.map((img: any) => img.url || img).filter(Boolean).slice(0, 50);
  }
  if (photos.length === 0) {
    photos = extractPhotosFromHtml(html, photoPatterns);
  }
  
  return {
    ...addr,
    state: addr.state || 'NS', // Default to Nova Scotia for now
    price: extractPrice(html, structured),
    beds: extractBeds(html, structured),
    baths: extractBaths(html, structured),
    sqft: extractSqft(html, structured),
    description: extractDescription(html, structured),
    photos,
    platform: 'realtor_ca',
  };
}

// ============================================================================
// GENERIC FALLBACK SCRAPER
// ============================================================================

function scrapeGeneric(url: string, html: string): ScrapedListing {
  const structured = extractJsonLd(html);
  const og = extractOpenGraph(html);
  const addr = extractAddress(html, structured);
  
  // If no structured address, try OG
  if (!addr.address && og['og:title']) {
    const parts = og['og:title'].split(/[,|–-]/).map(s => s.trim());
    if (parts.length >= 2) {
      addr.address = parts[0] || '';
      addr.city = parts[1] || '';
    }
  }
  
  // Generic photo extraction — look for large image URLs
  const photoPatterns = [
    /https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi,
  ];
  
  let photos: string[] = [];
  
  // Try JSON-LD images
  if (structured?.image) {
    const imgs = Array.isArray(structured.image) ? structured.image : [structured.image];
    photos = imgs.map((img: any) => img.url || img).filter(Boolean).slice(0, 50);
  }
  
  // Try OG image
  if (photos.length === 0 && og['og:image']) {
    photos.push(og['og:image']);
  }
  
  // Fallback to all image URLs
  if (photos.length < 3) {
    const allPhotos = extractPhotosFromHtml(html, photoPatterns);
    // Filter to likely listing photos (large URLs, not CDN assets)
    const filtered = allPhotos.filter(url => 
      url.length > 40 && 
      !url.includes('.css') && 
      !url.includes('.js') &&
      !url.includes('sprite') &&
      !url.includes('pixel')
    );
    photos.push(...filtered);
    photos = [...new Set(photos)].slice(0, 50);
  }
  
  // Detect brokerage from URL
  const hostname = new URL(url).hostname;
  let agentBrokerage = hostname.replace('www.', '').split('.')[0] || '';
  agentBrokerage = agentBrokerage.charAt(0).toUpperCase() + agentBrokerage.slice(1);
  
  return {
    ...addr,
    price: extractPrice(html, structured),
    beds: extractBeds(html, structured),
    baths: extractBaths(html, structured),
    sqft: extractSqft(html, structured),
    description: extractDescription(html, structured) || og['og:description'] || '',
    photos,
    agentBrokerage,
    platform: 'generic',
  };
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

const SCRAPERS: Record<string, ScraperFn> = {
  compass: scrapeCompass,
  zillow: scrapeZillow,
  redfin: scrapeRedfin,
  realtor: scrapeRealtor,
  realtor_ca: scrapeRealtorCa,
  // These platforms mostly share JSON-LD structure, use generic
  trulia: scrapeGeneric,
  coldwellbanker: scrapeGeneric,
  sothebys: scrapeGeneric,
  elliman: scrapeGeneric,
  theagency: scrapeGeneric,
  kw: scrapeGeneric,
  engelvolkers: scrapeGeneric,
  generic: scrapeGeneric,
};

/**
 * Scrape a listing from any supported platform
 */
export async function scrapeListing(url: string): Promise<ScrapedListing> {
  const platform = detectPlatform(url);
  const html = await fetchListingHtml(url);
  
  const scraper = SCRAPERS[platform] || scrapeGeneric;
  const result = scraper(url, html);
  
  if (!result.address && result.photos.length === 0) {
    throw new Error(`Could not extract listing data from ${platform}. The page may require JavaScript rendering.`);
  }
  
  return result;
}
