import { beforeEach, describe, expect, it } from "vitest";
import { analyzeTrack } from "@/lib/analysis/engine";
import { analysisCacheKey, analysisSourceVersion, clearAnalysisCache, pipelineVersion } from "@/lib/analysis/cache";
import type { FixtureTrack } from "@/lib/analysis/fixtures";

describe("analysis cache", () => {
  beforeEach(() => {
    clearAnalysisCache();
  });

  it("uses the default source version when a track has no inline lrc", () => {
    const track = { spotifyTrackId: "cache-default", title: "cache", artist: "saeshify" };

    expect(analysisSourceVersion(track)).toBe("default");
    expect(analysisCacheKey(track.spotifyTrackId, analysisSourceVersion(track))).toBe(
      `cache-default:${pipelineVersion()}:default`
    );
  });

  it("includes inline lrc content in the source version", () => {
    const first = makeTrack("cache-inline", "[00:00.00] first timed line");
    const second = makeTrack("cache-inline", "[00:00.00] second timed line");

    expect(analysisSourceVersion(first)).toMatch(/^inline-lrc-/);
    expect(analysisSourceVersion(first)).not.toBe(analysisSourceVersion(second));
  });

  it("reuses cached analyses for the same inline lrc", async () => {
    const track = makeTrack("cache-reuse", "[00:00.00] right rail rhyme\n[00:03.00] night tale time");

    const first = await analyzeTrack({ track, requestedAdapters: ["fixture"] });
    const second = await analyzeTrack({ track, requestedAdapters: ["fixture"] });

    expect(second).toBe(first);
    expect(first.provenance.cacheKey).toBe(analysisCacheKey(track.spotifyTrackId, analysisSourceVersion(track)));
  });

  it("does not reuse cached analyses after inline lrc edits", async () => {
    const firstTrack = makeTrack("cache-edit", "[00:00.00] first private line\n[00:03.00] first timing shine");
    const secondTrack = makeTrack("cache-edit", "[00:00.00] second private line\n[00:03.00] second timing shine");

    const first = await analyzeTrack({ track: firstTrack, requestedAdapters: ["fixture"] });
    const second = await analyzeTrack({ track: secondTrack, requestedAdapters: ["fixture"] });

    expect(second).not.toBe(first);
    expect(first.provenance.cacheKey).not.toBe(second.provenance.cacheKey);
    expect(first.lines[0].text).toBe("first private line");
    expect(second.lines[0].text).toBe("second private line");
  });
});

function makeTrack(spotifyTrackId: string, lrc: string): FixtureTrack {
  return {
    spotifyTrackId,
    title: "cache test",
    artist: "saeshify",
    durationMs: 6000,
    lrc
  };
}
