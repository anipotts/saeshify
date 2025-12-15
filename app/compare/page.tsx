"use client";

import { Suspense, useEffect, useState, useTransition, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";
import { submitVoteAndFetchNext } from "@/lib/actions/vote";
import { getNextMatchup } from "@/lib/ranking/matchmaking";
import { Matchup } from "@/lib/ranking/types";

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seedId = searchParams.get('seed') || undefined;
  
  // State
  const [current, setCurrent] = useState<Matchup | null>(null);
  const [next, setNext] = useState<Matchup | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVoting, startTransition] = useTransition();

  // History for Logic (Refs to avoid re-renders)
  const excludeIdsRef = useRef<string[]>([]);
  const excludeKeysRef = useRef<string[]>([]);
  
  const addToHistory = (m: Matchup) => {
      excludeIdsRef.current = [m.trackA.id, m.trackB.id, ...excludeIdsRef.current].slice(0, 10);
      excludeKeysRef.current = [m.id, ...excludeKeysRef.current].slice(0, 10);
  };

  // Initial Load
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
       // 1. Get First
       const first = await getNextMatchup({ seedTrackId: seedId });
       if (!mounted) return;
       if (first) {
           setCurrent(first);
           addToHistory(first);
           setLoading(false);
           
           // 2. Prefetch Next immediately
           // We exclude the one we just showed
           const nextPair = await getNextMatchup({ 
               seedTrackId: seedId,
               excludeTrackIds: excludeIdsRef.current,
               excludePairKeys: excludeKeysRef.current
           });
           if (mounted && nextPair) setNext(nextPair);
       } else {
           setLoading(false); // No matchups found at all
       }
    };
    
    init();
    return () => { mounted = false; };
  }, [seedId]);

  const handleVote = async (winnerId: string, loserId: string) => {
      if (!current) return;
      
      const previous = current;
      
      // OPTIMISTIC UPDATE: Swap immediately if we have a prefetched one
      if (next) {
          setCurrent(next);
          addToHistory(next);
          setNext(null); // Clear buffer until we fetch new one
      } else {
          // If no prefetch, show loading skeleton or keep wait
          setLoading(true);
      }
      
      startTransition(async () => {
         // 1. Submit Vote in Background & Get New Pair
         // Note: We use the *Previous* exclude list for this fetch effectively as it was calculated then?
         // Actually, we should pass the CURRENT new history including 'next' if we just swapped.
         // But the `submitVote` action also does a fetch. We can use that result for the *new* Next.
         
         const newNext = await submitVoteAndFetchNext(
             winnerId, 
             loserId, 
             seedId,
             excludeIdsRef.current, // Pass updated history
             excludeKeysRef.current
         );

         if (newNext) {
             if (!next) {
                 // If we didn't have a next (slow start), this becomes current
                 setCurrent(newNext);
                 addToHistory(newNext);
                 setLoading(false);
             } else {
                 // If we did have next (we swapped optimistic), this fills the buffer
                 setNext(newNext);
             }
         } else if (!next) {
             // No next available and we submitted?
             router.back();
         }
      });
  };

  if (loading) return (
      <div className="flex items-center justify-center h-full w-full bg-[#121212] text-white/50 text-sm font-bold tracking-widest animate-pulse absolute inset-0 z-50">
        LOADING MATCHUP...
      </div>
  );

  if (!current) return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#121212] absolute inset-0 z-50 p-6 text-center">
            <button 
                onClick={() => router.back()}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
                <X size={24} />
            </button>
            <div className="w-16 h-16 bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center mb-6">
                 <X size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">All caught up!</h2>
            <p className="text-zinc-400 mb-8 max-w-sm">
                You've ranked all the songs in your vault for now. Add more songs to continue ranking.
            </p>
            <button 
                onClick={() => router.push('/')}
                className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
            >
                Find more songs
            </button>
      </div>
  );

  const { trackA, trackB } = current;

  return (
    <div className="
        fixed top-0 left-0 right-0 bottom-[calc(80px+env(safe-area-inset-bottom))] 
        md:absolute md:inset-0 md:bottom-0 
        z-40 flex flex-col md:flex-row bg-[#121212]
    ">
        
        {/* Close Button */}
        <button 
            onClick={() => router.back()}
            className="absolute top-4 right-4 z-[60] p-2 bg-black/50 hover:bg-black/80 text-white/70 hover:text-white rounded-full backdrop-blur-md transition-all"
        >
            <X size={24} />
        </button>

        {/* VS Badge */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] pointer-events-none">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-accent text-black rounded-full flex items-center justify-center font-black text-lg md:text-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                or
            </div>
        </div>

        {/* Top / Left Option */}
        <div 
            onClick={() => handleVote(trackA.id, trackB.id)}
            className="flex-1 relative cursor-pointer group bg-[#181818] hover:bg-[#202020] transition-colors border-b md:border-b-0 md:border-r border-[#2A2A2A] active:opacity-90"
        >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                <div className="relative w-32 h-32 md:w-64 md:h-64 shadow-2xl mb-6 transition-transform duration-300 md:group-hover:scale-105">
                     {trackA.cover_url ? (
                         <Image src={trackA.cover_url} alt={trackA.name} fill className="object-cover rounded-md" />
                     ) : (
                         <div className="w-full h-full bg-zinc-800 rounded-md" />
                     )}
                </div>
                <div className="text-center max-w-sm">
                    <h2 className="text-xl md:text-3xl font-bold text-white mb-2 leading-tight line-clamp-2">
                        {trackA.name}
                    </h2>
                    <p className="text-sm md:text-lg text-neutral-400 font-medium truncate">
                        {trackA.artist_name || "Unknown Artist"}
                    </p>
                </div>
            </div>
        </div>

        {/* Bottom / Right Option */}
        <div 
            onClick={() => handleVote(trackB.id, trackA.id)}
            className="flex-1 relative cursor-pointer group bg-[#181818] hover:bg-[#202020] transition-colors active:opacity-90"
        >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                <div className="relative w-32 h-32 md:w-64 md:h-64 shadow-2xl mb-6 transition-transform duration-300 md:group-hover:scale-105">
                     {trackB.cover_url ? (
                         <Image src={trackB.cover_url} alt={trackB.name} fill className="object-cover rounded-md" />
                     ) : (
                         <div className="w-full h-full bg-zinc-800 rounded-md" />
                     )}
                </div>
                <div className="text-center max-w-sm">
                    <h2 className="text-xl md:text-3xl font-bold text-white mb-2 leading-tight line-clamp-2">
                        {trackB.name}
                    </h2>
                    <p className="text-sm md:text-lg text-neutral-400 font-medium truncate">
                        {trackB.artist_name || "Unknown Artist"}
                    </p>
                </div>
            </div>
        </div>

    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen"></div>}>
      <CompareContent />
    </Suspense>
  );
}
