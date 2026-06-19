import type { AnalysisCandidate, AnalysisLine, AnalysisWord, RhymeFamily } from "@/lib/analysis/types";
import { normalizeWord, phonemesForWord, rhymeTail, vowelNucleus } from "./phonetics";

const COLORS = ["#ef2f2f", "#d95cff", "#26d9d0", "#f0d232", "#1ed760", "#a7adb3", "#58a6ff", "#f38a2f"];
const QUIET_WORDS = new Set(["a", "an", "and", "as", "i", "in", "into", "of", "on", "or", "the", "to", "with"]);

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
  addMultisyllabicEndFamilies(words, candidate.lines, families);
  addExactFamilies(words, candidate.lines, families);
  addNearFamilies(words, families);

  return {
    words,
    lines: candidate.lines,
    rhymeFamilies: families
  };
}

function addMultisyllabicEndFamilies(words: AnalysisWord[], lines: AnalysisLine[], families: RhymeFamily[]) {
  const wordById = new Map(words.map((word) => [word.id, word]));
  const groups = new Map<string, AnalysisWord[][]>();

  for (const line of lines) {
    const significantWords = line.wordIds
      .map((wordId) => wordById.get(wordId))
      .filter((word): word is AnalysisWord => Boolean(word))
      .filter((word) => word.rhymeTail && !QUIET_WORDS.has(word.normalized) && word.normalized.length > 1);
    const phrase = significantWords.slice(-2);
    if (phrase.length < 2) continue;

    const tail = phrase.map((word) => word.rhymeTail).join(" | ");
    const group = groups.get(tail) || [];
    group.push(phrase);
    groups.set(tail, group);
  }

  for (const [tail, group] of groups) {
    const uniqueLines = new Set(group.map((phrase) => phrase[0].lineIndex));
    if (group.length < 2 || uniqueLines.size < 2) continue;

    const wordIds = unique(group.flat().map((word) => word.id));
    const family = createFamily(families.length, "multi", tail, wordIds, 0.93);
    families.push(family);
    group.flat().forEach((word) => word.rhymeFamilyIds.push(family.id));
  }
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

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
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
