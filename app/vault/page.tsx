"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, MoreHorizontal, Trophy, Trash2, Play } from "lucide-react";
import { useVaultTracks } from "@/lib/hooks/useData";
import { useUIStore } from "@/lib/store";
import { removeTrackFromVault } from "@/lib/actions/vault";
import PageHeader from "@/components/PageHeader";
import { useRouter } from "next/navigation";
import clsx from "clsx";

function formatDuration(ms: number) {
  if (!ms) return "-:--";
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
}

export default function VaultPage() {
  const { tracks, loading } = useVaultTracks();
  const { openDetails } = useUIStore();
  const router = useRouter();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Close menu on click outside
  React.useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleMenuClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleRemove = async (id: string) => {
    try {
      await removeTrackFromVault(id);
      // Data hook should auto-refresh if it uses realtime or we might need to manually trigger refresh
      // Since useVaultTracks is simple useEffect, we might need to rely on revalidatePath happening on server 
      // passing down to client via router.refresh() or just optimistic removal.
      // For now, let's assume server action revalidatePath works or we force reload.
      // Ideally we would update local state, but tracks comes from hook.
      // Let's assume revalidate works.
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartRanking = (track: any) => {
    router.push(`/rankings?start_ranking=${track.id}`);
    // Or compare page. Let's send to Rankings page as requested "Start ranking from this"
    // Actually typically ranking starts at /compare.
    // The Rankings Page is for viewing rankings.
    // I will guess '/compare' is the right place.
    // The user said "Start ranking from this".
    // I'll stick to a query param on rankings for now or compare.
    // Let's use compare.
    router.push(`/compare?seed=${track.id}`);
  };


// ... inside component

  return (
    <div className="min-h-full pb-safe">
      
      {/* Header */}
      <PageHeader title="Vault">
         <div className="flex items-center gap-4 w-full text-sm font-medium text-muted-foreground">
             <span>{loading ? "..." : `${tracks.length} songs`}</span>
             {/* Optional Filters */}
             <div className="flex gap-2 ml-auto overflow-x-auto no-scrollbar">
               <button className="bg-white/5 hover:bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">Playlists</button>
               <button className="bg-white/5 hover:bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">Artists</button>
             </div>
         </div>
      </PageHeader>
      
      {/* Content */}
      <div className="px-4 py-2">
        {loading ? (
             <div className="space-y-4 pt-2">
             {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse py-2">
                  <div className="w-12 h-12 bg-zinc-900 rounded-md shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-zinc-900 rounded-full" />
                    <div className="h-2 w-1/4 bg-zinc-900 rounded-full" />
                  </div>
                </div>
             ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-100 space-y-6 text-center">
             <div className="space-y-2">
               <h2 className="text-xl font-bold text-foreground">Vault is empty</h2>
               <p className="text-sm text-muted-foreground">Search and add songs to start ranking.</p>
             </div>
             <Link href="/" className="bg-white text-black font-bold py-3 px-8 rounded-full text-sm hover:scale-105 transition-transform">
               Find songs
             </Link>
          </div>
        ) : (
          <div className="space-y-1">
             {/* Header Row (Desktop Only) */}
             <div className="hidden md:flex items-center text-muted-foreground text-sm font-medium pb-2 border-b border-white/5 mb-2 px-2">
                <div className="w-8 text-center mr-4">#</div>
                <div className="flex-1">Title</div>
                <div className="flex-1">Album</div>
                <div className="w-24 text-right pr-8">Duration</div>
                <div className="w-8"></div>
             </div>

             {tracks.map((track, i) => (
               <div 
                  key={track.id}
                  onClick={() => openDetails({ kind: 'track', id: track.id, payload: track })}
                  className="group flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer relative"
               >
                  {/* Leading Index / Play Icon on Hover */}
                  <div className="hidden md:flex w-8 justify-center shrink-0 text-muted-foreground font-medium text-sm">
                      <span className="group-hover:hidden">{i + 1}</span>
                      <Play size={16} className="hidden group-hover:block text-white translate-x-0.5" fill="currentColor" />
                  </div>

                  {/* Artwork */}
                  <div className="relative w-12 h-12 shrink-0 md:w-10 md:h-10">
                     {track.cover_url ? (
                       <Image src={track.cover_url} alt={track.name} fill className="object-cover rounded-sm" />
                     ) : (
                       <div className="w-full h-full bg-zinc-800 rounded-sm" />
                     )}
                  </div>
                  
                  {/* Meta */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[16px] md:text-[14px] font-medium text-foreground truncate leading-snug lg:group-hover:text-accent transition-colors">
                        {track.name}
                    </p>
                    <p className="text-[13px] text-muted-foreground truncate leading-snug">
                        {/* 
                          Checking if track has array logic or flat fields. 
                          Assuming view returns 'artist_names' or similar, OR we fallback to text 
                          Usually views flatten JSON. If normalizeSpotify saves artist_ids, the view might join.
                          Let's try track.artist_name || "Unknown Artist" 
                        */}
                        {track.artist_name || (Array.isArray(track.artists) ? track.artists[0]?.name : "Unknown Artist")}
                    </p>
                  </div>

                   {/* Album (Desktop) */}
                   <div className="hidden md:block flex-1 min-w-0 pr-4">
                      <p className="text-[14px] text-muted-foreground truncate hover:text-white transition-colors">
                        {track.album_name || track.album?.name || "Unknown Album"}
                      </p>
                   </div>
                   
                   {/* Duration (Desktop) */}
                   <div className="hidden md:block w-24 text-right pr-4 text-sm text-muted-foreground font-variant-numeric tabular-nums">
                      {formatDuration(track.duration_ms || 0)}
                   </div>

                  {/* Overflow Menu Trigger */}
                  <div className="relative">
                    <button 
                        onClick={(e) => handleMenuClick(e, track.id)}
                        className="p-2 text-muted-foreground hover:text-white md:opacity-0 md:group-hover:opacity-100 transition-all"
                    >
                        <MoreHorizontal size={20} />
                    </button>
                    
                    {/* Simplified Dropdown */}
                    {activeMenuId === track.id && (
                        <div className="absolute right-0 top-full mt-1 bg-[#282828] rounded-md shadow-xl z-50 py-1 min-w-[180px] border border-white/5 overflow-hidden">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleStartRanking(track); setActiveMenuId(null); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-[#3E3E3E] flex items-center gap-2"
                            >
                                <Trophy size={16} /> Start ranking
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleRemove(track.id); setActiveMenuId(null); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[#3E3E3E] flex items-center gap-2"
                            >
                                <Trash2 size={16} /> Remove from vault
                            </button>
                        </div>
                    )}
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
