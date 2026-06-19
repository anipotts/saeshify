import { describe, expect, it } from "vitest";
import { fixtureTracks } from "@/lib/analysis/fixtures";

const BANNED_SURFACE_PHRASES = [
  "public repo",
  "public file",
  "repo lane",
  "outside git",
  "full song text",
  "add private",
  "private local",
  "local bank",
  "library keeps",
  "click one",
  "bank is real",
  "same engine"
];

describe("public fixture copy", () => {
  it("keeps setup and repo language out of visible demo lyrics", () => {
    const visibleText = fixtureTracks
      .map((track) => [track.title, track.artist, track.bankLabel, track.bankNote, track.lrc].filter(Boolean).join("\n"))
      .join("\n")
      .toLowerCase();

    for (const phrase of BANNED_SURFACE_PHRASES) {
      expect(visibleText).not.toContain(phrase);
    }
  });
});
