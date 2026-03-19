-- Create listings system for ZenSpace Real Estate
-- Tables: listings, listing_rooms, listing_designs

-- Listings table (one per property)
create table if not exists public.listings (
  id text primary key,
  source_url text,
  address text,
  city text,
  state text default 'CA',
  zip text,
  price integer,
  beds integer,
  baths integer,
  sqft integer,
  description text,
  hero_image text,
  neighborhood text,
  building_name text,
  year_built integer,
  floor_number integer,
  mls_number text,
  agent_name text,
  agent_email text,
  agent_phone text,
  agent_brokerage text,
  agent_photo text,
  agent_license text,
  status text not null default 'pending' check (status in ('pending', 'scraping', 'labeling', 'generating', 'review', 'ready', 'error')),
  error_message text,
  photo_count integer default 0,
  qr_code_house text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Listing rooms (one per identified room in the listing)
create table if not exists public.listing_rooms (
  id text primary key,
  listing_id text not null references public.listings(id) on delete cascade,
  label text not null,
  original_photo text not null,
  thumbnail text,
  photo_index integer,
  confidence real default 1.0,
  status text not null default 'pending' check (status in ('pending', 'generating', 'ready', 'hidden', 'error')),
  qr_code text,
  created_at timestamptz not null default now()
);

-- Listing designs (curated designs per room)
create table if not exists public.listing_designs (
  id text primary key,
  room_id text not null references public.listing_rooms(id) on delete cascade,
  listing_id text not null references public.listings(id) on delete cascade,
  name text not null,
  description text,
  image_url text not null,
  thumbnail_url text,
  frameworks text[] default '{}',
  design_seed jsonb,
  room_reading jsonb,
  style_analysis jsonb,
  quality_score real,
  is_curated boolean default false,
  display_order integer,
  is_hallucinated boolean default false,
  hallucination_reason text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_listing_rooms_listing on public.listing_rooms(listing_id);
create index if not exists idx_listing_designs_room on public.listing_designs(room_id);
create index if not exists idx_listing_designs_listing on public.listing_designs(listing_id);
create index if not exists idx_listings_status on public.listings(status);

-- No RLS for now — listings are public-facing content
-- (Agent auth will be added when agent dashboard is built)
