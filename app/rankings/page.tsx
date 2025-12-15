"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRankings } from "@/lib/hooks/useData";
import { useUIStore } from "@/lib/store";
import { Trophy, Info } from "lucide-react";
import clsx from "clsx";

export default function RankingsPage() {
  const { tracks, loading } = useRankings();
  const { openDetails } = useUIStore();
  const [filter, setFilter] = useState<'tracks' | 'artists' | 'albums'>('tracks');

  const getConfidence = (games: number = 0) => {
    if (games >= 15) return { text: "High", color: "bg-green-500/20 text-green-400" };
    if (games >= 5) return { text: "Med", color: "bg-yellow-500/20 text-yellow-400" };
    return { text: "Low", color: "bg-red-500/20 text-red-400" };
  };

  return (
    <div className="min-h-full pb-safe">
      
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-4 pb-0 border-b border-white/5">
        <div className="flex items-center justify-between pt-2 px-4 mb-4">
           <h1 className="text-2xl font-bold tracking-tight text-foreground">Rankings</h1>
        </div>

        {/* Tabs/Pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
           <button 
             onClick={() => setFilter('tracks')}
             className={clsx(
               "px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
               filter === 'tracks' ? "bg-white text-black" : "bg-zinc-800 text-muted-foreground hover:bg-zinc-700 hover:text-white"
             )}
           >
             Tracks
           </button>
           
           <div className="group relative">
             <button 
               className="px-4 py-1.5 rounded-full text-sm font-medium bg-zinc-800/50 text-muted-foreground/50 cursor-not-allowed whitespace-nowrap border border-transparent"
             >
               Artists
             </button>
             {/* Tooltip */}
             <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-zinc-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Coming soon
             </div>
           </div>

           <div className="group relative">
             <button 
               className="px-4 py-1.5 rounded-full text-sm font-medium bg-zinc-800/50 text-muted-foreground/50 cursor-not-allowed whitespace-nowrap border border-transparent"
             >
               Albums
             </button>
             <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-zinc-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Coming soon
             </div>
           </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 py-2">
        {loading ? (
             <div className="space-y-4 pt-2">
             {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse py-2">
                  <div className="w-8 h-8 bg-zinc-900 rounded-full shrink-0" />
                  <div className="w-12 h-12 bg-zinc-900 rounded-md shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-zinc-900 rounded-full" />
                  </div>
                </div>
             ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-100 space-y-6 text-center">
             <div className="space-y-2">
               <h2 className="text-xl font-bold text-foreground">No rankings yet</h2>
               <p className="text-sm text-muted-foreground">Start comparing songs to generate rankings.</p>
             </div>
          </div>
        ) : (
          <div className="space-y-1">
             {tracks.map((track, i) => {
               const conf = getConfidence(track.games);
               return (
               <div 
                  key={track.id}
                  onClick={() => openDetails({ kind: 'track', id: track.id, payload: track })}
                  className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer group"
               >
                  {/* Rank # */}
                  <div className={clsx(
                    "w-6 text-center font-bold text-lg shrink-0",
                    i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-700" : "text-muted-foreground"
                  )}>
                     {i + 1}
                  </div>

                  {/* Artwork */}
                  <div className="relative w-12 h-12 shrink-0">
                     {track.cover_url ? (
                       <Image src={track.cover_url} alt={track.name} fill className="object-cover rounded-sm" />
                     ) : (
                       <div className="w-full h-full bg-zinc-800 rounded-sm" />
                     )}
                  </div>
                  
                  {/* Meta */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[16px] font-medium text-foreground truncate leading-snug">{track.name}</p>
                    <p className="text-[13px] text-muted-foreground truncate leading-snug">
                        {track.artist_name || (Array.isArray(track.artists) ? track.artists[0]?.name : "Unknown Artist")}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col items-end gap-1">
                     <span className="text-[15px] font-bold text-foreground tabular-nums tracking-tight">
                       {Math.round(track.rating || 1500)}
                     </span>
                     <span className={clsx("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm tracking-wide", conf.color)}>
                       {conf.text}
                     </span>
                  </div>
               </div>
             )})}
          </div>
        )}
      </div>
    </div>
  );
}
