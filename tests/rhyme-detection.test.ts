import { describe, expect, it } from "vitest";
import { parseLrc } from "@/lib/analysis/adapters/lrc";
import { detectDenseRhymes } from "@/lib/rhyme/detect";
import type { AnalysisCandidate } from "@/lib/analysis/types";

describe("dense rhyme detection", () => {
  it("groups repeated phonetic tails", () => {
    const parsed = parseLrc("[00:00.00] right hand writes\n[00:03.00] bright night bites", "fixture", 6000);
    const candidate: AnalysisCandidate = {
      source: "fixture",
      track: { spotifyTrackId: "x", title: "x", artist: "x", durationMs: 6000 },
      ...parsed,
      confidence: 0.8
    };

    const result = detectDenseRhymes(candidate);
    expect(result.rhymeFamilies.length).toBeGreaterThan(0);
    expect(result.words.some((word) => word.rhymeFamilyIds.length > 0)).toBe(true);
  });

  it("marks line-ending rhyme families", () => {
    const parsed = parseLrc("[00:00.00] low light\n[00:03.00] tight night", "fixture", 6000);
    const candidate: AnalysisCandidate = {
      source: "fixture",
      track: { spotifyTrackId: "x", title: "x", artist: "x", durationMs: 6000 },
      ...parsed,
      confidence: 0.8
    };

    const result = detectDenseRhymes(candidate);
    expect(result.rhymeFamilies.some((family) => family.kind === "end")).toBe(true);
  });

  it("marks repeated multisyllabic line tails", () => {
    const parsed = parseLrc("[00:00.00] low light\n[00:03.00] slow night", "fixture", 6000);
    const candidate: AnalysisCandidate = {
      source: "fixture",
      track: { spotifyTrackId: "x", title: "x", artist: "x", durationMs: 6000 },
      ...parsed,
      confidence: 0.8
    };

    const result = detectDenseRhymes(candidate);
    const multi = result.rhymeFamilies.find((family) => family.kind === "multi");

    expect(multi?.tail).toBe("OW | AY T");
    expect(multi?.wordIds).toHaveLength(4);
  });
});
