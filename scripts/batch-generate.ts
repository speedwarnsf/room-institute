#!/usr/bin/env tsx
/**
 * Batch Design Generator
 * 
 * For each listing: scrape photos → label rooms → generate 5 designs per room
 * 
 * Usage:
 *   GEMINI_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/batch-generate.ts [--limit 13]
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqkoxfenyjomillmxawh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

if (!SUPABASE_KEY || !GEMINI_KEY) {
  console.error('❌ Set SUPABASE_SERVICE_ROLE_KEY and GEMINI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const limit = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || '13');

interface LabeledPhoto {
  url: string;
  roomType: string;
  confidence: number;
}

async function scrapePhotos(url: string): Promise<string[]> {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });
    const html = await resp.text();
    const photos = html.match(/https:\/\/ssl\.cdn-redfin\.com\/photo\/[^"'\s)]+\.(?:jpg|jpeg|webp)/gi) || [];
    return [...new Set(photos)].map(p => p.replace('mbpaddedwide', 'bigphoto').replace('genMid.', ''));
  } catch { return []; }
}

async function labelRoom(photoUrl: string): Promise<string> {
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'What room type is shown in this photo? Reply with ONLY one of: Living Room, Dining Room, Kitchen, Bedroom, Bathroom, Office, Hallway, Exterior, Terrace, View, Other. Just the label, nothing else.' },
              { inlineData: { mimeType: 'image/jpeg', data: '' } },
              { fileData: { fileUri: photoUrl, mimeType: 'image/jpeg' } },
            ]
          }],
        }),
      }
    );
    // Gemini can't fetch URLs directly in this mode — need to download and base64 encode
    return 'Unknown';
  } catch { return 'Unknown'; }
}

async function labelRoomFromUrl(photoUrl: string): Promise<string> {
  try {
    // Download the image first
    const imgResp = await fetch(photoUrl);
    const buffer = Buffer.from(await imgResp.arrayBuffer());
    const base64 = buffer.toString('base64');
    
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'What room type is shown in this photo? Reply with ONLY one of: Living Room, Dining Room, Kitchen, Bedroom, Master Bedroom, Bathroom, Office, Hallway, Exterior, Terrace, View, Other. Just the room type label, nothing else.' },
              { inlineData: { mimeType: 'image/jpeg', data: base64 } },
            ]
          }],
        }),
      }
    );
    
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Other';
    return text;
  } catch (e) {
    console.warn('  Label error:', (e as Error).message?.substring(0, 50));
    return 'Other';
  }
}

async function generateDesigns(photoUrl: string, roomType: string, listingAddress: string): Promise<any[]> {
  try {
    // Download image
    const imgResp = await fetch(photoUrl);
    const buffer = Buffer.from(await imgResp.arrayBuffer());
    const base64 = buffer.toString('base64');
    
    const prompt = `You are a world-class interior designer creating 5 distinct design directions for this ${roomType} at ${listingAddress}.

For each design, provide:
- name: 2-3 punchy words (no filler like "sanctuary" or "haven")
- description: 2-3 sentences describing the mood and approach
- frameworks: 2-3 from [Aesthetic Order, Human-Centric, Universal Design, Biophilic, Phenomenological]
- palette: 5 hex colors
- key_changes: 3-5 specific, actionable changes with material/finish details

Return ONLY valid JSON: { "designs": [{ "name": "...", "description": "...", "frameworks": [...], "palette": [...], "key_changes": [...] }, ...] }`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'image/jpeg', data: base64 } },
            ]
          }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );
    
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return parsed.designs || [];
  } catch (e) {
    console.warn('  Design gen error:', (e as Error).message?.substring(0, 80));
    return [];
  }
}

async function processListing(listing: any) {
  console.log(`\n📍 ${listing.address}, ${listing.city} (${listing.id})`);
  
  // Check if already has rooms
  const { data: existingRooms } = await supabase
    .from('listing_rooms')
    .select('id')
    .eq('listing_id', listing.id);
  
  if (existingRooms && existingRooms.length > 0) {
    console.log(`  ⏭️  Already has ${existingRooms.length} rooms, skipping`);
    return;
  }
  
  // 1. Scrape photos
  if (!listing.source_url) { console.log('  ❌ No source URL'); return; }
  const photos = await scrapePhotos(listing.source_url);
  console.log(`  📸 ${photos.length} photos scraped`);
  if (photos.length < 2) { console.log('  ❌ Not enough photos'); return; }
  
  // 2. Label rooms (sample up to 20 photos to save API calls)
  const sample = photos.slice(0, 20);
  const labeled: LabeledPhoto[] = [];
  
  for (let i = 0; i < sample.length; i++) {
    const roomType = await labelRoomFromUrl(sample[i]);
    labeled.push({ url: sample[i], roomType, confidence: 1 });
    process.stdout.write(`  🏷️  ${i + 1}/${sample.length}: ${roomType}\r`);
    await new Promise(r => setTimeout(r, 200)); // Rate limit
  }
  console.log(`  🏷️  Labeled ${labeled.length} photos`);
  
  // 3. Group by room, pick best per room (skip Exterior, View, Hallway, Other)
  const validRooms = ['Living Room', 'Dining Room', 'Kitchen', 'Bedroom', 'Master Bedroom', 'Bathroom', 'Office', 'Terrace'];
  const roomGroups: Record<string, string[]> = {};
  for (const photo of labeled) {
    if (!validRooms.includes(photo.roomType)) continue;
    if (!roomGroups[photo.roomType]) roomGroups[photo.roomType] = [];
    roomGroups[photo.roomType].push(photo.url);
  }
  
  const rooms = Object.entries(roomGroups);
  console.log(`  🏠 ${rooms.length} rooms identified: ${rooms.map(([r, p]) => `${r}(${p.length})`).join(', ')}`);
  
  if (rooms.length === 0) { console.log('  ❌ No valid rooms found'); return; }
  
  // 4. For each room: create DB entry + generate 5 designs
  for (const [roomType, roomPhotos] of rooms) {
    const bestPhoto = roomPhotos[0]; // First photo is usually the primary
    const roomId = `${listing.id}-${roomType.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Insert room
    await supabase.from('listing_rooms').upsert({
      id: roomId,
      listing_id: listing.id,
      label: roomType,
      original_photo: bestPhoto,
      thumbnail: bestPhoto,
    }, { onConflict: 'id' });
    
    // Generate designs
    console.log(`  🎨 Generating 5 designs for ${roomType}...`);
    const designs = await generateDesigns(bestPhoto, roomType, listing.address);
    
    if (designs.length === 0) {
      console.log(`  ⚠️  No designs generated for ${roomType}`);
      continue;
    }
    
    // Insert designs
    for (let i = 0; i < Math.min(designs.length, 5); i++) {
      const d = designs[i];
      const designId = `${roomId}-d${i + 1}`;
      await supabase.from('listing_designs').upsert({
        id: designId,
        listing_id: listing.id,
        room_id: roomId,
        name: d.name || `Design ${i + 1}`,
        description: d.description || '',
        frameworks: d.frameworks || [],
        design_seed: {
          mood: d.description || '',
          palette: d.palette || [],
          keyChanges: d.key_changes || [],
          key_changes: d.key_changes || [],
        },
      }, { onConflict: 'id' });
    }
    
    console.log(`  ✅ ${roomType}: ${Math.min(designs.length, 5)} designs created`);
    await new Promise(r => setTimeout(r, 500)); // Rate limit between rooms
  }
}

async function main() {
  console.log(`🏗️  Batch Design Generator — processing ${limit} listings\n`);
  
  const { data: listings } = await supabase
    .from('listings')
    .select('id, address, city, source_url')
    .eq('status', 'ready')
    .order('display_order')
    .limit(limit);
  
  if (!listings || listings.length === 0) {
    console.log('No listings found');
    return;
  }
  
  console.log(`Found ${listings.length} listings to process`);
  
  for (const listing of listings) {
    await processListing(listing);
  }
  
  // Summary
  const { count: roomCount } = await supabase.from('listing_rooms').select('*', { count: 'exact', head: true });
  const { count: designCount } = await supabase.from('listing_designs').select('*', { count: 'exact', head: true });
  
  console.log(`\n✨ Done! ${roomCount} rooms, ${designCount} designs total`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
