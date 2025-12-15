"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { getNextMatchup, MatchupPair } from "@/lib/ranking/matchmaking";

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
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVault = async () => {
       const supabase = createClient();
       // Using the View is handy, or raw join
       const { data, error } = await supabase
         .from("v_vault_tracks")
         .select("*")
         .order("liked_at", { ascending: false });
       
       if (!error && data) setTracks(data);
       setLoading(false);
    };
    fetchVault();
  }, []);

  return { tracks, loading };
}


// --- RANKINGS HOOK ---
export function useRankings() {
   const [tracks, setTracks] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     const fetchRankings = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("v_vault_tracks") // View includes rating
          .select("*")
          .order("rating", { ascending: false }); // Elo Sort
        
        if (!error && data) setTracks(data);
        setLoading(false);
     };
     fetchRankings();
   }, []);

   return { tracks, loading };
}
