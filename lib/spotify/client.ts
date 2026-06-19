import type { SpotifyNowPlayingResult } from "./types";

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export async function getSpotifyNowPlaying(): Promise<SpotifyNowPlayingResult> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return {
      ok: false,
      status: "missing_config",
      httpStatus: 503,
      retryAfterMs: 20_000,
      message: "spotify secrets missing. fixture mode is active."
    };
  }

  const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing?additional_types=track", {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });

  const result = await parseSpotifyNowPlayingResponse(response);
  if (!result.ok && result.status === "unauthorized") {
    cachedAccessToken = null;
  }
  return result;
}

export async function parseSpotifyNowPlayingResponse(response: Response, sampledAt = Date.now()): Promise<SpotifyNowPlayingResult> {
  if (response.status === 204) {
    return {
      ok: false,
      status: "no_active_playback",
      httpStatus: 200,
      retryAfterMs: 6000,
      message: "no active spotify playback"
    };
  }

  if (response.status === 401) {
    return {
      ok: false,
      status: "unauthorized",
      httpStatus: 401,
      retryAfterMs: 15_000,
      message: "spotify token rejected"
    };
  }

  if (response.status === 403) {
    return {
      ok: false,
      status: "forbidden",
      httpStatus: 403,
      retryAfterMs: 15_000,
      message: "spotify scope missing user-read-currently-playing"
    };
  }

  if (response.status === 429) {
    const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
    return {
      ok: false,
      status: "rate_limited",
      httpStatus: 429,
      retryAfterMs: retryAfter,
      message: "spotify rate limited the poller"
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: "spotify_error",
      httpStatus: response.status,
      retryAfterMs: 10_000,
      message: `spotify returned ${response.status}`
    };
  }

  const payload = await response.json();
  const item = payload.item;
  if (!item || payload.currently_playing_type !== "track") {
    return {
      ok: false,
      status: "no_active_playback",
      httpStatus: 200,
      retryAfterMs: 6000,
      message: "spotify is not playing a track"
    };
  }

  return {
    ok: true,
    snapshot: {
      trackId: item.id,
      progressMs: payload.progress_ms || 0,
      isPlaying: Boolean(payload.is_playing),
      durationMs: item.duration_ms || null,
      sampledAt,
      source: "spotify",
      device: payload.device
        ? {
            id: payload.device.id,
            name: payload.device.name,
            type: payload.device.type
          }
        : undefined
    },
    track: {
      spotifyTrackId: item.id,
      isrc: item.external_ids?.isrc,
      title: item.name,
      artist: item.artists?.map((artist: { name: string }) => artist.name).join(", ") || "unknown artist",
      album: item.album?.name,
      durationMs: item.duration_ms,
      artworkUrl: item.album?.images?.[0]?.url
    }
  };
}

function parseRetryAfter(value: string | null) {
  const seconds = Number(value || "30");
  if (!Number.isFinite(seconds) || seconds <= 0) return 30_000;
  return Math.ceil(seconds * 1000);
}

async function getAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30_000) {
    return cachedAccessToken.token;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    }),
    cache: "no-store"
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000
  };
  return cachedAccessToken.token;
}
