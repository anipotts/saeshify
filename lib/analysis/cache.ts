import type { TrackAnalysis } from "./types";

const VERSION = "rebuild-v2";
const memoryCache = new Map<string, TrackAnalysis>();

export function analysisCacheKey(trackId: string, sourceVersion = "default") {
  return `${trackId}:${VERSION}:${sourceVersion}`;
}

export function getCachedAnalysis(trackId: string, sourceVersion = "default") {
  return memoryCache.get(analysisCacheKey(trackId, sourceVersion)) || null;
}

export function setCachedAnalysis(analysis: TrackAnalysis) {
  memoryCache.set(analysis.provenance.cacheKey, analysis);
}

export function pipelineVersion() {
  return VERSION;
}
