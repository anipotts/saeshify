"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Mock Data Type
type ComparisonItem = {
  id: string;
  name: string;
  artist: string;
  image: string;
  color?: string;
};

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const albumId = searchParams.get('album');
  const supabase = createClient();
  
  const [queue, setQueue] = useState<any[]>([]);
  const [currentPair, setCurrentPair] = useState<[ComparisonItem, ComparisonItem] | null>(null);

  useEffect(() => {
    const q = JSON.parse(localStorage.getItem('comparison_queue') || '[]');
    if (q.length > 0) {
      setQueue(q);
      setCurrentPair([
        { id: '1', name: 'New Song', artist: 'Artist A', image: 'https://i.scdn.co/image/ab67616d0000b273e8b066f70c206551210d902b' },
        { id: '2', name: 'Old Favorite', artist: 'Artist B', image: 'https://i.scdn.co/image/ab67616d0000b27394d28d01170bd7be5eb65910' }
      ]);
    }
  }, []);

  const handleChoice = async (winnerId: string | 'skip') => {
    if (!currentPair) return;

    if (winnerId !== 'skip') {
       const loserId = currentPair[0].id === winnerId ? currentPair[1].id : currentPair[0].id;
       const { error } = await supabase.rpc('record_comparison', {
         p_winner_id: winnerId,
         p_loser_id: loserId,
         p_album_id: albumId || null
       });
       if (error) console.error('Error recording comparison:', error);
    }
    
    const nextQueue = queue.slice(1);
    setQueue(nextQueue);
    
    if (nextQueue.length > 0) {
        // Here we just go back to home if "done" for the demo
        router.back(); 
    } else {
        router.back();
    }
  };

  const x = useMotionValue(0);
  const opacityRight = useTransform(x, [0, 100], [0, 1]);
  const opacityLeft = useTransform(x, [0, -100], [0, 1]);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);

  if (!currentPair) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Loading Arena...</div>;

  return (
    <div className="fixed inset-0 bg-neutral-950 z-50 flex flex-col">
       <div className="flex justify-between items-center p-4 pt-[env(safe-area-inset-top)]">
         <span className="text-white/50 text-sm font-medium tracking-widest uppercase">This or That</span>
         <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-full"><X size={20} /></button>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center relative px-6 gap-6">
          <div className="w-full max-w-sm aspect-[3/4] relative">
              <motion.div 
                style={{ x, rotate, touchAction: "none" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, { offset, velocity }) => {
                  if (offset.x > 100) handleChoice(currentPair[0].id);
                  else if (offset.x < -100) handleChoice(currentPair[1].id);
                }}
                className="absolute inset-0 bg-[#282828] rounded-2xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing border border-white/5"
              >
                  <div className="relative h-2/3 w-full">
                    <Image src={currentPair[0].image} alt={currentPair[0].name} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#282828] to-transparent" />
                  </div>
                  <div className="p-6">
                    <h2 className="text-3xl font-bold mb-1 text-white">{currentPair[0].name}</h2>
                    <p className="text-[#B3B3B3] text-lg">{currentPair[0].artist}</p>
                  </div>
                  
                  <motion.div style={{ opacity: opacityRight }} className="absolute top-8 left-8 border-4 border-[#1DB954] text-[#1DB954] rounded-lg px-4 py-2 text-2xl font-black uppercase -rotate-12 bg-black/20 backdrop-blur-sm">
                    LIKE
                  </motion.div>
                   <motion.div style={{ opacity: opacityLeft }} className="absolute top-8 right-8 border-4 border-red-500 text-red-500 rounded-lg px-4 py-2 text-2xl font-black uppercase rotate-12 bg-black/20 backdrop-blur-sm">
                    PASS
                  </motion.div>
              </motion.div>
              
              <div className="absolute inset-0 bg-[#181818] rounded-2xl -z-10 scale-95 translate-y-4 opacity-50 flex items-end p-6">
                 <div>
                    <h2 className="text-xl font-bold text-white/50">{currentPair[1].name}</h2>
                 </div>
              </div>
          </div>
       </div>

       <div className="pb-[calc(env(safe-area-inset-bottom)+20px)] flex justify-center gap-4 px-6">
          <button onClick={() => handleChoice('skip')} className="bg-[#282828] text-white font-bold py-4 px-8 rounded-full flex-1">Skip</button>
          <button className="bg-[#282828] text-white font-bold py-4 px-8 rounded-full flex-1">Too Hard</button>
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
