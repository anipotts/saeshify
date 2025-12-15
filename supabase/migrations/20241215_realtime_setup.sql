
-- Enable Realtime for key tables
alter publication supabase_realtime add table public.user_bank;
alter publication supabase_realtime add table public.track_ratings;

-- Note: 'v_vault_tracks' is a view, cannot listen to it directly. 
-- Must listen to underlying tables.
