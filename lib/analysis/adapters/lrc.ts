import type { AnalysisAdapterKind, AnalysisLine, TimedWord } from "../types";

const TIMESTAMP_RE = /^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?]\s*(.*)$/;

export function parseLrc(lrc: string, source: AnalysisAdapterKind, fallbackDurationMs = 30000) {
  const parsed = lrc
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(TIMESTAMP_RE);
      if (!match) return null;
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fraction = Number((match[3] || "0").padEnd(3, "0"));
      return {
        startMs: minutes * 60_000 + seconds * 1000 + fraction,
        text: match[4].trim()
      };
    })
    .filter((line): line is { startMs: number; text: string } => Boolean(line && line.text));

  const lines: AnalysisLine[] = [];
  const words: TimedWord[] = [];

  parsed.forEach((line, lineIndex) => {
    const nextStart = parsed[lineIndex + 1]?.startMs ?? Math.max(line.startMs + 2600, fallbackDurationMs);
    const rawWords = line.text.split(/\s+/).filter(Boolean);
    const slotMs = Math.max(180, (nextStart - line.startMs) / Math.max(rawWords.length, 1));
    const wordIds: string[] = [];

    rawWords.forEach((word, wordIndex) => {
      const id = `w${words.length}`;
      const startMs = Math.round(line.startMs + wordIndex * slotMs);
      const endMs = Math.round(Math.min(nextStart - 40, startMs + slotMs * 0.82));
      wordIds.push(id);
      words.push({
        id,
        text: word,
        startMs,
        endMs,
        lineIndex,
        source,
        confidence: 0.72
      });
    });

    lines.push({
      id: `l${lineIndex}`,
      text: line.text,
      startMs: line.startMs,
      endMs: nextStart - 1,
      wordIds
    });
  });

  return { words, lines };
}

