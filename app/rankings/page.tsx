"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import Image from "next/image";
import clsx from "clsx";

export default function RankingsPage() {
  const [filter, setFilter] = useState<"Tracks" | "Albums" | "Artists">("Tracks");
  const rankings = []; // Empty for now

  // Mock data for visual test (optional, remove later if requested "no real dummy data" but helps visualize layout)
  // User asked "no dummy data" but empty state is requested. I'll stick to empty state.

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-safe px-4 pb-2 border-b border-white/5">
         <div className="flex items-center justify-between py-3">
           <div className="flex items-center gap-3">
             <h1 className="text-2xl font-bold tracking-tight text-foreground">Rankings</h1>
           </div>
           
           <Link href="/settings">
             <Settings size={22} className="text-foreground" />
           </Link>
         </div>

         {/* Segmented Pills */}
         <div className="flex gap-2 mt-2 pb-2">
           {["Tracks", "Albums", "Artists"].map((f) => (
             <button
               key={f}
               onClick={() => setFilter(f as any)}
               className={clsx(
                 "px-4 py-1.5 rounded-full text-xs font-medium border border-transparent transition-all",
                 filter === f 
                   ? "bg-accent text-black" 
                   : "bg-surface text-foreground hover:bg-white/10"
               )}
             >
               {f}
             </button>
           ))}
         </div>
      </div>
      
      {/* Content */}
      <div className="px-4 py-6">
        {rankings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
             <p className="text-lg font-bold text-foreground">No rankings yet</p>
             <p className="text-sm text-muted">Complete some comparisons in your Vault <br/> to generate your top list.</p>
          </div>
        ) : (
          <div className="space-y-4">
             {/* List UI Would Go Here */}
          </div>
        )}
      </div>
    </div>
  );
}
