import { detectDenseRhymes } from "@/lib/rhyme/detect";
import { fixtureTracks, type FixtureTrack } from "../fixtures";
import type { AnalysisCandidate, TrackAnalysis, TrackIdentity } from "../types";
import { parseLrc } from "./lrc";
import { scoreCandidate } from "../scoring";

export async function fixtureAdapter(track: TrackIdentity): Promise<AnalysisCandidate> {
  const fixture =
    fixtureTracks.find((candidate) => candidate.spotifyTrackId === track.spotifyTrackId) ||
    fixtureTracks[0];
  return fixtureCandidate(fixture, track.spotifyTrackId === fixture.spotifyTrackId ? fixture : { ...fixture, ...track });
}

export async function buildFixtureAnalysis(track: FixtureTrack): Promise<TrackAnalysis> {
  const candidate = await fixtureCandidate(track, track);
  const enriched = detectDenseRhymes(candidate);
  const score = scoreCandidate(candidate);

  return {
    track,
    sources: [{ kind: "fixture", status: "fulfilled", score }],
    ...enriched,
    metrics: {
      wordCount: enriched.words.length,
      lineCount: enriched.lines.length,
      rhymeFamilyCount: enriched.rhymeFamilies.length,
      rhymeDensity: enriched.words.filter((word) => word.rhymeFamilyIds.length > 0).length / enriched.words.length,
      durationMs: track.durationMs || enriched.lines.at(-1)?.endMs || 0
    },
    provenance: {
      generatedAt: new Date(0).toISOString(),
      pipelineVersion: "rebuild-v1",
      cacheKey: `fixture:${track.spotifyTrackId}:rebuild-v1`
    },
    quality: {
      score,
      bestSource: "fixture",
      warnings: []
    }
  };
}

async function fixtureCandidate(fixture: FixtureTrack, track: TrackIdentity): Promise<AnalysisCandidate> {
  const parsed = parseLrc(fixture.lrc, "fixture", track.durationMs);
  return {
    source: "fixture",
    track: { ...fixture, ...track, durationMs: track.durationMs || fixture.durationMs },
    words: parsed.words,
    lines: parsed.lines,
    confidence: 0.78
  };
}

