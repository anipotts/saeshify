"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import type { AnalysisLine, AnalysisWord, RhymeFamily, TrackAnalysis } from "@/lib/analysis/types";

const QUIET_WORDS = new Set(["a", "an", "and", "as", "i", "in", "into", "of", "on", "or", "the", "to", "with"]);

export default function KaraokeRhymePlayer({
  analysis,
  currentMs,
  compact = false
}: {
  analysis: TrackAnalysis;
  currentMs: number;
  compact?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<Record<string, HTMLElement | null>>({});
  const wordById = useMemo(() => new Map(analysis.words.map((word) => [word.id, word])), [analysis.words]);
  const familyById = useMemo(() => new Map(analysis.rhymeFamilies.map((family) => [family.id, family])), [analysis.rhymeFamilies]);
  const displayFamilyByWordId = useMemo(
    () => buildDisplayFamilyMap(analysis.lines, wordById, familyById),
    [analysis.lines, wordById, familyById]
  );
  const activeLineIndex = useMemo(() => getActiveLineIndex(analysis.lines, currentMs), [analysis.lines, currentMs]);
  const activeWordId = useMemo(() => getActiveWordId(analysis.words, currentMs), [analysis.words, currentMs]);

  useEffect(() => {
    const container = scrollRef.current;
    const activeLine = analysis.lines[activeLineIndex];
    const node = activeLine ? lineRefs.current[activeLine.id] : null;
    if (!container || !node) return;

    const focusY = compact ? container.clientHeight * 0.26 : container.clientHeight * 0.34;
    const containerBox = container.getBoundingClientRect();
    const nodeBox = node.getBoundingClientRect();
    container.scrollTo({
      top: Math.max(container.scrollTop + nodeBox.top - containerBox.top - focusY, 0),
      behavior: "smooth"
    });
  }, [activeLineIndex, analysis.lines, compact]);

  return (
    <section className="overflow-hidden rounded-[4px] border border-black bg-[#d9d9d9]">
      <div className="flex h-9 items-center justify-between bg-black px-4 text-white">
        <span className="truncate pr-4 text-[12px] font-black uppercase leading-none">
          {analysis.track.artist} - {analysis.track.title}
        </span>
        <span className="mono shrink-0 text-[11px] text-white/62">{formatClock(currentMs)}</span>
      </div>

      <div
        ref={scrollRef}
        className={clsx(
          "karaoke-scroll overflow-x-hidden overflow-y-auto scroll-smooth px-4 py-4 sm:px-7 sm:py-6",
          compact ? "h-[590px]" : "h-[clamp(292px,calc(100dvh-470px),390px)] sm:h-[calc(100vh-206px)] sm:min-h-[560px]"
        )}
      >
        <div className="pb-[42vh]">
          {analysis.lines.map((line, index) => {
            const words = line.wordIds.map((wordId) => wordById.get(wordId)).filter(Boolean) as AnalysisWord[];
            const active = index === activeLineIndex;
            const past = currentMs > line.endMs + 200;

            return (
              <section
                key={line.id}
                ref={(node) => {
                  lineRefs.current[line.id] = node;
                }}
                className={clsx(
                  "transition-opacity duration-300",
                  index > 0 && index % 4 === 0 ? "pt-5 sm:pt-7" : "pt-1",
                  active ? "opacity-100" : past ? "opacity-92" : "opacity-78"
                )}
                aria-label={`bar ${index + 1}`}
              >
                <p
                  className={clsx(
                    "m-0 w-full max-w-full whitespace-normal font-normal leading-[1.31] tracking-normal text-black sm:max-w-[22em]",
                    compact ? "text-[23px] sm:text-[30px]" : "text-[23px] sm:text-[31px] xl:text-[35px]"
                  )}
                >
                  {words.map((word, wordIndex) => (
                    <TimedWord
                      key={word.id}
                      active={word.id === activeWordId}
                      currentMs={currentMs}
                      family={displayFamilyByWordId.get(word.id) || null}
                      word={word}
                      wordIndex={wordIndex}
                    />
                  ))}
                </p>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TimedWord({
  active,
  currentMs,
  family,
  word,
  wordIndex
}: {
  active: boolean;
  currentMs: number;
  family: RhymeFamily | null;
  word: AnalysisWord;
  wordIndex: number;
}) {
  const reached = currentMs >= word.startMs - 35;
  const passed = currentMs >= word.endMs;
  const progress = active ? Math.min(Math.max((currentMs - word.startMs) / Math.max(word.endMs - word.startMs, 1), 0), 1) : 0;
  const familyFill = family ? `${family.color}${family.confidence >= 0.85 ? "e8" : "a6"}` : "transparent";
  const background = family && reached ? familyFill : "transparent";
  const karaokeFill = family && reached ? `${family.color}${family.confidence >= 0.85 ? "f2" : "cc"}` : "rgb(30 215 96 / 0.34)";
  const textColor = reached ? "#111111" : "rgb(17 17 17 / 0.32)";
  const title = family ? `${family.kind} / ${family.tail} / ${Math.round(family.confidence * 100)}%` : word.text;

  return (
    <span>
      {wordIndex > 0 ? " " : null}
      <span
        className={clsx(
          "karaoke-word rhyme-token relative box-decoration-clone rounded-[2px] px-[0.08em] py-[0.01em]",
          family && reached && "font-medium",
          active && "is-active"
        )}
        data-active={active || undefined}
        data-ghost={!reached || undefined}
        data-passed={passed || undefined}
        style={
          {
            "--token-bg": background,
            "--token-color": textColor,
            "--token-outline": "transparent",
            "--karaoke-fill": karaokeFill,
            "--karaoke-progress-pct": `${Math.round(progress * 100)}%`
          } as CSSProperties
        }
        title={title}
      >
        {word.text}
      </span>
    </span>
  );
}

function getActiveLineIndex(lines: AnalysisLine[], currentMs: number) {
  const active = lines.findIndex((line) => currentMs >= line.startMs && currentMs <= line.endMs);
  if (active >= 0) return active;
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (currentMs > lines[index].endMs) return index;
  }
  return 0;
}

function getActiveWordId(words: AnalysisWord[], currentMs: number) {
  return words.find((word) => currentMs >= word.startMs && currentMs <= word.endMs)?.id || null;
}

function displayFamily(word: AnalysisWord, familyById: Map<string, RhymeFamily>) {
  if (QUIET_WORDS.has(word.normalized)) return null;
  const families = word.rhymeFamilyIds
    .map((id) => familyById.get(id))
    .filter((family): family is RhymeFamily => Boolean(family))
    .filter((family) => family.wordIds.length >= 2 && (family.kind !== "near" || family.wordIds.length >= 4));

  return [...families].sort((left, right) => familyWeight(right) - familyWeight(left))[0] || null;
}

function buildDisplayFamilyMap(
  lines: AnalysisLine[],
  wordById: Map<string, AnalysisWord>,
  familyById: Map<string, RhymeFamily>
) {
  const display = new Map<string, RhymeFamily>();

  for (const line of lines) {
    const words = line.wordIds.map((wordId) => wordById.get(wordId)).filter(Boolean) as AnalysisWord[];
    const candidates = words
      .map((word, wordIndex) => {
        const family = displayFamily(word, familyById);
        if (!family) return null;

        const endBonus = wordIndex >= words.length - 2 ? 0.22 : 0;
        const internalBonus = wordIndex > 0 && wordIndex < words.length - 2 ? 0.08 : 0;
        const lengthBonus = Math.min(word.normalized.length / 80, 0.08);
        const score = familyWeight(family) + endBonus + internalBonus + lengthBonus;
        return { family, score, word };
      })
      .filter(Boolean) as Array<{ family: RhymeFamily; score: number; word: AnalysisWord }>;

    const lineBudget = Math.min(5, Math.max(2, Math.ceil(words.length * 0.42)));
    candidates
      .sort((left, right) => right.score - left.score)
      .slice(0, lineBudget)
      .forEach((candidate) => display.set(candidate.word.id, candidate.family));
  }

  return display;
}

function familyWeight(family: RhymeFamily) {
  const kindWeight = family.kind === "end" ? 0.3 : family.kind === "internal" ? 0.16 : 0.04;
  return family.confidence + kindWeight + family.wordIds.length / 120;
}

function formatClock(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = `${totalSeconds % 60}`.padStart(2, "0");
  return `${minutes}:${seconds}`;
}
