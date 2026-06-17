export type AnalysisAdapterKind = "fixture" | "lrclib" | "local-worker";

export interface TrackIdentity {
  spotifyTrackId: string;
  isrc?: string;
  title: string;
  artist: string;
  album?: string;
  durationMs?: number;
  artworkUrl?: string;
}

export interface TimedWord {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
  lineIndex: number;
  source: AnalysisAdapterKind;
  confidence: number;
}

export interface AnalysisWord extends TimedWord {
  normalized: string;
  phonemes: string[];
  rhymeTail: string;
  rhymeFamilyIds: string[];
}

export interface AnalysisLine {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
  wordIds: string[];
}

export type RhymeKind = "end" | "internal" | "near";

export interface RhymeFamily {
  id: string;
  label: string;
  kind: RhymeKind;
  color: string;
  tail: string;
  wordIds: string[];
  confidence: number;
}

export interface AnalysisSource {
  kind: AnalysisAdapterKind;
  status: "fulfilled" | "rejected" | "disabled";
  score: number;
  message?: string;
}

export interface AnalysisCandidate {
  source: AnalysisAdapterKind;
  track: TrackIdentity;
  words: TimedWord[];
  lines: AnalysisLine[];
  confidence: number;
  message?: string;
}

export interface TrackAnalysis {
  track: TrackIdentity;
  sources: AnalysisSource[];
  words: AnalysisWord[];
  lines: AnalysisLine[];
  rhymeFamilies: RhymeFamily[];
  metrics: {
    wordCount: number;
    lineCount: number;
    rhymeFamilyCount: number;
    rhymeDensity: number;
    durationMs: number;
  };
  provenance: {
    generatedAt: string;
    pipelineVersion: string;
    cacheKey: string;
  };
  quality: {
    score: number;
    bestSource: AnalysisAdapterKind;
    warnings: string[];
  };
}

