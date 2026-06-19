import { describe, expect, it } from "vitest";
import type { AnalysisLine, AnalysisWord, RhymeFamily } from "@/lib/analysis/types";
import { buildRhymeDisplayMap, buildRhymeLineSegments, selectRhymeDisplayFamily } from "@/lib/rhyme/display";

describe("rhyme display model", () => {
  it("merges adjacent words from the same displayed family into phrase spans", () => {
    const family = makeFamily("r1", "multi", ["w1", "w2", "w3"], 0.94);
    const words = [makeWord("w1", "low", ["r1"]), makeWord("w2", "slow", ["r1"]), makeWord("w3", "glow", ["r1"])];
    const segments = buildRhymeLineSegments(words, new Map(words.map((word) => [word.id, family])));

    expect(segments).toHaveLength(1);
    expect(segments[0].family?.id).toBe("r1");
    expect(segments[0].words.map(({ word }) => word.text)).toEqual(["low", "slow", "glow"]);
  });

  it("filters quiet words out of display families", () => {
    const family = makeFamily("r1", "end", ["w1", "w2"], 0.94);
    const quietWord = makeWord("w1", "the", ["r1"]);
    const fillerWord = makeWord("w2", "while", ["r1"]);

    expect(selectRhymeDisplayFamily(quietWord, new Map([[family.id, family]]))).toBeNull();
    expect(selectRhymeDisplayFamily(fillerWord, new Map([[family.id, family]]))).toBeNull();
  });

  it("prefers multisyllabic rhyme families over weaker internal families", () => {
    const internal = makeFamily("r1", "internal", ["w1", "w4", "w5"], 0.88);
    const multi = makeFamily("r2", "multi", ["w1", "w2", "w3"], 0.9);
    const word = makeWord("w1", "nightfall", ["r1", "r2"]);

    expect(selectRhymeDisplayFamily(word, new Map([[internal.id, internal], [multi.id, multi]]))?.id).toBe("r2");
  });

  it("keeps each line to a high-signal display budget", () => {
    const line: AnalysisLine = {
      id: "l1",
      text: "one two three four five six seven eight nine ten",
      startMs: 0,
      endMs: 4000,
      wordIds: Array.from({ length: 10 }, (_, index) => `w${index}`)
    };
    const words = line.wordIds.map((id, index) => makeWord(id, `word${index}`, [`r${index}`]));
    const wordById = new Map(words.map((word) => [word.id, word]));
    const familyById = new Map(words.map((word, index) => [`r${index}`, makeFamily(`r${index}`, "end", [word.id, `x${index}`], 0.94)]));

    const display = buildRhymeDisplayMap([line], wordById, familyById);

    expect(display.size).toBe(5);
  });
});

function makeWord(id: string, text: string, rhymeFamilyIds: string[]): AnalysisWord {
  return {
    id,
    text,
    normalized: text.toLowerCase(),
    phonemes: [],
    rhymeTail: text.toUpperCase(),
    rhymeFamilyIds,
    startMs: 0,
    endMs: 400,
    lineIndex: 0,
    source: "fixture",
    confidence: 0.9
  };
}

function makeFamily(id: string, kind: RhymeFamily["kind"], wordIds: string[], confidence: number): RhymeFamily {
  return {
    id,
    label: `${kind}:${id}`,
    kind,
    color: "#ef2f2f",
    tail: id,
    wordIds,
    confidence
  };
}
