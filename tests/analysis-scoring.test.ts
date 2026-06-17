import { describe, expect, it } from "vitest";
import { chooseBestCandidate, scoreCandidate } from "@/lib/analysis/scoring";
import { parseLrc } from "@/lib/analysis/adapters/lrc";
import type { AnalysisCandidate } from "@/lib/analysis/types";

describe("analysis scoring", () => {
  it("prefers denser timed candidates", () => {
    const track = { spotifyTrackId: "x", title: "x", artist: "x", durationMs: 9000 };
    const dense = parseLrc("[00:00.00] one right night\n[00:03.00] two light tight\n[00:06.00] three bright bite", "fixture", 9000);
    const sparse = parseLrc("[00:00.00] one\n[00:06.00] two", "fixture", 9000);

    const denseCandidate: AnalysisCandidate = { source: "fixture", track, ...dense, confidence: 0.7 };
    const sparseCandidate: AnalysisCandidate = { source: "fixture", track, ...sparse, confidence: 0.7 };

    expect(scoreCandidate(denseCandidate)).toBeGreaterThan(scoreCandidate(sparseCandidate));
    expect(chooseBestCandidate([sparseCandidate, denseCandidate])).toBe(denseCandidate);
  });
});

