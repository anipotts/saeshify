
-- 1. Create allowed_users table (Security Boundary)
-- Drop first to ensure clean state (avoids PK/constraint missing errors)
drop table if exists public.allowed_users cascade;

create table public.allowed_users (
  email text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for allowed_users (Public read? Or restricted? Let's make it strict: admin only or just server)
-- For now, if we want server-side checks only, we don't strictly need RLS for client. 
-- But let's allow authenticated users to read it to check their own status?
-- Actually, better pattern: `is_authorized()` function.

alter table public.allowed_users enable row level security;

-- Only service role can manage. No policies for public.

-- 2. Create authorize() helper function
create or replace function public.is_authorized()
returns boolean
language plpgsql security definer as $$
begin
  return exists (
    select 1 from public.allowed_users 
    where email = auth.email()
  );
end;
$$;

-- 3. Update Existing RLS Policies with Authorization Check
-- v_vault_tracks is a view, so we check underlying tables

-- User Bank
drop policy if exists "Users can view own bank" on public.user_bank;
create policy "Users can view own bank" on public.user_bank
  for select using ( auth.uid() = user_id and public.is_authorized() );

drop policy if exists "Users can insert own bank" on public.user_bank;
create policy "Users can insert own bank" on public.user_bank
  for insert with check ( auth.uid() = user_id and public.is_authorized() );

drop policy if exists "Users can delete own bank" on public.user_bank;
create policy "Users can delete own bank" on public.user_bank
  for delete using ( auth.uid() = user_id and public.is_authorized() );

-- Track Ratings
drop policy if exists "Users can view own ratings" on public.track_ratings;
create policy "Users can view own ratings" on public.track_ratings
  for select using ( auth.uid() = user_id and public.is_authorized() );

drop policy if exists "Users can update own ratings" on public.track_ratings;
create policy "Users can update own ratings" on public.track_ratings
  for update using ( auth.uid() = user_id and public.is_authorized() );

-- 4. Recent Searches Table
drop table if exists public.recent_searches cascade;

create table public.recent_searches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  query text not null, -- The display title (Track Name, Artist Name)
  kind text not null check (kind in ('track', 'album', 'artist', 'query')),
  spotify_id text not null, -- Unique ID (track ID, artist ID) or 'query'
  payload jsonb default '{}'::jsonb, -- Store cover_url, subtitle, etc.
  last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null,
  seen_count int default 1
);

-- Unique Constraint for Upsert
alter table public.recent_searches 
  add constraint unique_recent_search 
  unique (user_id, kind, spotify_id);

-- RLS
alter table public.recent_searches enable row level security;

create policy "Users can view own recents" on public.recent_searches
  for select using ( auth.uid() = user_id and public.is_authorized() );

create policy "Users can insert own recents" on public.recent_searches
  for insert with check ( auth.uid() = user_id and public.is_authorized() );

create policy "Users can update own recents" on public.recent_searches
  for update using ( auth.uid() = user_id and public.is_authorized() );

-- 5. Seed Allowed Users
insert into public.allowed_users (email)
values 
  ('saesharajput@gmail.com'), 
  ('anirudhpottammal@gmail.com')
on conflict (email) do nothing;
