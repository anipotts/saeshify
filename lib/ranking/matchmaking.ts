"use server";

import { createClient } from "@/lib/supabase/server";

export type MatchupPair = [any, any]; // Tuple of 2 track objects

export async function getNextMatchup(forcedSeedId?: string): Promise<MatchupPair | null> {
  const supabase = createClient();
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

  let trackA_ID, trackB_ID;

  if (forcedSeedId) {
    trackA_ID = forcedSeedId;
    const seedRating = candidates.find(c => c.track_id === forcedSeedId)?.rating || 1500;
    
    // Find closest rating
    const sortedByDiff = candidates
      .filter(c => c.track_id !== forcedSeedId)
      .sort((a, b) => Math.abs(a.rating - seedRating) - Math.abs(b.rating - seedRating));
    
    // Pick one of top 5 closest to avoid same matchup loop
    const rival = sortedByDiff[Math.floor(Math.random() * Math.min(5, sortedByDiff.length))];
    trackB_ID = rival?.track_id;
  } else {
    // Random pair weighted by fewer games?
    // Let's just do pure random for MVP robustness
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    trackA_ID = shuffled[0].track_id;
    trackB_ID = shuffled[1].track_id;
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
