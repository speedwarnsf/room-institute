#!/usr/bin/env tsx
/**
 * Static SEO Page Generator
 * 
 * Runs at build time. Generates pre-rendered HTML files for each published listing.
 * Output: public/seo/listing/{id}/index.html
 * 
 * These are served as static files by Vercel — zero compute, instant SEO.
 * Google sees real content, not an empty SPA shell.
 * 
 * Usage:
 *   npx tsx scripts/generate-seo-pages.ts
 *   (or: npm run seo)
 */

import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://vqkoxfenyjomillmxawh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const BASE_URL = 'https://room.institute';
const OUTPUT_DIR = join(process.cwd(), 'public', 'seo');

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set. Run with: SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/generate-seo-pages.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// Seed listing (always generated)
const SEED_LISTINGS = [{
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
  rooms: [{ label: 'Living Room', designCount: 4, designNames: ['Charcoal & Brass', 'Soft Contemporary', 'Bold Navy', 'Pink Accents'] }],
}];

interface ListingData {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  description: string;
  heroImage: string;
  agent: { name: string; brokerage: string };
  rooms: Array<{ label: string; designCount: number; designNames: string[] }>;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function generateHTML(listing: ListingData): string {
  const fullAddress = `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}`;
  const canonicalUrl = `${BASE_URL}/listing/${listing.id}`;
  const ogImage = listing.heroImage?.startsWith('http') ? listing.heroImage : `${BASE_URL}${listing.heroImage}`;
  const agentCredit = listing.agent?.name ? ` | Listed by ${listing.agent.name}${listing.agent.brokerage ? `, ${listing.agent.brokerage}` : ''}` : '';
  const title = `${listing.address} — Reimagined${agentCredit}`;
  const desc = `Explore AI-generated design possibilities for ${fullAddress}. ${listing.beds} bed, ${listing.baths} bath${listing.sqft > 0 ? `, ${listing.sqft.toLocaleString()} sqft` : ''}. ${listing.description?.slice(0, 150)}`;
  const totalDesigns = listing.rooms.reduce((s, r) => s + r.designCount, 0);

  const schema = JSON.stringify({
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
    ...(listing.price > 0 ? { offers: { '@type': 'Offer', price: listing.price, priceCurrency: 'USD' } } : {}),
    numberOfBedrooms: listing.beds,
    numberOfBathroomsTotal: listing.baths,
    ...(listing.sqft > 0 ? { floorSize: { '@type': 'QuantitativeValue', value: listing.sqft, unitText: 'sqft' } } : {}),
    ...(listing.agent?.name ? {
      broker: {
        '@type': 'RealEstateAgent',
        name: listing.agent.name,
        ...(listing.agent.brokerage ? { worksFor: { '@type': 'Organization', name: listing.agent.brokerage } } : {}),
      },
    } : {}),
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta name="robots" content="index, follow" />

  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${esc(ogImage)}" />
  <meta property="og:site_name" content="Room Institute" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${esc(ogImage)}" />

  <script type="application/ld+json">${schema}</script>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Cormorant Garamond', Georgia, serif; background: #0c0a09; color: #d6d3d1; }
    .hero { position: relative; min-height: 60vh; display: flex; align-items: flex-end; overflow: hidden; }
    .hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.6; }
    .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, #0c0a09 0%, transparent 60%); }
    .hero-content { position: relative; max-width: 720px; margin: 0 auto; padding: 40px 24px; width: 100%; }
    h1 { font-size: 2.5rem; color: #fafaf9; line-height: 1.15; margin-bottom: 12px; font-weight: 400; }
    .address-meta { color: #78716c; font-size: 0.9rem; font-family: 'Nunito', sans-serif; margin-bottom: 8px; }
    .price { color: #34d399; font-size: 1.5rem; font-weight: 600; }
    .container { max-width: 720px; margin: 0 auto; padding: 40px 24px; }
    .section { border-top: 1px solid #292524; padding-top: 32px; margin-top: 32px; }
    .desc { line-height: 1.8; font-size: 1.05rem; color: #a8a29e; }
    .agent { display: flex; align-items: center; gap: 16px; }
    .agent-name { font-size: 1.1rem; color: #fafaf9; }
    .agent-brokerage { color: #78716c; font-size: 0.85rem; font-family: 'Nunito', sans-serif; }
    .rooms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 16px; }
    .room-card { border: 1px solid #292524; padding: 20px; }
    .room-card h3 { color: #fafaf9; font-size: 1.1rem; margin-bottom: 8px; }
    .room-card p { color: #78716c; font-size: 0.85rem; font-family: 'Nunito', sans-serif; line-height: 1.6; }
    .design-name { display: inline-block; border: 1px solid #292524; padding: 4px 10px; margin: 4px 4px 0 0; font-size: 0.75rem; color: #a8a29e; font-family: 'Nunito', sans-serif; }
    .cta { display: inline-block; margin-top: 40px; padding: 14px 40px; border: 1px solid #059669; color: #34d399; text-decoration: none; font-size: 0.85rem; letter-spacing: 0.15em; text-transform: uppercase; font-family: 'Nunito', sans-serif; transition: all 0.2s; }
    .cta:hover { background: #059669; color: #0c0a09; }
    .footer { text-align: center; padding: 48px 24px; }
    .footer a { color: #44403c; font-size: 0.75rem; text-decoration: none; font-family: 'Nunito', sans-serif; }
    .footer a:hover { color: #059669; }
    @media (max-width: 640px) { h1 { font-size: 1.75rem; } .price { font-size: 1.2rem; } }
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Nunito:wght@400;600&display=swap" rel="stylesheet" />
</head>
<body>
  <div class="hero">
    <img class="hero-img" src="${esc(ogImage)}" alt="${esc(fullAddress)}" />
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <h1>${esc(listing.address)}</h1>
      <div class="address-meta">${esc(listing.city)}, ${esc(listing.state)} ${esc(listing.zip)}</div>
      ${listing.price > 0 ? `<div class="price">$${listing.price.toLocaleString()}</div>` : ''}
      <div class="address-meta" style="margin-top:8px">
        ${listing.beds > 0 ? `${listing.beds} Bed` : ''}${listing.baths > 0 ? ` · ${listing.baths} Bath` : ''}${listing.sqft > 0 ? ` · ${listing.sqft.toLocaleString()} sqft` : ''}
      </div>
    </div>
  </div>

  <div class="container">
    <div class="desc">${esc(listing.description)}</div>

    ${listing.agent?.name ? `
    <div class="section">
      <div class="agent">
        <div>
          <div class="agent-name">${esc(listing.agent.name)}</div>
          ${listing.agent.brokerage ? `<div class="agent-brokerage">${esc(listing.agent.brokerage)}</div>` : ''}
        </div>
      </div>
    </div>
    ` : ''}

    <div class="section">
      <h2 style="font-size:1.3rem;color:#fafaf9;margin-bottom:4px">${totalDesigns} Design Possibilities</h2>
      <p style="color:#78716c;font-size:0.85rem;font-family:Nunito,sans-serif;margin-bottom:16px">across ${listing.rooms.length} room${listing.rooms.length !== 1 ? 's' : ''}</p>
      <div class="rooms-grid">
        ${listing.rooms.map(r => `
        <div class="room-card">
          <h3>${esc(r.label)}</h3>
          <p>${r.designCount} design direction${r.designCount !== 1 ? 's' : ''}</p>
          ${r.designNames.length > 0 ? `<div style="margin-top:8px">${r.designNames.map(n => `<span class="design-name">${esc(n)}</span>`).join('')}</div>` : ''}
        </div>
        `).join('')}
      </div>
    </div>

    <a class="cta" href="${canonicalUrl}">Explore This Listing</a>
  </div>

  <div class="footer">
    <a href="${BASE_URL}">room.institute</a> · AI-powered interior design visualization
  </div>

  <!-- Redirect to SPA for full interactive experience -->
  <script>
    if (!/bot|crawl|spider|slurp|archive/i.test(navigator.userAgent)) {
      window.location.replace('${canonicalUrl}');
    }
  </script>
</body>
</html>`;
}

async function main() {
  console.log('🏗️  Generating SEO pages...\n');

  // Fetch all published listings from Supabase
  const { data: dbListings, error } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'ready');

  if (error) {
    console.error('⚠️  Supabase error:', error.message, '— falling back to seed data only');
  }

  const allListings: ListingData[] = [...SEED_LISTINGS];

  // Process DB listings
  for (const raw of (dbListings || [])) {
    const { data: rooms } = await supabase
      .from('listing_rooms')
      .select('id, label')
      .eq('listing_id', raw.id);

    const { data: designs } = await supabase
      .from('listing_designs')
      .select('id, name, room_id')
      .in('room_id', (rooms || []).map(r => r.id));

    allListings.push({
      id: raw.id,
      address: raw.address || '',
      city: raw.city || '',
      state: raw.state || '',
      zip: raw.zip || '',
      price: raw.price || 0,
      beds: raw.beds || 0,
      baths: raw.baths || 0,
      sqft: raw.sqft || 0,
      description: raw.description || '',
      heroImage: raw.hero_image || '',
      agent: { name: raw.agent_name || '', brokerage: raw.agent_brokerage || '' },
      rooms: (rooms || []).map(r => ({
        label: r.label,
        designCount: (designs || []).filter(d => d.room_id === r.id).length,
        designNames: (designs || []).filter(d => d.room_id === r.id).map(d => d.name).filter(Boolean),
      })),
    });
  }

  // Generate pages
  let count = 0;
  for (const listing of allListings) {
    const dir = join(OUTPUT_DIR, 'listing', listing.id);
    mkdirSync(dir, { recursive: true });

    const html = generateHTML(listing);
    writeFileSync(join(dir, 'index.html'), html, 'utf-8');
    count++;

    const totalDesigns = listing.rooms.reduce((s, r) => s + r.designCount, 0);
    console.log(`  ✅ ${listing.address} — ${listing.rooms.length} rooms, ${totalDesigns} designs`);
  }

  // Generate sitemap
  const sitemapDir = join(process.cwd(), 'public');
  const sitemapUrls = [
    `  <url><loc>${BASE_URL}</loc><priority>1.0</priority><changefreq>weekly</changefreq></url>`,
    `  <url><loc>${BASE_URL}/for/agencies</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>`,
    ...allListings.map(l => 
      `  <url><loc>${BASE_URL}/listing/${l.id}</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>`
    ),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>`;
  writeFileSync(join(sitemapDir, 'sitemap.xml'), sitemap, 'utf-8');

  console.log(`\n✨ Generated ${count} SEO pages + sitemap.xml`);
  console.log(`   Output: ${OUTPUT_DIR}/listing/*/index.html`);
  console.log(`   Sitemap: public/sitemap.xml`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
