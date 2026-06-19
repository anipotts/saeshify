import { NextResponse } from "next/server";
import { analysisCacheStats } from "@/lib/analysis/cache";
import { analysisJobStats } from "@/lib/analysis/jobs";
import { spotifyConfigStatus } from "@/lib/spotify/client";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "saeshify",
      mode: "cloudflare-ready",
      realtime: {
        clock: "spotify polling plus browser interpolation",
        delivery: "http now, websocket-ready later"
      },
      analysis: {
        cache: analysisCacheStats(),
        jobs: analysisJobStats(),
        adapters: ["fixture", "lrclib", "local-worker"]
      },
      spotify: spotifyConfigStatus(),
      boundaries: {
        publicData: "fixture-safe",
        privateMedia: "ignored public/local-media, stripped from cloudflare build"
      }
    },
    {
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}
