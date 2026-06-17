# spited reference study

research date: 2026-06-17

## source set

20 low-resolution reference videos were downloaded to `/tmp/saeshify-reference-research`
for local analysis only. none of the downloaded videos, audio, frames, or lyrics are
committed to this repo.

primary user reference:

- https://www.youtube.com/watch?v=Q_mSiKhXqaM

additional sampled Spited uploads:

- https://www.youtube.com/watch?v=616HnTkQv1M
- https://www.youtube.com/watch?v=l_MNfJ1oESQ
- https://www.youtube.com/watch?v=T8NjnrP1mGw
- https://www.youtube.com/watch?v=NJ-Vh1ABlPo
- https://www.youtube.com/watch?v=pC2BBrzGnz8
- https://www.youtube.com/watch?v=_B4pvb68L_M
- https://www.youtube.com/watch?v=uBpEU1cra7Q
- https://www.youtube.com/watch?v=2kndVfjLho0
- https://www.youtube.com/watch?v=s19n4wEv3Q8
- https://www.youtube.com/watch?v=-18zqISDT5k
- https://www.youtube.com/watch?v=b8DFika_1NQ
- https://www.youtube.com/watch?v=_5_POjTq80M
- https://www.youtube.com/watch?v=5GX52T4vM_g
- https://www.youtube.com/watch?v=RfEMb3OO7gA
- https://www.youtube.com/watch?v=p3rgC6xW1C8
- https://www.youtube.com/watch?v=wPcSLEl1fTU
- https://www.youtube.com/watch?v=oteHzyeW_mk
- https://www.youtube.com/watch?v=buFsSBUKqCo
- https://www.youtube.com/watch?v=kp620ya3ta0

## measured pass

local artifacts:

- selected list: `/tmp/saeshify-reference-research/meta/selected-20.json`
- per-video metrics: `/tmp/saeshify-reference-research/meta/visual-audio-analysis.json`
- summary: `/tmp/saeshify-reference-research/meta/analysis-summary.txt`
- contact sheet: `/tmp/saeshify-reference-research/contact/representative-20.jpg`
- motion samples: `/tmp/saeshify-reference-research/contact/samples-page-*.jpg`

observed metrics:

- videos: 20
- total duration sampled: 2069.1 seconds
- median video duration: 88.89 seconds
- median black header height: 5.2% of frame height
- primary MF DOOM reference header height: 13.3% of frame height
- median highlight coverage: 7.185% of frame area
- primary MF DOOM reference highlight coverage: 15.05% of frame area
- detected highlight palette families: red, magenta, purple, cyan, blue, green, yellow
- median vertical text drift over sampled frames: 6.1% of frame height
- primary MF DOOM reference vertical text drift: 7.5% of frame height

## visual system

- the core artifact is a lyric video page, not an app card.
- background is neutral grey, usually near `#d9d9d9`, with black text.
- a black title strip sits at the top of the lyric page.
- text is large, plain, and readable. the font is closer to a clean geometric sans
  than to a decorative lyric font.
- highlight blocks are rectangular, tight to the word or syllable, and lightly padded.
- highlight corners are effectively square.
- the important colors are saturated red, magenta/purple, cyan, yellow, green, and
  occasional grey. families keep the same color across the visible passage.
- dense rhyme families can overlap within one bar. the visual priority is the rhyme
  family, not an analytics label.
- there is very little chrome inside the lyric surface.

## timing system

- the videos are song-first. audio drives the reading pace.
- the page advances in verse windows, not individual isolated cards.
- lyrics scroll vertically as the song progresses.
- the current region stays readable near the upper-middle of the page.
- highlighted words are usually visible as part of the lyric document, while the
  viewer's attention moves by scroll position and the current vocal timing.
- the right target for saeshify is therefore:
  - select a local track
  - play or simulate the track clock
  - render the complete lyric/rhyme page
  - auto-scroll to the current bar
  - add a subtle karaoke active-word treatment without turning the whole page into
    one-word chips

## spotify shell rules

- surrounding app chrome should feel like spotify: black shell, green accent, compact
  left library, bottom player, dense typography, and minimal explanation.
- the lyric video surface should still look like Spited: grey page, black strip,
  saturated rhyme blocks.
- do not use spotify trademarks beyond broad color/interaction conventions.
- do not commit copyrighted full lyrics or audio. real MF DOOM local demo assets
  must live outside git under ignored local media paths.

## implementation target

v1 should replace the current static analysis view with a local song-bank player:

- left rail: local song bank with selectable tracks.
- main stage: Spited-style lyric page.
- bottom rail: spotify-like player controls and progress.
- behavior: selecting a track loads the timed analysis, starts the clock, scrolls to
  the current line, and marks the active word.
- public data: original fixture verses only.
- private local data: optional real audio plus local `.lrc` or generated analysis,
  ignored by git.
