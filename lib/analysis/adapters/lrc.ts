import type { AnalysisAdapterKind, AnalysisLine, TimedWord } from "../types";

const TIMESTAMP_RE = /^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?]\s*(.*)$/;
const WORD_TIMESTAMP_RE = /<(\d{2}):(\d{2})(?:\.(\d{2,3}))?>/g;

type ParsedLrcLine = {
  startMs: number;
  text: string;
  timedSegments: Array<{ startMs: number; text: string }>;
};

export function parseLrc(lrc: string, source: AnalysisAdapterKind, fallbackDurationMs = 30000) {
  const parsed = lrc
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(TIMESTAMP_RE);
      if (!match) return null;
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fraction = Number((match[3] || "0").padEnd(3, "0"));
      const startMs = minutes * 60_000 + seconds * 1000 + fraction;
      const rawText = match[4].trim();
      return {
        startMs,
        text: stripWordTimestamps(rawText),
        timedSegments: parseWordTimedSegments(rawText, startMs)
      };
    })
    .filter((line): line is ParsedLrcLine => Boolean(line && line.text));

  const lines: AnalysisLine[] = [];
  const words: TimedWord[] = [];

  parsed.forEach((line, lineIndex) => {
    const nextStart = parsed[lineIndex + 1]?.startMs ?? Math.max(line.startMs + 2600, fallbackDurationMs);
    const wordIds: string[] = [];
    const timedWords = expandTimedWords(line.timedSegments, nextStart);
    const rawWords = timedWords.length > 0 ? timedWords.map((word) => word.text) : line.text.split(/\s+/).filter(Boolean);
    const slotMs = Math.max(180, (nextStart - line.startMs) / Math.max(rawWords.length, 1));

    rawWords.forEach((word, wordIndex) => {
      const timedWord = timedWords[wordIndex];
      const id = `w${words.length}`;
      const startMs = Math.round(timedWord?.startMs ?? line.startMs + wordIndex * slotMs);
      const endMs = Math.round(Math.min(nextStart - 40, timedWord?.endMs ?? startMs + slotMs * 0.82));
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

function stripWordTimestamps(text: string) {
  return text.replace(WORD_TIMESTAMP_RE, " ").replace(/\s+/g, " ").trim();
}

function parseWordTimedSegments(text: string, lineStartMs: number) {
  const matches = [...text.matchAll(WORD_TIMESTAMP_RE)];
  if (matches.length === 0) return [];

  const leadText = text.slice(0, matches[0]?.index ?? 0).trim();
  const segments = matches
    .map((match, index) => {
      const next = matches[index + 1];
      const content = text.slice((match.index || 0) + match[0].length, next?.index ?? text.length).trim();
      return {
        startMs: timestampPartsToMs(match[1], match[2], match[3]),
        text: content
      };
    })
    .filter((segment) => segment.text.length > 0);

  return leadText.length > 0 ? [{ startMs: lineStartMs, text: leadText }, ...segments] : segments;
}

function expandTimedWords(segments: Array<{ startMs: number; text: string }>, lineEndMs: number) {
  return segments.flatMap((segment, segmentIndex) => {
    const rawWords = segment.text.split(/\s+/).filter(Boolean);
    const nextStart = segments[segmentIndex + 1]?.startMs ?? lineEndMs;
    const slotMs = Math.max(90, (nextStart - segment.startMs) / Math.max(rawWords.length, 1));

    return rawWords.map((word, wordIndex) => {
      const startMs = segment.startMs + wordIndex * slotMs;
      return {
        text: word,
        startMs,
        endMs: Math.min(nextStart - 20, startMs + slotMs * 0.86)
      };
    });
  });
}

function timestampPartsToMs(minutes: string, seconds: string, fraction = "0") {
  return Number(minutes) * 60_000 + Number(seconds) * 1000 + Number(fraction.padEnd(3, "0"));
}
