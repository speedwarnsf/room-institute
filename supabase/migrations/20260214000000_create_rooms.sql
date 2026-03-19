-- Create rooms table for ZenSpace
create table if not exists public.rooms (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null default 'Untitled Room',
  source_image_thumb text,
  designs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.rooms enable row level security;

-- Users can only see their own rooms
create policy "Users read own rooms" on public.rooms
  for select using (auth.uid() = user_id);

create policy "Users insert own rooms" on public.rooms
  for insert with check (auth.uid() = user_id);

create policy "Users update own rooms" on public.rooms
  for update using (auth.uid() = user_id);

create policy "Users delete own rooms" on public.rooms
  for delete using (auth.uid() = user_id);

-- Index for fast lookups by user
create index if not exists idx_rooms_user_id on public.rooms(user_id);
