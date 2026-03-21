import { useParams } from 'react-router-dom';
import { getListingById } from '../services/listingService';
import { useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ChevronDown, ArrowRight, X, Loader2, Plus } from 'lucide-react';
import GlobalTypeset from './GlobalTypeset';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useI18n } from '../i18n/I18nContext';
import { Listing as ListingType, ListingRoom, ListingDesign } from '../types';
import { track, trackTimeOnPage, trackVisibility } from '../services/tracking';
import { translateRoomLabel } from '../i18n/roomLabels';

const DesignSpread = lazy(() => import('./DesignSpread'));


/** ═══════════════════════════════════════════════════
 *  Horizontal design carousel for a single room
 *  ═══════════════════════════════════════════════════ */

function RoomLane({
  room,
  listingId,
  sourceUrl,
  onDesignTap,
  onNewDesigns,
}: {
  room: ListingRoom;
  listingId: string;
  sourceUrl?: string;
  onDesignTap: (design: ListingDesign, room: ListingRoom) => void;
  onNewDesigns: (roomId: string, designs: ListingDesign[]) => void;
}) {
  const { t, locale } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const allImages = [
    { type: 'original' as const, url: room.originalPhoto, label: t('listing.asListed') },
    ...room.designs.map(d => ({ type: 'design' as const, url: d.imageUrl, label: d.name, design: d })),
  ];

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / allImages.length;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(idx);
  }, [allImages.length]);

  return (
    <div className="mb-1">
      {/* Room label */}
      <div className="px-5 py-3 flex items-center justify-between">
        <h3 className="text-stone-300 text-sm" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {translateRoomLabel(room.label, t as (key: string) => string)}
        </h3>
        <span className="text-stone-600 text-xs">
          {room.designs.length} {t('listing.designs')}
        </span>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-5 pb-2"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {allImages.map((img, i) => (
          <div
            key={i}
            className="flex-shrink-0 snap-center relative cursor-pointer group"
            style={{ width: 'calc(85vw)', maxWidth: '520px' }}
            onClick={() => {
              if (img.type === 'design' && 'design' in img) {
                onDesignTap(img.design!, room);
              } else if (img.type === 'original' && sourceUrl) {
                window.open(sourceUrl, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            <div className="aspect-[16/10] overflow-hidden bg-stone-800 relative">
              <img
                src={img.url}
                alt={img.label}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Label overlay — INSIDE the image container */}
              {img.type === 'original' ? null : (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-900/90 to-transparent p-4">
                  <p className="text-stone-100 text-sm font-bold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {img.label}
                  </p>
                  <p className="text-emerald-500 text-xs mt-0.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('listing.goDeeper')} <ArrowRight className="w-3 h-3" />
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Generate More card */}
        <div
          className="flex-shrink-0 snap-center relative cursor-pointer"
          style={{ width: 'calc(85vw)', maxWidth: '520px' }}
          onClick={async () => {
            if (generating) return;
            setGenerating(true);
            track({ eventType: 'generate_more_tapped', listingId, metadata: { roomId: room.id, roomLabel: room.label } });
            try {
              const res = await fetch('/api/designs/generate-more', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: room.id, listingId, locale }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.designs?.length) {
                  onNewDesigns(room.id, data.designs);
                }
              }
            } catch {}
            setGenerating(false);
          }}
        >
          <div className="aspect-[16/10] overflow-hidden bg-stone-800 border border-dashed border-stone-600 flex flex-col items-center justify-center gap-3">
            {generating ? (
              <>
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-stone-400 text-sm" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {t('listing.generating')}
                </p>
                <p className="text-stone-600 text-[10px]">{t('listing.generatingTime')}</p>
              </>
            ) : (
              <>
                <Plus className="w-8 h-8 text-stone-500" />
                <p className="text-stone-300 text-sm font-bold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {t('listing.generateMore')}
                </p>
                <p className="text-stone-600 text-[10px]">{t('listing.generateMoreSub')}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 py-2">
        {[...allImages, { type: 'more' }].map((_, i) => (
          <div
            key={i}
            className={`h-1 transition-all duration-200 ${
              i === activeIndex
                ? 'w-4 bg-emerald-500'
                : i === allImages.length ? 'w-1 bg-stone-600' : 'w-1 bg-stone-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** ═══════════════════════════════════════════════════
 *  Full-bleed design overlay (tap a design to expand)
 *  ═══════════════════════════════════════════════════ */

function DesignOverlay({
  design,
  room,
  listingAddress,
  onClose,
  onGoDeeper,
}: {
  design: ListingDesign;
  room: ListingRoom;
  listingAddress: string;
  onClose: () => void;
  onGoDeeper: () => void;
}) {
  const { t } = useI18n();
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-200, 0], [0.3, 1]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.y < -100 && info.velocity.y < -100) {
      onGoDeeper();
    } else if (info.offset.y > 100) {
      onClose();
    }
  }, [onGoDeeper, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-stone-950"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-stone-900/80 text-stone-300 hover:text-stone-100 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Draggable image */}
      <motion.div
        className="h-full flex flex-col"
        drag="y"
        dragConstraints={{ top: -200, bottom: 200 }}
        dragElastic={0.3}
        onDragEnd={handleDragEnd}
        style={{ y, opacity }}
      >
        {/* Image */}
        <div className="flex-1 relative overflow-hidden">
          <img
            src={design.imageUrl}
            alt={design.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
        </div>

        {/* Info bar */}
        <div className="bg-stone-950 px-6 py-5">
          <h2
            className="text-2xl font-bold text-stone-100 mb-1"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            {design.name}
          </h2>
          <p className="text-stone-500 text-xs mb-4">{translateRoomLabel(room.label, t as (key: string) => string)} — {listingAddress}</p>

          {design.description && (
            <p className="text-stone-400 text-[13px] leading-relaxed mb-4 line-clamp-2">
              {design.description}
            </p>
          )}

          {/* Framework tags */}
          {design.frameworks?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {design.frameworks.map(f => (
                <span key={f} className="px-2 py-0.5 bg-stone-800 text-emerald-500 text-[10px] font-medium tracking-wide uppercase">
                  {f}
                </span>
              ))}
            </div>
          )}

          {/* Palette */}
          {design.palette && design.palette.length > 0 && (
            <div className="flex gap-1 mb-5">
              {design.palette.map((color, i) => (
                <div key={i} className="w-6 h-6" style={{ backgroundColor: color }} />
              ))}
            </div>
          )}

          {/* Go Deeper button */}
          <button
            onClick={onGoDeeper}
            className="w-full py-3 bg-emerald-500 text-stone-900 font-bold text-sm tracking-wide uppercase hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
          >
            {t('listing.goDeeper')}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-stone-700 text-[10px] mt-3">
            {t('listing.swipeUp')}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** ═══════════════════════════════════════════════════
 *  Spread Sheet (slides up from bottom)
 *  ═══════════════════════════════════════════════════ */

function SpreadSheet({
  design,
  listingAddress,
  roomLabel,
  onClose,
}: {
  design: ListingDesign;
  listingAddress: string;
  roomLabel: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[60] bg-stone-900 overflow-y-auto"
    >
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      }>
        <DesignSpread
          design={{
            id: design.id,
            name: design.name,
            description: design.description,
            imageUrl: design.imageUrl,
            frameworks: design.frameworks || [],
            palette: design.palette || [],
            products: design.products || [],
          }}
          listingAddress={listingAddress}
          roomLabel={roomLabel}
          onBack={onClose}
        />
      </Suspense>
    </motion.div>
  );
}

/** ═══════════════════════════════════════════════════
 *  Main Experience — single page, everything inline
 *  ═══════════════════════════════════════════════════ */

export function ListingExperience() {
  const { listingId } = useParams<{ listingId: string }>();
  const { t } = useI18n();
  const [listing, setListing] = useState<ListingType | null>(null);
  const [loading, setLoading] = useState(true);

  // Overlay state
  const [overlayDesign, setOverlayDesign] = useState<ListingDesign | null>(null);
  const [overlayRoom, setOverlayRoom] = useState<ListingRoom | null>(null);
  const [showSpread, setShowSpread] = useState(false);

  useEffect(() => {
    if (!listingId) { setLoading(false); return; }
    getListingById(listingId).then(data => { setListing(data); setLoading(false); });

    track({ eventType: 'page_view', listingId, metadata: { version: 'v2' } });
    const stopTimer = trackTimeOnPage({ listingId, metadata: { version: 'v2' } });
    return () => { stopTimer(); };
  }, [listingId]);

  // SEO: dynamic title, meta, and Schema.org structured data
  useEffect(() => {
    if (!listing) return;
    const agentName = listing.agent?.name;
    document.title = `${listing.address} — Reimagined${agentName ? ` | Listed by ${agentName}` : ''} | Room`;

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.setAttribute('name', 'description'); document.head.appendChild(metaDesc); }
    metaDesc.setAttribute('content', `Explore AI-generated design possibilities for ${listing.address}, ${listing.city}, ${listing.state}. ${listing.beds} bed, ${listing.baths} bath.`);

    // Inject Schema.org
    let schemaScript = document.getElementById('listing-schema');
    if (!schemaScript) { schemaScript = document.createElement('script'); schemaScript.id = 'listing-schema'; schemaScript.setAttribute('type', 'application/ld+json'); document.head.appendChild(schemaScript); }
    schemaScript.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'RealEstateListing',
      name: listing.address, description: listing.description,
      url: `https://room.institute/listing/${listing.id}`,
      image: listing.heroImage?.startsWith('http') ? listing.heroImage : `https://room.institute${listing.heroImage}`,
      address: { '@type': 'PostalAddress', streetAddress: listing.address, addressLocality: listing.city, addressRegion: listing.state, postalCode: listing.zip, addressCountry: 'US' },
      ...(listing.price ? { offers: { '@type': 'Offer', price: listing.price, priceCurrency: 'USD' } } : {}),
      numberOfBedrooms: listing.beds, numberOfBathroomsTotal: listing.baths,
      ...(agentName ? { broker: { '@type': 'RealEstateAgent', name: agentName, worksFor: listing.agent?.brokerage ? { '@type': 'Organization', name: listing.agent.brokerage } : undefined } } : {}),
    });

    return () => { document.title = 'Room — AI Interior Design'; };
  }, [listing]);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Nunito:wght@300;400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const handleNewDesigns = useCallback((roomId: string, newDesigns: ListingDesign[]) => {
    if (!listing) return;
    setListing({
      ...listing,
      rooms: listing.rooms.map(r =>
        r.id === roomId
          ? { ...r, designs: [...r.designs, ...newDesigns] }
          : r
      ),
    });
  }, [listing]);

  const handleDesignTap = useCallback((design: ListingDesign, room: ListingRoom) => {
    track({ eventType: 'design_expanded', listingId, designId: design.id, metadata: { version: 'v2' } });
    setOverlayDesign(design);
    setOverlayRoom(room);
    setShowSpread(false);
  }, [listingId]);

  const handleGoDeeper = useCallback(() => {
    if (overlayDesign) {
      track({ eventType: 'go_deeper_tapped', listingId, designId: overlayDesign.id, metadata: { version: 'v2' } });
    }
    setShowSpread(true);
  }, [overlayDesign, listingId]);

  const handleCloseOverlay = useCallback(() => {
    setOverlayDesign(null);
    setOverlayRoom(null);
    setShowSpread(false);
  }, []);

  const handleCloseSpread = useCallback(() => {
    setShowSpread(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <p className="text-stone-400">{t('error.listingNotFound')}</p>
      </div>
    );
  }

  if (listing.status !== 'ready') {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-stone-200 text-lg mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{t('error.listingNotPublished')}</p>
          <p className="text-stone-500 text-sm">{t('error.listingBeingPrepared')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
      <GlobalTypeset />

      {/* Compact hero */}
      <div className="relative">
        <div className="h-[45vh] overflow-hidden">
          <img
            src={listing.heroImage}
            alt={listing.address}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/30 to-transparent" />
        </div>

        {/* Overlay info */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <h1
            className="text-3xl md:text-5xl font-bold text-stone-100 mb-2 leading-tight"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            {listing.address}
          </h1>
          <div className="flex items-center gap-3 text-stone-300 text-sm">
            <span>{listing.city}, {listing.state}</span>
            <span className="text-stone-600">|</span>
            <span>${listing.price.toLocaleString()}</span>
            <span className="text-stone-600">|</span>
            <span>{listing.beds}{t('listing.beds')} {listing.baths}{t('listing.baths')}</span>
          </div>
        </div>
      </div>

      {/* Agent strip */}
      <div className="border-b border-stone-800 bg-stone-950 px-5 py-3 flex items-center justify-between">
        {listing.sourceUrl ? (
          <a href={listing.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {listing.agent.photo && (
              <div className="lens-circle overflow-hidden flex-shrink-0" style={{ width: 32, height: 32 }}>
                <img src={listing.agent.photo} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <span className="text-stone-300 text-xs font-medium">{listing.agent.name}</span>
              <span className="text-stone-600 text-xs ml-2">{listing.agent.brokerage}</span>
            </div>
          </a>
        ) : (
          <div className="flex items-center gap-3">
            {listing.agent.photo && (
              <div className="lens-circle overflow-hidden flex-shrink-0" style={{ width: 32, height: 32 }}>
                <img src={listing.agent.photo} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <span className="text-stone-300 text-xs font-medium">{listing.agent.name}</span>
              <span className="text-stone-600 text-xs ml-2">{listing.agent.brokerage}</span>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a href="https://room.institute" className="hover:opacity-80 transition-opacity flex items-center" style={{ height: 32 }}>
            <img src="/room-logo.png" alt="Room" style={{ height: 20 }} />
          </a>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="text-center py-4">
        <p className="text-stone-600 text-[11px] tracking-wide uppercase">{t('listing.swipe')}</p>
        <ChevronDown className="w-4 h-4 text-stone-700 mx-auto mt-1 animate-bounce" />
      </div>

      {/* Room lanes */}
      <div className="pb-8">
        {listing.rooms.map(room => (
          <RoomLane
            key={room.id}
            room={room}
            listingId={listing.id}
            sourceUrl={listing.sourceUrl}
            onDesignTap={handleDesignTap}
            onNewDesigns={handleNewDesigns}
          />
        ))}
      </div>

      {/* Design partner — visually separated as advertisement */}
      <div className="border-t-2 border-stone-700 bg-stone-900">
        <div className="max-w-sm mx-auto px-5 py-12 text-center">
          <img src="/room-logo.png" alt="Room" style={{ height: 18 }} className="mx-auto mb-6 opacity-60" />
          <h3 className="text-stone-200 text-2xl mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {(t as any)('ad.ownSpace')}
          </h3>
          <p className="text-emerald-500 text-lg font-bold mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {(t as any)('ad.seeItFirst')}
          </p>
          <p className="text-stone-400 text-[13px] leading-relaxed mb-6" data-no-smooth>
            {(t as any)('ad.roomDescription')}
          </p>
          <a
            href="https://room.institute"
            onClick={() => track({ eventType: 'room_cta_clicked', listingId, metadata: { context: 'v2', source: 'listing_ad' } })}
            className="inline-block px-6 pt-[14px] pb-[12px] border border-emerald-600 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500 text-xs tracking-widest uppercase transition-colors"
          >
            {(t as any)('ad.tryYourSpace')}
          </a>
        </div>
      </div>

      <footer className="py-6 text-center">
        <a href="https://room.institute" target="_blank" rel="noopener noreferrer" className="text-stone-700 hover:text-stone-500 text-[10px] transition-colors" data-no-smooth>
          {t('footer.poweredBy')}
        </a>
      </footer>

      {/* ═══ Overlays ═══ */}
      <AnimatePresence>
        {overlayDesign && overlayRoom && !showSpread && (
          <DesignOverlay
            key="overlay"
            design={overlayDesign}
            room={overlayRoom}
            listingAddress={listing.address}
            onClose={handleCloseOverlay}
            onGoDeeper={handleGoDeeper}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSpread && overlayDesign && overlayRoom && (
          <SpreadSheet
            key="spread"
            design={overlayDesign}
            listingAddress={listing.address}
            roomLabel={overlayRoom.label}
            onClose={handleCloseSpread}
          />
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
