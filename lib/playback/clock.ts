export interface PlaybackSnapshot {
  trackId: string | null;
  progressMs: number;
  isPlaying: boolean;
  durationMs: number | null;
  sampledAt: number;
  source: "spotify" | "fixture" | "manual";
  device?: {
    id?: string;
    name?: string;
    type?: string;
  };
}

const DRIFT_THRESHOLD_MS = 650;

export function interpolatePlayback(snapshot: PlaybackSnapshot, now = Date.now()) {
  if (!snapshot.isPlaying) return snapshot.progressMs;
  return Math.min(snapshot.durationMs || Number.MAX_SAFE_INTEGER, snapshot.progressMs + Math.max(0, now - snapshot.sampledAt));
}

export function reconcilePlayback(serverMs: number, interpolatedMs: number, isPlaying: boolean) {
  if (!isPlaying) {
    return { positionMs: serverMs, snapped: true };
  }

  const drift = Math.abs(serverMs - interpolatedMs);
  if (drift > DRIFT_THRESHOLD_MS) {
    return { positionMs: serverMs, snapped: true };
  }

  return {
    positionMs: Math.round(interpolatedMs * 0.7 + serverMs * 0.3),
    snapped: false
  };
}

export function nextSpotifyPollDelay(status: string, active: boolean, retryAfterMs?: number) {
  if (status === "rate_limited") return Math.max(retryAfterMs || 30_000, active ? 10_000 : 20_000);
  if (status === "missing_config") return 20_000;
  if (status === "unauthorized") return 15_000;
  if (status === "forbidden") return 30_000;
  if (status === "no_active_playback") return active ? 6000 : 18_000;
  if (status === "network_error") return 8000;
  return active ? 2200 : 9000;
}
