"use client";

import { Suspense, useEffect, useState, useTransition, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";
import { submitVoteAndFetchNext } from "@/lib/actions/vote";
import { getNextMatchup } from "@/lib/ranking/matchmaking";
import { Matchup } from "@/lib/ranking/types";
import { motion, AnimatePresence } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/motion/reducedMotion";

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seedId = searchParams.get('seed') || undefined;
  
  // State
  const [current, setCurrent] = useState<Matchup | null>(null);
  const [next, setNext] = useState<Matchup | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVoting, startTransition] = useTransition();

  // Interaction State
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isLocked, setLocked] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

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

  const handleVote = async (winnerIdSelected: string, loserId: string) => {
      if (!current || isLocked) return;
      setLocked(true);
      setWinnerId(winnerIdSelected);

      // 1. Visual Feedback Delay (Winner Highlight)
      await new Promise(resolve => setTimeout(resolve, prefersReducedMotion ? 0 : 200));

      const previous = current;
      
      // Perform Swap
      if (next) {
          setCurrent(next);
          addToHistory(next);
          setNext(null);
      } else {
          setLoading(true);
      }
      
      startTransition(async () => {
         const newNext = await submitVoteAndFetchNext(
             winnerIdSelected, 
             loserId, 
             seedId,
             excludeIdsRef.current,
             excludeKeysRef.current
         );

         if (newNext) {
             if (!next) {
                 setCurrent(newNext);
                 addToHistory(newNext);
                 setLoading(false);
             } else {
                 setNext(newNext);
             }
         } else if (!next) {
             router.back();
         }
      });
      
      // Reset State (after state update, new key will trigger AnimatePresence enter, which starts fresh)
      setWinnerId(null);
      setLocked(false);
  };

  if (loading) return (
      <div className="flex items-center justify-center h-full w-full bg-[#121212] text-white/50 text-sm font-bold tracking-widest animate-pulse absolute inset-0 z-50">
        LOADING MATCHUP...
      </div>
  );

  if (!current) return (
       // ... existing empty state ...
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
        z-40 bg-[#121212] overflow-hidden select-none
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

        <AnimatePresence mode="popLayout" initial={false}>
            <motion.div 
               key={current.id}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0, scale: 0.98 }}
               transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
               className="flex flex-col md:flex-row w-full h-full"
            >
                {/* Top / Left Option */}
                <CompareOption 
                    track={trackA} 
                    position="left"
                    isWinner={winnerId === trackA.id}
                    isLoser={winnerId === trackB.id}
                    onClick={() => handleVote(trackA.id, trackB.id)}
                    disabled={isLocked}
                />

                {/* Bottom / Right Option */}
                <CompareOption 
                    track={trackB} 
                    position="right"
                    isWinner={winnerId === trackB.id}
                    isLoser={winnerId === trackA.id}
                    onClick={() => handleVote(trackB.id, trackA.id)}
                    disabled={isLocked}
                />
            </motion.div>
        </AnimatePresence>

    </div>
  );
}

function CompareOption({ track, position, isWinner, isLoser, onClick, disabled }: { 
    track: any, 
    position: 'left' | 'right', 
    isWinner: boolean, 
    isLoser: boolean, 
    onClick: () => void,
    disabled: boolean
}) {
    // Determine visuals based on state
    // Winner: Highlight (opacity 1, scale 1.02, glow)
    // Loser: Fade (opacity 0.3, scale 0.98)
    // Idle: Normal
    
    return (
        <motion.div 
            onClick={disabled ? undefined : onClick}
            className={`
                flex-1 relative cursor-pointer group bg-[#181818] 
                transition-colors active:opacity-90 
                ${position === 'left' ? 'border-b md:border-b-0 md:border-r border-[#2A2A2A]' : ''}
            `}
            animate={{
                opacity: isLoser ? 0.2 : 1,
                scale: isWinner ? 1.02 : isLoser ? 0.98 : 1,
                backgroundColor: isWinner ? '#1F1F1F' : '#181818',
                zIndex: isWinner ? 10 : 1,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
             {/* Glow for winner */}
             {isWinner && (
                 <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="absolute inset-0 bg-accent/5 z-0 pointer-events-none" 
                 />
             )}

            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
                <div className="relative w-32 h-32 md:w-64 md:h-64 shadow-2xl mb-6">
                     {track.cover_url ? (
                         <Image src={track.cover_url} alt={track.name} fill className="object-cover rounded-md" />
                     ) : (
                         <div className="w-full h-full bg-zinc-800 rounded-md" />
                     )}
                     
                     {/* Checkmark or Ring on winner? User said "subtle glow/outline" */}
                     {isWinner && (
                        <motion.div 
                           className="absolute inset-0 rounded-md ring-4 ring-accent"
                           initial={{ opacity: 0, scale: 0.9 }}
                           animate={{ opacity: 1, scale: 1 }}
                           transition={{ duration: 0.2 }}
                        />
                     )}
                </div>
                <div className="text-center max-w-sm">
                    <h2 className="text-xl md:text-3xl font-bold text-white mb-2 leading-tight line-clamp-2">
                        {track.name}
                    </h2>
                    <p className="text-sm md:text-lg text-neutral-400 font-medium truncate">
                        {track.artist_name || "Unknown Artist"}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen"></div>}>
      <CompareContent />
    </Suspense>
  );
}
