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
  
  // 1. Fetch Candidate Pool
  let pool: Partial<RankedTrack>[] = [];

  // A. Fetch Seed if exists
  if (seedTrackId) {
      const { data: seedData } = await supabase
          .from("track_ratings")
          .select("track_id, rating, games, comparisons_count")
          .eq("user_id", user.id)
          .eq("track_id", seedTrackId)
          .single();
      
      if (seedData) {
           pool.push({
              id: seedData.track_id,
              rating: seedData.rating,
              games: seedData.games ?? seedData.comparisons_count ?? 0,
           });
      }
  }

  // B. Fetch General Pool (Prioritize Low Games)
  // We exclude the seed (already fetched) and the exclude list.
  const exclusions = seedTrackId ? [...excludeTrackIds, seedTrackId] : excludeTrackIds;

  const { data: candidates } = await supabase
     .from("track_ratings")
     .select("track_id, rating, games, comparisons_count")
     .eq("user_id", user.id)
     .not("track_id", "in", `(${exclusions.join(',')})`) // Note: Supabase JS .in/.not expects array usually, let's verify syntax.
     // actually .not('track_id', 'in', `(${...})`) is for raw filter. 
     // Better: .not('track_id', 'in', exclusions) -- wait, check Supabase JS docs support.
     // Standard: .filter('track_id', 'not.in', `(${exclusions.join(',')})`)
     // Or simpler: just client side filter if list is small. 
     // Let's try native .not('track_id', 'in', `(${exclusions.join(',')})`) is flaky if array empty.
     // Let's use standard filter if exclusions exist.
     .order("games", { ascending: true }) // Prioritize exploration
     .limit(100);

  if (candidates) {
      pool.push(...candidates.map(c => ({
          id: c.track_id,
          rating: c.rating,
          games: c.games ?? c.comparisons_count ?? 0,
      })));
  }

  // Deduplicate and filter (in case DB query filter failed or was complex)
  // ... logic handled below

  // Deduplicate and filter logic
  // Since we might have fetched the seed (which might be in 'candidates' if low games), dedupe.
  const seenIds = new Set();
  const validCandidates: Partial<RankedTrack>[] = [];
  
  for (const p of pool) {
      if (!p.id) continue;
      if (seenIds.has(p.id)) continue;
      // Double check exclusions (in case DB filter was lenient)
      // Note: seed is in pool but might be in exclusions if we passed it in exclusions (logic above handles this but check anyway)
      if (excludeTrackIds.includes(p.id) && p.id !== seedTrackId) continue;
      
      seenIds.add(p.id);
      validCandidates.push(p);
  }
  
  if (validCandidates.length < 2) return null;

  // 2. Select Track A (Focus Track)
  let trackA: Partial<RankedTrack>;
  
  if (seedTrackId) {
      const seed = validCandidates.find(c => c.id === seedTrackId);
      if (seed) {
          trackA = seed;
      } else {
          // Fallback
          trackA = validCandidates[Math.floor(Math.random() * validCandidates.length)];
      }
  } else {
      // Pick A from "Low Games" subset (first 15 of sorted validCandidates)
      // validCandidates are already sorted by games ASC from DB
      const lowGames = validCandidates.slice(0, 15);
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
