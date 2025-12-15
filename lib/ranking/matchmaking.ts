"use server";

import { createClient } from "@/lib/supabase/server";

export type MatchupPair = [any, any]; // Tuple of 2 track objects

export async function getNextMatchup(forcedSeedId?: string): Promise<MatchupPair | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Strategy:
  // 1. If seed provided, Find a close rival for seed (Elo similar)
  // 2. Else, 80% chance pick "High Uncertainty" pair (low games count)
  // 3. 20% chance pick "Pure Random" for diversity
  
  // Implementation note: 
  // Doing complex random weighted queries in Postgres can be slow. 
  // FAST MVP approach: Fetch `v_vault_tracks` with limit, shuffle in memory (for small library < 1000 songs this is instantaneous).

  // Fetch candidate pool (just id, rating, games)
  const { data: candidates, error } = await supabase
    .from("track_ratings")
    .select("track_id, rating, games, comparisons_count") 
    .eq("user_id", user.id)
    .limit(500); // Sanity limit

  if (!candidates || candidates.length < 2) return null;

  // 1. Cold Start Priority (Constraint: Recency/Exploration)
  // Check if we have unranked tracks (games=0)
  const coldTracks = candidates.filter(c => c.games === 0);
  
  if (!forcedSeedId && coldTracks.length >= 2 && Math.random() > 0.3) {
      // 70% chance to prioritize cold tracks if available and no seed forced
      const shuffled = [...coldTracks].sort(() => 0.5 - Math.random());
      const trackA = shuffled[0];
      const trackB = shuffled[1];
      
      const { data: tracks } = await supabase.from("tracks").select("*").in("id", [trackA.track_id, trackB.track_id]);
      if (tracks && tracks.length === 2) return [tracks[0], tracks[1]];
  }


  let trackA_ID: string | undefined;
  let trackB_ID: string | undefined;

  if (forcedSeedId) {
    trackA_ID = forcedSeedId;
    const seedRating = candidates.find(c => c.track_id === forcedSeedId)?.rating || 1500;
    
    // BINARY SEARCH / HILL CLIMBING LOGIC
    // We want to compare against a track that is "closest" in rating to find if it belongs higher or lower.
    const validOpponents = candidates.filter(c => c.track_id !== forcedSeedId);
    
    // Sort by distance to seed rating
    const sortedByDiff = validOpponents.sort((a, b) => Math.abs(a.rating - seedRating) - Math.abs(b.rating - seedRating));
    
    // Pick from the closest 3 to allow slight variance (avoiding exact same match if multiple runs)
    const closest = sortedByDiff.slice(0, 3);
    const rival = closest[Math.floor(Math.random() * closest.length)];
    
    trackB_ID = rival?.track_id;
  } else {
    // STANDARD PAIRING (Smart Matchmaking)
    // Pick A: Weighted towards fewer games (Information Gain)
    // sort by games asc, take top 10, pick random
    const lowGames = [...candidates].sort((a, b) => a.games - b.games).slice(0, 10);
    const chosenA = lowGames[Math.floor(Math.random() * lowGames.length)];
    trackA_ID = chosenA.track_id;

    // Pick B: Closest neighbor to A
    const validOpponents = candidates.filter(c => c.track_id !== trackA_ID);
    const sortedByDiff = validOpponents.sort((a, b) => Math.abs(a.rating - chosenA.rating) - Math.abs(b.rating - chosenA.rating));
    
    // Closest match
    const rival = sortedByDiff[0];
    trackB_ID = rival?.track_id;
  }

  if (!trackA_ID || !trackB_ID) return null;

  // Hydrate full track metadata
  const { data: tracks } = await supabase
    .from("tracks")
    .select("*")
    .in("id", [trackA_ID, trackB_ID]);

  if (!tracks || tracks.length !== 2) return null;

  // Ensure stable order [A, B] based on IDs we picked
  const trackA = tracks.find(t => t.id === trackA_ID);
  const trackB = tracks.find(t => t.id === trackB_ID);

  return [trackA, trackB];
}
