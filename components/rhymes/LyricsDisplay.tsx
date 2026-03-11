'use client';

import { useMemo } from 'react';
import type { RhymeAnalysis } from '@/lib/rhymes/types';

interface LyricsDisplayProps {
  analysis: RhymeAnalysis;
  currentMs: number;
}

export default function LyricsDisplay({ analysis, currentMs }: LyricsDisplayProps) {
  const { words, lines, rhyme_families } = analysis;

  // Find the active line (the one containing the current playback position)
  const activeLineIndex = useMemo(() => {
    for (let i = 0; i < lines.length; i++) {
      if (currentMs >= lines[i].start_ms && currentMs <= lines[i].end_ms + 500) {
        return i;
      }
    }
    // If between lines, find the next upcoming line
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].start_ms > currentMs) return Math.max(0, i - 1);
    }
    return lines.length - 1;
  }, [lines, currentMs]);

  return (
    <div className="flex flex-col gap-3 py-4">
      {lines.map((line, lineIdx) => {
        const isActiveLine = lineIdx === activeLineIndex;
        const isPast = lineIdx < activeLineIndex;
        const isFuture = lineIdx > activeLineIndex;

        return (
          <div
            key={lineIdx}
            className="transition-opacity duration-300"
            style={{
              opacity: isActiveLine ? 1 : isPast ? 0.5 : 0.3,
            }}
            data-active-line={isActiveLine || undefined}
          >
            <p className="text-lg md:text-xl font-bold leading-relaxed flex flex-wrap gap-x-1.5 gap-y-0.5">
              {line.word_indices.map((wordIdx) => {
                const word = words[wordIdx];
                if (!word) return null;

                const isActiveWord =
                  currentMs >= word.start_ms && currentMs < word.end_ms;
                const isPastWord = currentMs >= word.end_ms;
                const familyId = word.rhyme_family;
                const family = familyId ? rhyme_families[familyId] : null;

                // Rhyme color: show once the word has been reached
                const showRhymeColor = family && isPastWord;

                return (
                  <span
                    key={wordIdx}
                    className="transition-all duration-150 rounded-sm px-0.5"
                    style={{
                      color: showRhymeColor ? family.color : undefined,
                      backgroundColor: isActiveWord
                        ? 'rgba(255,255,255,0.15)'
                        : showRhymeColor
                          ? `${family.color}18`
                          : undefined,
                      textShadow: isActiveWord
                        ? '0 0 8px rgba(255,255,255,0.4)'
                        : showRhymeColor
                          ? `0 0 12px ${family.color}60`
                          : undefined,
                      transform: isActiveWord ? 'scale(1.05)' : undefined,
                    }}
                    data-start-ms={word.start_ms}
                    data-end-ms={word.end_ms}
                  >
                    {word.text}
                  </span>
                );
              })}
            </p>
          </div>
        );
      })}
    </div>
  );
}
