"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Clock, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/lib/store";

export default function ListeningHistory() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { openDetails } = useUIStore();

  useEffect(() => {
    const supabase = createClient();
    
    async function fetchHistory() {
      // Get recent unique tracks
      // Since specific queries like "distinct on track_id" might be heavy or need indexes,
      // we'll just fetch recent 50 and client-side dedup for UI smoothness.
      
      const { data, error } = await supabase
        .from("listening_events")
        .select("*")
        .order("played_at", { ascending: false })
        .limit(20);

      if (!error && data) {
         // Dedup by track_spotify_id
         const seen = new Set();
         const unique = data.filter(e => {
             if (seen.has(e.track_spotify_id)) return false;
             seen.add(e.track_spotify_id);
             return true;
         });
         setEvents(unique);
      }
      setLoading(false);
    }

    fetchHistory();
  }, []);

  if (!loading && events.length === 0) return null;

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center gap-2 px-4">
         <div className="p-1.5 bg-green-500/10 rounded-full">
            <Play size={12} className="text-[#1DB954] fill-current" />
         </div>
         <h2 className="text-lg font-bold text-white">From your listening</h2>
      </div>

      <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar">
        {loading ? (
           [...Array(3)].map((_, i) => (
             <div key={i} className="min-w-[140px] w-[140px] space-y-2 animate-pulse">
                <div className="w-full aspect-square bg-zinc-800 rounded-md" />
                <div className="h-3 w-3/4 bg-zinc-800 rounded" />
                <div className="h-2 w-1/2 bg-zinc-800 rounded" />
             </div>
           ))
        ) : (
           events.map((event) => (
              <div 
                key={event.id}
                onClick={() => openDetails({ 
                    kind: 'track', 
                    id: event.track_spotify_id, 
                    payload: event.raw?.track || { 
                        id: event.track_spotify_id, 
                        name: event.track_name, 
                        artists: [{ name: event.artist_name }],
                        album: { images: [{ url: event.cover_url }] },
                        duration_ms: event.duration_ms
                    } 
                })}
                className="min-w-[130px] w-[130px] group cursor-pointer"
              >
                  <div className="relative w-full aspect-square mb-2 shadow-lg">
                      {event.cover_url ? (
                          <Image src={event.cover_url} alt={event.track_name} fill className="object-cover rounded-md group-hover:opacity-80 transition-opacity" />
                      ) : (
                          <div className="w-full h-full bg-zinc-800 rounded-md flex items-center justify-center">
                              <Clock size={20} className="text-zinc-600" />
                          </div>
                      )}
                  </div>
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-[#1DB954] transition-colors">{event.track_name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{event.artist_name}</p>
              </div>
           ))
        )}
      </div>
    </div>
  );
}
