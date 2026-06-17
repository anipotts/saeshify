import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeTrack } from "@/lib/analysis/engine";
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
      artworkUrl: z.string().optional()
    })
    .optional(),
  requestedAdapters: z.array(z.enum(["fixture", "lrclib", "local-worker"])).optional()
});

export async function GET() {
  const analysis = await analyzeTrack({
    track: fixtureTracks[0],
    requestedAdapters: ["fixture"]
  });

  return NextResponse.json(analysis);
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const track = parsed.data.track || fixtureTracks[0];
  const analysis = await analyzeTrack({
    track,
    requestedAdapters: parsed.data.requestedAdapters || ["fixture", "lrclib", "local-worker"]
  });

  return NextResponse.json(analysis);
}

