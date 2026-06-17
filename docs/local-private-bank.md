# local private song bank

private song demos live under `public/local-media/`, which is ignored by git.
use this for mf doom, drake, kendrick, or any other real song assets you are
testing locally. the Cloudflare build script strips `local-media` out of the
OpenNext asset bundle before dry-run or deploy.

## file layout

```text
public/local-media/
  manifest.json
  doom-that-that.mp3
  doom-that-that.lrc
  doom-rhymes-like-dimes.mp3
  doom-rhymes-like-dimes.lrc
```

## manifest

`public/local-media/manifest.json`:

```json
{
  "tracks": [
    {
      "spotifyTrackId": "local-mf-doom-that-that",
      "title": "that's that",
      "artist": "mf doom",
      "durationMs": 129000,
      "bankLabel": "private mf doom",
      "bankNote": "private local lrc",
      "audioUrl": "doom-that-that.mp3",
      "lrcUrl": "doom-that-that.lrc"
    }
  ]
}
```

urls can be bare filenames or `/local-media/...` paths. the app keeps them inside
`/local-media/`.

for the 10-track mf doom private demo scaffold, copy
`docs/mf-doom-local-bank.template.json` to `public/local-media/manifest.json`,
then place legally supplied audio and matching `.lrc` files next to it. the
template is metadata only; it intentionally contains no copyrighted audio or full
lyrics.

## lrc format

use one timestamped line per bar or short lyric line:

```text
[00:00.00] first timed lyric line here
[00:03.20] next timed lyric line here
[00:06.80] another timed line here
```

for spited-style playback, use enhanced word timestamps inside each bar. the line
timestamp controls bar layout and scroll position; each `<mm:ss.xx>` tag controls
the exact word reveal:

```text
[00:06.00]<00:06.00>first <00:06.32>timed <00:06.68>word <00:07.04>run
[00:08.20]<00:08.20>next <00:08.54>bar <00:08.91>lands <00:09.22>clean
```

the client fetches the local `.lrc`, sends it to the local analyzer route, computes
phonetic rhyme families, and uses the audio element as the playback clock when the
audio file exists. if audio is missing, the same track still runs on the public-safe
clock so the rhyme sheet can be checked.

## rules

- do not commit `public/local-media/`.
- do not commit full copyrighted lyrics.
- do not commit downloaded audio.
- use this path for private local demos only.
