import { describe, expect, it } from "vitest";
import { analyzeTrack } from "@/lib/analysis/engine";
import { fixtureAdapter } from "@/lib/analysis/adapters/fixture";
import type { FixtureTrack } from "@/lib/analysis/fixtures";

describe("local lrc analysis", () => {
  it("uses inline local lrc instead of the public fallback fixture", async () => {
    const track: FixtureTrack = {
      spotifyTrackId: "local-inline-lrc",
      title: "private local",
      artist: "local bank",
      durationMs: 6000,
      lrc: "[00:00.00] private rhyme line\n[00:03.00] timing spine shine"
    };

    const candidate = await fixtureAdapter(track);

    expect(candidate.track.title).toBe("private local");
    expect(candidate.lines[0].text).toBe("private rhyme line");
  });

  it("keys cache by inline lrc content for local editing", async () => {
    const first = await analyzeTrack({
      track: {
        spotifyTrackId: "local-cache-lrc",
        title: "cache test",
        artist: "local bank",
        durationMs: 6000,
        lrc: "[00:00.00] first private line\n[00:03.00] first timing shine"
      } as FixtureTrack,
      requestedAdapters: ["fixture"]
    });

    const second = await analyzeTrack({
      track: {
        spotifyTrackId: "local-cache-lrc",
        title: "cache test",
        artist: "local bank",
        durationMs: 6000,
        lrc: "[00:00.00] second private line\n[00:03.00] second timing shine"
      } as FixtureTrack,
      requestedAdapters: ["fixture"]
    });

    expect(first.lines[0].text).toBe("first private line");
    expect(second.lines[0].text).toBe("second private line");
  });
});
