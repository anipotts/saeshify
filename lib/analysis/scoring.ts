import type { AnalysisAdapterKind, AnalysisCandidate, TrackIdentity } from "./types";

const SOURCE_PRIORITY: Record<AnalysisAdapterKind, number> = {
  "local-worker": 0.95,
  lrclib: 0.82,
  fixture: 0.7
};

export function scoreCandidate(candidate: AnalysisCandidate): number {
  const durationMs = candidate.track.durationMs || candidate.lines.at(-1)?.endMs || 0;
  const timestampDensity = candidate.words.filter((word) => word.endMs > word.startMs).length / Math.max(candidate.words.length, 1);
  const wordCoverage = Math.min(1, candidate.words.length / expectedWordCount(candidate.track));
  const durationMatch = durationMs > 0 ? durationFit(candidate.lines.at(-1)?.endMs || durationMs, durationMs) : 0.5;
  const sourcePriority = SOURCE_PRIORITY[candidate.source];

  return roundScore(
    0.3 * wordCoverage +
      0.25 * timestampDensity +
      0.2 * durationMatch +
      0.15 * candidate.confidence +
      0.1 * sourcePriority
  );
}

export function chooseBestCandidate(candidates: AnalysisCandidate[]) {
  if (candidates.length === 0) return null;
  return [...candidates].sort((left, right) => scoreCandidate(right) - scoreCandidate(left))[0];
}

function expectedWordCount(track: TrackIdentity) {
  const durationMs = track.durationMs || 180_000;
  return Math.max(12, Math.min(240, Math.round(durationMs / 1550)));
}

function durationFit(observedMs: number, expectedMs: number) {
  const delta = Math.abs(observedMs - expectedMs);
  return Math.max(0, 1 - delta / Math.max(expectedMs, 1));
}

function roundScore(value: number) {
  return Math.round(value * 1000) / 1000;
}

