import type { TrackIdentity } from "./types";

export interface FixtureTrack extends TrackIdentity {
  lrc: string;
}

export const fixtureTracks: FixtureTrack[] = [
  {
    spotifyTrackId: "fixture-demo-cypher",
    title: "demo cypher",
    artist: "saeshify",
    durationMs: 32000,
    lrc: `[00:00.00] ayo I keep the meter right here
[00:03.20] low light bends into the night air
[00:06.40] close range drums land in a bright glare
[00:09.90] tight snares crack through the square air
[00:13.20] backend clocks track every live line
[00:16.80] word tails align on the right time
[00:20.30] private mode listens as the vowels climb
[00:24.00] public files only keep the demo rhyme`
  }
];
