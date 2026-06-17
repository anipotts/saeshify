import type { AnalysisCandidate, TrackIdentity } from "../types";
import { parseLrc } from "./lrc";

interface LrclibResponse {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  duration?: number;
}

export async function lrclibAdapter(track: TrackIdentity): Promise<AnalysisCandidate> {
  if (process.env.ALLOW_LRCLIB_PRIVATE_MODE !== "true") {
    throw new Error("lrclib adapter disabled. set ALLOW_LRCLIB_PRIVATE_MODE=true for private local mode.");
  }

  const params = new URLSearchParams({
    artist_name: track.artist,
    track_name: track.title
  });
  const response = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
    headers: {
      "user-agent": "saeshify-private-rhyme-instrument/0.2"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`lrclib returned ${response.status}`);
  }

  const data = (await response.json()) as LrclibResponse;
  if (!data.syncedLyrics) {
    throw new Error("lrclib result has no synced lyrics");
  }

  const parsed = parseLrc(data.syncedLyrics, "lrclib", track.durationMs || Math.round((data.duration || 0) * 1000));

  return {
    source: "lrclib",
    track,
    words: parsed.words.map((word) => ({ ...word, confidence: 0.8 })),
    lines: parsed.lines,
    confidence: 0.8
  };
}

