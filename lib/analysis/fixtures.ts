import type { TrackIdentity } from "./types";

export interface FixtureTrack extends TrackIdentity {
  lrc: string;
  bankLabel?: string;
  bankNote?: string;
  accent?: string;
  localAudioUrl?: string;
  lrcUrl?: string;
}

export const fixtureTracks: FixtureTrack[] = [
  {
    spotifyTrackId: "fixture-demo-cypher",
    title: "local demo 052",
    artist: "saeshify study bank",
    durationMs: 67000,
    bankLabel: "reference study",
    bankNote: "public-safe timing fixture",
    accent: "#1ed760",
    lrc: `[00:00.00] chrome green glow on the left side rail
[00:03.20] black shell hums while the verse lines trail
[00:06.60] tight little syllables ride through the night air
[00:10.10] bright blocks bloom on the right pair
[00:13.60] low drums knock when the page scrolls down
[00:17.10] close vowels fold into a cold sound
[00:20.70] backend clocks keep the bar in line
[00:24.10] word tails align while the colors climb
[00:27.70] every near rhyme waits in the grey room
[00:31.20] red marks spark when the phrase hits soon
[00:34.70] magenta chains carry the same tone
[00:38.20] cyan side notes lock to a late phone
[00:41.80] no copied verse sits in the public file
[00:45.20] local mode points at a private style
[00:48.80] if the song slot loads then the clock stays tight
[00:52.30] karaoke words chase the vocal light
[00:55.80] scroll keeps pace with the next line clear
[00:59.30] rhyme blocks stay when the bar gets near`
  },
  {
    spotifyTrackId: "fixture-doom-slot-a",
    title: "doom slot a",
    artist: "local bank",
    durationMs: 73000,
    bankLabel: "mf doom slot",
    bankNote: "add private audio/lrc locally",
    accent: "#1ed760",
    localAudioUrl: process.env.NEXT_PUBLIC_SAESHIFY_DOOM_SLOT_A_AUDIO_URL || undefined,
    lrc: `[00:00.00] mask light flashes on a black home screen
[00:03.40] stacked rhyme patches where the track goes green
[00:06.80] right rail waits for the next night scene
[00:10.10] tight page shakes when the bright lines lean
[00:13.80] old code moves with a low slow glow
[00:17.20] close notes fold where the cold tones go
[00:20.90] chrome bars march in a clean square frame
[00:24.20] same tails spark but the words stay plain
[00:27.80] left side library keeps the set bank small
[00:31.30] click one record and the whole page scrolls
[00:34.90] pink sound family wraps the air there
[00:38.40] red chain answers from the same fair snare
[00:42.00] cyan quick hits mark the offbeat rhyme
[00:45.50] yellow end caps land at the right time
[00:49.10] no full song text ships in the repo lane
[00:52.60] private local files carry the real name
[00:56.10] when the vocal starts then the words move through
[00:59.70] line after line like the reference view
[01:03.20] bottom player holds with a simple sign
[01:06.80] green progress cuts through the long timeline`
  },
  {
    spotifyTrackId: "fixture-doom-slot-b",
    title: "doom slot b",
    artist: "local bank",
    durationMs: 62000,
    bankLabel: "mf doom slot",
    bankNote: "second private-song fixture",
    accent: "#1ed760",
    localAudioUrl: process.env.NEXT_PUBLIC_SAESHIFY_DOOM_SLOT_B_AUDIO_URL || undefined,
    lrc: `[00:00.00] select the record and the page wakes up
[00:03.00] deck turns dark while the green lights cut
[00:06.20] vowel maps stack in a bright red run
[00:09.40] night words answer when the next line comes
[00:12.80] grey lyric sheet keeps the whole verse near
[00:16.10] black title strip makes the source feel clear
[00:19.40] magenta air pairs with the square stare
[00:22.70] close range colors hit the same rare snare
[00:26.00] scroll not cards and no dashboard maze
[00:29.30] just the track clock moving through the phrase
[00:32.60] active word glows but the rhyme blocks stay
[00:35.90] past lines settle while the next bars play
[00:39.20] local audio can sit outside git
[00:42.50] private lyric files can line up with it
[00:45.80] public demo keeps the method in sight
[00:49.10] red magenta cyan green yellow white
[00:52.40] when the bank is real the same engine works
[00:55.70] timed word streams make the rhyme page turn`
  }
];
