# codex goal prompt

use this prompt when handing saeshify to codex for the next autonomous build pass.

```text
you are codex working in /Users/anipotts/Personal/people/saesha-rajput/saeshify.

goal: implement docs/implementation-spec.md end to end until saeshify is a
polished realtime rhyme instrument with a backend/io core.

read first:
- AGENTS.md
- README.md
- docs/saeshify-2026-research.md
- docs/implementation-spec.md
- docs/local-private-bank.md
- docs/spited-reference-study.md
- docs/cloudflare-cutover.md

project framing:
- saeshify is its own experimental instrument, not an explainer page and not a
  commercial music app.
- backend/io is the system underneath, not the public surface screaming at users.
- music-tech taste comes through the Spited-style rhyme sheet.
- public copy one-liner: live rhyme instrumentation for spotify playback clocks.
- public github must stay fixture-safe.
- private local demo should use Madvillainy as the foundation.

you have permission to work for a long time and iterate. do not stop just
because the first implementation compiles. build, inspect, test, visually review,
fix, and repeat until the result would impress Ani.

constraints:
- do not push, deploy, bind domains, change dns, or merge without explicit sign-off.
- do not commit .env files, downloaded audio, full copyrighted lyrics, or private
  local media.
- private local assets may exist under ignored public/local-media for testing.
- keep cloudflare-first architecture.
- keep heavy audio processing in local or external workers, not in cloudflare workers.
- keep human-facing copy lowercase, terse, technical, and concrete.

implementation priorities:
1. make the repo docs and project surface consistent with the product-first positioning.
2. make /instrument a polished local song-bank product surface.
3. make Madvillainy private local mode feel real with multiple selectable tracks
   when assets are available.
4. improve rhyme highlighting toward bar-level Spited quality, not isolated word
   chips.
5. make the public landing page at / feel like saeshify itself: minimal, direct,
   and centered on the instrument.
6. add or improve tests for parser, playback clock, spotify backoff, analysis
   scoring, cache behavior, local manifest, and visual edge cases.

quality loop:
- inspect repo state and branch.
- implement a focused slice.
- run npm run lint.
- run npm test.
- run npm run build.
- run npm run cf:build.
- verify .open-next contains no local-media assets.
- run npx wrangler deploy --dry-run.
- start the preview server.
- use the in-app browser first for page identity, dom, console, and interaction.
- capture desktop and mobile screenshots.
- inspect screenshots with view_image.
- compare against docs/spited-reference-study.md.
- fix visible issues.
- repeat until the product is clean.

visual acceptance:
- no blank canvas.
- no clipped lyrics.
- no overlapping highlight boxes.
- no cramped line spacing.
- future words are ghosted until timing reaches them.
- active word shows karaoke progress.
- past rhyme families remain colored.
- current bar stays readable near upper-middle.
- mobile layout is not an afterthought.
- instrument feels like a product, not a dashboard.

when committing:
- use local commits only unless Ani explicitly authorizes push.
- commit as Codex <codex@anipotts.com>.
- commit messages should be conventional, lowercase, imperative, under 70 chars.
- commit body should say why and list verification.

final report:
- summarize what changed.
- list exact verification commands.
- include preview url.
- include screenshot paths.
- state whether anything remains blocked.
- state plainly that no push/deploy/dns change happened.
```
