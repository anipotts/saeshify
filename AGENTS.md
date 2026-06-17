# saeshify agent context

saeshify is being rebuilt as a solo-first realtime rhyme instrumentation system.

## current direction

- public surface: cloudflare-hosted landing/status page.
- private local mode: spotify now-playing watcher plus rhyme visualization.
- public repo data: fixtures only. do not commit full copyrighted lyrics or downloaded audio.
- realtime claim: spotify polling plus local playback interpolation, not spotify webhooks.
- social rooms are deferred. leave architecture room for durable object rooms later.

## implementation rules

- keep this repo cloudflare-first: next.js on opennext/cloudflare workers.
- keep heavy transcription/alignment outside workers in local or external workers.
- preserve spotify refresh tokens server-side only.
- keep human-facing copy lowercase, terse, and concrete.
- do not push, merge, or change dns without ani's explicit sign-off.

