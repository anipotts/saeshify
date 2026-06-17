"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Activity, Gauge, RefreshCw } from "lucide-react";
import PlaybackPanel from "@/components/playback-panel";
import RhymeCanvas from "@/components/rhyme-canvas";
import StatusPill from "@/components/status-pill";
import type { PlaybackSnapshot } from "@/lib/playback/clock";
import { interpolatePlayback, nextSpotifyPollDelay, reconcilePlayback } from "@/lib/playback/clock";
import type { TrackAnalysis, TrackIdentity } from "@/lib/analysis/types";

type NowPlayingResponse =
  | { ok: true; snapshot: PlaybackSnapshot; track: TrackIdentity }
  | { ok: false; status: string; retryAfterMs: number; message: string };

const DEMO_TRACK_ID = "fixture-demo-cypher";

export default function InstrumentClient() {
  const [analysis, setAnalysis] = useState<TrackAnalysis | null>(null);
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot | null>(null);
  const [displayMs, setDisplayMs] = useState(0);
  const [status, setStatus] = useState("fixture mode");
  const [isLoading, setIsLoading] = useState(true);
  const [inspect, setInspect] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTrackId = useRef<string | null>(null);
  const demoStartedAt = useRef(0);

  const loadAnalysis = useCallback(async (track?: TrackIdentity) => {
    if (!track) {
      demoStartedAt.current = Date.now() - 5200;
    }

    const body = track
      ? { track, requestedAdapters: ["fixture", "lrclib", "local-worker"] }
      : { track: { spotifyTrackId: DEMO_TRACK_ID, title: "demo cypher", artist: "saeshify", durationMs: 32000 } };

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`analysis failed: ${response.status}`);
    }

    const next = (await response.json()) as TrackAnalysis;
    setAnalysis(next);
    lastTrackId.current = next.track.spotifyTrackId;
  }, []);

  useEffect(() => {
    demoStartedAt.current = Date.now() - 5200;
  }, []);

  useEffect(() => {
    let alive = true;

    const poll = async () => {
      try {
        const response = await fetch("/api/spotify/now-playing", { cache: "no-store" });
        const payload = (await response.json()) as NowPlayingResponse;

        if (!alive) return;

        if (!payload.ok) {
          setStatus(payload.status === "missing_config" ? "fixture mode" : payload.message || payload.status);
          if (!analysis) {
            await loadAnalysis();
          }
          const delay = payload.retryAfterMs || nextSpotifyPollDelay(payload.status, true);
          pollTimer.current = setTimeout(poll, delay);
          return;
        }

        setStatus(payload.snapshot.isPlaying ? "spotify live" : "spotify paused");
        setSnapshot((previous) => {
          if (!previous) return payload.snapshot;
          const reconciled = reconcilePlayback(payload.snapshot.progressMs, interpolatePlayback(previous), payload.snapshot.isPlaying);
          return { ...payload.snapshot, progressMs: reconciled.positionMs };
        });

        if (payload.track.spotifyTrackId !== lastTrackId.current) {
          await loadAnalysis(payload.track);
        }

        pollTimer.current = setTimeout(poll, nextSpotifyPollDelay("ok", true));
      } catch (error) {
        if (!alive) return;
        setStatus(error instanceof Error ? error.message : "spotify poll failed");
        if (!analysis) {
          await loadAnalysis();
        }
        pollTimer.current = setTimeout(poll, nextSpotifyPollDelay("network_error", true));
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    poll();
    return () => {
      alive = false;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [analysis, loadAnalysis]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      if (snapshot) {
        setDisplayMs(interpolatePlayback(snapshot));
      } else if (analysis) {
        const duration = analysis.track.durationMs || analysis.metrics.durationMs || 32_000;
        setDisplayMs((Date.now() - demoStartedAt.current) % duration);
      } else {
        setDisplayMs(0);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [analysis, snapshot]);

  const metricSummary = useMemo(() => {
    if (!analysis) return [];
    return [
      ["words", analysis.metrics.wordCount.toString()],
      ["families", analysis.metrics.rhymeFamilyCount.toString()],
      ["score", analysis.quality.score.toFixed(2)],
      ["source", analysis.quality.bestSource]
    ];
  }, [analysis]);

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-black bg-black px-5 py-4 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="font-black">
            saeshify
          </Link>
          <div className="flex items-center gap-3">
            <StatusPill label={status} />
            <button
              type="button"
              onClick={() => setInspect((value) => !value)}
              className="h-9 whitespace-nowrap rounded-md border border-white/20 px-3 text-sm font-semibold text-white/80"
            >
              inspect {inspect ? "on" : "off"}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-3 py-3 sm:px-5 sm:py-5 lg:grid-cols-[320px_1fr]">
        <aside className="order-2 space-y-4 lg:order-1">
          <PlaybackPanel analysis={analysis} snapshot={snapshot} isLoading={isLoading} />
          <div className="rounded-md border border-[var(--line)] bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black">
              <Gauge size={18} /> analysis
            </div>
            <div className="grid grid-cols-2 gap-2">
              {metricSummary.map(([label, value]) => (
                <div key={label} className="rounded-md border border-[var(--line)] p-3">
                  <div className="mono truncate text-lg font-black">{value}</div>
                  <div className="mono mt-1 text-[10px] uppercase text-[var(--muted)]">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-[var(--line)] bg-white p-4 text-sm leading-6 text-[var(--muted)]">
            <div className="mb-2 flex items-center gap-2 font-black text-black">
              <Activity size={18} /> private mode
            </div>
            set spotify secrets locally to watch your real account. without them, this page stays in fixture mode.
          </div>
          <button
            type="button"
            onClick={() => loadAnalysis()}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-black text-sm font-semibold text-white"
          >
            <RefreshCw size={16} /> reload fixture
          </button>
        </aside>

        <section className="order-1 min-w-0 rounded-md border border-black bg-[#d7dde2] p-2 sm:p-3 lg:order-2">
          <div className="mb-3 flex items-center justify-between rounded-sm bg-black px-4 py-3 text-white">
            <span className="text-sm font-black uppercase">
              {analysis?.track.artist || "saeshify"} - {analysis?.track.title || "loading"}
            </span>
            <span className="mono text-xs text-white/60">{Math.round(displayMs / 1000)}s</span>
          </div>
          {analysis ? (
            <RhymeCanvas analysis={analysis} currentMs={displayMs} inspect={inspect} />
          ) : (
            <div className="flex min-h-[520px] items-center justify-center text-sm text-[var(--muted)]">
              loading analysis
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
