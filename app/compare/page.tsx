"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play } from "lucide-react";
import { submitVoteAndFetchNext } from "@/lib/actions/vote";
import { useUIStore } from "@/lib/store";
import { getNextMatchup } from "@/lib/ranking/matchmaking";

function MatchupCard({ track, onClick, position }: { track: any, onClick: () => void, position: "top" | "bottom" | "left" | "right" }) {
    if (!track) return <div className="flex-1 bg-black" />;
    
    return (
        <div 
            onClick={onClick}
            className="relative flex-1 group cursor-pointer overflow-hidden border-b md:border-b-0 md:border-r border-[#2A2A2A] last:border-0"
        >
            {/* Background Image (Blurred) */}
            <div className="absolute inset-0 z-0">
               {track.cover_url ? (
                   <Image src={track.cover_url} alt="" fill className="object-cover opacity-30 blur-xl scale-110" />
               ) : (
                   <div className="w-full h-full bg-zinc-900" />
               )}
               <div className="absolute inset-0 bg-black/60" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 transition-transform duration-200 group-hover:scale-[1.02]">
                {/* Album Art (Clean) */}
                <div className="w-48 h-48 md:w-64 md:h-64 shadow-2xl rounded-lg mb-6 relative overflow-hidden ring-1 ring-white/10 group-hover:ring-white/30 transition-all">
                    {track.cover_url ? (
                        <Image src={track.cover_url} alt={track.name} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <Play size={40} className="text-white/20" />
                        </div>
                    )}
                </div>

                {/* Text */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl md:text-4xl font-black text-white leading-tight drop-shadow-lg max-w-lg">
                        {track.name}
                    </h2>
                    <p className="text-lg md:text-xl text-white/70 font-medium">
                        {track.artist_name || track.artists?.[0]?.name}
                    </p>
                </div>
            </div>

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none" />
        </div>
    );
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seedId = searchParams.get('seed') || undefined;
  
  const [pair, setPair] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVoting, startTransition] = useTransition();

  // Initial Load
  useEffect(() => {
    let mounted = true;
    getNextMatchup(seedId).then(data => {
        if (mounted) {
            setPair(data);
            setLoading(false);
        }
    });
    return () => { mounted = false; };
  }, [seedId]);

  const handleVote = async (winnerId: string, loserId: string) => {
      // Optimistic / Transition
      // We could fade out immediately, but waiting for server is safer for ensuring valid next pair
      // Beli feels instant because they might prefetch. 
      // We'll show a "Selection" state (e.g. flash green) then load next.
      
      startTransition(async () => {
         // Call Server Action
         const next = await submitVoteAndFetchNext(winnerId, loserId, seedId);
         if (next) {
            setPair(next);
         } else {
             // No more pairs? Back to queue?
             // Or keep going with null seed?
             // For now, if null, user finishes
             router.back();
         }
      });
  };

  if (loading || !pair) return (
      <div className="flex items-center justify-center h-full bg-black text-white/50 text-sm font-bold tracking-widest animate-pulse">
        ENTERING THE ARENA...
      </div>
  );

  const [trackA, trackB] = pair;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col md:flex-row">
        
        {/* Close Button (Floating) */}
        <button 
            onClick={() => router.back()}
            className="absolute top-safe-4 right-4 z-[60] p-3 text-white/50 hover:text-white bg-black/20 hover:bg-black/60 backdrop-blur-md rounded-full transition-all"
        >
            <X size={24} />
        </button>

        {/* VS Badge (Center) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] pointer-events-none">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white text-black rounded-full flex items-center justify-center font-black italic text-lg md:text-2xl shadow-xl ring-4 ring-black/50">
                VS
            </div>
        </div>

        {/* Voting Layout */}
        {/* Mobile: Col (Top A, Bottom B). Desktop: Row (Left A, Right B) */}
        
        <MatchupCard 
            track={trackA} 
            position="left" 
            onClick={() => !isVoting && handleVote(trackA.id, trackB.id)} 
        />
        
        <MatchupCard 
            track={trackB} 
            position="right" 
            onClick={() => !isVoting && handleVote(trackB.id, trackA.id)} 
        />

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
