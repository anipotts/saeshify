import type { AnalysisCandidate, AnalysisLine, AnalysisWord, RhymeFamily } from "@/lib/analysis/types";
import { normalizeWord, phonemesForWord, rhymeTail, vowelNucleus } from "./phonetics";

const COLORS = ["#ff4b3e", "#d95cff", "#26d9d0", "#ffcc33", "#35d06f", "#ff7ab6", "#58a6ff", "#f38a2f"];

export function detectDenseRhymes(candidate: AnalysisCandidate): {
  words: AnalysisWord[];
  lines: AnalysisLine[];
  rhymeFamilies: RhymeFamily[];
} {
  const words: AnalysisWord[] = candidate.words.map((word) => {
    const normalized = normalizeWord(word.text);
    const phonemes = phonemesForWord(normalized);
    return {
      ...word,
      normalized,
      phonemes,
      rhymeTail: rhymeTail(phonemes),
      rhymeFamilyIds: []
    };
  });

  const families: RhymeFamily[] = [];
  addExactFamilies(words, candidate.lines, families);
  addNearFamilies(words, families);

  return {
    words,
    lines: candidate.lines,
    rhymeFamilies: families
  };
}

function addExactFamilies(words: AnalysisWord[], lines: AnalysisLine[], families: RhymeFamily[]) {
  const groups = new Map<string, AnalysisWord[]>();
  words.forEach((word) => {
    if (!word.rhymeTail || word.normalized.length < 2) return;
    const group = groups.get(word.rhymeTail) || [];
    group.push(word);
    groups.set(word.rhymeTail, group);
  });

  for (const [tail, group] of groups) {
    const uniqueLines = new Set(group.map((word) => word.lineIndex));
    if (group.length < 2 || uniqueLines.size < 2) continue;
    const endWordIds = new Set(lines.map((line) => line.wordIds.at(-1)).filter(Boolean));
    const endHits = group.filter((word) => endWordIds.has(word.id)).length;
    const kind = endHits >= 2 ? "end" : "internal";
    const family = createFamily(families.length, kind, tail, group.map((word) => word.id), kind === "end" ? 0.94 : 0.88);
    families.push(family);
    group.forEach((word) => word.rhymeFamilyIds.push(family.id));
  }
}

function addNearFamilies(words: AnalysisWord[], families: RhymeFamily[]) {
  const alreadyGrouped = new Set(families.flatMap((family) => family.wordIds));
  const groups = new Map<string, AnalysisWord[]>();

  words.forEach((word) => {
    if (alreadyGrouped.has(word.id) || !word.rhymeTail) return;
    const nucleus = vowelNucleus(word.rhymeTail);
    if (!nucleus) return;
    const group = groups.get(nucleus) || [];
    group.push(word);
    groups.set(nucleus, group);
  });

  for (const [tail, group] of groups) {
    const uniqueLines = new Set(group.map((word) => word.lineIndex));
    if (group.length < 2 || uniqueLines.size < 2) continue;
    const family = createFamily(families.length, "near", tail, group.map((word) => word.id), 0.64);
    families.push(family);
    group.forEach((word) => word.rhymeFamilyIds.push(family.id));
  }
}

function createFamily(index: number, kind: RhymeFamily["kind"], tail: string, wordIds: string[], confidence: number): RhymeFamily {
  return {
    id: `r${index}`,
    label: `${kind}:${tail}`,
    kind,
    color: COLORS[index % COLORS.length],
    tail,
    wordIds,
    confidence
  };
}

