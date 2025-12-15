export interface RankedTrack {
  id: string; // Internal UUID
  spotify_id?: string;
  name: string;
  artist_name?: string;
  artists?: { name: string }[]; 
  artist_ids?: string[];
  album_name?: string;
  album?: { name: string, images: any[] };
  duration_ms?: number;
  cover_url: string | null;
  rating: number;
  games: number; // comparisons_count
}

export interface Matchup {
  id: string; // pairKey
  trackA: RankedTrack;
  trackB: RankedTrack;
}

export interface VoteResult {
  winnerId: string;
  loserId: string;
  winnerNewRating: number;
  loserNewRating: number;
}
