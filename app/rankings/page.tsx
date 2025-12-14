"use client";

import { Trophy, Search } from "lucide-react";
import Link from "next/link";
import { Settings } from "lucide-react";

export default function RankingsPage() {
  const rankings = []; // Empty for now

  return (
    <div className="py-6 sm:py-8 space-y-4 sm:space-y-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="text-[#1DB954]" size={32} />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Top Rated</h1>
        </div>
        <Link href="/settings" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <Settings size={20} className="text-neutral-400" />
        </Link>
      </div>
      
      {rankings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4 text-center">
           <p className="text-lg font-bold">No rankings yet</p>
           <p className="text-sm text-neutral-400">Complete some comparisons "This or That" <br/> to generate your top list.</p>
        </div>
      ) : (
        <div className="space-y-4">
           {/* Rankings list */}
        </div>
      )}
    </div>
  );
}
