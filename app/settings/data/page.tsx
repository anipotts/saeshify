"use client";

import { resetMyData } from "@/lib/actions/reset";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DataSettingsPage() {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleReset = async () => {
     await resetMyData("prod_confirmed");
     setIsResetModalOpen(false);
     window.location.href = "/"; // Force load home
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/50 rounded-lg p-6 border border-red-900/20">
         <h3 className="font-bold text-red-500 flex items-center gap-2 mb-2">
           <AlertTriangle size={18} /> Danger Zone
         </h3>
         <p className="text-sm text-muted-foreground mb-6">
           Resetting your data will permanently delete all your curated tracks, ratings, and vault contents. This action cannot be undone.
         </p>
         <button 
           onClick={() => setIsResetModalOpen(true)}
           className="w-full py-3 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium text-sm transition-colors border border-red-500/20"
         >
           Reset Data
         </button>
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
                   <br/><br/>
                   <span className="text-xs font-mono text-red-400 bg-red-900/10 p-1 rounded">IRREVERSIBLE ACTION</span>
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
