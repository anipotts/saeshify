# saeshify

live rhyme instrumentation for spotify playback.

saeshify watches your own spotify now-playing state, resolves the active track, runs lyric and timing adapters in parallel, scores the best analysis, computes dense phonetic rhyme families, and renders a color-coded lyric canvas synced to the playback clock.

the public repo ships fixtures only. private local mode can target real spotify tracks when you provide spotify credentials and optional local analysis services.

## shape

- next.js 16 on cloudflare workers via opennext
- local/private spotify now-playing polling with drift-corrected playback interpolation
- analysis adapters for fixtures, lrclib private mode, and a local worker endpoint
- deterministic phonetic rhyme detection for exact, internal, end, and near rhyme families
- no committed full-song lyrics or downloaded audio

## local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

open `http://localhost:3000/instrument`.

without spotify credentials, the app runs fixture mode. with spotify credentials, it can poll your active spotify playback from any device signed into the same account.

## private local song bank

drop ignored demo assets under `public/local-media/` and add a local
`manifest.json` to make real private tracks appear ahead of the public fixtures in
`/instrument`.

see `docs/local-private-bank.md` for the manifest and `.lrc` format. do not commit
full-song lyrics or audio.

## private spotify mode

set these in `.env.local`:

```bash
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=
```

the app uses the refresh token server-side to call spotify's currently-playing endpoint. spotify does not provide playback webhooks, so realtime means polling plus local interpolation.

## optional local analysis worker

```bash
npm run local:demo
```

this starts next.js and a local analysis worker stub. set `LOCAL_ANALYSIS_WORKER_URL=http://localhost:8788` to let the app ask that worker for analysis candidates.

## cloudflare

```bash
npm run cf:build
wrangler deploy --dry-run
```

dns migration notes live in `docs/cloudflare-cutover.md`. do not flip `saeshify.com` nameservers or deploy to the live domain without explicit sign-off.
