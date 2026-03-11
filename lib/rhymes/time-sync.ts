/**
 * High-precision Spotify playback clock.
 *
 * Spotify's API only updates position every ~1-2s. We interpolate between
 * polls using performance.now() for smooth word-level highlighting at 60fps.
 */

export interface PlaybackSnapshot {
  positionMs: number;
  isPlaying: boolean;
  timestamp: number; // performance.now() when this snapshot was recorded
  trackId: string | null;
}

const DRIFT_THRESHOLD_MS = 500;

/**
 * Compute the interpolated playback position based on the last snapshot.
 */
export function interpolatePosition(snapshot: PlaybackSnapshot): number {
  if (!snapshot.isPlaying) {
    return snapshot.positionMs;
  }
  const elapsed = performance.now() - snapshot.timestamp;
  return snapshot.positionMs + elapsed;
}

/**
 * Determine whether to snap or smooth-blend when receiving a new poll.
 * Returns the corrected position.
 */
export function reconcilePosition(
  newServerMs: number,
  interpolatedMs: number,
  isPlaying: boolean
): { positionMs: number; snapped: boolean } {
  if (!isPlaying) {
    return { positionMs: newServerMs, snapped: true };
  }

  const drift = Math.abs(newServerMs - interpolatedMs);
  if (drift > DRIFT_THRESHOLD_MS) {
    // Snap — user seeked or significant drift
    return { positionMs: newServerMs, snapped: true };
  }

  // Trust server position (minor correction)
  return { positionMs: newServerMs, snapped: false };
}
