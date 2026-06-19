import type { TrackAnalysis, TrackIdentity } from "./types";

const VERSION = "rebuild-v2";
const memoryCache = new Map<string, TrackAnalysis>();

export function analysisCacheKey(trackId: string, sourceVersion = "default") {
  return `${trackId}:${VERSION}:${sourceVersion}`;
}

export function analysisSourceVersion(track: TrackIdentity) {
  const lrc = "lrc" in track && typeof track.lrc === "string" ? track.lrc : "";
  if (!lrc) return "default";
  return `inline-lrc-${fastHash(lrc)}`;
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

export function analysisCacheStats() {
  return {
    entries: memoryCache.size,
    pipelineVersion: VERSION
  };
}

export function clearAnalysisCache() {
  memoryCache.clear();
}

function fastHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
