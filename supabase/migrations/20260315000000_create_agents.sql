-- Agent profiles for ZenSpace Real Estate
create table if not exists public.agents (
  id text primary key,
  name text not null,
  email text,
  phone text,
  company text,
  license_number text,
  portrait_url text,
  portrait_original_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Link listings to agents
alter table public.listings add column if not exists agent_id text references public.agents(id);
create index if not exists idx_listings_agent on public.listings(agent_id);
