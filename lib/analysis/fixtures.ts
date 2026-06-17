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
    lrc: `[00:00.00] tap the clock and let the light land here
[00:03.20] every bright line finds the right-side air
[00:06.40] quiet bars wake when the vowels flare
[00:09.90] close range colors ride the same square
[00:13.20] backend clocks keep the live line tight
[00:16.80] word tails glow when vowels align
[00:20.30] private mode maps what speakers dial
[00:24.00] no copied verse lives in public files`
  }
];
