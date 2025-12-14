"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Check, Plus, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpotifySearch } from "@/lib/hooks/useSpotify"; // Reusing types/fetcher logic could be better but sticking to fetch for now

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const [album, setAlbum] = useState<any>(null);
  const [addedTracks, setAddedTracks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/spotify/album/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          setAlbum(data);
          setLoading(false);
        });
    }
  }, [params.id]);

  const toggleTrack = (trackId: string) => {
    const next = new Set(addedTracks);
    if (next.has(trackId)) {
      next.delete(trackId);
    } else {
      next.add(trackId);
    }
    setAddedTracks(next);
    // TODO: Persist to Supabase 'user_bank'
  };

  const handleDone = () => {
    // Save to queue logic
    if (addedTracks.size > 0) {
       // Mock pushing to comparison queue
       const queue = Array.from(addedTracks).map(id => ({ id, albumId: album.id }));
       localStorage.setItem('comparison_queue', JSON.stringify(queue));
       router.push(`/compare?album=${album.id}`);
    } else {
       router.back();
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" /></div>;
  if (!album) return <div>Album not found</div>;

  return (
    <div className="pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md -mx-4 px-4 py-3 flex items-center gap-4 pt-[env(safe-area-inset-top)] border-b border-white/5">
        <button onClick={() => router.back()} className="text-white hover:bg-white/10 p-2 rounded-full -ml-2 transition-colors">
          <ArrowLeft />
        </button>
        <span className="font-bold truncate opacity-0 transition-opacity duration-300" style={{ opacity: 1 }}>{album.name}</span>
      </div>

      {/* Hero */}
      <div className="pt-[calc(env(safe-area-inset-top)+60px)] px-6 flex flex-col items-center gap-4 bg-gradient-to-b from-neutral-800/50 to-neutral-950 pb-8">
        <div className="relative w-48 h-48 shadow-2xl">
          <Image src={album.images[0]?.url} alt={album.name} fill className="object-cover rounded-md" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold leading-tight mb-1">{album.name}</h1>
          <p className="text-[#B3B3B3] font-medium">{album.artists[0]?.name} • {album.release_date.split('-')[0]}</p>
        </div>
      </div>

      {/* Tracklist */}
      <div className="px-4 space-y-1">
        {album.tracks.items.map((track: any, i: number) => {
          const isAdded = addedTracks.has(track.id);
          return (
            <div key={track.id} onClick={() => toggleTrack(track.id)} className="flex items-center justify-between p-3 rounded-md hover:bg-white/5 transition-colors cursor-pointer">
              <div className="flex flex-col min-w-0 pr-4">
                <span className={`font-medium truncate ${isAdded ? 'text-[#1DB954]' : 'text-white'}`}>{track.name}</span>
                <span className="text-xs text-[#B3B3B3]">{track.artists.map((a: any) => a.name).join(', ')}</span>
              </div>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isAdded ? 'bg-[#1DB954] border-[#1DB954]' : 'border-[#B3B3B3]'}`}>
                {isAdded && <Check size={14} className="text-black" strokeWidth={3} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Done Action */}
      <AnimatePresence>
        {addedTracks.size > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] left-0 right-0 px-6 flex justify-center z-40 pointer-events-none"
          >
            <button
               onClick={handleDone}
               className="pointer-events-auto bg-[#1DB954] text-black font-bold h-12 px-8 rounded-full shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
            >
              Done Ranking ({addedTracks.size})
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
