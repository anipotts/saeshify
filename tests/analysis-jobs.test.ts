import { beforeEach, describe, expect, it } from "vitest";
import { clearAnalysisCache } from "@/lib/analysis/cache";
import {
  analysisJobStats,
  clearAnalysisJobs,
  enqueueAnalysisJob,
  heartbeatAnalysisJob,
  processAnalysisJob,
  publicAnalysisJob
} from "@/lib/analysis/jobs";
import type { FixtureTrack } from "@/lib/analysis/fixtures";

describe("analysis jobs", () => {
  beforeEach(() => {
    clearAnalysisCache();
    clearAnalysisJobs();
  });

  it("queues a track with stable source metadata", () => {
    const job = enqueueAnalysisJob({ track: makeTrack("job-queued") }, { id: "job-one", now: at(0) });

    expect(job).toMatchObject({
      id: "job-one",
      status: "queued",
      trackId: "job-queued",
      sourceVersion: expect.stringMatching(/^inline-lrc-/),
      attempts: 0,
      createdAt: at(0).toISOString(),
      updatedAt: at(0).toISOString()
    });
    expect(analysisJobStats().counts.queued).toBe(1);
  });

  it("processes queued jobs and records heartbeat/result state", async () => {
    const track = makeTrack("job-process", "[00:00.00] right rail rhyme\n[00:03.00] night tale time");
    const job = enqueueAnalysisJob({ track, requestedAdapters: ["fixture"] }, { id: "job-process", now: at(0) });

    const processed = await processAnalysisJob(job.id, { now: at(1000) });

    expect(processed).toMatchObject({
      id: "job-process",
      status: "completed",
      attempts: 1,
      heartbeatAt: at(1000).toISOString()
    });
    expect(processed?.result?.track.spotifyTrackId).toBe("job-process");
    expect(analysisJobStats().counts.completed).toBe(1);
  });

  it("returns cached jobs without reprocessing after an analysis exists", async () => {
    const track = makeTrack("job-cache", "[00:00.00] cache line one\n[00:03.00] cache line two");
    const first = enqueueAnalysisJob({ track, requestedAdapters: ["fixture"] }, { id: "job-cache-a" });
    const processed = await processAnalysisJob(first.id);
    const second = enqueueAnalysisJob({ track, requestedAdapters: ["fixture"] }, { id: "job-cache-b" });

    expect(processed?.status).toBe("completed");
    expect(second.status).toBe("cached");
    expect(second.attempts).toBe(0);
    expect(second.cacheKey).toBe(processed?.cacheKey);
    expect(second.result).toBe(processed?.result);
  });

  it("can reuse an equivalent in-flight job instead of creating duplicates", () => {
    const track = makeTrack("job-reuse", "[00:00.00] reuse line one\n[00:03.00] reuse line two");
    const first = enqueueAnalysisJob(
      { track, requestedAdapters: ["fixture"] },
      { id: "job-reuse-a", reuseExisting: true }
    );
    const second = enqueueAnalysisJob(
      { track, requestedAdapters: ["fixture"] },
      { id: "job-reuse-b", reuseExisting: true }
    );

    expect(second).toBe(first);
    expect(second.id).toBe("job-reuse-a");
    expect(analysisJobStats().total).toBe(1);
  });

  it("coalesces concurrent processing for the same job", async () => {
    const track = makeTrack("job-race", "[00:00.00] race line one\n[00:03.00] race line two");
    const job = enqueueAnalysisJob({ track, requestedAdapters: ["fixture"] }, { id: "job-race" });

    const [first, second] = await Promise.all([processAnalysisJob(job.id), processAnalysisJob(job.id)]);

    expect(first).toBe(second);
    expect(first?.status).toBe("completed");
    expect(first?.attempts).toBe(1);
  });

  it("marks jobs failed when every requested adapter rejects", async () => {
    const job = enqueueAnalysisJob(
      { track: makeTrack("job-fail"), requestedAdapters: ["lrclib"] },
      { id: "job-fail" }
    );

    const failed = await processAnalysisJob(job.id);

    expect(failed?.status).toBe("failed");
    expect(failed?.attempts).toBe(1);
    expect(failed?.error).toContain("no analysis adapter produced");
    expect(analysisJobStats().counts.failed).toBe(1);
  });

  it("can publish job state without the analysis payload", async () => {
    const job = enqueueAnalysisJob({ track: makeTrack("job-public"), requestedAdapters: ["fixture"] });
    const processed = await processAnalysisJob(job.id);
    const published = publicAnalysisJob(processed!);

    expect("result" in published).toBe(false);
    expect(published.status).toBe("completed");
  });

  it("can publish a completed result when explicitly requested", async () => {
    const job = enqueueAnalysisJob({ track: makeTrack("job-result"), requestedAdapters: ["fixture"] });
    const processed = await processAnalysisJob(job.id);
    const published = publicAnalysisJob(processed!, { includeResult: true });

    expect(published.result?.track.spotifyTrackId).toBe("job-result");
    expect(published.status).toBe("completed");
  });

  it("updates heartbeat timestamps on processing jobs", () => {
    const job = enqueueAnalysisJob({ track: makeTrack("job-heartbeat") }, { id: "job-heartbeat", now: at(0) });
    const heartbeat = heartbeatAnalysisJob(job.id, at(2000));

    expect(heartbeat?.heartbeatAt).toBe(at(2000).toISOString());
    expect(heartbeat?.updatedAt).toBe(at(2000).toISOString());
  });
});

function makeTrack(spotifyTrackId: string, lrc = "[00:00.00] timing line one\n[00:03.00] timing line two"): FixtureTrack {
  return {
    spotifyTrackId,
    title: "job test",
    artist: "saeshify",
    durationMs: 6000,
    lrc
  };
}

function at(ms: number) {
  return new Date(ms);
}
