import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Check, X, Star, GripVertical, Trash2, RefreshCw, Eye,
  ArrowLeft, Loader2, QrCode, Download
} from 'lucide-react';
import GlobalTypeset from './GlobalTypeset';
import { createClient } from '@supabase/supabase-js';

import { supabase } from '../services/auth';
import { useI18n } from '../i18n/I18nContext';

interface Design {
  id: string;
  name: string;
  description: string;
  image_url: string;
  thumbnail_url: string;
  frameworks: string[];
  is_curated: boolean;
  display_order: number | null;
}

interface Room {
  id: string;
  label: string;
  original_photo: string;
  thumbnail: string;
  status: string;
  designs: Design[];
}

interface Listing {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status: string;
  hero_image: string;
  agent_name: string;
  agent_brokerage: string;
}

interface DesignState {
  approved: boolean;
  order: number;
  isHero: boolean;
}

export function ListingManage() {
  const { t, locale } = useI18n();
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();

  const [listing, setListing] = useState<Listing | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  // Track design states per room
  const [designStates, setDesignStates] = useState<Record<string, Record<string, DesignState>>>({});
  const [heroImage, setHeroImage] = useState<string>('');

  // Publishing state
  const [publishing, setPublishing] = useState(false);
  const [regeneratingRoomId, setRegeneratingRoomId] = useState<string | null>(null);
  const [generatingCount, setGeneratingCount] = useState(0);

  // QR code state
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrCodes, setQRCodes] = useState<{
    houseQR?: { url: string; qrUrl: string };
    roomQRs?: Array<{ roomId: string; roomType: string; url: string; qrUrl: string }>;
  } | null>(null);

  useEffect(() => {
    if (!listingId) {
      setLoading(false);
      return;
    }

    loadData();
  }, [listingId]);

  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Nunito:wght@300;400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  async function loadData() {
    if (!listingId) return;

    try {
      // Fetch listing
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (listingError || !listingData) {
        console.error('Failed to load listing:', listingError);
        setLoading(false);
        return;
      }

      setListing(listingData);
      setHeroImage(listingData.hero_image || '');

      // Fetch rooms (excluding hidden)
      const { data: roomsData, error: roomsError } = await supabase
        .from('listing_rooms')
        .select('*')
        .eq('listing_id', listingId)
        .neq('status', 'hidden')
        .order('created_at', { ascending: true });

      if (roomsError || !roomsData) {
        console.error('Failed to load rooms:', roomsError);
        setLoading(false);
        return;
      }

      // Fetch all designs
      const roomIds = roomsData.map(r => r.id);
      const { data: designsData, error: designsError } = await supabase
        .from('listing_designs')
        .select('*')
        .in('room_id', roomIds)
        .order('created_at', { ascending: true });

      if (designsError) {
        console.error('Failed to load designs:', designsError);
      }

      // Assemble rooms with designs
      const roomsWithDesigns: Room[] = roomsData.map(room => ({
        id: room.id,
        label: room.label,
        original_photo: room.original_photo,
        thumbnail: room.thumbnail || room.original_photo,
        status: room.status,
        designs: (designsData || [])
          .filter(d => d.room_id === room.id)
          .map(d => ({
            id: d.id,
            name: d.name,
            description: d.description || '',
            image_url: d.image_url,
            thumbnail_url: d.thumbnail_url || d.image_url,
            frameworks: d.frameworks || [],
            is_curated: d.is_curated || false,
            display_order: d.display_order
          }))
      }));

      setRooms(roomsWithDesigns);

      // Initialize design states from existing data
      const initialStates: Record<string, Record<string, DesignState>> = {};
      roomsWithDesigns.forEach(room => {
        initialStates[room.id] = {};
        room.designs.forEach((design, index) => {
          initialStates[room.id][design.id] = {
            approved: design.is_curated,
            order: design.display_order ?? index,
            isHero: false
          };
        });
      });
      setDesignStates(initialStates);

      setLoading(false);

      // Auto-trigger design generation for rooms that need it
      const pendingRooms = roomsWithDesigns.filter(
        r => r.status === 'generating' && r.designs.length === 0
      );
      if (pendingRooms.length > 0) {
        setGeneratingCount(pendingRooms.length);
        // Generate designs sequentially to avoid overloading
        for (const room of pendingRooms) {
          try {
            setRegeneratingRoomId(room.id);
            const response = await fetch('/api/listings/regenerate-room', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ listingId, roomId: room.id, locale })
            });
            if (response.ok) {
              setGeneratingCount(prev => prev - 1);
            }
          } catch (error) {
            console.error(`Failed to generate designs for ${room.label}:`, error);
          }
        }
        setRegeneratingRoomId(null);
        // Reload data to pick up new designs
        loadData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  }

  function toggleDesignApproval(roomId: string, designId: string) {
    setDesignStates(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [designId]: {
          ...prev[roomId][designId],
          approved: !prev[roomId][designId].approved
        }
      }
    }));
  }

  function setDesignAsHero(roomId: string, designId: string, imageUrl: string) {
    // Clear all other hero flags
    const newStates = { ...designStates };
    Object.keys(newStates).forEach(rId => {
      Object.keys(newStates[rId]).forEach(dId => {
        newStates[rId][dId].isHero = false;
      });
    });
    // Set this one as hero
    newStates[roomId][designId].isHero = true;
    setDesignStates(newStates);
    setHeroImage(imageUrl);
  }

  async function removeRoom(roomId: string) {
    if (!confirm('Remove this room? It will be hidden from the listing.')) {
      return;
    }

    try {
      await supabase
        .from('listing_rooms')
        .update({ status: 'hidden' })
        .eq('id', roomId);

      // Remove from local state
      setRooms(prev => prev.filter(r => r.id !== roomId));
    } catch (error) {
      console.error('Failed to remove room:', error);
      alert('Failed to remove room');
    }
  }

  async function regenerateRoom(roomId: string) {
    if (!confirm('Regenerate all designs for this room? This will delete existing designs.')) {
      return;
    }

    setRegeneratingRoomId(roomId);

    try {
      const response = await fetch('/api/listings/regenerate-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, roomId, locale })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate room');
      }

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Failed to regenerate room:', error);
      alert('Failed to regenerate designs');
    } finally {
      setRegeneratingRoomId(null);
    }
  }

  async function saveRoomLabel(roomId: string, newLabel: string) {
    try {
      await supabase
        .from('listing_rooms')
        .update({ label: newLabel })
        .eq('id', roomId);

      // Update local state
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, label: newLabel } : r));
      setEditingRoomId(null);
    } catch (error) {
      console.error('Failed to save room label:', error);
      alert('Failed to save label');
    }
  }

  async function generateQRCodes() {
    if (!listingId) return;
    setGeneratingQR(true);
    try {
      const response = await fetch('/api/listings/qrcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setQRCodes({
        houseQR: data.houseQR,
        roomQRs: data.roomQRs,
      });
    } catch (err: any) {
      console.error('QR generation failed:', err);
      alert('Failed to generate QR codes: ' + err.message);
    } finally {
      setGeneratingQR(false);
    }
  }

  async function publishListing() {
    // Validate at least one design approved per visible room
    const allRoomsHaveApprovedDesigns = rooms.every(room => {
      const roomDesigns = designStates[room.id] || {};
      return Object.values(roomDesigns).some(state => state.approved);
    });

    if (!allRoomsHaveApprovedDesigns) {
      alert('Each room must have at least one approved design before publishing.');
      return;
    }

    setPublishing(true);

    try {
      // Collect approved designs with their order
      const approvedDesigns: Array<{ id: string; order: number }> = [];
      Object.keys(designStates).forEach(roomId => {
        Object.keys(designStates[roomId]).forEach(designId => {
          const state = designStates[roomId][designId];
          if (state.approved) {
            approvedDesigns.push({ id: designId, order: state.order });
          }
        });
      });

      const response = await fetch('/api/listings/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          approvedDesigns,
          heroImage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to publish listing');
      }

      const result = await response.json();

      // Navigate to the public listing page
      navigate(`/listing/${listingId}`);
    } catch (error) {
      console.error('Failed to publish listing:', error);
      alert('Failed to publish listing');
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-stone-400">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-stone-200 mb-4">Listing Not Found</h1>
          <p className="text-stone-400">This listing could not be located.</p>
        </div>
      </div>
    );
  }

  const allRoomsHaveApprovedDesigns = rooms.every(room => {
    const roomDesigns = designStates[room.id] || {};
    return Object.values(roomDesigns).some(state => state.approved);
  });

  return (
    <div className="min-h-screen bg-stone-900" style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', lineHeight: '1.5' }}>
      <GlobalTypeset />

      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-950 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(`/listing/${listingId}`)}
              className="flex items-center gap-2 text-stone-400 hover:text-emerald-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Listing
            </button>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 text-xs font-medium tracking-wide uppercase ${
                listing.status === 'review' ? 'bg-emerald-950 text-emerald-200' : 'bg-green-900 text-green-300'
              }`}>
                {listing.status}
              </div>
            </div>
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold text-stone-100 mb-2"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Manage Listing
          </h1>
          <p className="text-stone-300 text-lg">
            {listing.address}, {listing.city}, {listing.state} {listing.zip}
          </p>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-stone-400 text-sm mt-2">
            {listing.price > 0 && <div>${listing.price.toLocaleString()}</div>}
            {listing.beds > 0 && <div>{listing.beds} bed</div>}
            {listing.baths > 0 && <div>{listing.baths} bath</div>}
            {listing.sqft > 0 && <div>{listing.sqft.toLocaleString()} sqft</div>}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Agent Branding Preview */}
        <div className="mb-12 bg-stone-950 border border-stone-800 p-6">
          <h2
            className="text-2xl font-bold text-stone-100 mb-4"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Agent Branding
          </h2>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-stone-200 font-medium">{listing.agent_name || 'Agent Name'}</div>
              <div className="text-stone-500 text-sm">{listing.agent_brokerage || 'Brokerage'}</div>
            </div>
          </div>
        </div>

        {/* Hero Image Selector */}
        <div className="mb-12 bg-stone-950 border border-stone-800 p-6">
          <h2
            className="text-2xl font-bold text-stone-100 mb-4"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Hero Image
          </h2>
          {heroImage ? (
            <div className="border border-stone-700">
              <img src={heroImage} alt="Hero" className="w-full h-64 object-cover" />
            </div>
          ) : (
            <p className="text-stone-400">Star a design to set as hero image</p>
          )}
        </div>

        {/* Rooms Grid */}
        <h2
          className="text-3xl font-bold text-stone-100 mb-6"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Rooms ({rooms.length})
        </h2>

        <div className="space-y-6">
          {rooms.map(room => {
            const isExpanded = expandedRoomId === room.id;
            const isEditing = editingRoomId === room.id;
            const roomDesignStates = designStates[room.id] || {};
            const approvedCount = Object.values(roomDesignStates).filter(s => s.approved).length;

            return (
              <div key={room.id} className="bg-stone-950 border border-stone-800">
                {/* Room Header */}
                <div className="p-4 md:p-6 border-b border-stone-800">
                  <div className="flex flex-col gap-3">
                    <div>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editLabel}
                            onChange={e => setEditLabel(e.target.value)}
                            className="flex-1 px-3 py-1 bg-stone-900 border border-stone-700 text-stone-200 focus:border-emerald-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => saveRoomLabel(room.id, editLabel)}
                            className="p-2 bg-emerald-500 text-stone-900 hover:bg-emerald-400 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingRoomId(null)}
                            className="p-2 bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <h3
                          className="text-xl md:text-2xl font-bold text-stone-100 mb-1 cursor-pointer hover:text-emerald-500 transition-colors"
                          style={{ fontFamily: 'Cormorant Garamond, serif' }}
                          onClick={() => {
                            setEditLabel(room.label);
                            setEditingRoomId(room.id);
                          }}
                        >
                          {room.label}
                        </h3>
                      )}
                      <p className="text-stone-400 text-sm">
                        {room.designs.length} designs • {approvedCount} approved
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedRoomId(isExpanded ? null : room.id)}
                        className="flex-1 md:flex-none px-4 py-2 bg-stone-800 text-stone-200 hover:bg-stone-700 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </button>
                      <button
                        onClick={() => regenerateRoom(room.id)}
                        disabled={regeneratingRoomId === room.id}
                        className="p-2 bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors disabled:opacity-50"
                        title={t('rooms.regenerateAll')}
                      >
                        {regeneratingRoomId === room.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => removeRoom(room.id)}
                        className="p-2 bg-stone-800 text-red-400 hover:bg-stone-700 transition-colors"
                        title={t('rooms.removeRoom')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Original Photo */}
                  <div className="mt-4">
                    <div className="text-emerald-500 text-xs font-medium tracking-wide mb-2 uppercase">
                      Original
                    </div>
                    <img
                      src={room.original_photo}
                      alt={room.label}
                      className="w-full h-48 object-cover border border-stone-700"
                    />
                  </div>
                </div>

                {/* Designs Grid (when expanded) */}
                {isExpanded && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {room.designs.map(design => {
                        const state = roomDesignStates[design.id] || { approved: false, order: 0, isHero: false };

                        return (
                          <div
                            key={design.id}
                            className={`border ${state.approved ? 'border-emerald-500' : 'border-stone-700'} bg-stone-900`}
                          >
                            {/* Design Image */}
                            <div className="relative">
                              <img
                                src={design.image_url}
                                alt={design.name}
                                className="w-full h-48 object-cover"
                              />
                              {/* Hero Star Overlay */}
                              <button
                                onClick={() => setDesignAsHero(room.id, design.id, design.image_url)}
                                className={`absolute top-2 right-2 p-2 ${
                                  state.isHero ? 'bg-emerald-500 text-stone-900' : 'bg-stone-900/80 text-stone-400'
                                } hover:bg-emerald-500 hover:text-stone-900 transition-colors`}
                                title={t('rooms.setHero')}
                              >
                                <Star className="w-4 h-4" fill={state.isHero ? 'currentColor' : 'none'} />
                              </button>
                            </div>

                            {/* Design Info */}
                            <div className="p-4">
                              <h4 className="text-lg font-bold text-stone-100 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                                {design.name}
                              </h4>
                              <p className="text-stone-400 text-sm mb-3 line-clamp-2">
                                {design.description}
                              </p>

                              {/* Approve/Reject Toggle */}
                              <button
                                onClick={() => toggleDesignApproval(room.id, design.id)}
                                className={`w-full py-2 font-medium transition-colors ${
                                  state.approved
                                    ? 'bg-emerald-500 text-stone-900 hover:bg-emerald-400'
                                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                                }`}
                              >
                                {state.approved ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <Check className="w-4 h-4" />
                                    Approved
                                  </span>
                                ) : (
                                  'Approve'
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-12 flex flex-wrap gap-4 justify-end">
          <button
            onClick={generateQRCodes}
            disabled={generatingQR}
            className="px-6 py-4 border border-stone-600 text-stone-200 font-bold hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {generatingQR ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating QR Codes...
              </>
            ) : (
              <>
                <QrCode className="w-5 h-5" />
                Generate QR Codes
              </>
            )}
          </button>

          <button
            onClick={publishListing}
            disabled={!allRoomsHaveApprovedDesigns || publishing}
            className="px-8 py-4 bg-emerald-500 text-stone-900 font-bold text-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {publishing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publishing...
              </>
            ) : (
              'Push Live'
            )}
          </button>
        </div>

        {/* QR Codes Display */}
        {qrCodes && (
          <div className="mt-8 border border-stone-700 bg-stone-900 p-6">
            <h3 className="font-semibold text-stone-200 text-lg mb-4 flex items-center gap-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              <QrCode className="w-5 h-5" />
              QR Codes Ready
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {/* House QR */}
              {qrCodes.houseQR && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full aspect-square bg-white p-3 flex items-center justify-center">
                    <img
                      src={qrCodes.houseQR.qrUrl}
                      alt="House QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-xs text-stone-400 text-center" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Full Listing
                  </span>
                  <a
                    href={qrCodes.houseQR.qrUrl}
                    download="house-qr.svg"
                    className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download SVG
                  </a>
                </div>
              )}

              {/* Room QRs */}
              {qrCodes.roomQRs?.map((room) => (
                <div key={room.roomId} className="flex flex-col items-center gap-2">
                  <div className="w-full aspect-square bg-white p-3 flex items-center justify-center">
                    <img
                      src={room.qrUrl}
                      alt={`${room.roomType} QR Code`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-xs text-stone-400 text-center" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {room.roomType}
                  </span>
                  <a
                    href={room.qrUrl}
                    download={`${room.roomType.toLowerCase().replace(/\s+/g, '-')}-qr.svg`}
                    className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download SVG
                  </a>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-stone-500" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Print these QR codes for open house signage. Each room code links directly to its design gallery.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
