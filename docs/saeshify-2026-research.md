# saeshify 2026 research

research date: 2026-06-19

this doc is the current technical basis for the next saeshify build pass. it is
not a generic ai-music app plan. the project should read as realtime backend/io:
playback state in, analysis jobs through adapters, cached analysis out, visual
clock sync on the client.

## product framing

saeshify should present as a portfolio-system research demo.

public one-liner:

```text
live rhyme instrumentation for spotify playback clocks.
```

public description:

```text
saeshify watches spotify playback, aligns timed lyrics to the playback clock,
computes phonetic rhyme families, and renders a color-coded rhyme sheet in real
time as the track moves.
```

the demo should use a private real-song screen recording. the public github repo
should still ship fixture-safe data and local setup paths only.

## current technical anchors

### spotify as the clock source

spotify exposes a currently-playing endpoint, not a playback webhook:

- currently playing track reference:
  `https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track`
- rate limits:
  `https://developer.spotify.com/documentation/web-api/concepts/rate-limits`

spotify rate limiting is calculated across a rolling 30 second window, and 429
responses can include `Retry-After`. saeshify should keep its realtime claim
honest: polling plus client-side interpolation, with backoff on 204, 401, 403,
and 429.

### cloudflare as the realtime substrate

cloudflare workers plus opennext are credible for the public app:

- next.js on workers:
  `https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/`
- opennext cloudflare adapter:
  `https://opennext.js.org/cloudflare`

durable objects and queues are the right future shape for realtime coordination
and analysis orchestration:

- durable object websockets:
  `https://developers.cloudflare.com/durable-objects/best-practices/websockets/`
- queues:
  `https://developers.cloudflare.com/queues/`
- cloudflare agents:
  `https://developers.cloudflare.com/agents/`

durable object websocket hibernation matters because a future live-room or
spectator mode can keep sessions connected without keeping every object hot.
queues matter because analysis work should be retryable and observable rather
than coupled to a request.

### realtime audio model direction

realtime audio APIs are moving toward continuous stream interfaces:

- OpenAI realtime audio models:
  `https://openai.com/index/advancing-voice-intelligence-with-new-models-in-the-api/`
- Gemini Live API:
  `https://ai.google.dev/gemini-api/docs/live-api`
- LiveKit Agents:
  `https://docs.livekit.io/agents/`

the key signal for saeshify is not "add a chatbot." the signal is that streaming
audio, interruption, transcription, tool calls, websocket sessions, and live
observability are becoming normal infrastructure. saeshify should borrow that
architecture language for music playback analysis without turning into a voice
assistant.

### typescript agent and streaming ecosystem

Vercel AI SDK 6 is a useful market signal for typescript agent and streaming
abstractions:

- `https://vercel.com/blog/ai-sdk-6`

this repo stays cloudflare-first. use Vercel as ecosystem context, not as a
platform migration target.

## design implications

- lead with a real demo video, not an explainer card.
- show the clock, the queue/cache pipeline, and the renderer as one system.
- keep the lyric sheet Spited-like: grey page, black title strip, black text,
  saturated blocks, square corners, minimal chrome.
- use a spotify-like shell around the sheet without using spotify marks.
- make the public demo fixture-safe, but let the private demo use Madvillainy
  assets from ignored local files.
- do not claim universal song support. claim a local/private analysis pipeline
  that can be extended.

## directions worth exploring

### best next direction

ship a polished portfolio demo around one or more Madvillainy tracks:

- local private audio plus enhanced lrc timing.
- `/instrument` loads a local bank and plays from the selected track.
- lyric sheet scrolls by bar and reveals words by timestamp.
- rhyme families stay color-coded after they appear.
- architecture and observability panels explain the backend/io path.
- landing page uses the real screen recording as the primary artifact.

### later direction: queue-backed analysis

add a cloudflare queue for analysis requests and a local worker consumer for
heavy work:

- request track analysis from the app.
- enqueue analysis job with track id, source version, requested adapters.
- local worker or external worker performs alignment and phonetic analysis.
- app polls job state or receives websocket updates.
- cached analysis becomes the replayable artifact.

### later direction: durable object session room

only after solo mode is excellent:

- one durable object per playback session.
- browser connects over websocket.
- object stores latest playback snapshot and analysis state.
- spectators can view the same lyric clock without controlling playback.

this is deferred because it is less important than making the solo demo excellent.

### later direction: realtime transcription

use local whisperx or a realtime transcription API when lrc timing is missing:

- audio in.
- word timings out.
- adapter emits the same `TrackAnalysis` candidate shape.
- scorer compares it against synced lyric candidates.

do not block the portfolio demo on this. a hand-timed enhanced lrc for a few
Madvillainy tracks will produce a stronger demo faster.

## source boundaries

private local assets are allowed for the demo and for screen recordings when Ani
asks for them. the repo should not contain raw copyrighted audio or full lyrics.
the public demo should use original fixture text.
