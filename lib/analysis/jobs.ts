import { analyzeTrack } from "./engine";
import { analysisCacheKey, analysisSourceVersion, getCachedAnalysis } from "./cache";
import type { AnalysisAdapterKind, TrackAnalysis, TrackIdentity } from "./types";

export type AnalysisJobStatus = "queued" | "processing" | "cached" | "completed" | "failed";

export interface AnalysisJobInput {
  track: TrackIdentity;
  requestedAdapters?: AnalysisAdapterKind[];
}

export interface EnqueueAnalysisJobOptions {
  id?: string;
  now?: Date;
  reuseExisting?: boolean;
}

export interface AnalysisJob {
  id: string;
  status: AnalysisJobStatus;
  trackId: string;
  sourceVersion: string;
  requestedAdapters: AnalysisAdapterKind[];
  createdAt: string;
  updatedAt: string;
  attempts: number;
  heartbeatAt?: string;
  cacheKey?: string;
  error?: string;
  result?: TrackAnalysis;
}

export interface PublicAnalysisJob {
  id: string;
  status: AnalysisJobStatus;
  trackId: string;
  sourceVersion: string;
  requestedAdapters: AnalysisAdapterKind[];
  createdAt: string;
  updatedAt: string;
  attempts: number;
  heartbeatAt?: string;
  cacheKey?: string;
  error?: string;
  result?: TrackAnalysis;
}

const DEFAULT_ADAPTERS: AnalysisAdapterKind[] = ["fixture", "lrclib", "local-worker"];
const jobs = new Map<string, AnalysisJob>();
const jobInputs = new Map<string, AnalysisJobInput>();
const jobFingerprints = new Map<string, string>();
const processingJobs = new Map<string, Promise<AnalysisJob | null>>();
let jobSequence = 0;

export function enqueueAnalysisJob(input: AnalysisJobInput, options: EnqueueAnalysisJobOptions = {}): AnalysisJob {
  const now = toIso(options.now);
  const sourceVersion = analysisSourceVersion(input.track);
  const requestedAdapters = input.requestedAdapters?.length ? input.requestedAdapters : DEFAULT_ADAPTERS;
  const fingerprint = analysisJobFingerprint(input.track.spotifyTrackId, sourceVersion, requestedAdapters);
  const reusableId = options.reuseExisting ? jobFingerprints.get(fingerprint) : null;
  const reusableJob = reusableId ? jobs.get(reusableId) : null;
  if (reusableJob && reusableJob.status !== "failed") {
    return reusableJob;
  }

  const cached = getCachedAnalysis(input.track.spotifyTrackId, sourceVersion);
  const job: AnalysisJob = {
    id: options.id || nextJobId(),
    status: cached ? "cached" : "queued",
    trackId: input.track.spotifyTrackId,
    sourceVersion,
    requestedAdapters,
    createdAt: now,
    updatedAt: now,
    attempts: 0,
    cacheKey: cached?.provenance.cacheKey || analysisCacheKey(input.track.spotifyTrackId, sourceVersion),
    result: cached || undefined
  };

  jobs.set(job.id, job);
  jobInputs.set(job.id, { track: input.track, requestedAdapters });
  jobFingerprints.set(fingerprint, job.id);
  return job;
}

export async function processAnalysisJob(id: string, options: { now?: Date } = {}) {
  const active = processingJobs.get(id);
  if (active) return active;

  const promise = processAnalysisJobOnce(id, options).finally(() => {
    processingJobs.delete(id);
  });
  processingJobs.set(id, promise);
  return promise;
}

async function processAnalysisJobOnce(id: string, options: { now?: Date } = {}) {
  const job = jobs.get(id);
  const input = jobInputs.get(id);
  if (!job || !input) return null;
  if (job.status === "cached" || job.status === "completed" || job.status === "failed") return job;

  const cached = getCachedAnalysis(input.track.spotifyTrackId, job.sourceVersion);
  if (cached) {
    updateJob(job, "cached", options.now);
    job.result = cached;
    job.cacheKey = cached.provenance.cacheKey;
    return job;
  }

  updateJob(job, "processing", options.now);
  heartbeatAnalysisJob(id, options.now);
  job.attempts += 1;

  try {
    const analysis = await analyzeTrack({
      track: input.track,
      requestedAdapters: input.requestedAdapters
    });
    job.result = analysis;
    job.cacheKey = analysis.provenance.cacheKey;
    updateJob(job, "completed", options.now);
  } catch (error) {
    job.error = error instanceof Error ? error.message : String(error);
    updateJob(job, "failed", options.now);
  }

  return job;
}

export function heartbeatAnalysisJob(id: string, now?: Date) {
  const job = jobs.get(id);
  if (!job) return null;
  const timestamp = toIso(now);
  job.heartbeatAt = timestamp;
  job.updatedAt = timestamp;
  return job;
}

export function getAnalysisJob(id: string) {
  return jobs.get(id) || null;
}

export function analysisJobStats() {
  const counts: Record<AnalysisJobStatus, number> = {
    queued: 0,
    processing: 0,
    cached: 0,
    completed: 0,
    failed: 0
  };

  for (const job of jobs.values()) {
    counts[job.status] += 1;
  }

  return {
    total: jobs.size,
    counts
  };
}

export function publicAnalysisJob(job: AnalysisJob, options: { includeResult?: boolean } = {}): PublicAnalysisJob {
  const { result, ...rest } = job;
  return options.includeResult ? { ...rest, result } : rest;
}

export function clearAnalysisJobs() {
  jobs.clear();
  jobInputs.clear();
  jobFingerprints.clear();
  processingJobs.clear();
  jobSequence = 0;
}

function updateJob(job: AnalysisJob, status: AnalysisJobStatus, now?: Date) {
  job.status = status;
  job.updatedAt = toIso(now);
}

function toIso(date = new Date()) {
  return date.toISOString();
}

function nextJobId() {
  jobSequence += 1;
  return `analysis-job-${jobSequence.toString().padStart(4, "0")}`;
}

function analysisJobFingerprint(trackId: string, sourceVersion: string, adapters: AnalysisAdapterKind[]) {
  return [trackId, sourceVersion, [...adapters].sort().join("+")].join(":");
}
