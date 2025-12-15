# SAEASHIFY BACKEND IMPLEMENTATION PLAN

## A. Authentication (Spotify OAuth + RLS)
1.  **Dependencies**: Install `@supabase/ssr` `@supabase/supabase-js` (Done).
2.  **Supabase Constants**: Define consistent client creaters.
    *   `lib/supabase/client.ts` (Client Component)
    *   `lib/supabase/server.ts` (Server Component / Actions)
    *   `lib/supabase/middleware.ts` (Session Refresh)
3.  **Callback Route**: `app/auth/callback/route.ts` to exchange code for session.
4.  **Database Updates**:
    *   Create `allowed_users` table.
    *   Update RLS policies for all tables to check `allowed_users`.
    *   Add `recent_searches` table.
    *   Add `user_preferences` table.
    *   Create `reset_my_data` RPC.

## B. Data Ingestion (Spotify -> Supabase)
1.  **Normalization**: Create `lib/utils/normalizeSpotify.ts`.
2.  **Saving Logic**: Create `lib/actions/vault.ts` (Server Actions).
    *   `addToVault(spotifyTrack)`: Upsert Track/Album/Artist -> Insert UserBank -> Init Rating.
3.  **Recent Searches**: Create `lib/actions/search.ts` (Server Actions).
    *   `logSearch(query, result?)`: Upsert to `recent_searches`.

## C. Matchmaking & Ranking
1.  **Matchmaking Engine**: Create `lib/ranking/matchmaking.ts`.
    *   Logic to find pairs (Random vs Uncertainty based).
    *   `getNextMatchup(userId)`: Returns 2 tracks.
2.  **Comparison Recording**: Ensure `record_comparison` RPC is used correctly.

## D. Data Hooks (The Contract)
1.  Create `lib/hooks/useData.ts` or individual hooks:
    *   `useVault()`
    *   `useRankings()`
    *   `useMatchup()`
    *   `useAuthUser()`

## Execution Order
1.  Supabase Client/Server/Middleware setup.
2.  Schema updates (run via SQL Command if possible, or provide SQL file for user).
3.  Auth Callback Route.
4.  Server Actions for Vault & Search.
5.  Matchmaking Logic.
6.  Export Hooks.
