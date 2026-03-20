/**
 * SEO Pre-rendered Listing Page
 * 
 * Serves fully-rendered HTML for crawlers (Googlebot, social media previews).
 * The SPA handles the interactive experience for humans.
 * 
 * Usage: /api/seo/listing?id=1177-california-1210
 * 
 * Returns: Complete HTML page with:
 * - Schema.org RealEstateListing structured data
 * - Open Graph meta tags
 * - Full listing content (address, description, rooms, designs, agent)
 * - Canonical URL pointing to the SPA listing page
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqkoxfenyjomillmxawh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// Seed listing fallback
const SEED_LISTING = {
  id: '1177-california-1210',
  address: '1177 California Street, Unit 1210',
  city: 'San Francisco',
  state: 'CA',
  zip: '94108',
  price: 1750000,
  beds: 2,
  baths: 2,
  sqft: 1660,
  description: 'Perched high above Nob Hill in the iconic Gramercy Towers, this luxurious 2-bedroom, 2-bath sanctuary on the 12th floor offers sweeping views of Grace Cathedral, Huntington Park, and the Fairmont Hotel.',
  heroImage: '/showcase/original.jpg',
  agent: { name: 'John Macon', brokerage: 'Compass' },
  rooms: [
    { label: 'Living Room', designCount: 4 },
  ],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  if (!id) return res.status(400).send('Missing listing id');

  let listing: any = null;

  // Try Supabase
  const { data } = await supabase.from('listings').select('*').eq('id', id).single();
  if (data) {
    const { data: rooms } = await supabase.from('listing_rooms').select('id, label').eq('listing_id', id);
    const { data: designs } = await supabase.from('listing_designs').select('id, name, room_id').eq('listing_id', id);
    listing = {
      ...data,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip || '',
      price: data.price || 0,
      beds: data.beds || 0,
      baths: data.baths || 0,
      sqft: data.sqft || 0,
      description: data.description || '',
      heroImage: data.hero_image || '',
      agent: { name: data.agent_name || '', brokerage: data.agent_brokerage || '' },
      rooms: (rooms || []).map(r => ({
        label: r.label,
        designCount: (designs || []).filter(d => d.room_id === r.id).length,
        designNames: (designs || []).filter(d => d.room_id === r.id).map(d => d.name),
      })),
    };
  }

  // Fallback to seed
  if (!listing && id === '1177-california-1210') {
    listing = SEED_LISTING;
  }

  if (!listing) return res.status(404).send('Listing not found');

  const fullAddress = `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}`;
  const canonicalUrl = `https://room.institute/listing/${id}`;
  const ogImage = listing.heroImage?.startsWith('http') ? listing.heroImage : `https://room.institute${listing.heroImage}`;
  const title = `${listing.address} — Reimagined | ${listing.agent?.name ? `Listed by ${listing.agent.name}` : 'Room Institute'}`;
  const desc = `Explore AI-generated design possibilities for ${fullAddress}. ${listing.beds} bed, ${listing.baths} bath, ${listing.sqft?.toLocaleString()} sqft. ${listing.description?.slice(0, 150)}`;

  const totalDesigns = listing.rooms?.reduce((s: number, r: any) => s + (r.designCount || 0), 0) || 0;

  // Schema.org structured data
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.address,
    description: listing.description,
    url: canonicalUrl,
    image: ogImage,
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.state,
      postalCode: listing.zip,
      addressCountry: 'US',
    },
    offers: listing.price > 0 ? {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'USD',
    } : undefined,
    numberOfBedrooms: listing.beds,
    numberOfBathroomsTotal: listing.baths,
    floorSize: listing.sqft > 0 ? { '@type': 'QuantitativeValue', value: listing.sqft, unitText: 'sqft' } : undefined,
    ...(listing.agent?.name ? {
      broker: {
        '@type': 'RealEstateAgent',
        name: listing.agent.name,
        worksFor: listing.agent.brokerage ? { '@type': 'Organization', name: listing.agent.brokerage } : undefined,
      },
    } : {}),
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(desc)}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escHtml(title)}" />
  <meta property="og:description" content="${escHtml(desc)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${escHtml(ogImage)}" />
  <meta property="og:site_name" content="Room Institute" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escHtml(title)}" />
  <meta name="twitter:description" content="${escHtml(desc)}" />
  <meta name="twitter:image" content="${escHtml(ogImage)}" />

  <!-- Schema.org -->
  <script type="application/ld+json">${JSON.stringify(schema)}</script>

  <style>
    body { font-family: 'Georgia', serif; background: #0c0a09; color: #d6d3d1; margin: 0; padding: 0; }
    .container { max-width: 720px; margin: 0 auto; padding: 40px 24px; }
    h1 { font-size: 2rem; color: #fafaf9; margin-bottom: 8px; }
    .meta { color: #78716c; font-size: 0.875rem; margin-bottom: 24px; }
    .desc { line-height: 1.7; margin-bottom: 32px; }
    .agent { border-top: 1px solid #292524; padding-top: 20px; margin-bottom: 32px; }
    .rooms { border-top: 1px solid #292524; padding-top: 20px; }
    .room { margin-bottom: 16px; }
    .room h3 { color: #fafaf9; margin: 0 0 4px; font-size: 1rem; }
    .room p { color: #78716c; margin: 0; font-size: 0.875rem; }
    .cta { display: inline-block; margin-top: 32px; padding: 12px 32px; border: 1px solid #059669; color: #34d399; text-decoration: none; font-size: 0.875rem; letter-spacing: 0.1em; text-transform: uppercase; }
    .cta:hover { background: #059669; color: #0c0a09; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escHtml(listing.address)}</h1>
    <div class="meta">
      ${listing.city}, ${listing.state} ${listing.zip}
      ${listing.price > 0 ? ` — $${listing.price.toLocaleString()}` : ''}
      ${listing.beds > 0 ? ` · ${listing.beds} bed` : ''}
      ${listing.baths > 0 ? ` · ${listing.baths} bath` : ''}
      ${listing.sqft > 0 ? ` · ${listing.sqft.toLocaleString()} sqft` : ''}
    </div>

    <div class="desc">${escHtml(listing.description || '')}</div>

    ${listing.agent?.name ? `
    <div class="agent">
      <strong style="color:#fafaf9">Listed by ${escHtml(listing.agent.name)}</strong>
      ${listing.agent.brokerage ? `<br/><span style="color:#78716c">${escHtml(listing.agent.brokerage)}</span>` : ''}
    </div>
    ` : ''}

    <div class="rooms">
      <h2 style="font-size:1.25rem;color:#fafaf9;margin-bottom:16px">${totalDesigns} Design Directions across ${listing.rooms?.length || 0} Rooms</h2>
      ${(listing.rooms || []).map((r: any) => `
        <div class="room">
          <h3>${escHtml(r.label)}</h3>
          <p>${r.designCount || 0} design variations${r.designNames?.length ? ': ' + r.designNames.map((n: string) => escHtml(n)).join(', ') : ''}</p>
        </div>
      `).join('')}
    </div>

    <a class="cta" href="${canonicalUrl}">Explore This Listing</a>

    <p style="margin-top:48px;color:#44403c;font-size:0.75rem">
      Powered by <a href="https://room.institute" style="color:#059669">room.institute</a> — AI-powered interior design visualization
    </p>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).send(html);
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
