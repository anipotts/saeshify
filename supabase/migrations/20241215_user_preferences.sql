-- Create user_preferences table
create table if not exists public.user_preferences (
  user_id uuid references auth.users on delete cascade not null primary key,
  display_name text,
  avatar_url text,
  explicit_content boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.user_preferences enable row level security;

create policy "Users can view their own preferences"
  on public.user_preferences for select
  using ( auth.uid() = user_id );

create policy "Users can update their own preferences"
  on public.user_preferences for update
  using ( auth.uid() = user_id );

create policy "Users can insert their own preferences"
  on public.user_preferences for insert
  with check ( auth.uid() = user_id );

-- Function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_auth_user_preferences_updated
  before update on public.user_preferences
  for each row execute procedure public.handle_updated_at();
