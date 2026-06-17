import { Music2 } from "lucide-react";
import type { TrackAnalysis } from "@/lib/analysis/types";
import type { PlaybackSnapshot } from "@/lib/playback/clock";

export default function PlaybackPanel({
  analysis,
  snapshot,
  isLoading
}: {
  analysis: TrackAnalysis | null;
  snapshot: PlaybackSnapshot | null;
  isLoading: boolean;
}) {
  return (
    <section className="rounded-md border border-[var(--line)] bg-white p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-black">
        <Music2 size={18} /> now playing
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-black leading-tight">{analysis?.track.title || "loading"}</h1>
        <p className="text-sm text-[var(--muted)]">{analysis?.track.artist || "fixture"}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <Readout label="state" value={snapshot?.isPlaying ? "playing" : isLoading ? "loading" : "demo loop"} />
        <Readout label="source" value={snapshot?.source || analysis?.quality.bestSource || "fixture"} />
        <Readout label="device" value={snapshot?.device?.name || "local"} />
        <Readout label="duration" value={`${Math.round((analysis?.track.durationMs || 0) / 1000)}s`} />
      </div>
    </section>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--line)] p-3">
      <div className="mono text-[10px] uppercase text-[var(--muted)]">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}
