"use client";

import { Suspense, useEffect, useState } from "react";
import { Search, Plus, Check, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpotifySearch } from "@/lib/hooks/useSpotify";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useUIStore } from "@/lib/store";
import { saveTrackToVault } from "@/lib/actions/vault";
import PageHeader from "@/components/ui/PageHeader";
import DebugVaultRow from "@/components/debug/DebugVaultRow";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { recordRecentSearch } from "@/lib/actions/recents";

interface RecentSearch {
  id: string;
  type: "track" | "artist" | "album";
  title: string;
  subtitle: string;
  image?: string;
  data: any; // Store full object to re-open
}

function SearchContent() {
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams();
  const debouncedQuery = useDebounce(query, 300);

  // Sync query from URL if changed externally (e.g. by TopBar)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q !== query) {
        setQuery(q);
    } else if (!q && query) {
        setQuery(""); // Clear if URL cleared
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger search when debouncedQuery changes
  useEffect(() => {
      if (debouncedQuery.length > 2) {
          search(debouncedQuery, "track,album,artist");
      }
  }, [debouncedQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  const { search, results, loading } = useSpotifySearch();
  const { openDetails } = useUIStore();
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [addedTracks, setAddedTracks] = useState<Set<string>>(new Set());

  // Load Recent Searches
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("saeshify_recent_searches");
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse recent searches");
        }
      }
    }
  }, []);

  const addToRecent = (item: RecentSearch) => {
    const filtered = recentSearches.filter(r => r.id !== item.id);
    const updated = [item, ...filtered].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem("saeshify_recent_searches", JSON.stringify(updated));
  };
  
  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("saeshify_recent_searches");
  };

  const removeRecent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(r => r.id !== id);
    setRecentSearches(updated);
    localStorage.setItem("saeshify_recent_searches", JSON.stringify(updated));
  };

  // No import here

  // ...

  const handleResultClick = (type: "track" | "artist" | "album", data: any) => {
    // 1. Open Details
    openDetails({ kind: type, id: data.id, payload: data });
    
    // 2. Add to Recent (Local)
    const image = type === 'track' ? data.album.images[0]?.url 
                : data.images ? data.images[0]?.url : null;
                
    addToRecent({
      id: data.id,
      type,
      title: data.name,
      subtitle: type === 'track' ? data.artists[0].name : type,
      image,
      data
    });

    // 3. Persist to DB (Fire & Forget)
    recordRecentSearch({
        kind: type,
        query: data.name,
        spotify_id: data.id,
        payload: data
    });
  };

  const handleAddToVault = async (e: React.MouseEvent, track: any) => {
    e.stopPropagation();
    if (addedTracks.has(track.id)) return;

    // Optimistic UI
    setAddedTracks(prev => new Set(prev).add(track.id));

    try {
      const result = await saveTrackToVault(track);
      if (!result.success) {
          if (result.code === 401) {
              // Redirect or show toast
              window.location.href = "/settings/account"; // Force redirect to login
              return;
          }
          throw new Error(result.error);
      }
    } catch (err) {
      console.error(err);
      // Revert if failed
      setAddedTracks(prev => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
      // Optionally alert user here
      alert("Failed to save: " + (err as any).message);
    }
  };


// ... 

  return (
    <div className="min-h-full pb-safe">
      
      {/* Unified Header */}
      <PageHeader title="Search">
         {/* Mobile Search Input - Hidden on Desktop (md:hidden) because TopBar has it */}
         <div className="w-full relative group rounded-md bg-zinc-900 hover:bg-zinc-800 transition-colors h-full flex items-center overflow-hidden border border-white/5 md:hidden">
            <div className="pl-3 text-muted-foreground">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="What do you want to play?"
              className="flex-1 h-full bg-transparent pl-3 pr-4 text-[16px] text-foreground placeholder:text-muted-foreground outline-none font-medium"
            />
            {query && (
              <button onClick={() => setQuery("")} className="pr-3 text-muted-foreground hover:text-white">
                <X size={16} />
              </button>
            )}
         </div>
      </PageHeader>

      {/* Content */}
      <div className="px-4 py-4 min-h-[500px]">
        
        {/* Loading */}
        {loading && (
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
        )}

        {/* Recent State */}
        {!loading && !query && (
           <div className="space-y-6">
             {recentSearches.length > 0 ? (
               <div>
                 <div className="flex items-center justify-between mb-2">
                   <h2 className="text-lg font-bold text-foreground">Recent searches</h2>
                   <button onClick={clearRecent} className="text-xs font-medium text-muted-foreground hover:text-white uppercase tracking-wider">Clear</button>
                 </div>
                 <div className="space-y-1">
                   {recentSearches.map((item) => (
                     <div 
                       key={item.id}
                       onClick={() => handleResultClick(item.type, item.data)}
                       className="flex items-center gap-3 py-2 cursor-pointer group hover:bg-white/5 rounded-md px-2 -mx-2 transition-colors"
                     >
                       <div className="relative w-12 h-12 shrink-0">
                          {item.image ? (
                            <Image src={item.image} alt={item.title} fill className={item.type === 'artist' ? "object-cover rounded-full" : "object-cover rounded-sm"} />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center rounded-sm text-zinc-600">
                               <Clock size={20} />
                            </div>
                          )}
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className={item.type === 'artist' ? "text-[16px] font-medium text-foreground group-hover:text-accent transition-colors" : "text-[16px] font-medium text-foreground leading-snug group-hover:text-accent transition-colors"}>
                           {item.title}
                         </p>
                         <p className="text-[13px] text-muted-foreground truncate">{item.subtitle}</p>
                       </div>
                       <button onClick={(e) => removeRecent(e, item.id)} className="p-2 text-muted-foreground hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                         <X size={16} />
                       </button>
                     </div>
                   ))}
                 </div>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-32 space-y-4">
                 <h3 className="text-foreground font-bold text-lg">Search any song</h3>
                 <p className="text-sm text-muted-foreground text-center max-w-[250px]">Save and compare your favorite songs</p>
               </div>
             )}
           </div>
        )}

        {/* Results */}
        {!loading && results && query && (
          <div className="space-y-8 pb-20">
            
            {/* Tracks */}
            {results.tracks?.items?.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <h2 className="text-lg font-bold text-foreground mb-2">Songs</h2>
                <div className="space-y-1">
                  {results.tracks.items.slice(0, 5).map((track: any) => {
                    const isAdded = addedTracks.has(track.id);
                    return (
                    <div 
                      key={track.id} 
                      onClick={() => handleResultClick("track", track)}
                      className="flex items-center gap-3 py-2 cursor-pointer group hover:bg-white/5 rounded-md px-2 -mx-2 transition-colors"
                    >
                      <div className="relative w-12 h-12 shrink-0">
                         {track.album.images[0] ? (
                           <Image src={track.album.images[0].url} alt={track.name} fill className="object-cover rounded-sm" />
                         ) : (
                           <div className="w-full h-full bg-zinc-800" />
                         )}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-[16px] font-medium text-foreground truncate leading-snug group-hover:text-accent transition-colors">{track.name}</p>
                        <p className="text-[13px] text-muted-foreground truncate leading-snug">{track.artists[0].name}</p>
                        <DebugVaultRow trackId={track.id} isAdded={isAdded} />
                      </div>

                      {/* Explicit Action: Add to Vault */}
                      <button 
                        onClick={(e) => handleAddToVault(e, track)}
                        className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
                      >
                         {isAdded ? <Check size={20} className="text-accent" /> : <Plus size={24} />}
                      </button>
                    </div>
                  )})}
                </div>
              </motion.div>
            )}
            
            {/* Artists */}
            {results.artists?.items?.length > 0 && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <h2 className="text-lg font-bold text-foreground mb-2">Artists</h2>
                 <div className="space-y-1">
                   {results.artists.items.slice(0, 3).map((artist: any) => (
                     <div 
                       key={artist.id} 
                       onClick={() => handleResultClick("artist", artist)}
                       className="flex items-center gap-3 py-2 cursor-pointer group hover:bg-white/5 rounded-md px-2 -mx-2 transition-colors"
                     >
                        <div className="relative w-12 h-12 shrink-0">
                           {artist.images[0] ? (
                             <Image src={artist.images[0].url} alt={artist.name} fill className="object-cover rounded-full" />
                           ) : (
                             <div className="w-full h-full bg-zinc-800 rounded-full" />
                           )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                           <p className="text-[16px] font-medium text-foreground truncate group-hover:text-accent transition-colors">{artist.name}</p>
                           <p className="text-[13px] text-muted-foreground">Artist</p>
                        </div>
                     </div>
                   ))}
                 </div>
               </motion.div>
            )}

            {/* Albums */}
            {results.albums?.items?.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <h2 className="text-lg font-bold text-foreground mb-2">Albums</h2>
                 <div className="space-y-1">
                  {results.albums.items.slice(0, 3).map((album: any) => (
                    <div 
                      key={album.id} 
                      onClick={() => handleResultClick("album", album)}
                      className="flex items-center gap-3 py-2 cursor-pointer group hover:bg-white/5 rounded-md px-2 -mx-2 transition-colors"
                    >
                       <div className="relative w-12 h-12 shrink-0">
                         {album.images[0] ? (
                           <Image src={album.images[0].url} alt={album.name} fill className="object-cover rounded-sm" />
                         ) : (
                           <div className="w-full h-full bg-zinc-800 rounded-sm" />
                         )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-[16px] font-medium text-foreground truncate leading-snug group-hover:text-accent transition-colors">{album.name}</p>
                        <p className="text-[13px] text-muted-foreground truncate leading-snug">Album • {album.artists[0].name}</p>
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

export default function Home() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <SearchContent />
        </Suspense>
    );
}
