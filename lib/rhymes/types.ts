export interface RhymeWord {
  text: string;
  start_ms: number;
  end_ms: number;
  phonemes: string;        // ARPAbet e.g. "B AO R D ER L AY N"
  rhyme_family: string | null; // family ID or null if no rhyme
  line_index: number;
}

export interface RhymeFamily {
  color: string;           // hex color e.g. "#FF5733"
  phoneme_pattern: string; // the rhyming phoneme tail e.g. "AY N"
  member_count: number;
}

export interface RhymeLine {
  text: string;
  start_ms: number;
  end_ms: number;
  word_indices: number[];  // indices into words array
}

export interface RhymeMetadata {
  duration_ms: number;
  word_count: number;
  rhyme_density: number;   // ratio of rhyming words to total
  offset_ms: number;       // YouTube→Spotify time offset
  pipeline_version: string;
}

export interface RhymeAnalysis {
  spotify_track_id: string;
  youtube_video_id: string | null;
  isrc: string | null;
  words: RhymeWord[];
  rhyme_families: Record<string, RhymeFamily>;
  lines: RhymeLine[];
  metadata: RhymeMetadata;
}

export type QueueStatus = 'pending' | 'downloading' | 'analyzing' | 'completed' | 'failed';

export interface RhymeQueueJob {
  id: string;
  spotify_track_id: string;
  status: QueueStatus;
  progress_pct: number;
  error_message: string | null;
}
