"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ListMusic, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import KaraokeRhymePlayer from "@/components/karaoke-rhyme-player";
import { fixtureTracks, type FixtureTrack } from "@/lib/analysis/fixtures";
import type { TrackAnalysis } from "@/lib/analysis/types";

const INITIAL_TRACK_ID = fixtureTracks[0].spotifyTrackId;

export default function InstrumentClient() {
  const [selectedTrackId, setSelectedTrackId] = useState(INITIAL_TRACK_ID);
  const [analysis, setAnalysis] = useState<TrackAnalysis | null>(null);
  const [displayMs, setDisplayMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioFailedTrackIds, setAudioFailedTrackIds] = useState<Set<string>>(() => new Set());
  const [status, setStatus] = useState("loading bank");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const lyricRegionRef = useRef<HTMLElement | null>(null);

  const selectedTrack = useMemo(
    () => fixtureTracks.find((track) => track.spotifyTrackId === selectedTrackId) || fixtureTracks[0],
    [selectedTrackId]
  );
  const canUseLocalAudio = Boolean(selectedTrack.localAudioUrl && !audioFailedTrackIds.has(selectedTrack.spotifyTrackId));

  const loadTrack = useCallback(async (track: FixtureTrack, shouldPlay = true, startMs = 0) => {
    setIsLoading(true);
    setStatus("loading analysis");
    setSelectedTrackId(track.spotifyTrackId);
    setDisplayMs(startMs);
    lastTickRef.current = null;

    const next = await fetchTrackAnalysis(track);

    if (!next) {
      setStatus("analysis unavailable");
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    setAnalysis(next);
    setIsPlaying(shouldPlay);
    setStatus(shouldPlay ? statusForPlayback(track, !audioFailedTrackIds.has(track.spotifyTrackId)) : "ready");
    setIsLoading(false);

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      window.requestAnimationFrame(() => {
        lyricRegionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    }
  }, [audioFailedTrackIds]);

  useEffect(() => {
    let cancelled = false;
    const initial = readInitialPlayback();

    fetchTrackAnalysis(initial.track).then((next) => {
      if (cancelled) return;
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

    let frame = 0;
    const duration = analysis.track.durationMs || analysis.metrics.durationMs || 60_000;

    const tick = (now: number) => {
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

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [analysis, canUseLocalAudio, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !canUseLocalAudio) return;

    if (isPlaying) {
      const play = audio.play();
      if (play) {
        play.catch(() => {
          setIsPlaying(false);
          setStatus("press play for local audio");
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
            <ListMusic size={18} /> local bank
          </div>
          <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-1 lg:overflow-visible lg:pb-0">
            {fixtureTracks.map((track, index) => (
              <button
                key={track.spotifyTrackId}
                type="button"
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
              <p className="mt-2 text-sm text-white/55">{selectedTrack.artist}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/8 px-3 py-2 text-xs text-white/64">
              <Volume2 size={15} />
              {canUseLocalAudio ? "local audio" : "public-safe clock"}
            </div>
          </div>

          {selectedTrack.localAudioUrl ? (
            <audio
              key={selectedTrack.spotifyTrackId}
              ref={audioRef}
              preload="metadata"
              src={selectedTrack.localAudioUrl}
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
                setStatus("local audio unavailable; clock fallback");
              }}
            />
          ) : null}

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
  return track.localAudioUrl && canUseAudio ? "playing local audio" : "playing local bank";
}

function readInitialPlayback() {
  if (typeof window === "undefined") {
    return { track: fixtureTracks[0], startMs: 0, autoplay: false };
  }

  const params = new URLSearchParams(window.location.search);
  const requestedTrackId = params.get("track");
  const track = fixtureTracks.find((candidate) => candidate.spotifyTrackId === requestedTrackId) || fixtureTracks[0];
  const startMs = Math.max(0, Number(params.get("startMs") || 0));
  const autoplay = params.get("autoplay") === "1";
  return { track, startMs, autoplay };
}
