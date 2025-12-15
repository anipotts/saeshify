"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAuthUser } from "@/lib/hooks/useData";
import { resetMyData } from "@/lib/actions/reset";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Trash2, AlertTriangle, Settings as SettingsIcon, Layout, User, ChevronRight, Check } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const { user, loading } = useAuthUser();
  const [activeTab, setActiveTab] = useState<"account" | "data" | "prefs">("account");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const router = useRouter();

  // Prefs
  const [defaultOpen, setDefaultOpen] = useState(false);
  
  useEffect(() => {
     if (typeof window !== "undefined") {
       setDefaultOpen(localStorage.getItem("saeshify_pref_details_open") === 'true');
     }
  }, []);
  
  const toggleDefaultOpen = () => {
    const newVal = !defaultOpen;
    setDefaultOpen(newVal);
    localStorage.setItem("saeshify_pref_details_open", String(newVal));
  };

  const handleSignOut = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      setTimeout(() => window.location.href = "/", 500);
  };

  const handleReset = async () => {
     await resetMyData("prod_confirmed");
     setIsResetModalOpen(false);
     window.location.reload(); // Force full reload to clear any cache/state
  };

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "data", label: "Data", icon: Trash2 },
    { id: "prefs", label: "Preferences", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-full pb-safe">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-4 pb-0 border-b border-white/5">
         <h1 className="text-2xl font-bold tracking-tight text-foreground px-4 pb-4 pt-2">Settings</h1>
         
         <div className="flex px-4 gap-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  "pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2",
                  activeTab === tab.id 
                    ? "border-accent text-accent" 
                    : "border-transparent text-muted-foreground hover:text-white"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
         </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "account" && (
            <motion.div 
               key="account"
               initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
               className="space-y-6"
            >
              <div className="bg-zinc-900 rounded-lg p-6 flex flex-col items-center text-center border border-white/5">
                 <div className="w-20 h-20 bg-zinc-800 rounded-full mb-4 flex items-center justify-center overflow-hidden relative">
                    {user?.user_metadata?.avatar_url ? (
                       <Image src={user.user_metadata.avatar_url} alt="Avatar" fill className="object-cover" />
                    ) : (
                       <User size={40} className="text-zinc-600" />
                    )}
                 </div>
                 <h2 className="text-xl font-bold text-white">{user?.user_metadata?.full_name || "Guest User"}</h2>
                 <p className="text-muted-foreground text-sm mt-1">{user?.email || "Not signed in"}</p>
                 
                 {user && (
                   <button 
                     onClick={handleSignOut}
                     className="mt-6 flex items-center gap-2 px-6 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium"
                   >
                     <LogOut size={16} /> Sign out
                   </button>
                 )}
              </div>
            </motion.div>
          )}

          {activeTab === "data" && (
            <motion.div 
               key="data"
               initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
               className="space-y-4"
            >
              <div className="bg-zinc-900/50 rounded-lg p-4 border border-red-900/20">
                 <h3 className="font-bold text-red-500 flex items-center gap-2 mb-2">
                   <AlertTriangle size={18} /> Danger Zone
                 </h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   Resetting your data will permanently delete all your curated tracks, ratings, and vault contents. This action cannot be undone.
                 </p>
                 <button 
                   onClick={() => setIsResetModalOpen(true)}
                   className="w-full py-3 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium text-sm transition-colors border border-red-500/20"
                 >
                   Reset Data
                 </button>
              </div>
            </motion.div>
          )}

          {activeTab === "prefs" && (
            <motion.div 
               key="prefs"
               initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
               className="space-y-4"
            >
               <div className="bg-zinc-900 rounded-lg overflow-hidden border border-white/5">
                  <div 
                    onClick={toggleDefaultOpen}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  >
                     <div className="flex items-center gap-3">
                        <Layout size={20} className="text-muted-foreground" />
                        <div>
                          <p className="font-medium text-white">Default Details Panel</p>
                          <p className="text-xs text-muted-foreground">Keep the details panel open by default on desktop</p>
                        </div>
                     </div>
                     <div className={clsx("w-12 h-6 rounded-full relative transition-colors", defaultOpen ? "bg-accent" : "bg-zinc-700")}>
                        <div className={clsx("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform", defaultOpen ? "left-7" : "left-1")} />
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Reset Modal */}
      <AnimatePresence>
        {isResetModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsResetModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-[#191919] rounded-xl border border-white/10 p-6 max-w-sm w-full shadow-2xl"
              >
                 <h3 className="text-lg font-bold text-white mb-2">Are you absolutely sure?</h3>
                 <p className="text-sm text-neutral-400 mb-6">
                   This will delete your entire vault and ranking history. 
                 </p>
                 <div className="flex gap-3">
                   <button 
                     onClick={() => setIsResetModalOpen(false)}
                     className="flex-1 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleReset}
                     className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors"
                   >
                     Confirm Reset
                   </button>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}
