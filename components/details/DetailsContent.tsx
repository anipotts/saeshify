"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Plus, Play, X, Trophy, AlertCircle, BarChart2 } from "lucide-react";
import { useFocus } from "@/lib/context/FocusContext";

export default function DetailsContent() {
  const { focusedEntity, closeDetails } = useFocus();
  const pathname = usePathname();

  if (!focusedEntity) return null;

  const { type, data } = focusedEntity;
  const isVault = pathname.includes("/vault");
  const isRankings = pathname.includes("/rankings");

  // Track helpers
  const image = data.album?.images?.[0]?.url || data.images?.[0]?.url;
  const title = data.name;
  const subtitle = type === "track" ? data.artists?.[0]?.name : 
                   type === "album" ? data.artists?.[0]?.name : 
                   "Artist";
  
  // Format duration (ms -> m:ss)
  const duration = data.duration_ms 
    ? `${Math.floor(data.duration_ms / 60000)}:${((data.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}`
    : null;

  const year = data.album?.release_date?.split("-")[0] || data.release_date?.split("-")[0];

  return (
    <div className="flex flex-col h-full bg-[#181818] text-white overflow-y-auto no-scrollbar">
      
      {/* Header / Close (Mobile mostly, Desktop has own close) */}
      <div className="flex items-center justify-between p-4 md:hidden">
        <span className="text-xs font-bold text-muted uppercase tracking-widest">{type}</span>
        <button onClick={closeDetails} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
          <X size={16} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-6 pt-2 pb-8 text-center space-y-6">
        
        {/* Artwork */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 shadow-2xl shrink-0 group">
          {image ? (
            <Image src={image} alt={title} fill className={`object-cover ${type === "artist" ? "rounded-full" : "rounded-lg"}`} />
          ) : (
            <div className={`w-full h-full bg-[#282828] ${type === "artist" ? "rounded-full" : "rounded-lg"}`} />
          )}
        </div>

        {/* Text Info */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold leading-tight">{title}</h2>
          <p className="text-muted font-medium">{subtitle}</p>
          {type === "track" && (
             <div className="flex items-center justify-center gap-2 text-xs text-muted mt-2 opacity-80">
               {year && <span>{year}</span>}
               {year && duration && <span>•</span>}
               {duration && <span>{duration}</span>}
             </div>
          )}
        </div>

        {/* CTA Actions Area - Context Aware */}
        <div className="w-full max-w-xs space-y-3 pt-4">
          
          {/* Default Search Context */}
          {!isVault && !isRankings && (
            <>
              <button className="w-full bg-accent text-black font-bold py-3.5 px-6 rounded-full hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2">
                {type === "track" ? (
                  <> <Plus size={20} strokeWidth={2.5} /> Add to Vault </>
                ) : (
                  <> View {type} </>
                )}
              </button>
              
              {type === "track" && (
                <button className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 px-6 rounded-full transition-colors flex items-center justify-center gap-2">
                  <Trophy size={18} />
                  Start ranking from this
                </button>
              )}
            </>
          )}

          {/* Vault Context */}
          {isVault && (
            <>
               <button className="w-full bg-accent text-black font-bold py-3.5 px-6 rounded-full hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <BarChart2 size={20} />
                  Start Ranking
               </button>
               <button className="w-full bg-white/5 hover:bg-[#E91429]/20 hover:text-[#E91429] text-white font-bold py-3.5 px-6 rounded-full transition-colors flex items-center justify-center gap-2">
                  Remove from Vault
               </button>
            </>
          )}

        </div>

        {/* Preview Player (If available) */}
        {data.preview_url && (
           <div className="w-full bg-white/5 rounded-lg p-3 mt-4 flex items-center gap-3">
             <button className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0">
               <Play size={14} fill="currentColor" />
             </button>
             <div className="h-1 bg-white/10 rounded-full flex-1 overflow-hidden">
               <div className="h-full w-1/3 bg-white/50 rounded-full" />
             </div>
             <span className="text-xs text-muted font-mono">0:10</span>
           </div>
        )}

        {/* Stats Section (If available) */}
        {isVault && (
           <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-white/5 mt-4">
             <div className="bg-white/5 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-accent">--%</div>
                <div className="text-[10px] text-muted uppercase tracking-wider">Win Rate</div>
             </div>
             <div className="bg-white/5 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-white">0</div>
                <div className="text-[10px] text-muted uppercase tracking-wider">Matches</div>
             </div>
           </div>
        )}

      </div>
    </div>
  );
}
