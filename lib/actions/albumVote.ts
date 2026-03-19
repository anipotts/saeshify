"use server";

import { createClient } from "@/lib/supabase/server";
import { getNextAlbumMatchup } from "@/lib/ranking/albumMatchmaking";
import { AlbumMatchup } from "@/lib/ranking/types";

/**
 * Submit an album vote and fetch the next matchup in one action.
 * This reduces round-trips and provides a smoother UX.
 */
export async function submitAlbumVoteAndFetchNext(
  winnerId: string,
  loserId: string,
  seedId?: string,
  excludeAlbumIds: string[] = [],
  excludePairKeys: string[] = []
): Promise<AlbumMatchup | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // 1. Record Vote via RPC (handles Elo calculation atomically)
    const { error } = await supabase.rpc('record_album_comparison', {
      p_winner_id: winnerId,
      p_loser_id: loserId,
    });

    if (error) {
      console.error("ALBUM_VOTE: Vote failed", error);
      // Continue to next matchup anyway - UI will still work
    }
  }

  // 2. Get Next Matchup
  const nextPair = await getNextAlbumMatchup({
    seedAlbumId: seedId,
    excludeAlbumIds,
    excludePairKeys,
  });

  return nextPair;
}
