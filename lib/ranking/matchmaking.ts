"use server";

import { createClient } from "@/lib/supabase/server";
import { RankedTrack, Matchup } from "./types";

/**
 * Generates the next optimal matchup for the user.
 * 
 * @param userId - though typically we derive from session, passing it can be useful for server-side calls if authenticated.
 * @param params.seedTrackId - Optional: ID of a track trying to be ranked specifically.
 * @param params.excludeTrackIds - IDs to strictly avoid (recently seen).
 * @param params.excludePairKeys - "minId:maxId" strings of recently seen pairs.
 */
export async function getNextMatchup(
  params: { 
    seedTrackId?: string; 
    excludeTrackIds?: string[];
    excludePairKeys?: string[];
  }
): Promise<Matchup | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { seedTrackId, excludeTrackIds = [], excludePairKeys = [] } = params;

  // 1. Fetch Candidate Pool
  // We need a decent pool size to allow for "smart" random selection.
  // We prefer "low games" tracks (Information Gain).
  
  // Query: Get tracks for this user.
  // To optimize: We can't easily "exclude" array of UUIDs in a large table scan without performance hit if array is huge,
  // but for < 10 exclusions it's fine.
  
  let candidates: RankedTrack[] = [];
  
  // A. Low Games Pool (Exploration)
  const { data: lowGamesData } = await supabase
    .from("track_ratings")
    .select("track_id, rating, games") // assumption: games column exists
    .eq("user_id", user.id)
    .order("games", { ascending: true })
    .limit(50);
    
  // B. Random Pool (Scattering - prevent getting stuck in local minima)
  // Approximate logic: Fetch a larger chunk and shuffle, or DB random if supported.
  // For Supabase/Postgres, `.order('random()')` is valid but sometimes slow on huge tables.
  // For user libraries (<5k), it's instant.
  const { data: randomData } = await supabase
    .from("track_ratings")
    .select("track_id, rating, games")
    .eq("user_id", user.id)
    .limit(50); // Just take 50, strictly we'd want random, but we'll shuffle in memory if this is just "top 50 by default sort" which is bad.
    // Ideally: .order('id') with offset? Or .rpc('get_random_tracks')?
    // Let's stick to a robust simpler query: fetch 200, shuffle.
    
  // Let's combine strategies into one query for speed if possible, or just use one good query.
  // "Get 200 tracks" then filter in memory is safest for standard libraries.
  const { data: rawCandidates } = await supabase
     .from("track_ratings")
     .select("track_id, rating, games, comparisons_count")
     .eq("user_id", user.id)
     .limit(300); // Sufficient pool
     
  if (!rawCandidates || rawCandidates.length < 2) return null;

  // Map to RankedTrack structure (partial, we'll need metadata later)
  // We don't have metadata yet. We only fetch metadata for the Chosen Pair.
  const pool = rawCandidates.map(c => ({
      id: c.track_id,
      rating: c.rating,
      games: c.games ?? c.comparisons_count ?? 0,
      comparisons_count: c.comparisons_count ?? c.games ?? 0
  } as Partial<RankedTrack>));
  
  // Filter Exclusions
  const validCandidates = pool.filter(c => !excludeTrackIds.includes(c.id!));
  
  if (validCandidates.length < 2) return null;

  // 2. Select Track A (Focus Track)
  let trackA: Partial<RankedTrack>;
  
  if (seedTrackId) {
      // Force A to be the seed if it exists in valid candidates (or even if it was excluded? No, respect exclude)
      // Actually, if user *requested* seed, we should allow it even if technically "excluded" by history (maybe).
      // But strictly, let's look for it.
      const seed = pool.find(c => c.id === seedTrackId);
      if (seed) {
          trackA = seed;
      } else {
          // Fallback if seed not found
          trackA = validCandidates[Math.floor(Math.random() * validCandidates.length)];
      }
  } else {
      // Pick A from "Low Games" subset to maximize info gain
      // Sort by games asc
      const lowGames = [...validCandidates].sort((a, b) => (a.games || 0) - (b.games || 0)).slice(0, 15);
      // Pick random from top 15 low-games tracks
      trackA = lowGames[Math.floor(Math.random() * lowGames.length)];
  }

  // 3. Select Track B (Opponent)
  // We want closeness in rating for maximum Elo efficiency (50/50 chance).
  // But strictly avoid duplicates.
  const opponents = validCandidates.filter(c => c.id !== trackA.id);
  
  // Sort by rating distance
  const sortedByDiff = opponents.sort((a, b) => 
      Math.abs((a.rating || 1500) - (trackA.rating || 1500)) - 
      Math.abs((b.rating || 1500) - (trackA.rating || 1500))
  );
  
  // Pick from top 5 closest to add noise/variety
  const topOpponents = sortedByDiff.slice(0, 5);
  let trackB = topOpponents[Math.floor(Math.random() * topOpponents.length)];
  
  // Check Exclude Pair Keys
  // If pair matches excluded key, try next.
  // pairKey = min:max
  const getPairKey = (id1: string, id2: string) => [id1, id2].sort().join(":");
  
  if (trackB && excludePairKeys.includes(getPairKey(trackA.id!, trackB.id!))) {
     // Try finding one that isn't excluded
     trackB = topOpponents.find(t => !excludePairKeys.includes(getPairKey(trackA.id!, t.id!))) || trackB;
  }

  if (!trackA || !trackB) return null;

  // 4. Hydrate Metadata
  const { data: tracks } = await supabase
    .from("tracks")
    .select("*")
    .in("id", [trackA.id, trackB.id]);

  if (!tracks || tracks.length !== 2) return null;

  const fullTrackA = tracks.find(t => t.id === trackA.id);
  const fullTrackB = tracks.find(t => t.id === trackB.id);

  // Merge metadata with stats
  const finalA: RankedTrack = {
      ...fullTrackA,
      ...trackA,
      spotify_id: fullTrackA.spotify_id, // ensure mapping
      id: fullTrackA.id
  };
  
  const finalB: RankedTrack = {
      ...fullTrackB,
      ...trackB,
      spotify_id: fullTrackB.spotify_id,
      id: fullTrackB.id
  };

  return {
     id: getPairKey(finalA.id, finalB.id),
     trackA: finalA,
     trackB: finalB
  };
}
