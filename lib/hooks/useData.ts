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
// --- VAULT HOOK ---
export function useVaultTracks() {
  const [tracks, setTracks] = useState<RankedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  
  // We need current user for filtering events
  // We can fetch it or just rely on RLS policies and channel filters if we had the ID.
  // To keep it simple, we'll fetch ID once.
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
     createClient().auth.getUser().then(({ data }) => {
         if (data.user) setUserId(data.user.id);
     });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    
    const fetchVault = async () => {
       const { data, error } = await supabase
         .from("v_vault_tracks")
         .select("*")
         .order("liked_at", { ascending: false });
       
       if (!error && data) setTracks(data as any as RankedTrack[]);
       setLoading(false);
    };

    fetchVault();

    if (!userId) return; // Wait for ID to subscribe

    const channel = supabase.channel('vault_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_bank',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
            console.log("Realtime Vault Update:", payload);
            fetchVault();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { tracks, loading };
}


// --- RANKINGS HOOK ---
export function useRankings() {
   const [tracks, setTracks] = useState<RankedTrack[]>([]);
   const [loading, setLoading] = useState(true);
   const [userId, setUserId] = useState<string | null>(null);

   useEffect(() => {
     createClient().auth.getUser().then(({ data }) => {
         if (data.user) setUserId(data.user.id);
     });
   }, []);

   useEffect(() => {
     const supabase = createClient();

     const fetchRankings = async () => {
        const { data, error } = await supabase
          .from("v_vault_tracks")
          .select("*")
          .order("rating", { ascending: false }); // Elo Sort
        
        if (!error && data) setTracks(data as any as RankedTrack[]);
        setLoading(false);
     };

     fetchRankings();

     if (!userId) return;

     const channel = supabase.channel('rankings_realtime')
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'track_ratings', // Listen to ratings updates
           filter: `user_id=eq.${userId}`
         },
         (payload) => {
             fetchRankings();
         }
       )
       .subscribe();

     return () => {
       supabase.removeChannel(channel);
     };

   }, [userId]);

   return { tracks, loading };
}
