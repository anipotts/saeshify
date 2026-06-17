import clsx from "clsx";
import { useMemo, type CSSProperties } from "react";
import type { AnalysisLine, AnalysisWord, RhymeFamily, TrackAnalysis } from "@/lib/analysis/types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "what",
  "when",
  "while",
  "with"
]);

export default function RhymeCanvas({
  analysis,
  currentMs,
  compact = false,
  inspect = false
}: {
  analysis: TrackAnalysis;
  currentMs: number;
  compact?: boolean;
  inspect?: boolean;
}) {
  const wordById = useMemo(() => new Map(analysis.words.map((word) => [word.id, word])), [analysis.words]);
  const familyById = useMemo(() => new Map(analysis.rhymeFamilies.map((family) => [family.id, family])), [analysis.rhymeFamilies]);

  return (
    <div className={clsx("overflow-hidden", compact ? "max-h-[520px]" : "min-h-[540px]")}>
      <div className={clsx("bar-canvas space-y-7", compact ? "px-4 py-5 md:px-5" : "px-4 py-6 sm:px-7 md:px-9")}>
        {analysis.lines.map((line, index) => (
          <BarLine
            key={line.id}
            compact={compact}
            currentMs={currentMs}
            familyById={familyById}
            index={index}
            inspect={inspect}
            line={line}
            wordById={wordById}
          />
        ))}
      </div>
    </div>
  );
}

function BarLine({
  compact,
  currentMs,
  familyById,
  index,
  inspect,
  line,
  wordById
}: {
  compact: boolean;
  currentMs: number;
  familyById: Map<string, RhymeFamily>;
  index: number;
  inspect: boolean;
  line: AnalysisLine;
  wordById: Map<string, AnalysisWord>;
}) {
  const words = line.wordIds.map((wordId) => wordById.get(wordId)).filter(Boolean) as AnalysisWord[];
  const activeLine = currentMs >= line.startMs && currentMs <= line.endMs + 500;
  const pastLine = currentMs > line.endMs + 500;
  const visibleFamilies = uniqueFamilies(words, familyById);

  return (
    <section
      className={clsx(
        "bar-line-block transition-opacity duration-300",
        activeLine ? "opacity-100" : pastLine ? "opacity-90" : "opacity-70"
      )}
      data-active={activeLine || undefined}
      aria-label={`bar ${index + 1}`}
    >
      <p
        className={clsx(
          "bar-line m-0 text-pretty font-normal leading-[1.26] tracking-normal text-black",
          compact ? "text-[30px] sm:text-[34px] md:text-[38px]" : "text-[34px] sm:text-[42px] md:text-[50px]"
        )}
      >
        {words.map((word, wordIndex) => (
          <WordToken
            key={word.id}
            currentMs={currentMs}
            family={selectDisplayFamily(word, familyById)}
            word={word}
            wordIndex={wordIndex}
          />
        ))}
      </p>
      {inspect && visibleFamilies.length > 0 ? (
        <div className="mono mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] uppercase leading-5 text-black/55">
          {visibleFamilies.map((family) => (
            <span key={`${line.id}-${family.id}`}>
              bar {index + 1} / {family.id} / tail {family.tail} / {family.kind} / {Math.round(family.confidence * 100)}%
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function WordToken({
  currentMs,
  family,
  word,
  wordIndex
}: {
  currentMs: number;
  family: RhymeFamily | null;
  word: AnalysisWord;
  wordIndex: number;
}) {
  const active = currentMs >= word.startMs && currentMs <= word.endMs;
  const hasPassed = currentMs >= word.startMs;
  const confidence = family?.confidence || word.confidence;
  const alpha = confidence >= 0.85 ? "d9" : "8f";
  const background = family && hasPassed ? `${family.color}${alpha}` : "transparent";
  const outline = active && family && hasPassed ? "#050505" : family && hasPassed && family.kind === "near" ? `${family.color}cc` : "transparent";
  const title = family ? `tail ${family.tail} / ${family.id} / ${word.source} / ${Math.round(confidence * 100)}%` : word.text;

  return (
    <span>
      {wordIndex > 0 ? " " : null}
      <span
        className={clsx(
          "rhyme-token box-decoration-clone rounded-[2px] px-[0.08em] py-[0.01em] transition-colors duration-200",
          family && hasPassed ? "font-medium" : "font-normal"
        )}
        data-active={active || undefined}
        style={
          {
            "--token-bg": background,
            "--token-color": "#111111",
            "--token-outline": outline
          } as CSSProperties
        }
        title={title}
      >
        {word.text}
      </span>
    </span>
  );
}

function uniqueFamilies(words: AnalysisWord[], familyById: Map<string, RhymeFamily>) {
  const families = new Map<string, RhymeFamily>();
  words.forEach((word) => {
    const family = selectDisplayFamily(word, familyById);
    if (family) families.set(family.id, family);
  });
  return Array.from(families.values());
}

function selectDisplayFamily(word: AnalysisWord, familyById: Map<string, RhymeFamily>) {
  const families = word.rhymeFamilyIds
    .map((id) => familyById.get(id))
    .filter((family): family is RhymeFamily => Boolean(family))
    .filter((family) => shouldShowFamily(word, family));

  return [...families].sort((left, right) => familyWeight(right) - familyWeight(left))[0] || null;
}

function shouldShowFamily(word: AnalysisWord, family: RhymeFamily) {
  if (STOP_WORDS.has(word.normalized)) return false;
  if (family.wordIds.length < 2) return false;
  if (family.kind === "near") {
    return word.normalized.length >= 4 && family.wordIds.length >= 3;
  }
  return family.confidence >= 0.82;
}

function familyWeight(family: RhymeFamily) {
  const kindWeight = family.kind === "end" ? 0.3 : family.kind === "internal" ? 0.18 : 0.05;
  return family.confidence + kindWeight + family.wordIds.length / 100;
}
