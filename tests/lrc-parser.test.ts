import { describe, expect, it } from "vitest";
import { parseLrc } from "@/lib/analysis/adapters/lrc";

describe("lrc parser", () => {
  it("uses enhanced lrc word timestamps when present", () => {
    const parsed = parseLrc(
      "[00:06.00]<00:06.00>right <00:06.40>hand <00:06.80>nightmare\n[00:08.00] next bar",
      "fixture",
      10000
    );

    expect(parsed.lines[0].text).toBe("right hand nightmare");
    expect(parsed.words.slice(0, 3).map((word) => word.text)).toEqual(["right", "hand", "nightmare"]);
    expect(parsed.words[0].startMs).toBe(6000);
    expect(parsed.words[1].startMs).toBe(6400);
    expect(parsed.words[2].startMs).toBe(6800);
    expect(parsed.words[0].endMs).toBeLessThanOrEqual(parsed.words[1].startMs);
  });

  it("keeps leading text before the first enhanced word timestamp", () => {
    const parsed = parseLrc("[00:01.00]aye <00:01.30>right <00:01.70>here\n[00:03.00] next", "fixture", 5000);

    expect(parsed.lines[0].text).toBe("aye right here");
    expect(parsed.words.slice(0, 3).map((word) => word.text)).toEqual(["aye", "right", "here"]);
    expect(parsed.words[0].startMs).toBe(1000);
    expect(parsed.words[1].startMs).toBe(1300);
  });
});
