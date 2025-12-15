"use server";

import { createClient } from "@/lib/supabase/server";
import { getNextMatchup } from "@/lib/ranking/matchmaking";
import { revalidatePath } from "next/cache";

export async function submitVoteAndFetchNext(
  winnerId: string, 
  loserId: string, 
  seedId?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
      // 1. Record Vote
      // Fire and forget catch? No, we should await to ensure integrity.
      const { error } = await supabase.rpc('record_comparison', {
        p_winner_id: winnerId,
        p_loser_id: loserId,
        p_album_id: null
      });
      
      if (error) {
        console.error("VOTE: Vote failed", error);
      }
      
      // 2. Increment Games Count?
      // triggers in DB usually handle this, but if not we might strictly update.
      // SQL migration added 'comparisons_count'.
      // The RPC `record_comparison` logic is user provided. We assume it handles Elo.
      // We should ideally ensure 'record_comparison' is up to date.
  }

  // 3. Get Next
  const nextPair = await getNextMatchup(seedId);
  return nextPair;
}
