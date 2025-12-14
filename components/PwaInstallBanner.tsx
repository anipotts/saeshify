"use client";

import { useState, useEffect } from "react";
import { isStandalone, hasOnboarded, hasDismissedInstallTip, setDismissedInstallTip } from "@/lib/pwa";
import { X, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OnboardingFlow from "./onboarding/OnboardingFlow";

// Reusing logic: if they click the banner, we show the instructions part of the OnboardingFlow?
// Or we can just create a simple "Instructions Modal" here. 
// For simplicity, let's keep it self-contained or reuse a simple Instruction Sheet.

export default function PwaInstallBanner() {
  const [show, setShow] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Show only if: NOT standalone, HAS onboarded, NOT dismissed tip
    if (!isStandalone() && hasOnboarded() && !hasDismissedInstallTip()) {
      setShow(true);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedInstallTip();
    setShow(false);
  };

  const handleOpen = () => {
    // For this requirement, we can just reset the onboarding state (partially) or allow the OnboardingFlow to handle "force show"?
    // User requested "opens the same instructions sheet (Screen 2 UI)".
    // Let's implement a local simple sheet to match Screen 2.
    setShowInstructions(true);
  };

  if (!show && !showInstructions) return <OnboardingFlow />; // Include the main flow here correctly?
  // Actually, OnboardingFlow handles its own visibility logic. We can render it parallel.

  return (
    <>
      <OnboardingFlow />
      
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            onClick={handleOpen}
            className="fixed top-[env(safe-area-inset-top)] left-4 right-4 z-40 bg-[#1DB954] text-black rounded-full px-4 py-3 flex items-center justify-between shadow-lg cursor-pointer mt-2"
          >
            <div className="flex items-center gap-2">
              <ArrowUpRight size={18} />
              <span className="font-bold text-sm">Tip: Add to Home Screen</span>
            </div>
            <button 
              onClick={handleDismiss}
              className="p-1 bg-black/10 rounded-full hover:bg-black/20"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions Modal (Recreated logic or reuse OnboardingFlow could be cleaner, but minimal here) */}
      {showInstructions && (
        <div className="fixed inset-0 z-[70] bg-neutral-950 flex flex-col p-6 text-white pt-[calc(env(safe-area-inset-top)+20px)]">
             <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">How to Install</h2>
              <button onClick={() => setShowInstructions(false)} className="p-2 bg-white/10 rounded-full">
                <X size={20} />
              </button>
            </div>
             <div className="space-y-6 flex-1">
                 {/* Content similar to screen 2 */}
                 <div className="flex items-start gap-4">
                   <div className="bg-[#1DB954]/20 p-3 rounded-xl text-[#1DB954]">
                     <ArrowUpRight size={24} /> 
                   </div>
                   <div>
                     <h3 className="font-bold text-lg">1. Tap Share</h3>
                     <p className="text-neutral-400">Square icon with arrow.</p>
                   </div>
                 </div>
                 {/* ... abbreviated for speed as per user "minimal" request */}
                  <div className="flex items-start gap-4">
                 <div className="bg-[#1DB954]/20 p-3 rounded-xl text-[#1DB954]">
                   <span className="font-bold text-2xl">+</span>
                 </div>
                 <div>
                   <h3 className="font-bold text-lg">2. Add to Home Screen</h3>
                 </div>
               </div>
             </div>
             <button 
              onClick={() => setShowInstructions(false)}
              className="w-full bg-[#1DB954] text-black font-bold py-4 rounded-full mb-8"
            >
              Got it
            </button>
        </div>
      )}
    </>
  );
}
