"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpotifySearch } from "@/lib/hooks/useSpotify";
import Image from "next/image";

export default function Home() {
  const [query, setQuery] = useState("");
  const { search, results, loading } = useSpotifySearch();
  let debounceTimer: NodeJS.Timeout;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (val.length > 2) {
        search(val, "track,album,artist");
      }
    }, 500);
  };

  return (
    // Point 2: Page padding and vertical spacing
    <div className="py-6 sm:py-8 space-y-4 sm:space-y-6">
      
      {/* Point 2: Title */}
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
        Search
      </h1>

      {/* Point 3: Search Input Pill */}
      <div className="relative group rounded-full bg-neutral-900/70 ring-1 ring-white/10 hover:ring-white/20 focus-within:ring-2 focus-within:ring-white/20 transition-all shadow-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-white transition-colors" size={20} />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="What do you want to listen to?"
          className="h-12 w-full bg-transparent pl-12 pr-6 rounded-full text-[15px] text-white placeholder:text-white/50 outline-none"
        />
      </div>

      {/* Point 4: Results Surface Card */}
      <div className="mt-6 rounded-xl bg-neutral-950/40 ring-1 ring-white/10 p-3 sm:p-4 min-h-[300px]">
        {loading && (
          <div className="flex justify-center py-10">
             <div className="w-6 h-6 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Point 9: Default State */}
        {!loading && !results && !query && (
          <div className="flex flex-col items-center justify-center h-full py-20 opacity-50 space-y-2">
             <Search size={48} strokeWidth={1} />
             <p className="text-sm font-medium">Search a song or album to start.</p>
          </div>
        )}

        {!loading && results && (
          <div className="space-y-8">
            {/* Tracks */}
            {results.tracks?.items?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 px-2">Songs</h2>
                
                {/* Point 5: Row Items */}
                <div className="space-y-1 divide-y divide-white/5">
                  {results.tracks.items.slice(0, 5).map((track: any) => (
                    <div key={track.id} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-white/5 active:bg-white/10 transition-colors group cursor-pointer">
                      <div className="relative w-10 h-10 flex-shrink-0 shadow-sm">
                         {track.album.images[0] && (
                           <Image src={track.album.images[0].url} alt={track.name} fill className="object-cover rounded-sm" />
                         )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-[15px] font-medium text-white truncate leading-tight group-hover:text-[#1DB954] transition-colors">{track.name}</p>
                        <p className="text-[13px] text-white/60 truncate leading-tight">{track.artists[0].name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            
             {/* Albums */}
            {results.albums?.items?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 px-2">Albums</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {results.albums.items.slice(0, 4).map((album: any) => (
                    <div key={album.id} className="group flex flex-col gap-3 p-3 bg-white/5 rounded-md hover:bg-white/10 transition-colors cursor-pointer ring-1 ring-white/5 hover:ring-white/10">
                       <div className="relative aspect-square w-full shadow-lg">
                         {album.images[0] && (
                           <Image src={album.images[0].url} alt={album.name} fill className="object-cover rounded-md" />
                         )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-[14px] font-bold text-white truncate leading-tight">{album.name}</p>
                        <p className="text-[12px] text-white/60 truncate leading-tight line-clamp-2">Album • {album.artists[0].name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
