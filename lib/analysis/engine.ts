import { fixtureAdapter } from "./adapters/fixture";
import { lrclibAdapter } from "./adapters/lrclib";
import { localWorkerAdapter } from "./adapters/local-worker";
import { analysisCacheKey, getCachedAnalysis, pipelineVersion, setCachedAnalysis } from "./cache";
import { chooseBestCandidate, scoreCandidate } from "./scoring";
import type { AnalysisAdapterKind, AnalysisCandidate, AnalysisSource, TrackAnalysis, TrackIdentity } from "./types";
import { detectDenseRhymes } from "@/lib/rhyme/detect";

interface AnalyzeTrackInput {
  track: TrackIdentity;
  requestedAdapters?: AnalysisAdapterKind[];
}

const ADAPTERS: Record<AnalysisAdapterKind, (track: TrackIdentity) => Promise<AnalysisCandidate>> = {
  fixture: fixtureAdapter,
  lrclib: lrclibAdapter,
  "local-worker": localWorkerAdapter
};

export async function analyzeTrack({ track, requestedAdapters = ["fixture", "lrclib", "local-worker"] }: AnalyzeTrackInput): Promise<TrackAnalysis> {
  const cached = getCachedAnalysis(track.spotifyTrackId);
  if (cached) return cached;

  const settled = await Promise.allSettled(
    requestedAdapters.map(async (kind) => {
      const candidate = await ADAPTERS[kind](track);
      return candidate;
    })
  );

  const candidates: AnalysisCandidate[] = [];
  const sources: AnalysisSource[] = settled.map((result, index) => {
    const kind = requestedAdapters[index];
    if (result.status === "fulfilled") {
      candidates.push(result.value);
      return { kind, status: "fulfilled", score: scoreCandidate(result.value) };
    }
    return {
      kind,
      status: "rejected",
      score: 0,
      message: result.reason instanceof Error ? result.reason.message : String(result.reason)
    };
  });

  const best = chooseBestCandidate(candidates);
  if (!best) {
    throw new Error("no analysis adapter produced a usable result");
  }

  const enriched = detectDenseRhymes(best);
  const analysis: TrackAnalysis = {
    track: best.track,
    sources,
    ...enriched,
    metrics: {
      wordCount: enriched.words.length,
      lineCount: enriched.lines.length,
      rhymeFamilyCount: enriched.rhymeFamilies.length,
      rhymeDensity: enriched.words.filter((word) => word.rhymeFamilyIds.length > 0).length / Math.max(enriched.words.length, 1),
      durationMs: best.track.durationMs || enriched.lines.at(-1)?.endMs || 0
    },
    provenance: {
      generatedAt: new Date().toISOString(),
      pipelineVersion: pipelineVersion(),
      cacheKey: analysisCacheKey(best.track.spotifyTrackId)
    },
    quality: {
      score: scoreCandidate(best),
      bestSource: best.source,
      warnings: sources.filter((source) => source.status === "rejected").map((source) => `${source.kind}: ${source.message}`)
    }
  };

  setCachedAnalysis(analysis);
  return analysis;
}

