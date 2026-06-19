import type { AnalysisLine, AnalysisWord, RhymeFamily } from "@/lib/analysis/types";

export const DISPLAY_QUIET_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "every",
  "i",
  "in",
  "into",
  "of",
  "on",
  "only",
  "or",
  "the",
  "through",
  "to",
  "what",
  "when",
  "where",
  "while",
  "with"
]);

export interface RhymeLineSegment {
  family: RhymeFamily | null;
  words: Array<{
    word: AnalysisWord;
    wordIndex: number;
  }>;
}

export function buildRhymeDisplayMap(
  lines: AnalysisLine[],
  wordById: Map<string, AnalysisWord>,
  familyById: Map<string, RhymeFamily>
) {
  const display = new Map<string, RhymeFamily>();

  for (const line of lines) {
    const words = wordsForLine(line, wordById);
    const candidates = words
      .map((word, wordIndex) => {
        const family = selectRhymeDisplayFamily(word, familyById);
        if (!family) return null;

        const endBonus = wordIndex >= words.length - 2 ? 0.22 : 0;
        const internalBonus = wordIndex > 0 && wordIndex < words.length - 2 ? 0.08 : 0;
        const lengthBonus = Math.min(word.normalized.length / 80, 0.08);
        const score = rhymeFamilyWeight(family) + endBonus + internalBonus + lengthBonus;
        return { family, score, word };
      })
      .filter((candidate): candidate is { family: RhymeFamily; score: number; word: AnalysisWord } => Boolean(candidate));

    const lineBudget = Math.min(5, Math.max(2, Math.ceil(words.length * 0.42)));
    candidates
      .sort((left, right) => right.score - left.score)
      .slice(0, lineBudget)
      .forEach((candidate) => display.set(candidate.word.id, candidate.family));
  }

  return display;
}

export function buildRhymeLineSegments(words: AnalysisWord[], displayFamilyByWordId: Map<string, RhymeFamily>) {
  const segments: RhymeLineSegment[] = [];

  words.forEach((word, wordIndex) => {
    const family = displayFamilyByWordId.get(word.id) || null;
    const previous = segments.at(-1);
    if (previous && previous.family?.id === family?.id) {
      previous.words.push({ word, wordIndex });
      return;
    }

    segments.push({
      family,
      words: [{ word, wordIndex }]
    });
  });

  return segments;
}

export function scrollAnchorLineIndex(activeLineIndex: number, lineCount: number, contextLines: number) {
  if (lineCount <= 0) return 0;

  const safeActiveIndex = Math.min(Math.max(activeLineIndex, 0), lineCount - 1);
  const safeContextLines = Math.max(0, Math.floor(contextLines));
  return Math.max(0, safeActiveIndex - safeContextLines);
}

export function visibleRhymeFamiliesForWords(words: AnalysisWord[], familyById: Map<string, RhymeFamily>) {
  const families = new Map<string, RhymeFamily>();
  words.forEach((word) => {
    const family = selectRhymeDisplayFamily(word, familyById);
    if (family) families.set(family.id, family);
  });
  return Array.from(families.values());
}

export function selectRhymeDisplayFamily(word: AnalysisWord, familyById: Map<string, RhymeFamily>) {
  if (DISPLAY_QUIET_WORDS.has(word.normalized)) return null;

  const families = word.rhymeFamilyIds
    .map((id) => familyById.get(id))
    .filter((family): family is RhymeFamily => Boolean(family))
    .filter((family) => shouldDisplayFamily(word, family));

  return [...families].sort((left, right) => rhymeFamilyWeight(right) - rhymeFamilyWeight(left))[0] || null;
}

export function wordsForLine(line: AnalysisLine, wordById: Map<string, AnalysisWord>) {
  return line.wordIds.map((wordId) => wordById.get(wordId)).filter((word): word is AnalysisWord => Boolean(word));
}

function shouldDisplayFamily(word: AnalysisWord, family: RhymeFamily) {
  if (family.wordIds.length < 2) return false;
  if (family.kind === "near") {
    return word.normalized.length >= 4 && family.wordIds.length >= 4;
  }
  if (family.kind === "internal") {
    return family.confidence >= 0.82 && family.wordIds.length >= 3;
  }
  return family.confidence >= 0.82;
}

function rhymeFamilyWeight(family: RhymeFamily) {
  const kindWeight = family.kind === "multi" ? 0.38 : family.kind === "end" ? 0.3 : family.kind === "internal" ? 0.16 : 0.04;
  return family.confidence + kindWeight + family.wordIds.length / 120;
}
