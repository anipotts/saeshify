"use client";

import { useState, useEffect } from "react";
import { isStandalone, hasOnboarded, setOnboarded } from "@/lib/pwa";
import { Share, PlusSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OnboardingFlow({ onComplete }: { onComplete?: () => void }) {
  // Initialize directly from localStorage to avoid flash
  const [show, setShow] = useState(() => !hasOnboarded());
  const [step, setStep] = useState<"intro" | "instructions">("intro");



  const handleDismiss = () => {
    setOnboarded();
    setShow(false);
    if (onComplete) onComplete();
  };

  const handleScan = () => {
    setStep("instructions");
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-neutral-950 flex flex-col p-6 text-white"
      >
        {step === "intro" ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-4"
            >
              <h1 className="text-4xl font-bold tracking-tight text-[#1DB954]">Saeshify</h1>
            </motion.div>

            <div className="w-full max-w-xs space-y-3 pt-8">
              <button 
                onClick={handleScan}
                className="w-full bg-white text-black font-bold py-4 rounded-full active:scale-95 transition-transform"
              >
                Add to Home Screen
              </button>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col pt-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">How to Install</h2>
              <button onClick={handleDismiss} className="p-2 bg-white/10 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 flex-1">
              <div className="flex items-start gap-4">
                <div className="bg-[#1DB954]/20 p-3 rounded-xl text-[#1DB954]">
                  <Share size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">1. Tap Share</h3>
                  <p className="text-neutral-400">Look for the square icon with an arrow at the bottom.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-[#1DB954]/20 p-3 rounded-xl text-[#1DB954]">
                  <PlusSquare size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">2. Add to Home Screen</h3>
                  <p className="text-neutral-400">Scroll down until you see this option.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-[#1DB954]/20 p-3 rounded-xl text-[#1DB954]">
                  <span className="font-bold text-xl">Add</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">3. Tap 'Add'</h3>
                  <p className="text-neutral-400">Confirm in the top corner.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleDismiss}
              className="w-full bg-[#1DB954] text-black font-bold py-4 rounded-full mb-8 active:scale-95 transition-transform"
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
