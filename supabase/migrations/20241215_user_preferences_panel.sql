
-- Add panel state columns to user_preferences
alter table public.user_preferences 
  add column if not exists details_panel_open boolean default false,
  add column if not exists details_width integer default 360;
