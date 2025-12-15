"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Check, Plus } from "lucide-react";
// Removed unused imports

import { saveTrackToVault, removeTrackFromVault } from "@/lib/actions/vault";

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const [album, setAlbum] = useState<any>(null);
  const [addedTracks, setAddedTracks] = useState<Set<string>>(new Set()); // Ideally fetch existing status too? For now, session-based optimism or we check user_bank if we had time.
  // Actually, to make it robust "add to vault", we should probably know if it's already there. 
  // For this MVP step, we will assume "toggle" adds/removes from vault directly.
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
       Promise.all([
           fetch(`/api/spotify/album/${params.id}`).then(res => res.json())
           // Future: Fetch user's vault status for these tracks to pre-populate 'addedTracks'
       ]).then(([data]) => {
          setAlbum(data);
          setLoading(false);
       });
    }
  }, [params.id]);

  const handleToggle = async (track: any) => {
      const isAdded = addedTracks.has(track.id);
      const next = new Set(addedTracks);
      
      // Optimistic Update
      if (isAdded) {
          next.delete(track.id);
          // remove logic (optional, user might just want to 'unselect' before committing? 
          // user said "add any to vault i want" -> implies immediate action or batch?
          // "clicking this button should take me to a page ... and im able to ... add any to vault i want"
          // Let's do immediate action for "Spotify Like" feel (heart icon style).
          await removeTrackFromVault(track.id); // We need a server action for this or just ignore if we only support adding. 
          // I see 'removeTrackFromVault' was in vault.ts view!
      } else {
          next.add(track.id);
          // format for vault
          await saveTrackToVault(track); 
      }
      setAddedTracks(next);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#121212]"><div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" /></div>;
  if (!album) return <div className="text-white p-10">Album not found</div>;

  return (
    <div className="pb-24 bg-[#121212] min-h-screen">
      {/* Sticky Header (Opacity changes on scroll could be added with listener, keeping simple fixed for now) */}
      <div className="fixed top-0 left-0 right-0 z-40 h-16 bg-neutral-900/0 backdrop-blur-md flex items-center px-4 pt-safe transition-all border-b border-white/0">
        <button onClick={() => router.back()} className="text-white bg-black/40 hover:bg-black/60 p-2 rounded-full backdrop-blur-md transition-colors z-50">
          <ArrowLeft size={20} />
        </button>
        <span className="ml-4 font-bold text-white truncate opacity-0 transition-opacity duration-300 pointer-events-none">{album.name}</span>
      </div>

      {/* Hero */}
      <div className="relative pt-[calc(env(safe-area-inset-top)+60px)] px-6 flex flex-col items-center pb-8 bg-gradient-to-b from-neutral-800 to-[#121212]">
        <div className="relative w-48 h-48 md:w-64 md:h-64 shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-6 transition-transform hover:scale-105 duration-500">
          <Image src={album.images[0]?.url} alt={album.name} fill className="object-cover rounded-md" priority />
        </div>
        <div className="text-center z-10 max-w-lg">
          <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-2">{album.name}</h1>
          <p className="text-neutral-400 font-medium text-sm md:text-lg">
             <span className="text-white hover:underline cursor-pointer">{album.artists[0]?.name}</span> • {album.release_date.split('-')[0]} • {album.total_tracks} songs
          </p>
        </div>
      </div>

      {/* Tracklist */}
      <div className="px-2 md:px-8 space-y-1 max-w-4xl mx-auto">
        {album.tracks.items.map((track: any, i: number) => {
          const isAdded = addedTracks.has(track.id);
          return (
            <div key={track.id} onClick={() => handleToggle(track)} className="group flex items-center justify-between p-3 rounded-md hover:bg-white/5 transition-colors cursor-pointer active:scale-[0.99]">
              <div className="flex flex-col min-w-0 pr-4">
                <span className={`font-medium truncate text-base ${isAdded ? 'text-[#1DB954]' : 'text-white'}`}>{track.name}</span>
                <span className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                    {track.artists.map((a: any) => a.name).join(', ')}
                </span>
              </div>
              <button 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isAdded ? 'text-[#1DB954]' : 'text-neutral-500 hover:text-white hover:scale-110'}`}
              >
                {isAdded ? <Check size={20} className="drop-shadow-glow" /> : <Plus size={20} />}
              </button>
            </div>
          );
        })}
      </div>
      
       {/* Floating "View Vault" or similar if needed, user said "add any to vault", so simpler is better */}
    </div>
  );
}
