"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { getNextMatchup } from "@/lib/ranking/matchmaking";

// --- AUTH HOOK ---
import { RankedTrack } from "@/lib/ranking/types";

// ... (previous imports)

// ... (useAuthUser and useVaultTracks omitted for brevity if unchanged, but I need to be careful with replace)
// Actually I should view the file content positions again or use safe replacements.
// I will replace the whole file content to be safe and clean or just the specialized hook.
// I'll replace the whole file as it is small.

// --- AUTH HOOK ---
export function useAuthUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
       setUser(data.user);
       setLoading(false);
    });
  }, []);

  return { user, loading };
}

// --- VAULT HOOK ---
export function useVaultTracks() {
  const [tracks, setTracks] = useState<RankedTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVault = async () => {
       const supabase = createClient();
       // Using the View is handy, or raw join
       const { data, error } = await supabase
         .from("v_vault_tracks")
         .select("*")
         .order("liked_at", { ascending: false });
       
       if (!error && data) setTracks(data as any as RankedTrack[]);
       setLoading(false);
    };
    fetchVault();
  }, []);

  return { tracks, loading };
}


// --- RANKINGS HOOK ---
export function useRankings() {
   const [tracks, setTracks] = useState<RankedTrack[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     const fetchRankings = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("v_vault_tracks") // View includes rating
          .select("*")
          .order("rating", { ascending: false }); // Elo Sort
        
        if (!error && data) setTracks(data as any as RankedTrack[]);
        setLoading(false);
     };
     fetchRankings();
   }, []);

   return { tracks, loading };
}
