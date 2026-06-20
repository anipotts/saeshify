import { beforeEach, describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/analyze/jobs/route";
import { clearAnalysisCache } from "@/lib/analysis/cache";
import { clearAnalysisJobs } from "@/lib/analysis/jobs";
import type { FixtureTrack } from "@/lib/analysis/fixtures";

describe("analysis jobs route", () => {
  beforeEach(() => {
    clearAnalysisCache();
    clearAnalysisJobs();
  });

  it("exposes queued and processed states for the same analysis request", async () => {
    const track = makeTrack("route-job");
    const queuedResponse = await POST(jobRequest({ track, processNow: false }));
    const queuedPayload = await queuedResponse.json();

    expect(queuedResponse.status).toBe(202);
    expect(queuedPayload.job).toMatchObject({
      status: "queued",
      trackId: "route-job",
      attempts: 0
    });
    expect(queuedPayload.job.result).toBeUndefined();

    const processedResponse = await POST(jobRequest({ track, includeResult: true }));
    const processedPayload = await processedResponse.json();

    expect(processedResponse.status).toBe(202);
    expect(processedPayload.job).toMatchObject({
      id: queuedPayload.job.id,
      status: "completed",
      trackId: "route-job",
      attempts: 1
    });
    expect(processedPayload.job.result.track.spotifyTrackId).toBe("route-job");

    const statsResponse = await GET(new Request("http://localhost/api/analyze/jobs"));
    const statsPayload = await statsResponse.json();

    expect(statsPayload.stats).toMatchObject({
      total: 1,
      counts: {
        queued: 0,
        processing: 0,
        cached: 0,
        completed: 1,
        failed: 0
      }
    });
  });
});

function jobRequest(body: unknown) {
  return new Request("http://localhost/api/analyze/jobs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

function makeTrack(spotifyTrackId: string): FixtureTrack {
  return {
    spotifyTrackId,
    title: "route test",
    artist: "saeshify",
    durationMs: 6000,
    lrc: "[00:00.00] route line one\n[00:03.00] route line two"
  };
}
