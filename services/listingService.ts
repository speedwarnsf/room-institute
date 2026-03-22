import { Listing, ListingRoom } from '../types';
import { SEED_LISTINGS } from './listingData';
import { supabase } from './auth';

/**
 * Get a listing by ID
 * Tries Supabase first, falls back to seed data
 */
export async function getListingById(id: string): Promise<Listing | null> {
  // Try Supabase first
  try {
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single();

    if (listingError || !listingData) {
      // Fall back to seed data
      return SEED_LISTINGS.find(listing => listing.id === id) || null;
    }

    // Fetch rooms
    const { data: roomsData, error: roomsError } = await supabase
      .from('listing_rooms')
      .select('*')
      .eq('listing_id', id);

    if (roomsError || !roomsData) {
      // Fall back to seed data
      return SEED_LISTINGS.find(listing => listing.id === id) || null;
    }

    // Fetch designs for all rooms
    const roomIds = roomsData.map(r => r.id);
    const { data: designsData, error: designsError } = await supabase
      .from('listing_designs')
      .select('*')
      .in('room_id', roomIds)
      .order('created_at', { ascending: true });

    if (designsError) {
      // Continue without designs
    }

    // Assemble the listing
    const rooms: ListingRoom[] = roomsData.map(roomRow => ({
      id: roomRow.id,
      label: roomRow.label,
      originalPhoto: roomRow.original_photo,
      thumbnail: roomRow.thumbnail || roomRow.original_photo,
      designable: roomRow.designable !== false,
      designs: (designsData || [])
        .filter(d => d.room_id === roomRow.id)
        .map(designRow => {
          const seed = designRow.design_seed || {};
          return {
            id: designRow.id,
            name: designRow.name,
            description: designRow.description || '',
            imageUrl: designRow.image_url,
            thumbnailUrl: designRow.thumbnail_url || designRow.image_url,
            frameworks: designRow.frameworks || [],
            palette: seed.palette || [],
            products: seed.products || [],
          };
        })
    }));

    const listing: Listing & { status: string } = {
      id: listingData.id,
      address: listingData.address,
      city: listingData.city,
      state: listingData.state,
      zip: listingData.zip || '',
      price: listingData.price || 0,
      beds: listingData.beds || 0,
      baths: listingData.baths || 0,
      sqft: listingData.sqft || 0,
      description: listingData.description || '',
      heroImage: listingData.hero_image || rooms[0]?.originalPhoto || '',
      sourceUrl: listingData.source_url || '',
      agent: {
        name: listingData.agent_name || 'Agent',
        brokerage: listingData.agent_brokerage || 'Compass',
        photo: listingData.agent_photo
      },
      rooms,
      createdAt: new Date(listingData.created_at).getTime(),
      status: listingData.status || 'pending'
    };

    return listing;
  } catch (error) {
    console.error('Error fetching listing from Supabase:', error);
    // Fall back to seed data
    return SEED_LISTINGS.find(listing => listing.id === id) || null;
  }
}

/**
 * Get a specific room from a listing
 */
export async function getListingRoom(listingId: string, roomId: string): Promise<ListingRoom | null> {
  const listing = await getListingById(listingId);
  if (!listing) return null;
  return listing.rooms.find(room => room.id === roomId) || null;
}
