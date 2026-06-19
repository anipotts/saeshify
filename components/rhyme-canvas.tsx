import clsx from "clsx";
import { useMemo, type CSSProperties } from "react";
import type { AnalysisLine, AnalysisWord, RhymeFamily, TrackAnalysis } from "@/lib/analysis/types";
import { selectRhymeDisplayFamily, visibleRhymeFamiliesForWords, wordsForLine } from "@/lib/rhyme/display";

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
    <div className={clsx("overflow-hidden", compact ? "max-h-[440px] sm:max-h-[480px]" : "min-h-[620px]")}>
      <div
        className={clsx(
          "bar-canvas space-y-4 sm:space-y-5",
          compact ? "px-4 py-5 md:px-5" : "px-4 py-6 sm:px-8 sm:py-8 md:px-10"
        )}
      >
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
  const words = wordsForLine(line, wordById);
  const activeLine = currentMs >= line.startMs && currentMs <= line.endMs + 500;
  const pastLine = currentMs > line.endMs + 500;
  const revealedLine = currentMs >= line.startMs;
  const stanzaBreak = index > 0 && index % 4 === 0;
  const visibleFamilies = visibleRhymeFamiliesForWords(words, familyById);

  return (
    <section
      className={clsx(
        "bar-line-block transition-opacity duration-300",
        stanzaBreak && "pt-8 sm:pt-12",
        activeLine ? "opacity-100" : pastLine ? "opacity-90" : "opacity-60"
      )}
      data-active={activeLine || undefined}
      aria-label={`bar ${index + 1}`}
    >
      <p
        className={clsx(
          "bar-line m-0 text-pretty font-normal leading-[1.18] tracking-normal text-black",
          compact ? "text-[28px] sm:text-[33px] md:text-[37px]" : "text-[30px] sm:text-[40px] md:text-[48px] xl:text-[56px]"
        )}
      >
        {words.map((word, wordIndex) => (
          <WordToken
            key={word.id}
            activeLine={activeLine}
            family={selectRhymeDisplayFamily(word, familyById)}
            revealedLine={revealedLine}
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
  activeLine,
  family,
  revealedLine,
  word,
  wordIndex
}: {
  activeLine: boolean;
  family: RhymeFamily | null;
  revealedLine: boolean;
  word: AnalysisWord;
  wordIndex: number;
}) {
  const confidence = family?.confidence || word.confidence;
  const alpha = confidence >= 0.85 ? "dd" : "95";
  const background = family && revealedLine ? `${family.color}${alpha}` : "transparent";
  const title = family ? `tail ${family.tail} / ${family.id} / ${word.source} / ${Math.round(confidence * 100)}%` : word.text;

  return (
    <span>
      {wordIndex > 0 ? " " : null}
      <span
        className={clsx(
          "rhyme-token box-decoration-clone rounded-[2px] px-[0.08em] py-[0.01em] transition-colors duration-200",
          family && revealedLine ? "font-medium" : "font-normal"
        )}
        data-active={(activeLine && family && revealedLine) || undefined}
        style={
          {
            "--token-bg": background,
            "--token-color": "#111111",
            "--token-outline": "transparent"
          } as CSSProperties
        }
        title={title}
      >
        {word.text}
      </span>
    </span>
  );
}
