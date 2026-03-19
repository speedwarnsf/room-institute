-- ═══════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor before deploying
-- https://supabase.com/dashboard/project/vqkoxfenyjomillmxawh/sql/new
-- ═══════════════════════════════════════════════════════════════

-- 1. Add display_order and spread_data to listing_designs
ALTER TABLE public.listing_designs ADD COLUMN IF NOT EXISTS display_order integer;
ALTER TABLE public.listing_designs ADD COLUMN IF NOT EXISTS spread_data jsonb;

-- Set Monochrome Depths first in Living Room
UPDATE public.listing_designs SET display_order = 1 WHERE id = '071cb86d-5a7d-4ec8-a05d-a67cc2ab213e';
UPDATE public.listing_designs SET display_order = 2 WHERE id = 'dc7ec589-12a2-4910-85a7-df6ce321124f';
UPDATE public.listing_designs SET display_order = 3 WHERE id = 'ef89c4aa-e7f0-41f8-bd8b-f2450f6320e6';

-- 2. Markets
CREATE TABLE IF NOT EXISTS public.markets (
  id text PRIMARY KEY,
  name text NOT NULL,
  region text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'planned')),
  launched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Design partners
CREATE TABLE IF NOT EXISTS public.design_partners (
  id text PRIMARY KEY,
  name text NOT NULL,
  url text,
  contact_name text,
  contact_email text,
  bio text,
  accolades text[] DEFAULT '{}',
  markets text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'active', 'churned')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Agencies
CREATE TABLE IF NOT EXISTS public.agencies (
  id text PRIMARY KEY,
  name text NOT NULL,
  market_id text REFERENCES public.markets(id),
  contact_name text,
  contact_email text,
  logo_url text,
  status text NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'onboarding', 'active', 'churned')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Link agents to agencies/markets
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS agency_id text REFERENCES public.agencies(id);
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS market_id text REFERENCES public.markets(id);

-- 6. Link listings to markets/agencies/partners
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS market_id text REFERENCES public.markets(id);
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS agency_id text REFERENCES public.agencies(id);
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS design_partner_id text REFERENCES public.design_partners(id);

-- 7. Interaction events
CREATE TABLE IF NOT EXISTS public.interaction_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type text NOT NULL,
  listing_id text REFERENCES public.listings(id) ON DELETE SET NULL,
  room_id text,
  design_id text,
  market_id text,
  metadata jsonb DEFAULT '{}',
  session_token text,
  device_type text CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  source text,
  referrer_domain text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_type ON public.interaction_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_listing ON public.interaction_events(listing_id);
CREATE INDEX IF NOT EXISTS idx_events_market ON public.interaction_events(market_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON public.interaction_events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_design ON public.interaction_events(design_id);

-- 8. Pitch portfolios
CREATE TABLE IF NOT EXISTS public.pitch_portfolios (
  id text PRIMARY KEY,
  name text NOT NULL,
  prospect_type text NOT NULL CHECK (prospect_type IN ('design_firm', 'agency', 'investor', 'custom')),
  prospect_name text,
  market_ids text[] DEFAULT '{}',
  insights jsonb,
  narrative text,
  deck_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'sent', 'converted')),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed SF market
INSERT INTO public.markets (id, name, region, status, launched_at)
VALUES ('sf', 'San Francisco', 'Bay Area', 'active', now())
ON CONFLICT (id) DO NOTHING;

-- Seed MODTAGE as first design partner
INSERT INTO public.design_partners (id, name, url, contact_name, bio, accolades, markets, status)
VALUES (
  'modtage',
  'MODTAGE Design',
  'https://www.modtagedesign.com',
  'Gretchen Murdock',
  'Award-winning San Francisco interior design studio. Modern meets vintage.',
  ARRAY['Architectural Digest', 'Dwell', 'SF Decorator Showcase'],
  ARRAY['sf'],
  'active'
)
ON CONFLICT (id) DO NOTHING;

SELECT 'All migrations complete' as status;
