-- ALBUM COMPARISON SYSTEM
-- Mirrors the existing track comparison system for albums

-- 1. USER ALBUM BANK: User's saved albums (library)
create table if not exists public.user_album_bank (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  album_id text references albums(id) on delete cascade,
  liked_at timestamptz default now(),

  unique(user_id, album_id)
);

alter table public.user_album_bank enable row level security;

create policy "User can manage their own album bank" on public.user_album_bank
  for all using (auth.uid() = user_id);


-- 2. ALBUM RATINGS: Elo Scores for albums
create table if not exists public.album_ratings (
  album_id text references albums(id) on delete cascade,
  user_id uuid references auth.users(id) default auth.uid(),
  rating int default 1500,
  games int default 0,
  comparisons_count int default 0,
  updated_at timestamptz default now(),

  primary key (album_id, user_id)
);

alter table public.album_ratings enable row level security;

create policy "User can manage their own album ratings" on public.album_ratings
  for all using (auth.uid() = user_id);


-- 3. ALBUM COMPARISONS: Recording comparison events
create table if not exists public.album_comparisons (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  winner_album_id text references albums(id) on delete cascade,
  loser_album_id text references albums(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.album_comparisons enable row level security;

create policy "User can manage their own album comparisons" on public.album_comparisons
  for all using (auth.uid() = user_id);


-- 4. TRIGGER: Ensure album_ratings exists when album added to bank
create or replace function public.ensure_album_rating()
returns trigger as $$
begin
  insert into public.album_ratings (user_id, album_id, rating, games, comparisons_count)
  values (new.user_id, new.album_id, 1500, 0, 0)
  on conflict (user_id, album_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_ensure_album_rating on public.user_album_bank;
create trigger trg_ensure_album_rating
  after insert on public.user_album_bank
  for each row execute procedure public.ensure_album_rating();


-- 5. VIEW: v_vault_albums (mirrors v_vault_tracks)
create or replace view public.v_vault_albums as
select
  uab.liked_at,
  a.id,
  a.name,
  a.artist_ids,
  a.cover_url,
  ar.rating,
  ar.games,
  ar.comparisons_count
from public.user_album_bank uab
join public.albums a on uab.album_id = a.id
left join public.album_ratings ar on (ar.album_id = a.id and ar.user_id = auth.uid())
where uab.user_id = auth.uid();


-- 6. RPC: record_album_comparison (Elo calculation with dynamic K-factor)
create or replace function public.record_album_comparison(
  p_winner_id text,
  p_loser_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();

  -- Winner Data
  v_winner_rating float;
  v_winner_games int;

  -- Loser Data
  v_loser_rating float;
  v_loser_games int;

  -- Elo Variables
  v_k_winner float;
  v_k_loser float;
  v_expected_winner float;
  v_expected_loser float;
  v_new_winner_rating float;
  v_new_loser_rating float;
begin
  -- 1. Lock rows to prevent race conditions
  select rating, comparisons_count into v_winner_rating, v_winner_games
  from album_ratings
  where user_id = v_user_id and album_id = p_winner_id
  for update;

  select rating, comparisons_count into v_loser_rating, v_loser_games
  from album_ratings
  where user_id = v_user_id and album_id = p_loser_id
  for update;

  -- Handle missing ratings (shouldn't happen with trigger, but be safe)
  if v_winner_rating is null then
    v_winner_rating := 1500;
    v_winner_games := 0;
    insert into album_ratings (album_id, user_id, rating, games, comparisons_count)
    values (p_winner_id, v_user_id, 1500, 0, 0)
    on conflict do nothing;
  end if;

  if v_loser_rating is null then
    v_loser_rating := 1500;
    v_loser_games := 0;
    insert into album_ratings (album_id, user_id, rating, games, comparisons_count)
    values (p_loser_id, v_user_id, 1500, 0, 0)
    on conflict do nothing;
  end if;

  -- 2. Determine K-Factor (Dynamic)
  -- < 5 games = 64 (Placement), 5-20 = 32 (Adjustment), > 20 = 16 (Stable)

  if v_winner_games < 5 then v_k_winner := 64;
  elsif v_winner_games < 20 then v_k_winner := 32;
  else v_k_winner := 16;
  end if;

  if v_loser_games < 5 then v_k_loser := 64;
  elsif v_loser_games < 20 then v_k_loser := 32;
  else v_k_loser := 16;
  end if;

  -- 3. Elo Math
  v_expected_winner := 1.0 / (1.0 + power(10.0, (v_loser_rating - v_winner_rating) / 400.0));
  v_expected_loser := 1.0 / (1.0 + power(10.0, (v_winner_rating - v_loser_rating) / 400.0));

  v_new_winner_rating := v_winner_rating + v_k_winner * (1.0 - v_expected_winner);
  v_new_loser_rating := v_loser_rating + v_k_loser * (0.0 - v_expected_loser);

  -- 4. Update Winner
  update album_ratings
  set
    rating = v_new_winner_rating,
    comparisons_count = comparisons_count + 1,
    games = games + 1,
    updated_at = now()
  where user_id = v_user_id and album_id = p_winner_id;

  -- 5. Update Loser
  update album_ratings
  set
    rating = v_new_loser_rating,
    comparisons_count = comparisons_count + 1,
    games = games + 1,
    updated_at = now()
  where user_id = v_user_id and album_id = p_loser_id;

  -- 6. Insert Comparison Record
  insert into album_comparisons (user_id, winner_album_id, loser_album_id, created_at)
  values (v_user_id, p_winner_id, p_loser_id, now());

  -- 7. Return Result
  return jsonb_build_object(
    'winner_id', p_winner_id,
    'loser_id', p_loser_id,
    'winner_new_rating', v_new_winner_rating,
    'loser_new_rating', v_new_loser_rating
  );
end;
$$;


-- 7. REALTIME: Enable for album tables
alter publication supabase_realtime add table public.user_album_bank;
alter publication supabase_realtime add table public.album_ratings;


-- 8. INDEXES: For performance
create index if not exists idx_album_ratings_user on public.album_ratings (user_id);
create index if not exists idx_album_comparisons_user on public.album_comparisons (user_id);
create index if not exists idx_user_album_bank_user on public.user_album_bank (user_id);


-- 9. UPDATE reset_my_data to include album tables
create or replace function public.reset_my_data(confirm_mode text)
returns void
language plpgsql
security definer
as $$
begin
  if confirm_mode not in ('dev_fast', 'prod_confirmed') then
    raise exception 'Invalid confirmation mode';
  end if;

  delete from recent_searches where user_id = auth.uid();
  delete from comparisons where user_id = auth.uid();
  delete from album_comparisons where user_id = auth.uid();
  delete from track_ratings where user_id = auth.uid();
  delete from album_ratings where user_id = auth.uid();
  delete from user_bank where user_id = auth.uid();
  delete from user_album_bank where user_id = auth.uid();
  delete from user_preferences where user_id = auth.uid();
  delete from comparison_queue where user_id = auth.uid();
end;
$$;
