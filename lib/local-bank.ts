import { fixtureTracks, type FixtureTrack } from "@/lib/analysis/fixtures";

export const LOCAL_MANIFEST_URL = "/local-media/manifest.json";

export interface LocalBankManifestTrack {
  spotifyTrackId: string;
  isrc?: string;
  title: string;
  artist: string;
  album?: string;
  durationMs?: number;
  artworkUrl?: string;
  bankLabel?: string;
  bankNote?: string;
  localAudioUrl?: string;
  audioUrl?: string;
  lrcUrl?: string;
  lrc?: string;
}

export interface LocalBankManifest {
  tracks?: LocalBankManifestTrack[];
}

export interface SongBankTrack extends FixtureTrack {
  unavailableReason?: string;
}

export interface InitialPlaybackInput {
  requestedTrackId?: string | null;
  startMs?: number | string | null;
  autoplay?: boolean | string | null;
}

export type LocalTextFetcher = (url: string) => Promise<string | null>;

export async function resolveLocalManifestTracks(
  manifest: LocalBankManifest | null | undefined,
  readText: LocalTextFetcher = fetchLocalText
) {
  if (!manifest?.tracks?.length) return [];

  const tracks = await Promise.all(manifest.tracks.map((track) => resolveLocalManifestTrack(track, readText)));
  return tracks.filter((track): track is SongBankTrack => Boolean(track));
}

export async function resolveLocalManifestTrack(
  track: LocalBankManifestTrack,
  readText: LocalTextFetcher = fetchLocalText
): Promise<SongBankTrack | null> {
  if (!track.spotifyTrackId || !track.title || !track.artist) return null;

  const lrcUrl = normalizeLocalMediaUrl(track.lrcUrl);
  const localAudioUrl = normalizeLocalMediaUrl(track.localAudioUrl || track.audioUrl);
  const lrc = track.lrc || (lrcUrl ? await readText(lrcUrl) : null);

  return {
    spotifyTrackId: track.spotifyTrackId,
    isrc: track.isrc,
    title: track.title,
    artist: track.artist,
    album: track.album,
    durationMs: track.durationMs,
    artworkUrl: track.artworkUrl,
    bankLabel: track.bankLabel || "private local",
    bankNote: track.bankNote || (lrc?.trim() ? "private local lrc" : "missing local lrc"),
    localAudioUrl,
    lrcUrl,
    lrc: lrc || "",
    unavailableReason: lrc?.trim() ? undefined : unavailableReasonForTrack(lrcUrl)
  };
}

export function mergeLocalTracks(localTracks: SongBankTrack[], publicTracks: FixtureTrack[] = fixtureTracks): SongBankTrack[] {
  if (localTracks.length === 0) return publicTracks;

  const localIds = new Set(localTracks.map((track) => track.spotifyTrackId));
  return [...localTracks, ...publicTracks.filter((track) => !localIds.has(track.spotifyTrackId))];
}

export function normalizeLocalMediaUrl(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/^(https?:|blob:|data:)/.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return `/local-media/${trimmed.replace(/^local-media\//, "")}`;
}

export function resolveInitialPlayback(tracks: SongBankTrack[], input: InitialPlaybackInput = {}) {
  const requestedTrack = tracks.find((candidate) => candidate.spotifyTrackId === input.requestedTrackId);
  const firstPlayableTrack =
    tracks.find((candidate) => !(candidate as SongBankTrack).unavailableReason) || tracks[0] || fixtureTracks[0];
  const track = requestedTrack || firstPlayableTrack;
  const parsedStartMs = Number(input.startMs || 0);
  const startMs = Number.isFinite(parsedStartMs) ? Math.max(0, parsedStartMs) : 0;
  const autoplay = input.autoplay === true || input.autoplay === "1" || input.autoplay === "true";

  return { track, startMs, autoplay };
}

function unavailableReasonForTrack(lrcUrl?: string) {
  return lrcUrl ? `missing lrc ${lrcUrl}` : "missing lrc";
}

async function fetchLocalText(url: string) {
  if (typeof fetch !== "function") return null;
  const response = await fetch(url, { cache: "no-store" }).catch(() => null);
  if (!response?.ok) return null;
  return response.text();
}
