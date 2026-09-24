# saeshify

rank your music by picking favorites, two at a time.

saeshify pulls your library from spotify and turns ranking into a series of quick head-to-heads: this song or that one, this album or that one. every pick feeds an elo rating, so after a few rounds you get a real ordered list instead of a vibe. you can also browse without logging in, you just don't get the ranking.

live at [saeshify.vercel.app](https://saeshify.vercel.app).

## what it does

- **search** tracks, albums and artists through the spotify api, with recents saved locally
- **vault**: save tracks and albums you actually care about. that's the pool you rank from
- **compare**: head-to-head matchups for tracks or albums. matchmaking skips pairs you've already seen
- **rankings**: your vault sorted by elo, per track and per album
- **library** and **settings**: profile, preferences, and a data page to reset or delete what you've ranked
- **nudges** (optional): a cron job reads your recent listening and sends a web push when you keep replaying one track (suggesting you vault it) or binge one artist
- **rhymes** (experimental): overlays rhyme families on the lyrics of whatever's playing. needs the separate rhyme service in `scripts/`, which runs on a gpu box and isn't part of the deploy

## stack

next 16 (app router) on react 19, supabase for auth and data (sql in `supabase/migrations`), zustand, tailwind, framer motion. production is on vercel today. the cloudflare workers build via opennext is done and passes ci but hasn't been cut over yet; `MIGRATION.md` has the exact state and what's still gated.

## run it

node 22 and pnpm 10.

```bash
pnpm install
pnpm dev
```

open http://localhost:3000. search works with just the spotify client vars. login, vault and rankings need a supabase project with the migrations applied.

env vars (names only, put values in `.env.local`):

| var | for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client auth and reads |
| `SUPABASE_SERVICE_ROLE_KEY` | cron routes only |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` | spotify login and api |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | web push, optional |
| `CRON_SECRET` | bearer token the cron routes require |

## checks

```bash
pnpm test               # vitest: elo math, matchmaking, vault, cron, pwa
pnpm exec tsc --noEmit
pnpm cf:build           # opennext worker build
```

ci runs all of that plus a wrangler dry run on every pr, and `main` only merges green.

## found a bug

open an issue. it's a side project, but i read them.
