import { NextResponse } from "next/server";
import { z } from "zod";
import {
  analysisJobStats,
  enqueueAnalysisJob,
  getAnalysisJob,
  processAnalysisJob,
  publicAnalysisJob
} from "@/lib/analysis/jobs";
import { fixtureTracks } from "@/lib/analysis/fixtures";

const requestSchema = z.object({
  track: z
    .object({
      spotifyTrackId: z.string(),
      isrc: z.string().optional(),
      title: z.string(),
      artist: z.string(),
      album: z.string().optional(),
      durationMs: z.number().optional(),
      artworkUrl: z.string().optional(),
      lrc: z.string().optional(),
      bankLabel: z.string().optional(),
      bankNote: z.string().optional(),
      localAudioUrl: z.string().optional(),
      lrcUrl: z.string().optional()
    })
    .optional(),
  requestedAdapters: z.array(z.enum(["fixture", "lrclib", "local-worker"])).optional(),
  processNow: z.boolean().optional()
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const includeResult = url.searchParams.get("includeResult") === "1";
  if (!id) {
    return NextResponse.json({
      ok: true,
      stats: analysisJobStats()
    });
  }

  const job = getAnalysisJob(id);
  if (!job) {
    return NextResponse.json({ error: "analysis job not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    job: publicAnalysisJob(job, { includeResult })
  });
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const job = enqueueAnalysisJob({
    track: parsed.data.track || fixtureTracks[0],
    requestedAdapters: parsed.data.requestedAdapters
  });

  const next = parsed.data.processNow === false ? job : await processAnalysisJob(job.id);
  return NextResponse.json(
    {
      ok: true,
      job: publicAnalysisJob(next || job)
    },
    { status: 202 }
  );
}
