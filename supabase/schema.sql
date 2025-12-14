-- SAESHIFY SUPABASE SCHEMA

-- 1. Enable Extensions
create extension if not exists "uuid-ossp";

-- 2. Clean up (Optional, be careful)
-- drop table if exists track_ratings cascade;
-- drop table if exists comparisons cascade;
-- drop table if exists user_bank cascade;
-- drop table if exists albums cascade;
-- drop table if exists tracks cascade;

-- 3. Create Tables

-- TRACKS: Normalized Spotify Data
create table tracks (
  id text primary key, -- Spotify ID
  name text not null,
  album_id text,
  artist_ids text[], -- array of spotify artist ids
  cover_url text, -- optimized image
  preview_url text,
  updated_at timestamptz default now()
);

-- ALBUMS
create table albums (
  id text primary key, -- Spotify ID
  name text not null,
  artist_ids text[],
  cover_url text,
  updated_at timestamptz default now()
);

-- USER BANK: Usage history / Library
create table user_bank (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  track_id text references tracks(id) on delete cascade,
  liked_at timestamptz default now(),
  
  unique(user_id, track_id) -- Prevent duplicates
);

-- COMPARISONS: Recording raw events
create table comparisons (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  winner_track_id text references tracks(id) on delete cascade,
  loser_track_id text references tracks(id) on delete cascade,
  context_album_id text, -- optional, if comparing within album
  created_at timestamptz default now()
);

-- TRACK RATINGS: Elo Scores
create table track_ratings (
  track_id text references tracks(id) on delete cascade,
  user_id uuid references auth.users(id) default auth.uid(),
  rating int default 1200,
  games int default 0,
  updated_at timestamptz default now(),
  
  primary key (track_id, user_id)
);

-- COMPARISON QUEUE: Pending comparisons from albums
create table comparison_queue (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  track_id text references tracks(id) on delete cascade,
  status text default 'pending', -- pending, completed, skipped
  source_album_id text,
  created_at timestamptz default now()
);

-- 4. RLS POLICIES

alter table tracks enable row level security;
alter table albums enable row level security;
alter table user_bank enable row level security;
alter table comparisons enable row level security;
alter table track_ratings enable row level security;
alter table comparison_queue enable row level security;

-- Public Read for Tracks/Albums (App-wide data)
create policy "Public tracks read" on tracks for select using (true);
create policy "Public albums read" on albums for select using (true);
-- Allow authenticated users (via service role or server actions) to insert/update tracks
-- Assuming Service Role usage for metadata population, or:
create policy "Authenticated can insert tracks" on tracks for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update tracks" on tracks for update using (auth.role() = 'authenticated');
-- Same for albums
create policy "Authenticated can insert albums" on albums for insert with check (auth.role() = 'authenticated');

-- User Data: Private
create policy "User can manage their own bank" on user_bank
  for all using (auth.uid() = user_id);

create policy "User can manage their own comparisons" on comparisons
  for all using (auth.uid() = user_id);

create policy "User can manage their own ratings" on track_ratings
  for all using (auth.uid() = user_id);
  
create policy "User can manage their own queue" on comparison_queue
  for all using (auth.uid() = user_id);

-- 5. RPC FUNCTIONS

-- record_comparison: Updates Elo and inserts comparison atomically
create or replace function record_comparison(
  p_winner_id text,
  p_loser_id text,
  p_album_id text default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  k_factor constant int := 32;
  
  winner_rating int;
  loser_rating int;
  
  expected_winner float;
  expected_loser float;
  
  new_winner_rating int;
  new_loser_rating int;
begin
  -- 1. Insert Comparison
  insert into comparisons (user_id, winner_track_id, loser_track_id, context_album_id)
  values (v_user_id, p_winner_id, p_loser_id, p_album_id);
  
  -- 2. Get current ratings (Initialize if missing)
  select rating into winner_rating from track_ratings where track_id = p_winner_id and user_id = v_user_id;
  if winner_rating is null then
    winner_rating := 1200;
    insert into track_ratings (track_id, user_id, rating) values (p_winner_id, v_user_id, 1200)
    on conflict do nothing;
  end if;
  
  select rating into loser_rating from track_ratings where track_id = p_loser_id and user_id = v_user_id;
  if loser_rating is null then
    loser_rating := 1200;
    insert into track_ratings (track_id, user_id, rating) values (p_loser_id, v_user_id, 1200)
    on conflict do nothing;
  end if;
  
  -- 3. Calculate Elo
  -- Expected score = 1 / (1 + 10 ^ ((opp - own) / 400))
  expected_winner := 1.0 / (1.0 + power(10.0, (loser_rating - winner_rating) / 400.0));
  expected_loser := 1.0 / (1.0 + power(10.0, (winner_rating - loser_rating) / 400.0));
  
  new_winner_rating := round(winner_rating + k_factor * (1 - expected_winner));
  new_loser_rating := round(loser_rating + k_factor * (0 - expected_loser));
  
  -- 4. Update Ratings
  update track_ratings set rating = new_winner_rating, games = games + 1, updated_at = now()
  where track_id = p_winner_id and user_id = v_user_id;
  
  update track_ratings set rating = new_loser_rating, games = games + 1, updated_at = now()
  where track_id = p_loser_id and user_id = v_user_id;

end;
$$;
