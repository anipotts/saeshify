import { describe, expect, it } from "vitest";
import type { TrackIdentity } from "@/lib/analysis/types";
import type { SongBankTrack } from "@/lib/local-bank";
import { findSpotifyBankTrack, reconcileSpotifySnapshot } from "@/lib/playback/spotify-sync";

describe("spotify sync matching", () => {
  it("prefers exact spotify track ids", () => {
    const tracks = [makeTrack("local-accordion", "Accordion"), makeTrack("spotify-accordion", "Accordion")];

    expect(findSpotifyBankTrack(tracks, makeSpotifyTrack({ spotifyTrackId: "spotify-accordion" }))?.spotifyTrackId).toBe(
      "spotify-accordion"
    );
  });

  it("matches private local rows by isrc when the bank id stays local", () => {
    const tracks = [makeTrack("local-accordion", "Accordion", { isrc: "USST10400001" })];

    expect(findSpotifyBankTrack(tracks, makeSpotifyTrack({ isrc: "usst10400001" }))?.spotifyTrackId).toBe("local-accordion");
  });

  it("falls back to title and loose artist matching for manifest templates", () => {
    const tracks = [makeTrack("local-madvillain-accordion", "Accordion", { artist: "Madvillain" })];

    expect(
      findSpotifyBankTrack(
        tracks,
        makeSpotifyTrack({
          spotifyTrackId: "spotify-real-id",
          title: "Accordion",
          artist: "Madvillain, Madlib, MF DOOM",
          album: "Madvillainy"
        })
      )?.spotifyTrackId
    ).toBe("local-madvillain-accordion");
  });

  it("rejects title-only collisions", () => {
    const tracks = [makeTrack("wrong-accordion", "Accordion", { artist: "other artist" })];

    expect(findSpotifyBankTrack(tracks, makeSpotifyTrack({ title: "Accordion", artist: "Madvillain" }))).toBeNull();
  });

  it("reconciles a spotify snapshot against local browser position", () => {
    const reconciled = reconcileSpotifySnapshot(
      {
        trackId: "spotify-1",
        progressMs: 10_000,
        isPlaying: true,
        durationMs: 60_000,
        sampledAt: 1000,
        source: "spotify"
      },
      10_400,
      1300
    );

    expect(reconciled).toMatchObject({
      serverMs: 10_300,
      snapped: false,
      driftMs: -100
    });
    expect(reconciled.positionMs).toBe(10370);
  });
});

function makeTrack(
  spotifyTrackId: string,
  title: string,
  overrides: Partial<SongBankTrack> = {}
): SongBankTrack {
  return {
    spotifyTrackId,
    title,
    artist: "Madvillain",
    album: "Madvillainy",
    durationMs: 129_000,
    lrc: "[00:00.00] line",
    ...overrides
  };
}

function makeSpotifyTrack(overrides: Partial<TrackIdentity> = {}): TrackIdentity {
  return {
    spotifyTrackId: "spotify-track",
    title: "Accordion",
    artist: "Madvillain",
    album: "Madvillainy",
    durationMs: 129_000,
    ...overrides
  };
}
