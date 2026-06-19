import { describe, expect, it, vi } from "vitest";
import type { FixtureTrack } from "@/lib/analysis/fixtures";
import {
  mergeLocalTracks,
  normalizeLocalMediaUrl,
  resolveInitialPlayback,
  resolveLocalManifestTrack,
  resolveLocalManifestTracks
} from "@/lib/local-bank";

describe("local bank", () => {
  it("normalizes local media filenames without rewriting absolute URLs", () => {
    expect(normalizeLocalMediaUrl("doom-slot-a.mp3")).toBe("/local-media/doom-slot-a.mp3");
    expect(normalizeLocalMediaUrl("local-media/doom-slot-b.lrc")).toBe("/local-media/doom-slot-b.lrc");
    expect(normalizeLocalMediaUrl("/local-media/manifest-track.lrc")).toBe("/local-media/manifest-track.lrc");
    expect(normalizeLocalMediaUrl("https://example.com/private.wav")).toBe("https://example.com/private.wav");
  });

  it("rejects manifest tracks without identity", async () => {
    const readText = vi.fn(async () => null);

    await expect(resolveLocalManifestTrack({ spotifyTrackId: "", title: "x", artist: "y" }, readText)).resolves.toBeNull();
  });

  it("keeps manifest tracks with missing lrc as unavailable rows", async () => {
    const readText = vi.fn(async () => null);

    const track = await resolveLocalManifestTrack(
      { spotifyTrackId: "missing-lrc", title: "private song", artist: "private artist", lrcUrl: "missing.lrc" },
      readText
    );

    expect(track).toMatchObject({
      spotifyTrackId: "missing-lrc",
      lrc: "",
      unavailableReason: "missing lrc /local-media/missing.lrc",
      bankNote: "missing local lrc"
    });
  });

  it("prefers inline lrc and skips network reads", async () => {
    const readText = vi.fn(async () => "[00:00.00] fetched line");

    const track = await resolveLocalManifestTrack(
      {
        spotifyTrackId: "local-inline",
        isrc: "USST10400001",
        title: "private song",
        artist: "private artist",
        audioUrl: "audio.wav",
        lrcUrl: "lyrics.lrc",
        lrc: "[00:00.00] inline line"
      },
      readText
    );

    expect(readText).not.toHaveBeenCalled();
    expect(track?.localAudioUrl).toBe("/local-media/audio.wav");
    expect(track?.lrcUrl).toBe("/local-media/lyrics.lrc");
    expect(track?.isrc).toBe("USST10400001");
    expect(track?.lrc).toContain("inline line");
  });

  it("resolves lrc files through the provided reader", async () => {
    const readText = vi.fn(async (url: string) => (url === "/local-media/lyrics.lrc" ? "[00:00.00] fetched line" : null));

    const track = await resolveLocalManifestTrack(
      {
        spotifyTrackId: "local-fetch",
        title: "private song",
        artist: "private artist",
        lrcUrl: "lyrics.lrc"
      },
      readText
    );

    expect(readText).toHaveBeenCalledWith("/local-media/lyrics.lrc");
    expect(track?.bankLabel).toBe("private local");
    expect(track?.lrc).toContain("fetched line");
  });

  it("filters invalid manifest rows but keeps unavailable local rows visible", async () => {
    const tracks = await resolveLocalManifestTracks(
      {
        tracks: [
          { spotifyTrackId: "valid", title: "valid", artist: "artist", lrc: "[00:00.00] line" },
          { spotifyTrackId: "missing-lrc", title: "missing", artist: "artist" },
          { spotifyTrackId: "", title: "invalid", artist: "artist" }
        ]
      },
      async () => null
    );

    expect(tracks.map((track) => track.spotifyTrackId)).toEqual(["valid", "missing-lrc"]);
    expect(tracks[1].unavailableReason).toBe("missing lrc");
  });

  it("keeps local tracks ahead of public fixtures and removes duplicates", () => {
    const local = makeFixture("shared", "local");
    const publicTracks = [makeFixture("shared", "public duplicate"), makeFixture("fixture", "public fixture")];

    expect(mergeLocalTracks([local], publicTracks).map((track) => track.title)).toEqual(["local", "public fixture"]);
  });

  it("selects initial playback from query state defensively", () => {
    const tracks = [makeFixture("first", "first"), makeFixture("second", "second")];

    expect(resolveInitialPlayback(tracks, { requestedTrackId: "second", startMs: "6500", autoplay: "1" })).toMatchObject({
      track: tracks[1],
      startMs: 6500,
      autoplay: true
    });
    expect(resolveInitialPlayback(tracks, { requestedTrackId: "missing", startMs: "-10", autoplay: "0" })).toMatchObject({
      track: tracks[0],
      startMs: 0,
      autoplay: false
    });
  });

  it("defaults to the first playable track when local manifest rows are unavailable", () => {
    const unavailable = { ...makeFixture("missing-lrc", "missing"), unavailableReason: "missing lrc" };
    const playable = makeFixture("fixture", "fixture");

    expect(resolveInitialPlayback([unavailable, playable], {})).toMatchObject({
      track: playable,
      startMs: 0,
      autoplay: false
    });
    expect(resolveInitialPlayback([unavailable, playable], { requestedTrackId: "missing-lrc" })).toMatchObject({
      track: unavailable
    });
  });
});

function makeFixture(spotifyTrackId: string, title: string): FixtureTrack {
  return {
    spotifyTrackId,
    title,
    artist: "fixture artist",
    durationMs: 1000,
    lrc: "[00:00.00] fixture line"
  };
}
