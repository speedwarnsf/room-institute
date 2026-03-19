-- ═══════════════════════════════════════════════════════════════
--  ZENSPACE PLATFORM — Multi-market, interaction tracking, pitches
-- ═══════════════════════════════════════════════════════════════

-- Markets (SF, NYC, Austin, etc.)
create table if not exists public.markets (
  id text primary key,
  name text not null,
  region text, -- 'Bay Area', 'Tri-State', etc.
  status text not null default 'active' check (status in ('active', 'paused', 'planned')),
  launched_at timestamptz,
  created_at timestamptz not null default now()
);

-- Design partners (one per market, or cross-market)
create table if not exists public.design_partners (
  id text primary key,
  name text not null,
  url text,
  contact_name text,
  contact_email text,
  bio text,
  accolades text[], -- 'Architectural Digest', 'Dwell', 'SF Decorator Showcase'
  markets text[] default '{}', -- market IDs this partner covers
  status text not null default 'prospect' check (status in ('prospect', 'active', 'churned')),
  created_at timestamptz not null default now()
);

-- Agencies (Compass, Sotheby's, etc.)
create table if not exists public.agencies (
  id text primary key,
  name text not null,
  market_id text references public.markets(id),
  contact_name text,
  contact_email text,
  logo_url text,
  status text not null default 'prospect' check (status in ('prospect', 'onboarding', 'active', 'churned')),
  created_at timestamptz not null default now()
);

-- Link agents to agencies
alter table public.agents add column if not exists agency_id text references public.agencies(id);
alter table public.agents add column if not exists market_id text references public.markets(id);

-- Link listings to markets and agencies
alter table public.listings add column if not exists market_id text references public.markets(id);
alter table public.listings add column if not exists agency_id text references public.agencies(id);
alter table public.listings add column if not exists design_partner_id text references public.design_partners(id);

-- ═══════════════════════════════════════════════════════════════
--  INTERACTION EVENTS — Privacy-first, no PII, no cookies
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.interaction_events (
  id bigint generated always as identity primary key,
  -- Context (what, not who)
  event_type text not null,
  listing_id text references public.listings(id) on delete set null,
  room_id text,
  design_id text,
  market_id text,
  -- Event data
  metadata jsonb default '{}',
  -- Anonymous session (random per page load, not persistent)
  session_token text,
  -- Device context (no fingerprinting)
  device_type text check (device_type in ('mobile', 'tablet', 'desktop')),
  -- Source
  source text, -- 'qr', 'direct', 'pitch-page', 'agent-share'
  referrer_domain text,
  -- Timing
  duration_ms integer, -- time spent on this interaction
  created_at timestamptz not null default now()
);

-- Indexes for fast aggregation
create index if not exists idx_events_type on public.interaction_events(event_type);
create index if not exists idx_events_listing on public.interaction_events(listing_id);
create index if not exists idx_events_market on public.interaction_events(market_id);
create index if not exists idx_events_created on public.interaction_events(created_at);
create index if not exists idx_events_design on public.interaction_events(design_id);

-- Event types reference:
-- page_view          — listing or room page loaded
-- design_viewed      — design card scrolled into view
-- design_expanded    — tapped/clicked a design image
-- go_deeper_tapped   — tapped Go Deeper
-- spread_completed   — scrolled to bottom of spread
-- spread_section     — reached a section (materials, philosophy, etc.)
-- qr_scanned         — QR code scan (source=qr)
-- partner_clicked    — tapped design partner CTA
-- camera_opened      — opened ZenSpace camera on listing
-- time_on_page       — periodic heartbeat (every 30s)
-- agent_onboard      — agent completed onboarding

-- ═══════════════════════════════════════════════════════════════
--  PITCH PORTFOLIOS — Packaged insights for prospects
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.pitch_portfolios (
  id text primary key,
  name text not null, -- 'SF Design Firms Q1 2026'
  prospect_type text not null check (prospect_type in ('design_firm', 'agency', 'investor', 'custom')),
  prospect_name text, -- who this is for
  market_ids text[] default '{}',
  -- Generated content
  insights jsonb, -- aggregated data snapshots
  narrative text, -- generated editorial pitch text
  deck_url text, -- exported PDF/deck URL
  -- Status
  status text not null default 'draft' check (status in ('draft', 'ready', 'sent', 'converted')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- No RLS — admin-only access via service key
