import type { PlaybackSnapshot } from "@/lib/playback/clock";
import type { TrackIdentity } from "@/lib/analysis/types";

export type SpotifyNowPlayingResult =
  | {
      ok: true;
      snapshot: PlaybackSnapshot;
      track: TrackIdentity;
    }
  | {
      ok: false;
      status: "missing_config" | "unauthorized" | "forbidden" | "rate_limited" | "no_active_playback" | "spotify_error";
      httpStatus: number;
      retryAfterMs: number;
      message: string;
    };

