"use client";

import { Trophy } from "lucide-react";

// Mock Data
const MOCK_RANKINGS = Array.from({ length: 10 }).map((_, i) => ({
  id: `r-${i}`,
  name: `Ranked Song ${i + 1}`,
  artist: `Artist ${i + 1}`,
  rank: i + 1,
  elo: 2000 - (i * 50),
}));

export default function RankingsPage() {
  return (
    <div className="py-6 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="text-[#1DB954]" size={32} />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Top Rated</h1>
      </div>
      
      <div className="space-y-4">
        {MOCK_RANKINGS.map((item, index) => (
          <div key={item.id} className="flex items-center gap-4 bg-[#121212] p-4 rounded-lg">
             <div className="text-2xl font-black italic text-[#1DB954] w-8 text-center">{item.rank}</div>
             <div className="flex-1">
                <p className="font-bold text-white text-lg">{item.name}</p>
                <p className="text-[#B3B3B3]">{item.artist}</p>
             </div>
             <div className="text-sm font-mono text-[#B3B3B3] bg-[#282828] px-2 py-1 rounded">
               {item.elo}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
