/**
 * Affiliate Link Generator
 * 
 * Generates search URLs for major furniture/decor retailers.
 * When Skimlinks is active, these URLs are automatically converted
 * to affiliate links with tracking.
 * 
 * Skimlinks covers: Amazon, Wayfair, West Elm, CB2, Crate & Barrel,
 * Pottery Barn, Restoration Hardware, AllModern, Joybird, Article,
 * Design Within Reach, 1stDibs, Chairish, and thousands more.
 */

interface RetailerLink {
  name: string;
  url: string;
  /** Priority for display (lower = shown first) */
  priority: number;
}

/**
 * Map product categories to the best retailers for that category
 */
const CATEGORY_RETAILERS: Record<string, string[]> = {
  furniture: ['wayfair', 'westelm', 'cb2', 'article', 'dwr'],
  lighting: ['ylighting', 'wayfair', 'westelm', 'cb2'],
  textiles: ['westelm', 'potterybarn', 'wayfair', 'serenaandlily'],
  decor: ['cb2', 'westelm', 'wayfair', 'onekingslane'],
  rugs: ['rugsusa', 'wayfair', 'westelm', 'serenaandlily'],
  hardware: ['rejuvenation', 'schoolhouse', 'wayfair'],
  plants: ['thesill', 'bloomscape'],
};

/**
 * Retailer URL templates
 */
const RETAILER_URLS: Record<string, { name: string; searchUrl: (q: string) => string }> = {
  wayfair: {
    name: 'Wayfair',
    searchUrl: (q) => `https://www.wayfair.com/keyword.php?keyword=${encodeURIComponent(q)}`,
  },
  westelm: {
    name: 'West Elm',
    searchUrl: (q) => `https://www.westelm.com/search?Ntt=${encodeURIComponent(q)}`,
  },
  cb2: {
    name: 'CB2',
    searchUrl: (q) => `https://www.cb2.com/search?query=${encodeURIComponent(q)}`,
  },
  article: {
    name: 'Article',
    searchUrl: (q) => `https://www.article.com/search?query=${encodeURIComponent(q)}`,
  },
  dwr: {
    name: 'Design Within Reach',
    searchUrl: (q) => `https://www.dwr.com/search?q=${encodeURIComponent(q)}`,
  },
  ylighting: {
    name: 'YLighting',
    searchUrl: (q) => `https://www.ylighting.com/search?q=${encodeURIComponent(q)}`,
  },
  potterybarn: {
    name: 'Pottery Barn',
    searchUrl: (q) => `https://www.potterybarn.com/search?Ntt=${encodeURIComponent(q)}`,
  },
  serenaandlily: {
    name: 'Serena & Lily',
    searchUrl: (q) => `https://www.serenaandlily.com/search?q=${encodeURIComponent(q)}`,
  },
  rugsusa: {
    name: 'Rugs USA',
    searchUrl: (q) => `https://www.rugsusa.com/rugsusa/control/search?query=${encodeURIComponent(q)}`,
  },
  rejuvenation: {
    name: 'Rejuvenation',
    searchUrl: (q) => `https://www.rejuvenation.com/search?Ntt=${encodeURIComponent(q)}`,
  },
  schoolhouse: {
    name: 'Schoolhouse',
    searchUrl: (q) => `https://www.schoolhouse.com/search?q=${encodeURIComponent(q)}`,
  },
  onekingslane: {
    name: 'One Kings Lane',
    searchUrl: (q) => `https://www.onekingslane.com/search?q=${encodeURIComponent(q)}`,
  },
  thesill: {
    name: 'The Sill',
    searchUrl: (q) => `https://www.thesill.com/search?q=${encodeURIComponent(q)}`,
  },
  bloomscape: {
    name: 'Bloomscape',
    searchUrl: (q) => `https://bloomscape.com/search/?q=${encodeURIComponent(q)}`,
  },
  amazon: {
    name: 'Amazon',
    searchUrl: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
  },
};

/**
 * Known design brands → their own websites (better for the design experience)
 * Skimlinks will auto-convert these to affiliate links if the brand participates
 */
const BRAND_DIRECT: Record<string, (q: string) => string> = {
  'herman miller': (q) => `https://www.hermanmiller.com/search/?q=${encodeURIComponent(q)}`,
  'knoll': (q) => `https://www.knoll.com/search?query=${encodeURIComponent(q)}`,
  'flos': (q) => `https://usa.flos.com/search?q=${encodeURIComponent(q)}`,
  'artemide': (q) => `https://www.artemide.com/en/search?q=${encodeURIComponent(q)}`,
  'hay': (q) => `https://www.hay.com/search?q=${encodeURIComponent(q)}`,
  'muuto': (q) => `https://www.muuto.com/search?q=${encodeURIComponent(q)}`,
  'restoration hardware': (q) => `https://rh.com/search?q=${encodeURIComponent(q)}`,
  'rh': (q) => `https://rh.com/search?q=${encodeURIComponent(q)}`,
  'cb2': (q) => `https://www.cb2.com/search?query=${encodeURIComponent(q)}`,
  'west elm': (q) => `https://www.westelm.com/search?Ntt=${encodeURIComponent(q)}`,
  'design within reach': (q) => `https://www.dwr.com/search?q=${encodeURIComponent(q)}`,
  'dwr': (q) => `https://www.dwr.com/search?q=${encodeURIComponent(q)}`,
  'serena & lily': (q) => `https://www.serenaandlily.com/search?q=${encodeURIComponent(q)}`,
  'serena and lily': (q) => `https://www.serenaandlily.com/search?q=${encodeURIComponent(q)}`,
  'article': (q) => `https://www.article.com/search?query=${encodeURIComponent(q)}`,
  'vitra': (q) => `https://www.vitra.com/en-us/search?q=${encodeURIComponent(q)}`,
  'fritz hansen': (q) => `https://fritzhansen.com/en/search?q=${encodeURIComponent(q)}`,
  'menu': (q) => `https://menuspace.com/search?q=${encodeURIComponent(q)}`,
  'tom dixon': (q) => `https://www.tomdixon.net/search?q=${encodeURIComponent(q)}`,
  'kartell': (q) => `https://www.kartell.com/search?q=${encodeURIComponent(q)}`,
  'ligne roset': (q) => `https://www.ligne-roset.com/us/search.htm?q=${encodeURIComponent(q)}`,
  'b&b italia': (q) => `https://www.bebitalia.com/en/search?q=${encodeURIComponent(q)}`,
  'cassina': (q) => `https://www.cassina.com/search?q=${encodeURIComponent(q)}`,
  'moooi': (q) => `https://www.moooi.com/search?q=${encodeURIComponent(q)}`,
  'louis poulsen': (q) => `https://www.louispoulsen.com/en-us/search?q=${encodeURIComponent(q)}`,
  'schoolhouse': (q) => `https://www.schoolhouse.com/search?q=${encodeURIComponent(q)}`,
  'rejuvenation': (q) => `https://www.rejuvenation.com/search?Ntt=${encodeURIComponent(q)}`,
  'pottery barn': (q) => `https://www.potterybarn.com/search?Ntt=${encodeURIComponent(q)}`,
  'crate & barrel': (q) => `https://www.crateandbarrel.com/search?query=${encodeURIComponent(q)}`,
  'crate and barrel': (q) => `https://www.crateandbarrel.com/search?query=${encodeURIComponent(q)}`,
  'ikea': (q) => `https://www.ikea.com/us/en/search/?q=${encodeURIComponent(q)}`,
  'bloomscape': (q) => `https://bloomscape.com/search/?q=${encodeURIComponent(q)}`,
  'the sill': (q) => `https://www.thesill.com/search?q=${encodeURIComponent(q)}`,
  'proven winners': (q) => `https://www.provenwinners.com/search?q=${encodeURIComponent(q)}`,
  'terrain': (q) => `https://www.shopterrain.com/search?q=${encodeURIComponent(q)}`,
};

/**
 * Get the best retailer search URL for a product
 * Strategy: brand's own site first (design-forward), category retailer as fallback
 */
export function getProductUrl(
  productName: string,
  brand?: string,
  category?: string
): string {
  // 1. Try brand's own website first — keeps the design experience premium
  if (brand) {
    const brandKey = brand.toLowerCase().trim();
    const directUrl = BRAND_DIRECT[brandKey];
    if (directUrl) {
      return directUrl(productName);
    }
  }
  
  // 2. Category-specific retailer that fits the aesthetic tier
  const searchQuery = brand ? `${brand} ${productName}` : productName;
  const retailers = (category && CATEGORY_RETAILERS[category]) || ['westelm', 'cb2'];
  const primaryRetailer = retailers[0] || 'westelm';
  
  const retailer = RETAILER_URLS[primaryRetailer];
  if (!retailer) {
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=shop`;
  }
  
  return retailer.searchUrl(searchQuery);
}

/**
 * Get multiple retailer links for a product (for a "Shop at" dropdown)
 */
export function getProductRetailerLinks(
  productName: string,
  brand?: string,
  category?: string,
  maxLinks: number = 3
): RetailerLink[] {
  const searchQuery = brand ? `${brand} ${productName}` : productName;
  const retailers = (category && CATEGORY_RETAILERS[category]) || ['wayfair', 'westelm', 'amazon'];
  
  return retailers.slice(0, maxLinks).map((key, i) => {
    const retailer = RETAILER_URLS[key];
    if (!retailer) {
      return {
        name: 'Google Shopping',
        url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=shop`,
        priority: i,
      };
    }
    return {
      name: retailer.name,
      url: retailer.searchUrl(searchQuery),
      priority: i,
    };
  });
}

/**
 * Get Google Shopping link as universal fallback
 */
export function getGoogleShoppingUrl(productName: string, brand?: string): string {
  const q = brand ? `${brand} ${productName}` : productName;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=shop`;
}
