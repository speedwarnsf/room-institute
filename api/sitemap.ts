/**
 * Dynamic Sitemap Generator
 * 
 * GET /api/sitemap → XML sitemap of all published listings
 * Also accessible as /sitemap.xml via Vercel rewrite
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqkoxfenyjomillmxawh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BASE_URL = 'https://room.institute';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { data: listings } = await supabase
    .from('listings')
    .select('id, updated_at')
    .eq('status', 'ready');

  const { data: rooms } = await supabase
    .from('listing_rooms')
    .select('id, listing_id, updated_at');

  const urls: Array<{ loc: string; lastmod?: string; priority: string; changefreq: string }> = [
    // Homepage
    { loc: BASE_URL, priority: '1.0', changefreq: 'weekly' },
    // Static pages
    { loc: `${BASE_URL}/for/agencies`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${BASE_URL}/agent/onboard`, priority: '0.7', changefreq: 'monthly' },
  ];

  // Seed listing
  urls.push({
    loc: `${BASE_URL}/listing/1177-california-1210`,
    priority: '0.9',
    changefreq: 'weekly',
  });

  // DB listings
  for (const listing of (listings || [])) {
    urls.push({
      loc: `${BASE_URL}/listing/${listing.id}`,
      lastmod: listing.updated_at ? new Date(listing.updated_at).toISOString().split('T')[0] : undefined,
      priority: '0.9',
      changefreq: 'weekly',
    });

    // Room pages
    const listingRooms = (rooms || []).filter(r => r.listing_id === listing.id);
    for (const room of listingRooms) {
      urls.push({
        loc: `${BASE_URL}/listing/${listing.id}/room/${room.id}`,
        lastmod: room.updated_at ? new Date(room.updated_at).toISOString().split('T')[0] : undefined,
        priority: '0.7',
        changefreq: 'weekly',
      });
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(xml);
}
