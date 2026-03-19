import { useParams, Link } from 'react-router-dom';
import { getListingById } from '../services/listingService';
import { ArrowLeft, Camera, ArrowRight } from 'lucide-react';
import { useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react';
import GlobalTypeset from './GlobalTypeset';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Listing as ListingType, ListingRoom } from '../types';
import { track, trackTimeOnPage, trackVisibility } from '../services/tracking';
import { useI18n } from '../i18n/I18nContext';
import { translateRoomLabel } from '../i18n/roomLabels';

/** Wrapper that tracks how long a design card is visible in the viewport */
function TrackedDesignCard({
  children,
  designId,
  listingId,
  roomId,
}: {
  children: React.ReactNode;
  designId: string;
  listingId?: string;
  roomId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanup = trackVisibility(ref.current, {
      eventType: 'design_viewed',
      designId,
      listingId,
      roomId,
    });
    return cleanup;
  }, [designId, listingId, roomId]);

  return <div ref={ref}>{children}</div>;
}

const DesignSpread = lazy(() => import('./DesignSpread'));

interface Listing extends ListingType {
  status: string;
}

interface SpreadDesign {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  frameworks: string[];
  palette: string[];
  products: Array<{ name: string; brand: string; category: string; price_range: string; description: string; }>;
}

export function RoomPage() {
  const { t } = useI18n();
  const { listingId, roomId } = useParams<{ listingId: string; roomId: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [spreadDesign, setSpreadDesign] = useState<SpreadDesign | null>(null);

  useEffect(() => {
    if (!listingId) {
      setLoading(false);
      return;
    }

    getListingById(listingId).then(data => {
      setListing(data);
      setLoading(false);
    });

    track({ eventType: 'page_view', listingId, roomId });
    const stopTimer = trackTimeOnPage({ listingId, roomId });
    return () => { stopTimer(); };
  }, [listingId, roomId]);

  const room = listing?.rooms.find(r => r.id === roomId);

  useEffect(() => {
    // Load Google Fonts for this page
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Nunito:wght@300;400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-stone-400">{t('loading.room')}</p>
        </div>
      </div>
    );
  }

  if (!listing || !room) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-stone-200 mb-4">{t('error.roomNotFound')}</h1>
          <p className="text-stone-400">{t('error.roomNotLocated')}</p>
        </div>
      </div>
    );
  }

  // Draft gate - only show if status is 'ready'
  if (listing.status !== 'ready') {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-serif text-stone-200 mb-4">{t('error.listingNotPublished')}</h1>
          <p className="text-stone-400 mb-6">
            {t('error.listingBeingPrepared')}
          </p>
          {listingId && (
            <a
              href={`/listing/${listingId}/manage`}
              className="inline-block px-6 py-3 bg-emerald-500 text-stone-900 font-semibold hover:bg-emerald-400 transition-colors"
            >
              {t('error.goToManagePage')}
            </a>
          )}
        </div>
      </div>
    );
  }

  // Show spread view if a design is selected for deep dive
  if (spreadDesign && listing) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-stone-900 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <DesignSpread
          design={spreadDesign}
          listingAddress={listing.address}
          roomLabel={room?.label || 'Room'}
          onBack={() => setSpreadDesign(null)}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900" style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', lineHeight: '1.5' }}>
      <GlobalTypeset />
      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-950 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to={`/listing/${listing.id}`}
            className="flex items-center gap-2 text-stone-400 hover:text-emerald-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('nav.back')}
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="text-emerald-500 text-sm font-medium tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              ZenSpace
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Room Heading */}
        <div className="mb-8">
          <h1
            className="text-4xl md:text-5xl font-bold text-stone-100 mb-2"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            {translateRoomLabel(room.label, t)}
          </h1>
          <p className="text-stone-400 text-lg">
            {listing.address}
          </p>
        </div>

        {/* Original Photo */}
        <div className="mb-12">
          <div className="text-emerald-500 text-sm font-medium tracking-wide mb-3 uppercase" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {t('listing.asListed')}
          </div>
          <div className="bg-stone-950 border border-stone-800 p-2">
            <img
              src={room.originalPhoto}
              alt={`${translateRoomLabel(room.label, t)} - Original`}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Design Directions */}
        <div className="mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold text-stone-100 mb-8"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            {t('room.designDirections')}
          </h2>
          <div className="space-y-12">
            {room.designs.map(design => (
              <TrackedDesignCard key={design.id} designId={design.id} listingId={listingId} roomId={roomId}>
              <div className="bg-stone-950 border border-stone-800">
                {/* Design Image */}
                <div className="p-2">
                  <img
                    src={design.imageUrl}
                    alt={design.name}
                    className="w-full h-auto"
                  />
                </div>

                {/* Design Content */}
                <div className="p-6 md:p-8 border-t border-stone-800">
                  <h3
                    className="text-2xl md:text-3xl font-bold text-stone-100 mb-3"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    {design.name}
                  </h3>
                  <p className="text-stone-300 leading-relaxed mb-4" style={{ fontSize: '13px' }}>
                    {design.description}
                  </p>

                  {/* Framework Tags */}
                  {design.frameworks && design.frameworks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {design.frameworks.map(framework => (
                        <span
                          key={framework}
                          className="px-3 py-1 bg-stone-800 text-emerald-500 text-xs font-medium tracking-wide uppercase"
                        >
                          {framework}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Go Deeper */}
                  <button
                    onClick={() => {
                      track({ eventType: 'go_deeper_tapped', listingId, roomId, designId: design.id });
                      setSpreadDesign({
                      id: design.id,
                      name: design.name,
                      description: design.description,
                      imageUrl: design.imageUrl,
                      frameworks: design.frameworks || [],
                      palette: design.palette || [],
                      products: design.products || [],
                    });
                    }}
                    className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition-colors text-sm font-medium tracking-wide uppercase"
                  >
                    {t('listing.goDeeper')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              </TrackedDesignCard>
            ))}
          </div>
        </div>

        {/* Camera CTA */}
        <div className="border border-stone-800 bg-stone-950 p-8 md:p-12 text-center mb-12">
          <h3
            className="text-2xl md:text-3xl font-bold text-stone-100 mb-4"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Capture your own angle
          </h3>
          <p className="text-stone-400 mb-6 max-w-2xl mx-auto" data-no-smooth>
            {t('room.cameraPrompt')}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-emerald-500 text-stone-900 px-8 py-4 font-semibold hover:bg-emerald-400 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Open Camera
          </a>
        </div>

        {/* Design partner — visually separated as advertisement */}
        <div className="border-t-2 border-stone-700 bg-stone-900">
          <p className="text-stone-600 text-[9px] tracking-[0.3em] uppercase text-center pt-4 mb-0">{t('ad.label')}</p>
          <div className="max-w-sm mx-auto px-6 py-8 text-center">
            <h3 className="text-stone-200 text-2xl mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {t('ad.dreaming')}
            </h3>
            <p className="text-emerald-500 text-lg font-bold mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {t('ad.startDesigning')}
            </p>
            <p className="text-stone-400 text-[13px] leading-relaxed mb-6" data-no-smooth>
              {t('ad.description')}
            </p>
            <a
              href="https://www.modtagedesign.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track({ eventType: 'partner_clicked', listingId, roomId, metadata: { partner: 'modtage', context: 'room' } })}
              className="inline-block px-6 pt-[14px] pb-[12px] border border-stone-600 text-stone-300 hover:text-stone-100 hover:border-stone-400 text-xs tracking-widest uppercase transition-colors"
            >
              {t('ad.cta')}
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-800 py-8 mt-12">
        <p className="max-w-6xl mx-auto px-6 text-center text-stone-500 text-sm" data-no-smooth>
          {t('footer.poweredByFull')}
        </p>
      </footer>
    </div>
  );
}
