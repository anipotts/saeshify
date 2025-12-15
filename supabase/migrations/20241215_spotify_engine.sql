-- 1. Spotify Tokens (Server-side storage)
create table if not exists public.spotify_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  spotify_user_id text,
  access_token text not null,
  refresh_token text not null,
  scope text,
  expires_at timestamp with time zone not null,
  updated_at timestamp with time zone default now()
);

alter table public.spotify_tokens enable row level security;

-- Only Allow owner to read (optional, mostly for debug/status checks)
create policy "Users can view own spotify tokens" on public.spotify_tokens
  for select using ( auth.uid() = user_id );

-- Insert/Update only via Service Role (Application Logic)
-- We do NOT want clients updating tokens directly to avoid hijacking.
-- However, for the initial Auth Callback (which might run server-side or client-side depending on architecture),
-- we usually treat it as trusted. But RLS applies to the Client.
-- Ideally, the callback runs on the server (Route Handler), which uses Service Role (admin) to write this.
-- So we don't strictly need a "for insert" policy for public, assuming we use service role in `api/auth/callback`.

-- 2. Listening Events (History)
create table if not exists public.listening_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  played_at timestamp with time zone not null,
  track_spotify_id text not null,
  track_name text not null,
  artist_name text not null,
  album_name text,
  album_spotify_id text,
  cover_url text,
  duration_ms int,
  context_type text, -- 'playlist', 'album', 'artist'
  raw jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now(),
  
  -- Prevent duplicates
  unique(user_id, track_spotify_id, played_at)
);

alter table public.listening_events enable row level security;

create policy "Users can view own listening history" on public.listening_events
  for select using ( auth.uid() = user_id );

-- Inserts are handled by Cron (Service Role)

-- Indexes for performance
create index if not exists idx_listening_events_user_played on public.listening_events (user_id, played_at desc);
create index if not exists idx_listening_events_user_track on public.listening_events (user_id, track_spotify_id);


-- 3. Listening State (Now Playing Snapshot)
create table if not exists public.listening_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_playing boolean default false,
  track_spotify_id text,
  progress_ms int,
  last_updated timestamp with time zone default now(),
  raw jsonb default '{}'::jsonb
);

alter table public.listening_state enable row level security;

create policy "Users can view own listening state" on public.listening_state
  for select using ( auth.uid() = user_id );


-- 4. Push Subscriptions (Web Push)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamp with time zone default now(),
  
  unique(user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage own push subscriptions" on public.push_subscriptions
  for all using ( auth.uid() = user_id );


-- 5. Grant permissions to service_role (usually implicit, but good to be explicit if needed)
grant all on public.spotify_tokens to service_role;
grant all on public.listening_events to service_role;
grant all on public.listening_state to service_role;
grant all on public.push_subscriptions to service_role;
