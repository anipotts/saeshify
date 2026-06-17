import { describe, expect, it } from "vitest";
import { interpolatePlayback, nextSpotifyPollDelay, reconcilePlayback, type PlaybackSnapshot } from "@/lib/playback/clock";

describe("playback clock", () => {
  it("interpolates playing snapshots", () => {
    const snapshot: PlaybackSnapshot = {
      trackId: "t1",
      progressMs: 1000,
      isPlaying: true,
      durationMs: 10_000,
      sampledAt: 1000,
      source: "spotify"
    };

    expect(interpolatePlayback(snapshot, 1600)).toBe(1600);
  });

  it("does not move paused snapshots", () => {
    const snapshot: PlaybackSnapshot = {
      trackId: "t1",
      progressMs: 1000,
      isPlaying: false,
      durationMs: 10_000,
      sampledAt: 1000,
      source: "spotify"
    };

    expect(interpolatePlayback(snapshot, 5000)).toBe(1000);
  });

  it("snaps when drift is large", () => {
    expect(reconcilePlayback(5000, 1000, true)).toEqual({ positionMs: 5000, snapped: true });
  });

  it("backs off for spotify rate limits", () => {
    expect(nextSpotifyPollDelay("rate_limited", true)).toBeGreaterThan(20_000);
  });
});

