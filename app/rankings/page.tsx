"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRankings, useAlbumRankings } from "@/lib/hooks/useData";
import { useUIStore } from "@/lib/store";
import { Trophy, Info } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import clsx from "clsx";

export default function RankingsPage() {
  const { tracks, loading: tracksLoading } = useRankings();
  const { albums, loading: albumsLoading } = useAlbumRankings();
  const { openDetails } = useUIStore();
  const [filter, setFilter] = useState<'tracks' | 'artists' | 'albums'>('tracks');

  const loading = filter === 'tracks' ? tracksLoading : albumsLoading;

  const getConfidence = (games: number = 0) => {
    if (games >= 15) return { text: "High", color: "bg-green-500/20 text-green-400" };
    if (games >= 5) return { text: "Med", color: "bg-yellow-500/20 text-yellow-400" };
    return { text: "Low", color: "bg-red-500/20 text-red-400" };
  };

  return (
    <div className="min-h-full pb-safe">
      
      {/* Header */}
      <PageHeader title="Rankings">
         {/* Tabs/Pills */}
         <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar md:pb-0">
            <button 
              onClick={() => setFilter('tracks')}
              className={clsx(
                "text-sm px-4 py-1.5 rounded-full whitespace-nowrap",
                filter === 'tracks' ? "bg-white text-black font-bold hover:scale-105 transition-transform" : "bg-zinc-800 text-muted-foreground hover:bg-zinc-700 hover:text-white font-medium"
              )}
            >
              Tracks
            </button>
            <div className="group relative">
               <button 
                 disabled 
                 className="bg-white/10 text-white/50 text-sm font-bold px-4 py-1.5 rounded-full cursor-not-allowed whitespace-nowrap"
               >
                 Artists
               </button>
               <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  Coming soon
               </div>
            </div>
            <button
              onClick={() => setFilter('albums')}
              className={clsx(
                "text-sm px-4 py-1.5 rounded-full whitespace-nowrap",
                filter === 'albums' ? "bg-white text-black font-bold hover:scale-105 transition-transform" : "bg-zinc-800 text-muted-foreground hover:bg-zinc-700 hover:text-white font-medium"
              )}
            >
              Albums
            </button>
         </div>
      </PageHeader>
      
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
        ) : filter === 'tracks' && tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-100 space-y-6 text-center">
             <div className="space-y-2">
               <h2 className="text-xl font-bold text-foreground">No rankings yet</h2>
               <p className="text-sm text-muted-foreground">Rate some songs to get started.</p>
             </div>
          </div>
        ) : filter === 'albums' && albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-100 space-y-6 text-center">
             <div className="space-y-2">
               <h2 className="text-xl font-bold text-foreground">No album rankings yet</h2>
               <p className="text-sm text-muted-foreground">Add albums to your library and start ranking.</p>
             </div>
          </div>
        ) : filter === 'tracks' ? (
          <div className="space-y-1">
             {tracks.map((track, i) => {
               const conf = getConfidence(track.games);
               return (
               <div
                  key={track.id}
                  onClick={() => openDetails({ kind: 'track', id: track.id, payload: track })}
                  className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer group row-micro"
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
        ) : (
          /* Albums List */
          <div className="space-y-1">
             {albums.map((album, i) => {
               const conf = getConfidence(album.games);
               return (
               <div
                  key={album.id}
                  onClick={() => openDetails({ kind: 'album', id: album.id, payload: album })}
                  className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer group row-micro"
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
                     {album.cover_url ? (
                       <Image src={album.cover_url} alt={album.name} fill className="object-cover rounded-sm" />
                     ) : (
                       <div className="w-full h-full bg-zinc-800 rounded-sm" />
                     )}
                  </div>

                  {/* Meta */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[16px] font-medium text-foreground truncate leading-snug">{album.name}</p>
                    <p className="text-[13px] text-muted-foreground truncate leading-snug">
                        {album.artist_name || "Unknown Artist"}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col items-end gap-1">
                     <span className="text-[15px] font-bold text-foreground tabular-nums tracking-tight">
                       {Math.round(album.rating || 1500)}
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
