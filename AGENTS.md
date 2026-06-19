# saeshify agent context

saeshify is a realtime rhyme instrumentation system for spotify playback clocks.

the visible product is the instrument: a Spited-style rhyme visualization synced
to playback. the system underneath is external playback state in, analysis jobs
through adapters, cacheable track analyses out, and a frontend that stays locked
to the clock.

## positioning

- present saeshify as its own instrument, not a case study, explainer page, or
  commercial music app.
- use this one-liner: `live rhyme instrumentation for spotify playback clocks.`
- public copy should be sparse: name, one-liner, instrument, source.
- technical docs can mention playback clocks, polling, drift correction, queues,
  adapters, caching, and rendering.
- `saeshify.com` is the intended standalone landing page.
- backend/io matters underneath, but the product surface stays spare and direct.

## current direction

- public surface: cloudflare-hosted landing page plus fixture-safe `/instrument`.
- private local mode: real song assets under ignored `public/local-media/`.
- target demo space: Madvillainy, the 2004 Madvillain album, as the main private
  sample bank, with adjacent MF DOOM tracks only when useful for stress tests.
- public repo data: fixtures, templates, architecture, and tests only.
- realtime claim: spotify polling plus local playback interpolation, not spotify
  webhooks.
- social rooms, friends feed, and public multi-user surfaces are deferred.

## implementation rules

- keep this repo cloudflare-first: next.js on opennext/cloudflare workers.
- keep heavy transcription, alignment, source scraping, and audio processing
  outside workers in local or external workers.
- preserve spotify refresh tokens server-side only.
- never commit downloaded audio, full copyrighted lyrics, `.env*`, or private
  local media.
- private real-song screen recordings are acceptable demo assets when Ani
  explicitly asks, but do not add the raw assets to git.
- do not push, merge, deploy, bind domains, or change dns without explicit sign-off.
- keep human-facing copy lowercase, terse, technical, and concrete.

## expected architecture

- spotify now-playing poller handles 204, 401, 403, and 429 with backoff.
- browser sessions interpolate playback locally between server snapshots.
- analysis candidates share one stable `TrackAnalysis` schema.
- adapters should be parallel and retryable: fixture, private lrclib, local worker,
  and future transcription/alignment.
- scorer chooses the best candidate by timestamp density, word coverage, duration
  match, confidence, and source priority.
- cache by spotify track id plus analysis source version.
- renderer should preserve the Spited visual grammar: neutral grey page, black
  header strip, large readable text, saturated rectangular rhyme blocks, ghosted
  future lyrics, and word-level karaoke timing.

## quality bar

- a future implementation pass should behave like a long-running product build:
  inspect, implement, run tests, run cloudflare checks, open the browser, capture
  desktop and mobile screenshots, compare visually, fix, and repeat.
- do not stop at a passing build if the lyric surface looks clipped, generic,
  desynced, low-density, or unlike the reference.
- record source boundaries honestly. do not claim "any song in the world" until
  ingestion and rights boundaries are explicit.

## important docs

- `README.md`: repo explanation.
- `docs/saeshify-2026-research.md`: current technical anchors.
- `docs/implementation-spec.md`: next implementation spec.
- `docs/codex-goal-prompt.md`: goal prompt for a long autonomous codex pass.
- `docs/local-private-bank.md`: private song-bank setup.
- `docs/spited-reference-study.md`: visual reference notes.
- `docs/cloudflare-cutover.md`: dns and cloudflare cutover checklist.
