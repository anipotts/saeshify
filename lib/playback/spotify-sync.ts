import type { TrackIdentity } from "@/lib/analysis/types";
import type { SongBankTrack } from "@/lib/local-bank";
import { interpolatePlayback, reconcilePlayback, type PlaybackSnapshot } from "@/lib/playback/clock";

export interface SpotifyReconcileResult {
  positionMs: number;
  snapped: boolean;
  serverMs: number;
  driftMs: number;
}

export function findSpotifyBankTrack(tracks: SongBankTrack[], spotifyTrack: TrackIdentity) {
  const candidates = tracks
    .map((track) => ({
      track,
      score: scoreSpotifyBankTrack(track, spotifyTrack)
    }))
    .filter((candidate) => candidate.score >= 55)
    .sort((left, right) => right.score - left.score);

  return candidates[0]?.track || null;
}

export function reconcileSpotifySnapshot(
  snapshot: PlaybackSnapshot,
  localPositionMs: number,
  now = Date.now()
): SpotifyReconcileResult {
  const serverMs = interpolatePlayback(snapshot, now);
  const reconciled = reconcilePlayback(serverMs, localPositionMs, snapshot.isPlaying);

  return {
    ...reconciled,
    serverMs,
    driftMs: Math.round(serverMs - localPositionMs)
  };
}

function scoreSpotifyBankTrack(track: SongBankTrack, spotifyTrack: TrackIdentity) {
  let score = 0;

  if (track.spotifyTrackId && spotifyTrack.spotifyTrackId && track.spotifyTrackId === spotifyTrack.spotifyTrackId) {
    score += 120;
  }

  if (track.isrc && spotifyTrack.isrc && cleanKey(track.isrc) === cleanKey(spotifyTrack.isrc)) {
    score += 90;
  }

  const titleMatch = cleanKey(track.title) === cleanKey(spotifyTrack.title);
  const artistMatch = looseArtistMatch(track.artist, spotifyTrack.artist);
  const albumMatch = track.album && spotifyTrack.album && cleanKey(track.album) === cleanKey(spotifyTrack.album);
  const durationMatch =
    track.durationMs && spotifyTrack.durationMs ? Math.abs(track.durationMs - spotifyTrack.durationMs) <= 2500 : false;

  if (titleMatch) score += 42;
  if (artistMatch) score += 28;
  if (albumMatch) score += 12;
  if (durationMatch) score += 6;

  if (!titleMatch && score < 90) return 0;
  if (titleMatch && !artistMatch && score < 90) return 0;

  return score;
}

function looseArtistMatch(left: string, right: string) {
  const leftKey = cleanKey(left);
  const rightKey = cleanKey(right);
  if (!leftKey || !rightKey) return false;

  return leftKey.includes(rightKey) || rightKey.includes(leftKey);
}

function cleanKey(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
