"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Play, Disc, Music, ChevronRight } from "lucide-react";
import { saveTrackToVault, removeTrackFromVault } from "@/lib/actions/vault"; 
// Assuming saveTrack uses standardized spotify object or we adapt.

import { Check, Plus } from "lucide-react";

// Sub-component for Track Row to handle its own interaction or pass up
function TrackRow({ track, index }: { track: any, index: number }) {
  const router = useRouter();
  const [isAdded, setIsAdded] = useState(false); // Local state for immediate feedback
  
  const handleToggle = async (e: any) => {
    e.stopPropagation(); // Don't navigate
    setIsAdded(!isAdded);
    if (!isAdded) {
       await saveTrackToVault(track);
    } else {
       await removeTrackFromVault(track.id);
    }
  };

  return (
    <div className="flex items-center gap-4 p-2 hover:bg-white/10 rounded-md group transition-colors cursor-pointer" onClick={() => router.push(`/album/${track.album.id}`)}>
        <span className="w-4 text-center text-neutral-400 font-tabular-nums">{index + 1}</span>
        <div className="relative w-12 h-12 flex-shrink-0">
            <Image src={track.album.images[0]?.url} alt={track.name} fill className="object-cover rounded" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-white">{track.name}</p>
            <p className="text-xs text-neutral-400 truncate">{track.artists.map((a:any)=>a.name).join(", ")}</p>
        </div>
        
        {/* Add Button */}
        <button 
           onClick={handleToggle}
           className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isAdded ? 'text-[#1DB954]' : 'text-neutral-500 hover:text-white opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}
        >
           {/* Mobile always visible? opacity logic logic above hides it on mobile defaults. 
               Lets make it visible or use proper mobile styles. 
               Mobile: always visible maybe? or simplified. 
               Let's make it always visible for simplicity in pure logic, or stick to opacity-100.
            */}
           {isAdded ? <Check size={20} /> : <Plus size={20} />}
        </button>

        <div className="text-neutral-400 text-sm hidden md:block">
            {(track.duration_ms / 60000).toFixed(1)}
        </div>
    </div>
  );
}

export default function ArtistPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/spotify/artist/${params.id}`)
        .then((res) => res.json())
        .then((fetched) => {
          setData(fetched);
          setLoading(false);
        });
    }
  }, [params.id]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#121212]"><div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" /></div>;
  if (!data || data.error) return <div className="text-white p-10">Artist not found</div>;

  const { artist, top_tracks, albums } = data;

  return (
    <div className="bg-[#121212] min-h-screen pb-24 text-white">
      
      {/* 1. Header with Artist Image background */}
      <div className="relative w-full h-[40vh] md:h-[50vh]">
         {/* Back Button */}
         <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-safe">
            <button onClick={() => router.back()} className="bg-black/40 hover:bg-black/60 p-2 rounded-full backdrop-blur-md transition-colors">
                <ArrowLeft size={24} />
            </button>
         </div>

         {/* Background Image */}
         {artist.images[0] && (
             <Image 
                src={artist.images[0].url} 
                alt={artist.name} 
                fill 
                className="object-cover opacity-80"
                priority
             />
         )}
         {/* Gradient Overlay */}
         <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent" />

         {/* Artist Name */}
         <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
            <h1 className="text-4xl md:text-7xl font-black mb-4 drop-shadow-xl">{artist.name}</h1>
            <p className="text-sm md:text-base font-medium text-neutral-300">
               {artist.followers.total.toLocaleString()} followers
            </p>
         </div>
      </div>

      {/* 2. Content */}
      <div className="px-4 md:px-10 space-y-10 relative z-10 -mt-6">
         
         {/* Play Button Action (Mock) */}
         <div className="flex gap-4">
             <button className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg text-black">
                 <Play size={28} fill="currentColor" className="ml-1" />
             </button>
             <button className="px-6 py-2 border border-white/30 rounded-full font-bold text-sm hover:border-white transition-colors">
                 Follow
             </button>
         </div>

         {/* Top Tracks */}
         <section>
            <h2 className="text-xl font-bold mb-4">Popular</h2>
            <div className="space-y-1">
                {top_tracks.slice(0, 5).map((track: any, i: number) => {
                    // Logic for added status (Optimistic for now, using Set state)
                    // We need local state for this component to track added items
                    // Refactor component to include `addedTracks` state
                    return (
                        <TrackRow key={track.id} track={track} index={i} />
                    );
                })}
            </div>
         </section>

         {/* Discography (Albums + Singles) */}
         <section>
             <h2 className="text-xl font-bold mb-4">Discography</h2>
             {/* Horizontal Scroll or Grid? Spotify Mobile uses Horizontal, Desktop Grid. 
                 Let's do horizontal for aesthetic mobile feel. */}
             <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
                 {albums.map((album: any) => (
                     <div 
                        key={album.id} 
                        className="min-w-[140px] w-[140px] md:w-auto flex-shrink-0 group cursor-pointer"
                        onClick={() => router.push(`/album/${album.id}`)}
                     >
                         <div className="relative w-full aspect-square mb-3 shadow-lg">
                             <Image src={album.images[0]?.url} alt={album.name} fill className="object-cover rounded-md" />
                         </div>
                         <h3 className="font-bold text-white text-sm truncate">{album.name}</h3>
                         <p className="text-neutral-400 text-xs capitalize">{album.album_type} • {album.release_date.split('-')[0]}</p>
                     </div>
                 ))}
             </div>
         </section>

      </div>
    </div>
  );
}
