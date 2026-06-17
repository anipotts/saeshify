import type { AnalysisCandidate, TrackIdentity } from "../types";

export async function localWorkerAdapter(track: TrackIdentity): Promise<AnalysisCandidate> {
  const workerUrl = process.env.LOCAL_ANALYSIS_WORKER_URL;
  if (!workerUrl) {
    throw new Error("local worker disabled. set LOCAL_ANALYSIS_WORKER_URL for private mode.");
  }

  const response = await fetch(`${workerUrl.replace(/\/$/, "")}/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ track }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`local worker returned ${response.status}`);
  }

  const candidate = (await response.json()) as AnalysisCandidate;
  return {
    ...candidate,
    source: "local-worker",
    track: candidate.track || track
  };
}

