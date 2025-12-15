-- 1. Ensure track_ratings exists for every user_bank item
-- (Invariant Check & Trigger)

-- Trigger Function
create or replace function public.ensure_track_rating()
returns trigger as $$
begin
  insert into public.track_ratings (user_id, track_id, rating, games, comparisons_count)
  values (new.user_id, new.track_id, 1500, 0, 0)
  on conflict (user_id, track_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger Definition
drop trigger if exists trg_ensure_track_rating on public.user_bank;
create trigger trg_ensure_track_rating
  after insert on public.user_bank
  for each row execute procedure public.ensure_track_rating();

-- Backfill missing ratings (Self-Healing)
insert into public.track_ratings (user_id, track_id, rating, games, comparisons_count)
select ub.user_id, ub.track_id, 1500, 0, 0
from public.user_bank ub
left join public.track_ratings tr on ub.user_id = tr.user_id and ub.track_id = tr.track_id
where tr.track_id is null;


-- 2. Enhanced record_comparison RPC with Dynamic K-Factor
create or replace function record_comparison(
  p_winner_id uuid,
  p_loser_id uuid,
  p_album_id uuid default null -- Optional context
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
  -- We select them to get current state
  select rating, comparisons_count into v_winner_rating, v_winner_games
  from track_ratings
  where user_id = v_user_id and track_id = p_winner_id
  for update;
  
  select rating, comparisons_count into v_loser_rating, v_loser_games
  from track_ratings
  where user_id = v_user_id and track_id = p_loser_id
  for update;
  
  if v_winner_rating is null or v_loser_rating is null then
    raise exception 'One or both tracks are missing ratings. Invariant violation.';
  end if;

  -- 2. Determine K-Factor (Dynamic)
  -- Rules: < 5 games = 64 (Placement), 5-20 = 32 (Adjustment), > 20 = 16 (Stable)
  
  -- Winner K
  if v_winner_games < 5 then v_k_winner := 64;
  elsif v_winner_games < 20 then v_k_winner := 32;
  else v_k_winner := 16;
  end if;
  
  -- Loser K
  if v_loser_games < 5 then v_k_loser := 64;
  elsif v_loser_games < 20 then v_k_loser := 32;
  else v_k_loser := 16;
  end if;
  
  -- 3. Elo Math
  -- Expected score = 1 / (1 + 10^((opp - self)/400))
  v_expected_winner := 1.0 / (1.0 + power(10.0, (v_loser_rating - v_winner_rating) / 400.0));
  v_expected_loser := 1.0 / (1.0 + power(10.0, (v_winner_rating - v_loser_rating) / 400.0));
  
  -- New Ratings
  -- New = Old + K * (Actual - Expected)
  -- Winner Actual = 1, Loser Actual = 0
  v_new_winner_rating := v_winner_rating + v_k_winner * (1.0 - v_expected_winner);
  v_new_loser_rating := v_loser_rating + v_k_loser * (0.0 - v_expected_loser);
  
  -- 4. Update Database
  
  -- Update Winner
  update track_ratings
  set 
    rating = v_new_winner_rating,
    comparisons_count = comparisons_count + 1,
    games = games + 1, -- explicitly update games alias too if schema differs
    updated_at = now()
  where user_id = v_user_id and track_id = p_winner_id;
  
  -- Update Loser
  update track_ratings
  set 
    rating = v_new_loser_rating,
    comparisons_count = comparisons_count + 1,
    games = games + 1,
    updated_at = now()
  where user_id = v_user_id and track_id = p_loser_id;
  
  -- Insert Comparison Record
  insert into comparisons (user_id, winner_track_id, loser_track_id, created_at)
  values (v_user_id, p_winner_id, p_loser_id, now());
  
  -- 5. Return Result
  return jsonb_build_object(
    'winner_id', p_winner_id,
    'loser_id', p_loser_id,
    'winner_new_rating', v_new_winner_rating,
    'loser_new_rating', v_new_loser_rating
  );
end;
$$;
