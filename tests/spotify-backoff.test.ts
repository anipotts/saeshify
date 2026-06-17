import { describe, expect, it } from "vitest";
import { nextSpotifyPollDelay } from "@/lib/playback/clock";

describe("spotify polling policy", () => {
  it("polls active sessions faster than background sessions", () => {
    expect(nextSpotifyPollDelay("ok", true)).toBeLessThan(nextSpotifyPollDelay("ok", false));
  });

  it("uses a slower cadence when config is missing", () => {
    expect(nextSpotifyPollDelay("missing_config", true)).toBe(20_000);
  });
});

