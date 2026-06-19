import { beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";
import { clearAnalysisCache } from "@/lib/analysis/cache";
import { clearAnalysisJobs, enqueueAnalysisJob } from "@/lib/analysis/jobs";
import type { FixtureTrack } from "@/lib/analysis/fixtures";

describe("health route", () => {
  beforeEach(() => {
    clearAnalysisCache();
    clearAnalysisJobs();
  });

  it("exposes a compact backend/io snapshot without secrets", async () => {
    enqueueAnalysisJob({ track: makeTrack("health-job"), requestedAdapters: ["fixture"] }, { id: "health-job" });

    const response = GET();
    const payload = await response.json();

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toMatchObject({
      ok: true,
      service: "saeshify",
      mode: "cloudflare-ready",
      realtime: {
        clock: "spotify polling plus browser interpolation"
      },
      analysis: {
        cache: {
          entries: 0,
          pipelineVersion: expect.any(String)
        },
        jobs: {
          total: 1,
          counts: {
            queued: 1,
            processing: 0,
            cached: 0,
            completed: 0,
            failed: 0
          }
        },
        adapters: ["fixture", "lrclib", "local-worker"]
      },
      spotify: {
        configured: expect.any(Boolean),
        scope: "user-read-currently-playing",
        mode: "polling",
        tokenCached: expect.any(Boolean)
      },
      boundaries: {
        publicData: "fixture-safe"
      }
    });
    expect(JSON.stringify(payload)).not.toMatch(/client_secret|refresh_token|access_token/i);
  });
});

function makeTrack(spotifyTrackId: string): FixtureTrack {
  return {
    spotifyTrackId,
    title: "health test",
    artist: "saeshify",
    durationMs: 6000,
    lrc: "[00:00.00] health line one\n[00:03.00] health line two"
  };
}
