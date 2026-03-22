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
  furniture: ['dwr', 'cb2', 'article', 'westelm'],
  lighting: ['ylighting', 'dwr', 'cb2'],
  textiles: ['serenaandlily', 'westelm', 'potterybarn'],
  decor: ['cb2', 'onekingslane', 'westelm'],
  rugs: ['serenaandlily', 'westelm', 'rugsusa'],
  hardware: ['rejuvenation', 'schoolhouse'],
  plants: ['thesill', 'bloomscape', 'terrain'],
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
  'poliform': (q) => `https://www.poliform.it/en/search?q=${encodeURIComponent(q)}`,
  'minotti': (q) => `https://www.minotti.com/en/search?q=${encodeURIComponent(q)}`,
  'molteni': (q) => `https://www.molteni.it/en/search?q=${encodeURIComponent(q)}`,
  'molteni&c': (q) => `https://www.molteni.it/en/search?q=${encodeURIComponent(q)}`,
  'gubi': (q) => `https://www.gubi.com/en/search?q=${encodeURIComponent(q)}`,
  '&tradition': (q) => `https://www.andtradition.com/search?q=${encodeURIComponent(q)}`,
  'and tradition': (q) => `https://www.andtradition.com/search?q=${encodeURIComponent(q)}`,
  'apparatus': (q) => `https://www.apparatusstudio.com/search?q=${encodeURIComponent(q)}`,
  'roll & hill': (q) => `https://www.rollandhill.com/search?q=${encodeURIComponent(q)}`,
  'lindsey adelman': (q) => `https://www.lindseyadelman.com/search?q=${encodeURIComponent(q)}`,
  'workstead': (q) => `https://workstead.com/search?q=${encodeURIComponent(q)}`,
  'edra': (q) => `https://www.edra.com/en/search?q=${encodeURIComponent(q)}`,
  'moroso': (q) => `https://www.moroso.it/en/search?q=${encodeURIComponent(q)}`,
  'de padova': (q) => `https://www.depadova.com/en/search?q=${encodeURIComponent(q)}`,
  '1stdibs': (q) => `https://www.1stdibs.com/search/?q=${encodeURIComponent(q)}`,
  'the invisible collection': (q) => `https://www.theinvisiblecollection.com/en/search?q=${encodeURIComponent(q)}`,
  'louis poulsen': (q) => `https://www.louispoulsen.com/en-us/search?q=${encodeURIComponent(q)}`,
  'cc-tapis': (q) => `https://www.cc-tapis.com/search?q=${encodeURIComponent(q)}`,
  'nanimarquina': (q) => `https://www.nanimarquina.com/search?q=${encodeURIComponent(q)}`,
  'maharam': (q) => `https://www.maharam.com/search?q=${encodeURIComponent(q)}`,
  'kvadrat': (q) => `https://www.kvadrat.dk/en/search?q=${encodeURIComponent(q)}`,
  'holly hunt': (q) => `https://www.hollyhunt.com/search?q=${encodeURIComponent(q)}`,
  'donghia': (q) => `https://www.donghia.com/search?q=${encodeURIComponent(q)}`,
  'flexform': (q) => `https://www.flexform.it/en/search?q=${encodeURIComponent(q)}`,
  'meridiani': (q) => `https://www.meridiani.it/en/search?q=${encodeURIComponent(q)}`,
  'baxter': (q) => `https://www.bafrfrter.it/en/search?q=${encodeURIComponent(q)}`,
  'de la espada': (q) => `https://www.delaespada.com/search?q=${encodeURIComponent(q)}`,
  'bocci': (q) => `https://www.bocci.com/search?q=${encodeURIComponent(q)}`,
  'foscarini': (q) => `https://www.foscarini.com/en/search?q=${encodeURIComponent(q)}`,
  'jan kath': (q) => `https://www.jankath.com/search?q=${encodeURIComponent(q)}`,
  'tai ping': (q) => `https://www.taipingcarpets.com/search?q=${encodeURIComponent(q)}`,
  'fort street studio': (q) => `https://www.fortstreetstudio.com/search?q=${encodeURIComponent(q)}`,
  'dedar': (q) => `https://www.dedar.com/search?q=${encodeURIComponent(q)}`,
  'pierre frey': (q) => `https://www.pierrefrey.com/en/search?q=${encodeURIComponent(q)}`,
  'de le cuona': (q) => `https://www.delecuona.com/search?q=${encodeURIComponent(q)}`,
  'rubelli': (q) => `https://www.rubelli.com/en/search?q=${encodeURIComponent(q)}`,
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
  // Ultra-luxury furniture
  'christian liaigre': (q) => `https://www.christianliaigre.fr/en/search?q=${encodeURIComponent(q)}`,
  'promemoria': (q) => `https://www.promemoria.com/search?q=${encodeURIComponent(q)}`,
  'giorgetti': (q) => `https://www.giorgettimeda.com/en/search?q=${encodeURIComponent(q)}`,
  'turri': (q) => `https://www.turri.it/en/search?q=${encodeURIComponent(q)}`,
  'visionnaire': (q) => `https://www.visionnaire-home.com/search?q=${encodeURIComponent(q)}`,
  'boca do lobo': (q) => `https://www.bocadolobo.com/en/search/?s=${encodeURIComponent(q)}`,
  'christopher guy': (q) => `https://www.christopherguy.com/search?q=${encodeURIComponent(q)}`,
  'baker furniture': (q) => `https://www.bakerfurniture.com/search?q=${encodeURIComponent(q)}`,
  'baker': (q) => `https://www.bakerfurniture.com/search?q=${encodeURIComponent(q)}`,
  'henredon': (q) => `https://www.henredon.com/search?q=${encodeURIComponent(q)}`,
  // Luxury fashion houses — home collections
  'ralph lauren home': (q) => `https://www.ralphlaurenhome.com/search?q=${encodeURIComponent(q)}`,
  'armani casa': (q) => `https://www.armani.com/en-us/armani-casa?q=${encodeURIComponent(q)}`,
  'fendi casa': (q) => `https://www.fendi.com/us-en/fendi-casa/search?q=${encodeURIComponent(q)}`,
  'versace home': (q) => `https://www.versace.com/us/en/home-collection/?q=${encodeURIComponent(q)}`,
  'hermes home': (q) => `https://www.hermes.com/us/en/search/?s=${encodeURIComponent(q)}`,
  'hermès home': (q) => `https://www.hermes.com/us/en/search/?s=${encodeURIComponent(q)}`,
  'hermès': (q) => `https://www.hermes.com/us/en/search/?s=${encodeURIComponent(q)}`,
  'bottega veneta': (q) => `https://www.bottegaveneta.com/en-us/search?q=${encodeURIComponent(q)}`,
  'brunello cucinelli': (q) => `https://shop.brunellocucinelli.com/en-us/search?q=${encodeURIComponent(q)}`,
  'loro piana': (q) => `https://us.loropiana.com/en/search?q=${encodeURIComponent(q)}`,
  // Collectible design galleries
  'galerie kreo': (q) => `https://www.galeriekreo.com/search?q=${encodeURIComponent(q)}`,
  'carpenters workshop gallery': (q) => `https://www.carpentersworkshopgallery.com/search?q=${encodeURIComponent(q)}`,
  'r & company': (q) => `https://www.r-and-company.com/search?q=${encodeURIComponent(q)}`,
  'r and company': (q) => `https://www.r-and-company.com/search?q=${encodeURIComponent(q)}`,
  'nilufar gallery': (q) => `https://www.nilufar.com/search?q=${encodeURIComponent(q)}`,
  'nilufar': (q) => `https://www.nilufar.com/search?q=${encodeURIComponent(q)}`,
  'david gill gallery': (q) => `https://www.davidgillgallery.com/search?q=${encodeURIComponent(q)}`,
  'gagosian': (q) => `https://gagosian.com/search/?q=${encodeURIComponent(q)}`,
  // Luxury textiles & wallcovering
  'schumacher': (q) => `https://www.fschumacher.com/search?q=${encodeURIComponent(q)}`,
  'jim thompson': (q) => `https://www.jimthompsonfabrics.com/search?q=${encodeURIComponent(q)}`,
  'fortuny': (q) => `https://www.fortuny.com/search?q=${encodeURIComponent(q)}`,
  'holland & sherry': (q) => `https://www.hollandandsherry.com/search?q=${encodeURIComponent(q)}`,
  'holland and sherry': (q) => `https://www.hollandandsherry.com/search?q=${encodeURIComponent(q)}`,
  'fromental': (q) => `https://www.fromental.co.uk/search?q=${encodeURIComponent(q)}`,
  'de gournay': (q) => `https://www.degournay.com/search?q=${encodeURIComponent(q)}`,
  'gracie': (q) => `https://www.graciestudio.com/search?q=${encodeURIComponent(q)}`,
  // Luxury bath & fixtures
  'ann sacks': (q) => `https://www.annsacks.com/search?q=${encodeURIComponent(q)}`,
  'waterworks': (q) => `https://www.waterworks.com/search?q=${encodeURIComponent(q)}`,
  'dornbracht': (q) => `https://www.dornbracht.com/en-us/search?q=${encodeURIComponent(q)}`,
  'lefroy brooks': (q) => `https://www.lefroybrooks.com/search?q=${encodeURIComponent(q)}`,
  // Additional luxury lighting
  'hervé van der straeten': (q) => `https://www.hervevanderstraeten.fr/search?q=${encodeURIComponent(q)}`,
  'herve van der straeten': (q) => `https://www.hervevanderstraeten.fr/search?q=${encodeURIComponent(q)}`,
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
