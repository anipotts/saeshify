# saeshify implementation spec

version: 2026-06-19

## goal

turn saeshify into a polished realtime rhyme instrument with a backend/io core.

the end state is not a generic ai music app. it is a working system that makes a
playback clock visible: spotify-style input state, queued or cached analysis,
phonetic rhyme families, and a Spited-style renderer that stays synchronized with
the track.

## north star

the product should make the system feel obvious without over-explaining it:

```text
playback state comes in, analysis resolves to timed words, rhyme families appear,
and the lyric surface stays locked to the song.
```

## public scope

public github and `saeshify.com` should include:

- cloudflare-ready next.js app.
- public fixture demo that always works.
- screenshot and short recording of the instrument.
- short system explanation centered on the playback clock.
- local private mode docs for real-song assets.
- tests and ci that prove the pipeline is not a static mock.
- no raw copyrighted audio or full lyrics committed to git.

## private demo scope

private demo should use Madvillainy as the primary sample space.

target private tracks:

- Madvillain, `Accordion`
- Madvillain, `Meat Grinder`
- Madvillain, `Figaro`
- Madvillain, `All Caps`
- Madvillain, `Rhinestone Cowboy`
- Madvillain, `America's Most Blunted`
- Madvillain, `Raid`
- Madvillain, `Curls`
- Madvillain, `Money Folder`
- Madvillain, `Strange Ways`

the repo should contain a manifest template only. the actual audio and enhanced
lrc files live under ignored `public/local-media/`.

## architecture

### app shell

- `/` is the landing page for `saeshify.com`.
- `/instrument` is the working demo surface.
- `/api/health` returns service and deployment health.
- `/api/spotify/now-playing` returns playback snapshots from spotify credentials.
- `/api/analyze` accepts track identity plus selected adapters and returns
  `TrackAnalysis`.

### playback clock

snapshot shape:

```ts
type PlaybackSnapshot = {
  trackId: string;
  progressMs: number;
  isPlaying: boolean;
  durationMs: number | null;
  sampledAt: number;
  source: "spotify" | "fixture" | "manual";
  device?: {
    id?: string;
    name?: string;
    type?: string;
  };
};
```

rules:

- poll spotify only from server-side code.
- handle 204 as no active playback.
- handle 401 by clearing token cache and backing off.
- handle 403 as missing scope.
- handle 429 using `Retry-After`.
- foreground browser sessions poll more often than background sync.
- client interpolates progress between snapshots.
- client corrects drift on each new snapshot instead of jumping aggressively.

### analysis schema

keep one stable output schema:

```ts
type TrackAnalysis = {
  track: TrackIdentity;
  sources: AnalysisSource[];
  words: AnalysisWord[];
  lines: AnalysisLine[];
  rhymeFamilies: RhymeFamily[];
  metrics: {
    wordCount: number;
    lineCount: number;
    rhymeFamilyCount: number;
    rhymeDensity: number;
    durationMs: number;
  };
  provenance: {
    generatedAt: string;
    pipelineVersion: string;
    cacheKey: string;
  };
  quality: {
    score: number;
    bestSource: AnalysisAdapterKind;
    warnings: string[];
  };
};
```

adapter priority:

- fixture and enhanced lrc, always available.
- private lrclib, opt-in only.
- local worker, opt-in only.
- future transcription and alignment, external or local worker only.

scoring:

- prefer high timestamp density.
- prefer high word coverage.
- prefer duration match.
- prefer explicit word timing over line-only estimates.
- prefer local curated enhanced lrc for the private demo.
- expose rejected source warnings for debugging.

cache:

- key by spotify track id plus source version.
- for inline local lrc, include an lrc content hash.
- cached analysis must be reusable without reprocessing.

### rhyme engine

minimum behavior:

- normalize words.
- compute phonemes from cmudict-style lookup plus fallback.
- detect end rhymes.
- detect internal rhymes.
- detect near rhymes.
- detect repeated multisyllabic tails when possible.
- assign stable saturated color families.
- avoid highlighting quiet words unless they are part of a useful phrase.

future improvement:

- phrase-level family spans, not just word-level families.
- stronger g2p fallback.
- confidence bands for exact, inferred, and near rhyme.

### renderer

must match the reference direction:

- neutral grey lyric page.
- black title strip.
- large readable black text.
- saturated square-ish highlight blocks.
- 2px or greater vertical breathing room between highlight blocks.
- ghost future words until their timestamp.
- active word gets karaoke progress fill.
- past rhyme families stay colored.
- auto-scroll keeps current bar near upper-middle.
- desktop and mobile must both look designed.

avoid:

- card-heavy dashboards.
- analytics labels on top of the lyric surface.
- word chips that destroy bar readability.
- purple/blue startup gradients.
- cramped line boxes.
- explanatory text inside the instrument.

### landing page

landing page should prioritize a real screen recording:

- hero: product name, one-liner, private demo video.
- below: concise system diagram.
- below: backend/io readout: poller, queue, scorer, cache, renderer.
- below: fixture-safe public demo link and github link.
- below: source-boundary note.

copy should be lowercase, terse, and technical.

## implementation phases

### phase 1: repo and copy surface

- update README, AGENTS, CLAUDE.
- add research, implementation spec, and goal prompt docs.
- make Madvillainy the private demo sample-bank foundation.
- keep the branch clean and commit locally.

### phase 2: polished private local demo

- create ignored private local media manifest from template.
- add or generate enhanced lrc timing for at least three Madvillainy tracks.
- verify local audio playback, fallback clock, seeking, pausing, and replay.
- improve rhyme family density where the current algorithm misses obvious groups.
- capture desktop and mobile screenshots.

### phase 3: public landing page

- redesign `/` around the screen recording and backend/io system story.
- add architecture diagram.
- add public fixture demo route link.
- keep `saeshify.com` cloudflare-first.
- run full build and browser QA.

### phase 4: queue and worker proof

- add cloudflare queue bindings only after local demo is excellent.
- model analysis requests as jobs.
- add worker heartbeat and job state.
- keep heavy audio processing out of the worker.
- add observability readouts for pending, processing, cached, failed.

### phase 5: final demo proof

- record a private real-song demo video.
- capture mobile proof.
- write an anipotts.com project card.
- decide whether to deploy `saeshify.com`.

## test plan

unit tests:

- enhanced lrc parser with word timestamps.
- playback interpolation and drift correction.
- spotify response handling for 204, 401, 403, 429.
- analysis scoring and cache key behavior.
- rhyme detection for end, internal, near, and multisyllabic cases.

integration tests:

- mock now-playing track change.
- analysis cache hit avoids reprocessing.
- local manifest loads ahead of public fixtures.
- missing audio falls back to public-safe clock.
- unavailable analysis returns transparent state.

visual checks:

- desktop instrument screenshot.
- mobile instrument screenshot.
- long line wrapping.
- ghost future lyrics.
- active word progress.
- paused playback.
- seek jump.
- missing timestamps.
- no clipped text.
- no blank canvas.

cloudflare checks:

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run cf:build`
- verify `.open-next` contains no `local-media`.
- `npx wrangler deploy --dry-run`

browser checks:

- use in-app browser first.
- verify page identity and title.
- verify no framework overlay.
- verify console has no relevant warnings or errors.
- click play, pause, restart, seek, and song selection.
- capture desktop and mobile screenshots.
- inspect screenshots with `view_image`.
- iterate until visual issues are fixed.

## non-goals

- no public social rooms yet.
- no public spotify login yet.
- no public promise of every song support yet.
- no raw copyrighted assets in git.
- no platform migration away from cloudflare.
- no generic ai assistant bolted onto the music surface.

## done means

- public repo tells the right story.
- private demo can show multiple Madvillainy tracks locally.
- public fixture demo works without secrets.
- landing page makes the backend/io system legible in under 15 seconds.
- tests and cloudflare checks pass.
- desktop and mobile screenshots look like a finished product, not a prototype.
