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
    lrc: `[00:00.00] cold code folds over low light
[00:03.20] right hand writes while the night rides
[00:06.40] close range flows with a bright bite
[00:09.90] backend clocks keep the live line tight
[00:13.20] word tails glow when the vowels align
[00:16.80] dense schemes breathe over measured time
[00:20.30] no copied verse in the public file
[00:24.00] private mode maps what the speakers dial`
  }
];

