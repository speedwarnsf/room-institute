/**
 * PublicationHome — the magazine-style front door for room.institute
 * 
 * Shows featured luxury listings in an editorial grid.
 * Replaces the upload tool as the homepage.
 * The consumer design tool lives at /design.
 */

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../services/auth';
import { useI18n } from '../i18n/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import GlobalTypeset from './GlobalTypeset';
import ComparisonHero from './ComparisonHero';

interface PublicationListing {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  neighborhood: string;
  building_name: string | null;
  description: string;
  hero_image: string | null;
  agent_name: string | null;
  agent_brokerage: string | null;
  display_order: number;
  is_featured: boolean;
  sold_date: string | null;
  market: string;
}

function formatPrice(price: number): string {
  if (price >= 10_000_000) return `$${(price / 1_000_000).toFixed(0)}M`;
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  return `$${price.toLocaleString()}`;
}

function ListingCard({ listing, index }: { listing: PublicationListing; index: number }) {
  const isSold = !!listing.sold_date;
  const isHero = index === 0;

  return (
    <Link
      to={`/listing/${listing.id}`}
      className={`group block relative overflow-hidden ${isHero ? 'col-span-full' : ''}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.5 }}
        className={`relative ${isHero ? 'aspect-[4/3] sm:aspect-[21/9]' : 'aspect-[4/3]'} bg-stone-900 overflow-hidden`}
      >
        {/* Image */}
        {listing.hero_image ? (
          <img
            src={listing.hero_image}
            alt={listing.address}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading={index < 4 ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center">
            <span className="text-stone-600 text-xs uppercase tracking-widest" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {(t as any)('pub.comingSoon')}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />

        {/* SOLD badge */}
        {isSold && (
          <div className="absolute top-4 left-4 bg-white text-stone-900 px-3 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Sold {new Date(listing.sold_date!).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          </div>
        )}

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          {/* Neighborhood tag */}
          <span className="text-emerald-400 text-[10px] uppercase tracking-[0.2em] block mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {listing.neighborhood || listing.city}
          </span>

          {/* Address */}
          <h3
            className={`text-white leading-tight mb-1.5 ${isHero ? 'text-3xl sm:text-4xl' : 'text-lg sm:text-xl'}`}
            style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400 }}
          >
            {listing.building_name || listing.address}
          </h3>

          {/* If building name, show address below */}
          {listing.building_name && (
            <p className="text-stone-400 text-xs mb-1.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {listing.address}
            </p>
          )}

          {/* Price + details */}
          <div className="flex items-center gap-3 text-stone-300">
            <span className={`font-semibold ${isHero ? 'text-xl' : 'text-base'}`} style={{ fontFamily: 'Nunito, sans-serif' }}>
              {formatPrice(listing.price)}
            </span>
            <span className="text-stone-500 text-xs" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {listing.beds > 0 ? `${listing.beds} bed` : ''}
              {listing.baths > 0 ? ` · ${listing.baths} bath` : ''}
              {listing.sqft > 0 ? ` · ${listing.sqft.toLocaleString()} sqft` : ''}
            </span>
          </div>

          {/* Agent credit */}
          {listing.agent_brokerage && (
            <p className="text-stone-500 text-[10px] mt-2 uppercase tracking-wider" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {listing.agent_name ? `${listing.agent_name} · ` : ''}{listing.agent_brokerage}
            </p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default function PublicationHome() {
  const { t } = useI18n();
  const [listings, setListings] = useState<PublicationListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    supabase
      .from('listings')
      .select('id, address, city, state, zip, price, beds, baths, sqft, neighborhood, building_name, description, hero_image, agent_name, agent_brokerage, display_order, is_featured, sold_date, market')
      .eq('status', 'ready')
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        setListings(data || []);
        setLoading(false);
      });
  }, []);

  // Extract unique cities for filter
  const cities = useMemo(() => {
    const unique = [...new Set(listings.map(l => l.city))].sort();
    return unique;
  }, [listings]);

  const filtered = useMemo(() => {
    if (filter === 'all') return listings;
    if (filter === 'featured') return listings.filter(l => l.is_featured);
    return listings.filter(l => l.city === filter);
  }, [listings, filter]);

  useEffect(() => {
    document.title = 'Room Institute — Design Intelligence for Exceptional Properties';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Explore AI-generated design possibilities for the world\'s finest properties. Room Institute transforms how buyers experience luxury real estate.');
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      {/* Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Nunito:wght@300;400;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header className="border-b border-stone-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/room-logo.png" alt="Room" style={{ height: 22 }} className="opacity-90" />
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Welcome */}
      <GlobalTypeset />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <p className="text-stone-400 text-sm sm:text-base max-w-2xl leading-relaxed" data-no-typeset style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 300, lineHeight: '1.8' }}>
          A private collection of the world{'\u2019'}s most exceptional properties. Every room can be reimagined{'\u00A0'}{'\u2014'} tap any listing to see what{'\u2019'}s{'\u00A0'}possible.
        </p>
      </div>

      {/* Before/After Comparison */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <ComparisonHero />
      </div>

      {/* Editorial copy */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8">
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl text-stone-100 leading-[1.15] mb-6"
          style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400 }}
        >
          {(t as any)('pub.hero')}
        </h2>
        <div className="text-stone-400 text-sm sm:text-base max-w-lg leading-relaxed" data-no-typeset style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 300, lineHeight: '1.8' }}>
          <p style={{ marginBottom: '0.5em' }}>{(t as any)('pub.body1')}</p>
          <p style={{ marginBottom: '0.5em' }}>{(t as any)('pub.body2')}</p>
          <p style={{ marginTop: '1.2em', marginBottom: '0.5em' }}>{(t as any)('pub.body3a')}<a href="https://room.institute" className="italic hover:text-stone-300 transition-colors" style={{ textDecoration: 'none' }}>(room.institute)</a>{(t as any)('pub.body3b')}</p>
          <p>{(t as any)('pub.body4')}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'featured', ...cities].map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`flex-shrink-0 px-3 py-1.5 text-[11px] uppercase tracking-widest transition-colors ${
                filter === c
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-stone-500 border border-stone-800 hover:border-stone-600'
              }`}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {c === 'all' ? (t as any)('pub.allListings') : c === 'featured' ? (t as any)('pub.featured') : c}
            </button>
          ))}
        </div>
      </div>

      {/* Listings grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-stone-900 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-stone-600 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {(t as any)('pub.noListings')}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-800/50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <img src="/room-logo.png" alt="Room" style={{ height: 16 }} className="opacity-30 mx-auto mb-4" />
          <p className="text-stone-700 text-[10px] tracking-wider" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Realtor access is by introduction only
          </p>
        </div>
      </footer>

      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}
