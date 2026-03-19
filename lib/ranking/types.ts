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

// Album Types
export interface RankedAlbum {
  id: string; // Spotify Album ID
  name: string;
  artist_ids?: string[];
  artist_name?: string; // Denormalized for display
  cover_url: string | null;
  rating: number;
  games: number;
  comparisons_count?: number;
  liked_at?: string;
}

export interface AlbumMatchup {
  id: string; // pairKey (min:max)
  albumA: RankedAlbum;
  albumB: RankedAlbum;
}
