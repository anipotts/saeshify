'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRhymeStore } from '@/lib/store/rhymes';
import { interpolatePosition, reconcilePosition } from '@/lib/rhymes/time-sync';
import type { PlaybackSnapshot } from '@/lib/rhymes/time-sync';
import LyricsDisplay from './LyricsDisplay';
import ProcessingOverlay from './ProcessingOverlay';

const PLAYBACK_POLL_MS = 2000;
const STATUS_POLL_MS = 3000;

export default function RhymePlayer() {
  const {
    trackId,
    trackName,
    artistName,
    coverUrl,
    analysis,
    isLoading,
    isProcessing,
    processingProgress,
    error,
    playback,
    setAnalysis,
    setLoading,
    setProcessing,
    setError,
    setTrack,
    updatePlayback,
  } = useRhymeStore();

  const rafRef = useRef<number>(0);
  const currentMsRef = useRef(0);
  const displayMsRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Poll Spotify playback state
  useEffect(() => {
    let alive = true;

    const pollPlayback = async () => {
      try {
        const res = await fetch('/api/rhymes/playback');
        if (!res.ok || !alive) return;
        const data = await res.json();

        const newSnapshot: PlaybackSnapshot = {
          positionMs: data.progress_ms || 0,
          isPlaying: data.is_playing || false,
          timestamp: performance.now(),
          trackId: data.track?.id || null,
        };

        // Auto-detect track change
        if (data.track && data.track.id !== trackId) {
          setTrack(
            data.track.id,
            data.track.name,
            data.track.artist,
            data.track.cover,
          );
          // Trigger analysis fetch for new track
          fetchAnalysis(data.track.id, data.track.isrc, data.track.artist, data.track.name);
        }

        updatePlayback(newSnapshot);
      } catch {
        // Silently ignore fetch errors
      }
    };

    pollPlayback();
    const interval = setInterval(pollPlayback, PLAYBACK_POLL_MS);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [trackId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch or trigger analysis
  const fetchAnalysis = useCallback(
    async (tid: string, isrc?: string, artist?: string, title?: string) => {
      setLoading(true);
      try {
        // Try to get cached analysis
        const res = await fetch(`/api/rhymes/${tid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.words && data.words.length > 0) {
            setAnalysis(data);
            return;
          }
        }

        // Not cached — enqueue
        const enqueueRes = await fetch(`/api/rhymes/${tid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isrc, artist, title }),
        });

        if (!enqueueRes.ok) {
          setError('Failed to start analysis');
          return;
        }

        const { result } = await enqueueRes.json();
        if (result === 'cached') {
          // Race condition — re-fetch
          const refetch = await fetch(`/api/rhymes/${tid}`);
          if (refetch.ok) {
            setAnalysis(await refetch.json());
          }
          return;
        }

        // Start polling queue status
        setProcessing(true, 0);
        pollQueueStatus(tid);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Poll queue status while processing
  const pollQueueStatus = useCallback(
    async (tid: string) => {
      const poll = async () => {
        try {
          const res = await fetch(`/api/rhymes/status/${tid}`);
          if (!res.ok) return;
          const data = await res.json();

          if (data.status === 'completed') {
            // Fetch the completed analysis
            const analysisRes = await fetch(`/api/rhymes/${tid}`);
            if (analysisRes.ok) {
              setAnalysis(await analysisRes.json());
            }
            return; // Stop polling
          }

          if (data.status === 'failed') {
            setError(data.error_message || 'Analysis failed');
            return; // Stop polling
          }

          setProcessing(true, data.progress_pct || 0);
          setTimeout(poll, STATUS_POLL_MS);
        } catch {
          setTimeout(poll, STATUS_POLL_MS);
        }
      };

      poll();
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // rAF loop for interpolated time
  useEffect(() => {
    const tick = () => {
      const ms = interpolatePosition(playback);
      currentMsRef.current = ms;
      displayMsRef.current = ms;

      // Force re-render by scrolling active line into view
      if (containerRef.current) {
        const activeLine = containerRef.current.querySelector('[data-active-line]');
        if (activeLine) {
          activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playback]);

  // Force re-render at 30fps for smooth word highlighting
  useEffect(() => {
    const interval = setInterval(() => {
      displayMsRef.current = currentMsRef.current;
    }, 33);
    return () => clearInterval(interval);
  }, []);

  // Retry handler
  const handleRetry = () => {
    if (trackId) {
      setError(null);
      fetchAnalysis(trackId);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Track info header */}
      {trackName && (
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          {coverUrl && (
            <img
              src={coverUrl}
              alt={trackName}
              className="w-12 h-12 rounded-md object-cover"
            />
          )}
          <div className="min-w-0">
            <h2 className="text-white font-bold text-base truncate">{trackName}</h2>
            <p className="text-muted text-sm truncate">{artistName}</p>
          </div>
          {playback.isPlaying && (
            <div className="ml-auto flex items-center gap-1">
              <span className="w-1 h-3 bg-accent rounded-full animate-pulse" />
              <span className="w-1 h-4 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
              <span className="w-1 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 md:px-8">
        {!trackId && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <h2 className="text-white text-xl font-bold">Rhyme Highlighter</h2>
            <p className="text-muted text-sm max-w-sm">
              Play a song on Spotify and the rhyme scheme will appear here in real time.
            </p>
          </div>
        )}

        {(isLoading || isProcessing) && !analysis && (
          <div className="flex items-center justify-center h-full">
            <ProcessingOverlay
              progress={processingProgress}
              error={error}
              onRetry={handleRetry}
            />
          </div>
        )}

        {error && !isProcessing && (
          <div className="flex items-center justify-center h-full">
            <ProcessingOverlay progress={0} error={error} onRetry={handleRetry} />
          </div>
        )}

        {analysis && (
          <LyricsDisplay analysis={analysis} currentMs={currentMsRef.current} />
        )}
      </div>
    </div>
  );
}
