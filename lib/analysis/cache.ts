import type { TrackAnalysis } from "./types";

const VERSION = "rebuild-v2";
const memoryCache = new Map<string, TrackAnalysis>();

export function analysisCacheKey(trackId: string) {
  return `${trackId}:${VERSION}`;
}

export function getCachedAnalysis(trackId: string) {
  return memoryCache.get(analysisCacheKey(trackId)) || null;
}

export function setCachedAnalysis(analysis: TrackAnalysis) {
  memoryCache.set(analysis.provenance.cacheKey, analysis);
}

export function pipelineVersion() {
  return VERSION;
}
