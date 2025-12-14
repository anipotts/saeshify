# Supabase Setup for Saeshify

Follow these steps to configure your backend.

## 1. Create Project
Go to [database.new](https://database.new) and create a new project.

## 2. Environment Variables
Create a file named `.env.local` in the root of your project and add the following keys from your Supabase Project Settings > API:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

*Note: The Service Role Key is required for API routes that bypass RLS (e.g. data syncing).*

## 3. Database Schema setup
We have prepared a SQL script to set up all tables and security policies.

1. Go to the **SQL Editor** in your Supabase Dashboard.
2. Open the file `supabase/schema.sql` in this repository.
3. Copy the entire content.
4. Paste it into the SQL Editor and click **Run**.

This will create:
- Tables: `tracks`, `albums`, `user_bank`, `comparisons`, `track_ratings`, `comparison_queue`
- RLS Policies: Ensuring user data isolation.
- RPC Function: `record_comparison` for Elo updates.

## 4. Auth Settings
- Go to **Authentication > URL Configuration**.
- Add `http://localhost:3000/auth/callback` (or your production URL) to **Redirect URLs**.
