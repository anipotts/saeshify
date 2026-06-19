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
    title: "fixture 052",
    artist: "saeshify",
    durationMs: 67000,
    bankLabel: "demo verse",
    bankNote: "fixture timing",
    accent: "#1ed760",
    lrc: `[00:00.00] chrome green glow on the left side rail
[00:03.20] black shell hums while the verse lines trail
[00:06.60] tight little syllables ride through the night air
[00:10.10] bright blocks bloom on the right pair
[00:13.60] low drums knock when the page scrolls down
[00:17.10] cold vowels fold into a low sound
[00:20.70] clock hands cut through a thin bright line
[00:24.10] word tails lock while the colors climb
[00:27.70] near rhymes wait in the grey room
[00:31.20] red marks spark when the phrase hits soon
[00:34.70] magenta chains carry the same tone
[00:38.20] cyan side notes ring through the phone
[00:41.80] white space holds when the drums stay mild
[00:45.20] green tags land with a crooked smile
[00:48.80] if the chorus turns then the clock stays tight
[00:52.30] karaoke words chase the vocal light
[00:55.80] scroll keeps pace with the next line clear
[00:59.30] rhyme blocks stay when the bar gets near`
  },
  {
    spotifyTrackId: "fixture-doom-slot-a",
    title: "madvillainy slot 01",
    artist: "saeshify",
    durationMs: 73000,
    bankLabel: "madvillainy slot",
    bankNote: "fixture timing",
    accent: "#1ed760",
    localAudioUrl: process.env.NEXT_PUBLIC_SAESHIFY_DOOM_SLOT_A_AUDIO_URL || undefined,
    lrc: `[00:00.00] mask light flashes on a black home screen
[00:03.40] stacked rhyme patches where the track goes green
[00:06.80] right rail waits in a low light
[00:10.10] tight page shakes through a slow night
[00:13.80] old code moves with a low slow glow
[00:17.20] close notes fold where the cold tones go
[00:20.90] chrome bars march in a clean square frame
[00:24.20] same tails spark but the words stay plain
[00:27.80] left side shadows keep the nightfall small
[00:31.30] kick snare shivers and the whole page scrolls
[00:34.90] pink sound family wraps the air there
[00:38.40] red chain answers from the same fair snare
[00:42.00] cyan quick hits mark the offbeat rhyme
[00:45.50] yellow end caps land at the right time
[00:49.10] two turntables frame the room in rain
[00:52.60] crooked little drums keep the real name
[00:56.10] when the vocal starts then the words move through
[00:59.70] line after line like the reference view
[01:03.20] bottom player holds with a simple sign
[01:06.80] green progress cuts through the long timeline`
  },
  {
    spotifyTrackId: "fixture-doom-slot-b",
    title: "madvillainy slot 02",
    artist: "saeshify",
    durationMs: 62000,
    bankLabel: "madvillainy slot",
    bankNote: "fixture timing",
    accent: "#1ed760",
    localAudioUrl: process.env.NEXT_PUBLIC_SAESHIFY_DOOM_SLOT_B_AUDIO_URL || undefined,
    lrc: `[00:00.00] drop the needle and the page wakes up
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
[00:39.20] low end knocks while the kick drums hit
[00:42.50] midnight syllables line up with it
[00:45.80] bright ink catches the midnight light
[00:49.10] red magenta cyan green yellow white
[00:52.40] when the drums kick in the same colors work
[00:55.70] timed word streams make the rhyme page turn`
  }
];
