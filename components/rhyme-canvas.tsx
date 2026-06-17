import clsx from "clsx";
import type { TrackAnalysis, AnalysisWord } from "@/lib/analysis/types";

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
  return (
    <div className={clsx("overflow-hidden", compact ? "max-h-[520px]" : "min-h-[520px]")}>
      <div className={clsx("space-y-7", compact ? "p-3" : "p-2 md:p-6")}>
        {analysis.lines.map((line) => {
          const activeLine = currentMs >= line.startMs && currentMs <= line.endMs + 700;

          return (
            <p
              key={line.id}
              className={clsx(
                "flex flex-wrap gap-x-2 gap-y-2 leading-[1.45] transition-opacity",
                compact ? "text-2xl md:text-3xl" : "text-3xl md:text-5xl",
                activeLine ? "opacity-100" : currentMs > line.endMs ? "opacity-55" : "opacity-35"
              )}
            >
              {line.wordIds.map((wordId) => {
                const word = analysis.words.find((candidate) => candidate.id === wordId);
                if (!word) return null;
                return <WordToken key={word.id} analysis={analysis} word={word} currentMs={currentMs} inspect={inspect} />;
              })}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function WordToken({
  analysis,
  word,
  currentMs,
  inspect
}: {
  analysis: TrackAnalysis;
  word: AnalysisWord;
  currentMs: number;
  inspect: boolean;
}) {
  const active = currentMs >= word.startMs && currentMs <= word.endMs;
  const family = word.rhymeFamilyIds
    .map((id) => analysis.rhymeFamilies.find((candidate) => candidate.id === id))
    .find(Boolean);
  const hasPassed = currentMs >= word.startMs;
  const confidence = family?.confidence || word.confidence;
  const alpha = confidence >= 0.85 ? "cc" : confidence >= 0.65 ? "88" : "44";
  const background = family && hasPassed ? `${family.color}${alpha}` : "transparent";
  const outline = family && hasPassed && family.kind === "near" ? family.color : "transparent";
  const color = family && hasPassed && confidence >= 0.85 ? "#050505" : "#111111";
  const inspectLabel = family
    ? `tail ${family.tail} / ${family.id} / ${word.source} / ${Math.round(confidence * 100)}%`
    : "";

  return (
    <span className="inline-flex flex-col">
      <span
        className="rhyme-token rounded-sm px-1 font-medium transition-transform"
        data-active={active || undefined}
        style={{
          "--token-bg": background,
          "--token-color": color,
          "--token-outline": outline,
          transform: active ? "scale(1.04)" : undefined
        } as React.CSSProperties}
      >
        {word.text}
      </span>
      {inspect && family ? (
        <span className="mono mt-1 max-w-48 truncate text-[10px] uppercase text-black/55" title={inspectLabel}>
          {inspectLabel}
        </span>
      ) : null}
    </span>
  );
}
