"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ListMusic, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import KaraokeRhymePlayer from "@/components/karaoke-rhyme-player";
import { fixtureTracks, type FixtureTrack } from "@/lib/analysis/fixtures";
import type { TrackAnalysis } from "@/lib/analysis/types";
import {
  LOCAL_MANIFEST_URL,
  mergeLocalTracks,
  resolveInitialPlayback,
  resolveLocalManifestTracks,
  type LocalBankManifest
} from "@/lib/local-bank";

const INITIAL_TRACK_ID = fixtureTracks[0].spotifyTrackId;

export default function InstrumentClient() {
  const [bankTracks, setBankTracks] = useState<FixtureTrack[]>(fixtureTracks);
  const [selectedTrackId, setSelectedTrackId] = useState(INITIAL_TRACK_ID);
  const [analysis, setAnalysis] = useState<TrackAnalysis | null>(null);
  const [displayMs, setDisplayMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioBlockedTrackIds, setAudioBlockedTrackIds] = useState<Set<string>>(() => new Set());
  const [audioFailedTrackIds, setAudioFailedTrackIds] = useState<Set<string>>(() => new Set());
  const [status, setStatus] = useState("loading");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const displayMsRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const lyricRegionRef = useRef<HTMLElement | null>(null);

  const selectedTrack = useMemo(
    () => bankTracks.find((track) => track.spotifyTrackId === selectedTrackId) || bankTracks[0] || fixtureTracks[0],
    [bankTracks, selectedTrackId]
  );
  const canUseLocalAudio = Boolean(
    selectedTrack.localAudioUrl &&
      !audioFailedTrackIds.has(selectedTrack.spotifyTrackId) &&
      !audioBlockedTrackIds.has(selectedTrack.spotifyTrackId)
  );

  useEffect(() => {
    displayMsRef.current = displayMs;
  }, [displayMs]);

  const primeLocalAudioPlayback = useCallback((track: FixtureTrack, shouldPlay: boolean, startMs: number) => {
    const audio = audioRef.current;
    if (!audio || !track.localAudioUrl || audioFailedTrackIds.has(track.spotifyTrackId)) return;
    setAudioBlockedTrackIds((previous) => deleteFromSet(previous, track.spotifyTrackId));

    if (audio.dataset.trackId !== track.spotifyTrackId) {
      audio.pause();
      audio.src = track.localAudioUrl;
      audio.dataset.trackId = track.spotifyTrackId;
      audio.load();
    }

    seekAudioWhenReady(audio, startMs);

    if (shouldPlay) {
      const play = audio.play();
      if (play) {
        play.catch(() => {
          setAudioBlockedTrackIds((previous) => addToSet(previous, track.spotifyTrackId));
          setIsPlaying(true);
          setStatus("audio blocked; clock fallback");
        });
      }
    }
  }, [audioFailedTrackIds]);

  const loadTrack = useCallback(async (track: FixtureTrack, shouldPlay = true, startMs = 0) => {
    setIsLoading(true);
    setStatus("loading analysis");
    setSelectedTrackId(track.spotifyTrackId);
    setDisplayMs(startMs);
    lastTickRef.current = null;
    primeLocalAudioPlayback(track, shouldPlay, startMs);

    const next = await fetchTrackAnalysis(track);

    if (!next) {
      setStatus("analysis unavailable");
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    setAnalysis(next);
    setIsPlaying(shouldPlay);
    setStatus(
      shouldPlay
        ? statusForPlayback(track, Boolean(track.localAudioUrl && !audioFailedTrackIds.has(track.spotifyTrackId) && !audioBlockedTrackIds.has(track.spotifyTrackId)))
        : "ready"
    );
    setIsLoading(false);

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      window.requestAnimationFrame(() => {
        lyricRegionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    }
  }, [audioBlockedTrackIds, audioFailedTrackIds, primeLocalAudioPlayback]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!selectedTrack.localAudioUrl) {
      audio.pause();
      audio.removeAttribute("src");
      delete audio.dataset.trackId;
      audio.load();
      return;
    }

    if (audio.dataset.trackId !== selectedTrack.spotifyTrackId) {
      audio.pause();
      audio.src = selectedTrack.localAudioUrl;
      audio.dataset.trackId = selectedTrack.spotifyTrackId;
      audio.load();
      seekAudioWhenReady(audio, displayMsRef.current);
    }
  }, [selectedTrack.localAudioUrl, selectedTrack.spotifyTrackId]);

  useEffect(() => {
    let cancelled = false;

    loadSongBank().then(async (tracks) => {
      if (cancelled) return;
      const initial = readInitialPlayback(tracks);
      const next = await fetchTrackAnalysis(initial.track);
      if (cancelled) return;
      setBankTracks(tracks);
      setSelectedTrackId(initial.track.spotifyTrackId);
      setDisplayMs(initial.startMs);
      if (next) {
        setAnalysis(next);
        setIsPlaying(initial.autoplay);
        setStatus(initial.autoplay ? statusForPlayback(initial.track, true) : "ready");
      } else {
        setStatus("analysis unavailable");
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || !analysis || canUseLocalAudio) {
      lastTickRef.current = null;
      return;
    }

    const duration = analysis.track.durationMs || analysis.metrics.durationMs || 60_000;

    const tick = () => {
      const now = performance.now();
      const last = lastTickRef.current ?? now;
      const delta = now - last;
      lastTickRef.current = now;

      setDisplayMs((previous) => {
        const next = previous + delta;
        if (next >= duration) {
          setIsPlaying(false);
          setStatus("ended");
          return duration;
        }
        return next;
      });
    };

    tick();
    const interval = window.setInterval(tick, 80);
    return () => window.clearInterval(interval);
  }, [analysis, canUseLocalAudio, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !canUseLocalAudio) return;

    if (isPlaying) {
      const play = audio.play();
      if (play) {
        play.catch(() => {
          setAudioBlockedTrackIds((previous) => addToSet(previous, selectedTrackId));
          setIsPlaying(true);
          setStatus("audio blocked; clock fallback");
        });
      }
    } else {
      audio.pause();
    }
  }, [canUseLocalAudio, isPlaying, selectedTrackId]);

  useEffect(() => {
    if (!isPlaying || !canUseLocalAudio) return;

    let frame = 0;
    const syncFromAudio = () => {
      const audio = audioRef.current;
      if (audio) setDisplayMs(audio.currentTime * 1000);
      frame = requestAnimationFrame(syncFromAudio);
    };

    frame = requestAnimationFrame(syncFromAudio);
    return () => cancelAnimationFrame(frame);
  }, [canUseLocalAudio, isPlaying, selectedTrackId]);

  const durationMs = analysis?.track.durationMs || analysis?.metrics.durationMs || selectedTrack.durationMs || 1;
  const progress = Math.min(displayMs / durationMs, 1);

  const togglePlayback = () => {
    if (!analysis) return;
    setIsPlaying((value) => {
      const next = !value;
      setStatus(next ? statusForPlayback(selectedTrack, canUseLocalAudio) : "paused");
      return next;
    });
  };

  const restart = () => {
    if (audioRef.current && canUseLocalAudio) {
      audioRef.current.currentTime = 0;
    }
    setDisplayMs(0);
    lastTickRef.current = null;
    setIsPlaying(true);
    setStatus(statusForPlayback(selectedTrack, canUseLocalAudio));
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#121212] pb-32 text-white">
      <header className="border-b border-white/10 bg-black px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <Link href="/" className="text-lg font-black tracking-normal">
            saeshify
          </Link>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span className="h-2 w-2 rounded-full bg-[var(--spotify)]" />
            {status}
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1500px] min-w-0 gap-4 px-3 py-4 sm:px-5 lg:grid-cols-[310px_1fr]">
        <aside className="min-w-0 overflow-hidden rounded-lg bg-[#181818] p-3 lg:min-h-[calc(100vh-190px)]">
          <div className="mb-3 flex items-center gap-2 px-2 text-sm font-black text-white">
            <ListMusic size={18} /> tracks
          </div>
          <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-1 lg:overflow-visible lg:pb-0">
            {bankTracks.map((track, index) => (
              <button
                key={track.spotifyTrackId}
                type="button"
                onPointerDown={() => primeLocalAudioPlayback(track, true, 0)}
                onClick={() => loadTrack(track, true)}
                className={clsxTrackButton(track.spotifyTrackId === selectedTrackId)}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-[#282828] text-sm font-black text-[var(--spotify)]">
                  {`${index + 1}`.padStart(2, "0")}
                </span>
                <span className="min-w-0 text-left">
                  <span className="block truncate text-sm font-bold text-white">{track.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-white/52">{track.bankLabel || track.artist}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section ref={lyricRegionRef} className="min-w-0 scroll-mt-3">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <p className="mono text-[11px] uppercase text-[var(--spotify)]">{selectedTrack.bankNote || "local demo"}</p>
              <h1 className="mt-1 text-3xl font-black leading-none text-white sm:text-5xl">{selectedTrack.title}</h1>
              <p className="mt-2 text-sm text-white/55">{selectedTrack.album || selectedTrack.bankLabel || selectedTrack.artist}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/8 px-3 py-2 text-xs text-white/64">
              <Volume2 size={15} />
              {audioBadgeLabel(selectedTrack, canUseLocalAudio, audioBlockedTrackIds, audioFailedTrackIds)}
            </div>
          </div>

          <audio
            ref={audioRef}
            preload="metadata"
            onLoadedMetadata={(event) => {
              if (displayMs > 0) event.currentTarget.currentTime = displayMs / 1000;
            }}
            onEnded={() => {
              setDisplayMs(durationMs);
              setIsPlaying(false);
              setStatus("ended");
            }}
            onError={() => {
              setAudioFailedTrackIds((previous) => new Set(previous).add(selectedTrack.spotifyTrackId));
              setIsPlaying(true);
              setStatus("audio unavailable; clock fallback");
            }}
          />

          {analysis ? (
            <KaraokeRhymePlayer analysis={analysis} currentMs={displayMs} />
          ) : (
            <div className="flex min-h-[560px] items-center justify-center rounded border border-white/10 bg-[#d9d9d9] text-sm text-black/55">
              {isLoading ? "loading analysis" : "analysis unavailable"}
            </div>
          )}
        </section>
      </section>

      <footer className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-black px-4 py-3 text-white sm:px-6">
        <div className="mx-auto grid max-w-[1500px] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{selectedTrack.title}</div>
            <div className="truncate text-xs text-white/50">{selectedTrack.artist}</div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={restart}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:text-white"
              aria-label="restart"
            >
              <RotateCcw size={18} />
            </button>
            <button
              type="button"
              onPointerDown={() => primeLocalAudioPlayback(selectedTrack, true, displayMs)}
              onClick={togglePlayback}
              disabled={!analysis}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black disabled:opacity-40"
              aria-label={isPlaying ? "pause" : "play"}
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
          </div>

          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <span className="mono text-[11px] text-white/45">{formatClock(displayMs)}</span>
            <input
              type="range"
              min={0}
              max={Math.max(durationMs, 1)}
              value={Math.min(displayMs, durationMs)}
              onChange={(event) => {
                const nextMs = Number(event.currentTarget.value);
                if (audioRef.current && canUseLocalAudio) {
                  audioRef.current.currentTime = nextMs / 1000;
                }
                setDisplayMs(nextMs);
                lastTickRef.current = null;
              }}
              className="accent-[var(--spotify)]"
              aria-label="track progress"
            />
            <span className="mono text-[11px] text-white/45">{formatClock(durationMs)}</span>
          </div>
        </div>
        <div className="mx-auto mt-2 h-1 max-w-[1500px] overflow-hidden rounded-full bg-white/12">
          <div className="h-full rounded-full bg-[var(--spotify)]" style={{ width: `${progress * 100}%` }} />
        </div>
      </footer>
    </main>
  );
}

function clsxTrackButton(active: boolean) {
  return [
    "flex min-w-[220px] items-center gap-3 rounded-md p-2 transition-colors lg:min-w-0",
    active ? "bg-[#2a2a2a]" : "bg-transparent hover:bg-white/8"
  ].join(" ");
}

function formatClock(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = `${totalSeconds % 60}`.padStart(2, "0");
  return `${minutes}:${seconds}`;
}

async function fetchTrackAnalysis(track: FixtureTrack) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ track, requestedAdapters: ["fixture"] })
  });

  if (!response.ok) return null;
  return (await response.json()) as TrackAnalysis;
}

function statusForPlayback(track: FixtureTrack, canUseAudio: boolean) {
  return track.localAudioUrl && canUseAudio ? "playing audio" : "playing clock";
}

function audioBadgeLabel(
  track: FixtureTrack,
  canUseAudio: boolean,
  blockedTrackIds: Set<string>,
  failedTrackIds: Set<string>
) {
  if (!track.localAudioUrl) return "clock";
  if (failedTrackIds.has(track.spotifyTrackId)) return "audio missing";
  if (blockedTrackIds.has(track.spotifyTrackId)) return "clock";
  return canUseAudio ? "audio" : "clock";
}

function addToSet<T>(set: Set<T>, item: T) {
  if (set.has(item)) return set;
  const next = new Set(set);
  next.add(item);
  return next;
}

function deleteFromSet<T>(set: Set<T>, item: T) {
  if (!set.has(item)) return set;
  const next = new Set(set);
  next.delete(item);
  return next;
}

async function loadSongBank(): Promise<FixtureTrack[]> {
  const manifest = await fetchJson<LocalBankManifest>(LOCAL_MANIFEST_URL);
  const localTracks = await resolveLocalManifestTracks(manifest, fetchText);
  return mergeLocalTracks(localTracks);
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { cache: "no-store" }).catch(() => null);
  if (!response?.ok) return null;
  return (await response.json().catch(() => null)) as T | null;
}

async function fetchText(url: string): Promise<string | null> {
  const response = await fetch(url, { cache: "no-store" }).catch(() => null);
  if (!response?.ok) return null;
  return response.text();
}

function seekAudioWhenReady(audio: HTMLAudioElement, startMs: number) {
  const seek = () => {
    audio.currentTime = Math.max(0, startMs / 1000);
  };

  if (audio.readyState >= 1) {
    seek();
    return;
  }

  audio.addEventListener("loadedmetadata", seek, { once: true });
}

function readInitialPlayback(tracks: FixtureTrack[]) {
  if (typeof window === "undefined") {
    return resolveInitialPlayback(tracks);
  }

  const params = new URLSearchParams(window.location.search);
  return resolveInitialPlayback(tracks, {
    requestedTrackId: params.get("track"),
    startMs: params.get("startMs"),
    autoplay: params.get("autoplay")
  });
}
