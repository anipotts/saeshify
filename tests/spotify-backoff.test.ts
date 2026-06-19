import { describe, expect, it } from "vitest";
import { nextSpotifyPollDelay } from "@/lib/playback/clock";
import { parseSpotifyNowPlayingResponse } from "@/lib/spotify/client";

describe("spotify polling policy", () => {
  it("polls active sessions faster than background sessions", () => {
    expect(nextSpotifyPollDelay("ok", true)).toBeLessThan(nextSpotifyPollDelay("ok", false));
  });

  it("uses a slower cadence when config is missing", () => {
    expect(nextSpotifyPollDelay("missing_config", true)).toBe(20_000);
  });

  it("honors spotify retry-after values for rate limits", async () => {
    const result = await parseSpotifyNowPlayingResponse(
      new Response(null, {
        status: 429,
        headers: { "retry-after": "42" }
      })
    );

    expect(result).toMatchObject({
      ok: false,
      status: "rate_limited",
      retryAfterMs: 42_000
    });
    expect(nextSpotifyPollDelay("rate_limited", true, result.ok ? undefined : result.retryAfterMs)).toBe(42_000);
  });

  it("maps empty, unauthorized, and forbidden spotify responses without throwing", async () => {
    await expect(parseSpotifyNowPlayingResponse(new Response(null, { status: 204 }))).resolves.toMatchObject({
      ok: false,
      status: "no_active_playback",
      retryAfterMs: 6000
    });
    await expect(parseSpotifyNowPlayingResponse(new Response(null, { status: 401 }))).resolves.toMatchObject({
      ok: false,
      status: "unauthorized",
      retryAfterMs: 15_000
    });
    await expect(parseSpotifyNowPlayingResponse(new Response(null, { status: 403 }))).resolves.toMatchObject({
      ok: false,
      status: "forbidden",
      retryAfterMs: 15_000
    });
  });

  it("normalizes a currently-playing track into a playback snapshot", async () => {
    const result = await parseSpotifyNowPlayingResponse(
      Response.json({
        currently_playing_type: "track",
        progress_ms: 12_345,
        is_playing: true,
        device: { id: "device-1", name: "ap-pro", type: "Computer" },
        item: {
          id: "spotify-track-1",
          name: "accordion",
          duration_ms: 129_000,
          artists: [{ name: "Madvillain" }],
          album: {
            name: "Madvillainy",
            images: [{ url: "https://example.com/cover.jpg" }]
          },
          external_ids: { isrc: "USST10400001" }
        }
      }),
      777
    );

    expect(result).toMatchObject({
      ok: true,
      snapshot: {
        trackId: "spotify-track-1",
        progressMs: 12_345,
        isPlaying: true,
        durationMs: 129_000,
        sampledAt: 777,
        source: "spotify",
        device: { id: "device-1", name: "ap-pro", type: "Computer" }
      },
      track: {
        spotifyTrackId: "spotify-track-1",
        isrc: "USST10400001",
        title: "accordion",
        artist: "Madvillain",
        album: "Madvillainy",
        durationMs: 129_000,
        artworkUrl: "https://example.com/cover.jpg"
      }
    });
  });
});
