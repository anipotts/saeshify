-- 1. Allowed Users Whitelist
create table if not exists allowed_users (
  user_id uuid primary key references auth.users(id),
  email text not null
);
alter table allowed_users enable row level security;
create policy "Public allowed_users read" on allowed_users for select using (true); -- needed for checks

-- 2. Recent Searches
create table if not exists recent_searches (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) default auth.uid() not null,
  kind text not null check (kind in ('track', 'album', 'artist')),
  query text,
  spotify_id text,
  payload jsonb, -- store minimal presentation data (name, image, artist)
  last_seen_at timestamptz default now(),
  seen_count int default 1,
  
  unique(user_id, kind, spotify_id)
);
alter table recent_searches enable row level security;
create policy "User manages own searches" on recent_searches for all using (auth.uid() = user_id);
create index idx_recent_searches_user_date on recent_searches(user_id, last_seen_at desc);

-- 3. User Preferences
create table if not exists user_preferences (
  user_id uuid primary key references auth.users(id),
  details_panel_open boolean default false,
  details_panel_width int default 320,
  updated_at timestamptz default now()
);
alter table user_preferences enable row level security;
create policy "User manages own prefs" on user_preferences for all using (auth.uid() = user_id);

-- 4. Update Track Ratings
alter table track_ratings add column if not exists comparisons_count int default 0;

-- 5. Helper Views (Optional but useful for frontend)
create or replace view v_vault_tracks as
select 
  ub.liked_at,
  t.id, t.name, t.artist_ids, t.album_id, t.cover_url, t.preview_url,
  tr.rating, tr.games, tr.comparisons_count,
  a.name as album_name
from user_bank ub
join tracks t on ub.track_id = t.id
left join albums a on t.album_id = a.id
left join track_ratings tr on (tr.track_id = t.id and tr.user_id = auth.uid())
where ub.user_id = auth.uid();

-- 6. Reset Data RPC
create or replace function reset_my_data(confirm_mode text)
returns void
language plpgsql
security definer
as $$
begin
  if confirm_mode not in ('dev_fast', 'prod_confirmed') then
    raise exception 'Invalid confirmation mode';
  end if;

  -- Delete in order of dependency
  delete from recent_searches where user_id = auth.uid();
  delete from comparisons where user_id = auth.uid();
  delete from track_ratings where user_id = auth.uid();
  delete from user_bank where user_id = auth.uid();
  delete from user_preferences where user_id = auth.uid();
  
  -- comparison_queue if exists
  delete from comparison_queue where user_id = auth.uid();
end;
$$;
