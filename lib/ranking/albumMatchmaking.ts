"use server";

import { createClient } from "@/lib/supabase/server";
import { RankedAlbum, AlbumMatchup } from "./types";

/**
 * Generates the next optimal album matchup for the user.
 *
 * @param params.seedAlbumId - Optional: ID of an album trying to be ranked specifically.
 * @param params.excludeAlbumIds - IDs to strictly avoid (recently seen).
 * @param params.excludePairKeys - "minId:maxId" strings of recently seen pairs.
 */
export async function getNextAlbumMatchup(
  params: {
    seedAlbumId?: string;
    excludeAlbumIds?: string[];
    excludePairKeys?: string[];
  }
): Promise<AlbumMatchup | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { seedAlbumId, excludeAlbumIds = [], excludePairKeys = [] } = params;

  // 1. Fetch Candidate Pool
  // Prefer "low games" albums (Information Gain)
  let pool: Partial<RankedAlbum>[] = [];

  // A. Fetch Seed if exists
  if (seedAlbumId) {
    const { data: seedData } = await supabase
      .from("album_ratings")
      .select("album_id, rating, games, comparisons_count")
      .eq("user_id", user.id)
      .eq("album_id", seedAlbumId)
      .single();

    if (seedData) {
      pool.push({
        id: seedData.album_id,
        rating: seedData.rating,
        games: seedData.games ?? seedData.comparisons_count ?? 0,
      });
    }
  }

  // B. Fetch General Pool (Prioritize Low Games)
  const exclusions = seedAlbumId ? [...excludeAlbumIds, seedAlbumId] : excludeAlbumIds;

  const { data: candidates } = await supabase
    .from("album_ratings")
    .select("album_id, rating, games, comparisons_count")
    .eq("user_id", user.id)
    .order("games", { ascending: true })
    .limit(100);

  if (candidates) {
    pool.push(...candidates
      .filter(c => !exclusions.includes(c.album_id))
      .map(c => ({
        id: c.album_id,
        rating: c.rating,
        games: c.games ?? c.comparisons_count ?? 0,
      }))
    );
  }

  // Deduplicate
  const seenIds = new Set();
  const validCandidates: Partial<RankedAlbum>[] = [];

  for (const p of pool) {
    if (!p.id) continue;
    if (seenIds.has(p.id)) continue;
    if (excludeAlbumIds.includes(p.id) && p.id !== seedAlbumId) continue;

    seenIds.add(p.id);
    validCandidates.push(p);
  }

  if (validCandidates.length < 2) return null;

  // 2. Select Album A (Focus Album)
  let albumA: Partial<RankedAlbum>;

  if (seedAlbumId) {
    const seed = validCandidates.find(c => c.id === seedAlbumId);
    if (seed) {
      albumA = seed;
    } else {
      albumA = validCandidates[Math.floor(Math.random() * validCandidates.length)];
    }
  } else {
    // Pick A from "Low Games" subset (first 15 of sorted validCandidates)
    const lowGames = validCandidates.slice(0, 15);
    albumA = lowGames[Math.floor(Math.random() * lowGames.length)];
  }

  // 3. Select Album B (Opponent)
  // Match by rating proximity for maximum Elo efficiency
  const opponents = validCandidates.filter(c => c.id !== albumA.id);

  const sortedByDiff = opponents.sort((a, b) =>
    Math.abs((a.rating || 1500) - (albumA.rating || 1500)) -
    Math.abs((b.rating || 1500) - (albumA.rating || 1500))
  );

  // Pick from top 5 closest to add variety
  const topOpponents = sortedByDiff.slice(0, 5);
  let albumB = topOpponents[Math.floor(Math.random() * topOpponents.length)];

  // Check Exclude Pair Keys
  const getPairKey = (id1: string, id2: string) => [id1, id2].sort().join(":");

  if (albumB && excludePairKeys.includes(getPairKey(albumA.id!, albumB.id!))) {
    albumB = topOpponents.find(t => !excludePairKeys.includes(getPairKey(albumA.id!, t.id!))) || albumB;
  }

  if (!albumA || !albumB) return null;

  // 4. Hydrate Metadata
  const { data: albums } = await supabase
    .from("albums")
    .select("*")
    .in("id", [albumA.id, albumB.id]);

  if (!albums || albums.length !== 2) return null;

  const fullAlbumA = albums.find(a => a.id === albumA.id);
  const fullAlbumB = albums.find(a => a.id === albumB.id);

  // Merge metadata with stats
  const finalA: RankedAlbum = {
    ...fullAlbumA,
    ...albumA,
    id: fullAlbumA.id,
    name: fullAlbumA.name,
    cover_url: fullAlbumA.cover_url,
    artist_ids: fullAlbumA.artist_ids,
    rating: albumA.rating || 1500,
    games: albumA.games || 0,
  };

  const finalB: RankedAlbum = {
    ...fullAlbumB,
    ...albumB,
    id: fullAlbumB.id,
    name: fullAlbumB.name,
    cover_url: fullAlbumB.cover_url,
    artist_ids: fullAlbumB.artist_ids,
    rating: albumB.rating || 1500,
    games: albumB.games || 0,
  };

  return {
    id: getPairKey(finalA.id, finalB.id),
    albumA: finalA,
    albumB: finalB,
  };
}
