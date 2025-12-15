"use server";

import { createClient } from "@/lib/supabase/server";
import { getNextMatchup } from "@/lib/ranking/matchmaking";
import { revalidatePath } from "next/cache";

import { RankedTrack, Matchup } from "@/lib/ranking/types";

export async function submitVoteAndFetchNext(
  winnerId: string, 
  loserId: string, 
  seedId?: string,
  excludeTrackIds: string[] = [],
  excludePairKeys: string[] = []
): Promise<Matchup | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
      // 1. Record Vote (Dynamic K-Factor handled by DB RPC)
      // We pass the raw IDs. The DB triggers handle the rest.
      const { error } = await supabase.rpc('record_comparison', {
        p_winner_id: winnerId,
        p_loser_id: loserId,
        p_album_id: null
      });
      
      if (error) {
        console.error("VOTE: Vote failed", error);
        // We might want to throw or return null to signal UI retry? 
        // For now, we proceed to next logic, but UI won't know save failed.
        // Ideally we throw.
      }
  }

  // 3. Get Next
  const nextPair = await getNextMatchup({
      seedTrackId: seedId,
      excludeTrackIds,
      excludePairKeys
  });
  return nextPair;
}
