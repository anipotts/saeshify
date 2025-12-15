"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useSpotifySearch } from "@/lib/hooks/useSpotify";
import Image from "next/image";
import { useFocus } from "@/lib/context/FocusContext";

export default function Home() {
  const [query, setQuery] = useState("");
  const { search, results, loading } = useSpotifySearch();
  const { openDetails } = useFocus();
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
    <div className="min-h-screen pb-safe bg-background">
      
      {/* Mobile-Style Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-safe px-4 pb-2 border-b border-white/5 w-full">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-4 pt-2">Search</h1>
        
        <div className="relative group rounded-md bg-surface hover:bg-[#2a2a2a] transition-colors h-[48px] flex items-center overflow-hidden">
          <div className="pl-3 text-muted">
             <Search size={22} />
          </div>
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="What do you want to play?"
            className="flex-1 h-full bg-transparent pl-3 pr-4 text-[16px] text-foreground placeholder:text-muted outline-none font-medium"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 min-h-[500px]">
        
        {/* Loading */}
        {loading && (
          <div className="space-y-4 pt-2">
             {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse py-2">
                  <div className="w-12 h-12 bg-surface rounded-md shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-surface rounded-full" />
                    <div className="h-2 w-1/4 bg-surface rounded-full" />
                  </div>
                </div>
             ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !results && !query && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <h3 className="text-foreground font-bold">Play what you love</h3>
             <p className="text-sm text-muted text-center max-w-[250px]">Search for artists, songs, podcasts, and more.</p>
          </div>
        )}

        {/* Results */}
        {!loading && results && (
          <div className="space-y-6">
            
            {/* Tracks */}
            {results.tracks?.items?.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <h2 className="text-lg font-bold text-foreground mb-2">Songs</h2>
                <div className="space-y-1">
                  {results.tracks.items.slice(0, 5).map((track: any) => (
                    <div 
                      key={track.id} 
                      onClick={() => openDetails({ type: "track", data: track })}
                      className="flex items-center gap-3 py-2 active:opacity-60 transition-opacity cursor-pointer group"
                    >
                      <div className="relative w-12 h-12 shrink-0">
                         {track.album.images[0] ? (
                           <Image src={track.album.images[0].url} alt={track.name} fill className="object-cover rounded-sm" />
                         ) : (
                           <div className="w-full h-full bg-surface" />
                         )}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-[16px] font-medium text-foreground truncate leading-snug group-hover:text-accent transition-colors">{track.name}</p>
                        <p className="text-[13px] text-muted truncate leading-snug">{track.artists[0].name}</p>
                      </div>

                      {/* Explicit Action: Add to Vault */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); /* Add logic later */ }}
                        className="w-10 h-10 flex items-center justify-center text-muted hover:text-foreground"
                      >
                         <Plus size={24} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* Artists (Circle) */}
            {results.artists?.items?.length > 0 && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <h2 className="text-lg font-bold text-foreground mb-2">Artists</h2>
                 <div className="space-y-2">
                   {results.artists.items.slice(0, 3).map((artist: any) => (
                     <div 
                       key={artist.id} 
                       onClick={() => openDetails({ type: "artist", data: artist })}
                       className="flex items-center gap-3 py-2 active:opacity-60 transition-opacity cursor-pointer group"
                     >
                        <div className="relative w-12 h-12 shrink-0">
                           {artist.images[0] ? (
                             <Image src={artist.images[0].url} alt={artist.name} fill className="object-cover rounded-full" />
                           ) : (
                             <div className="w-full h-full bg-surface rounded-full" />
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-[16px] font-medium text-foreground truncate group-hover:text-accent transition-colors">{artist.name}</p>
                           <p className="text-[13px] text-muted">Artist</p>
                        </div>
                     </div>
                   ))}
                 </div>
               </motion.div>
            )}

             {/* Albums */}
            {results.albums?.items?.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pb-8">
                <h2 className="text-lg font-bold text-foreground mb-2">Albums</h2>
                 <div className="space-y-1">
                  {results.albums.items.slice(0, 3).map((album: any) => (
                    <div 
                      key={album.id} 
                      onClick={() => openDetails({ type: "album", data: album })}
                      className="flex items-center gap-3 py-2 active:opacity-60 transition-opacity cursor-pointer group"
                    >
                       <div className="relative w-12 h-12 shrink-0">
                         {album.images[0] ? (
                           <Image src={album.images[0].url} alt={album.name} fill className="object-cover rounded-sm" />
                         ) : (
                           <div className="w-full h-full bg-surface rounded-sm" />
                         )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-[16px] font-medium text-foreground truncate leading-snug group-hover:text-accent transition-colors">{album.name}</p>
                        <p className="text-[13px] text-muted truncate leading-snug">Album • {album.artists[0].name}</p>
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
