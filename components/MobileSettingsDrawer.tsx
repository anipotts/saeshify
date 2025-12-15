"use client";

import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, ChevronRight, User, Settings, Lock, Download, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAuthUser } from "@/lib/hooks/useData";

export default function MobileSettingsDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuthUser();
  const draggingRef = useRef(false);

  // Drag logic
  const onDragEnd = (event: any, info: any) => {
    // If dragged left enough (negative x), close
    if (info.offset.x < -100) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.5, right: 0.05 }}
            onDragEnd={onDragEnd}
            className="fixed inset-y-0 left-0 w-[85%] max-w-[320px] bg-[#121212] z-[101] overflow-y-auto no-scrollbar shadow-2xl"
          >
            <div className="p-4 pt-safe flex flex-col gap-6">
               {/* Header */}
               <div className="flex items-center gap-4 mb-2">
                 <div className="w-12 h-12 rounded-full bg-zinc-800 relative overflow-hidden">
                    {user?.user_metadata?.avatar_url ? (
                        <Image src={user.user_metadata.avatar_url} alt="User" fill className="object-cover" />
                    ) : (
                        <User className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                    )}
                 </div>
                 <div className="flex-1">
                    <h2 className="text-lg font-bold text-white">{user?.user_metadata?.full_name || "Guest"}</h2>
                    <p className="text-xs text-muted-foreground">View Profile</p>
                 </div>
                 <button onClick={onClose}>
                    <X size={24} className="text-white" />
                 </button>
               </div>

               {/* Menu Sections */}
               <div className="space-y-6">
                  
                  {/* Account */}
                  <section className="space-y-2">
                     <h3 className="text-sm font-bold text-white px-2">Account</h3>
                     <div className="space-y-1">
                        <div className="px-2 py-3 flex items-center justify-between active:bg-white/5 rounded-md">
                           <span className="text-base text-white">Premium Plan</span>
                           <span className="text-sm text-neutral-400">Individual</span>
                        </div>
                        <div className="px-2 py-3 flex items-center justify-between active:bg-white/5 rounded-md">
                            <span className="text-base text-white">Email</span>
                            <span className="text-sm text-neutral-400 truncate max-w-[150px]">{user?.email || "No email"}</span>
                        </div>
                     </div>
                  </section>
                  
                  {/* Preferences */}
                  <section className="space-y-2">
                     <h3 className="text-sm font-bold text-white px-2">Data Saver</h3>
                     <div className="space-y-1">
                        <div className="px-2 py-3 flex items-center justify-between active:bg-white/5 rounded-md">
                           <span className="text-base text-white">Audio Quality</span>
                           <span className="text-sm text-neutral-400">Normal</span>
                        </div>
                        <div className="px-2 py-3 flex items-center justify-between active:bg-white/5 rounded-md">
                           <span className="text-base text-white">Video Podcasts</span>
                           <div className="w-10 h-6 bg-accent rounded-full relative">
                              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                           </div>
                        </div>
                     </div>
                  </section>

                  {/* Playback */}
                  <section className="space-y-2">
                     <h3 className="text-sm font-bold text-white px-2">Playback</h3>
                     <div className="space-y-1">
                        <div className="px-2 py-3 flex items-center justify-between active:bg-white/5 rounded-md">
                           <span className="text-base text-white">Crossfade</span>
                           <span className="text-sm text-neutral-400">0s</span>
                        </div>
                        <div className="px-2 py-3 flex items-center justify-between active:bg-white/5 rounded-md">
                           <span className="text-base text-white">Gapless Playback</span>
                           <div className="w-10 h-6 bg-accent rounded-full relative">
                              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                           </div>
                        </div>
                        <div className="px-2 py-3 flex items-center justify-between active:bg-white/5 rounded-md">
                           <span className="text-base text-white">Automix</span>
                           <div className="w-10 h-6 bg-zinc-700 rounded-full relative">
                              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                           </div>
                        </div>
                     </div>
                  </section>

                  <div className="pt-8 pb-12 flex justify-center">
                     <button onClick={() => { /* Logout logic */ }} className="bg-white text-black font-bold py-3 px-8 rounded-full">
                        Log out
                     </button>
                  </div>

               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
