import { NextResponse } from "next/server";
import { getSpotifyNowPlaying } from "@/lib/spotify/client";

export async function GET() {
  const result = await getSpotifyNowPlaying();

  if (!result.ok) {
    const status = result.status === "spotify_error" ? result.httpStatus : 200;

    return NextResponse.json(result, {
      status,
      headers: {
        "cache-control": "no-store",
        "retry-after": Math.ceil(result.retryAfterMs / 1000).toString()
      }
    });
  }

  return NextResponse.json(result, {
    headers: {
      "cache-control": "no-store"
    }
  });
}
