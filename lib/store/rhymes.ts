import { create } from 'zustand';
import type { RhymeAnalysis } from '@/lib/rhymes/types';
import type { PlaybackSnapshot } from '@/lib/rhymes/time-sync';

interface RhymeState {
  // Track being visualized
  trackId: string | null;
  trackName: string | null;
  artistName: string | null;
  coverUrl: string | null;

  // Pre-computed rhyme data
  analysis: RhymeAnalysis | null;
  isLoading: boolean;
  isProcessing: boolean; // GPU pipeline running
  processingProgress: number; // 0-100
  error: string | null;

  // Playback state
  playback: PlaybackSnapshot;

  // Actions
  setTrack: (trackId: string, trackName: string, artistName: string, coverUrl: string | null) => void;
  setAnalysis: (analysis: RhymeAnalysis) => void;
  setLoading: (loading: boolean) => void;
  setProcessing: (processing: boolean, progress?: number) => void;
  setError: (error: string | null) => void;
  updatePlayback: (snapshot: PlaybackSnapshot) => void;
  reset: () => void;
}

const initialPlayback: PlaybackSnapshot = {
  positionMs: 0,
  isPlaying: false,
  timestamp: 0,
  trackId: null,
};

export const useRhymeStore = create<RhymeState>((set) => ({
  trackId: null,
  trackName: null,
  artistName: null,
  coverUrl: null,
  analysis: null,
  isLoading: false,
  isProcessing: false,
  processingProgress: 0,
  error: null,
  playback: initialPlayback,

  setTrack: (trackId, trackName, artistName, coverUrl) =>
    set({ trackId, trackName, artistName, coverUrl, analysis: null, error: null }),

  setAnalysis: (analysis) =>
    set({ analysis, isLoading: false, isProcessing: false, processingProgress: 100 }),

  setLoading: (isLoading) => set({ isLoading }),

  setProcessing: (isProcessing, progress) =>
    set({ isProcessing, processingProgress: progress ?? 0 }),

  setError: (error) => set({ error, isLoading: false, isProcessing: false }),

  updatePlayback: (playback) => set({ playback }),

  reset: () =>
    set({
      trackId: null,
      trackName: null,
      artistName: null,
      coverUrl: null,
      analysis: null,
      isLoading: false,
      isProcessing: false,
      processingProgress: 0,
      error: null,
      playback: initialPlayback,
    }),
}));
