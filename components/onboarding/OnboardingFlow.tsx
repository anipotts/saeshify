"use client";

import { useState, useEffect } from "react";
import { isStandalone, hasOnboarded, setOnboarded } from "@/lib/utils/pwa";
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
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-4"
            >
              <h1 className="text-4xl font-bold tracking-tight text-[#1DB954]">Saeshify</h1>
              <p className="text-neutral-400">Spotify for Saesha</p>
            </motion.div>

            <div className="w-auto space-y-3 pt-4">
              <button 
                onClick={handleScan}
                className="w-full bg-white text-black font-bold py-2 px-4 rounded-full active:scale-95 transition-transform"
              >
                Install
              </button>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center h-full max-w-md mx-auto w-full">
            <h2 className="text-2xl font-bold mb-8">How to Install</h2>

            <div className="space-y-6 w-full mb-10">
              <div className="flex items-start gap-4">
                <div className="bg-[#1DB954]/20 p-3 rounded-xl text-[#1DB954] shrink-0">
                  <Share size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">1. Share</h3>
                  <p className="text-neutral-400 leading-snug">Tap the square with an arrow at the bottom.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-[#1DB954]/20 p-3 rounded-xl text-[#1DB954] shrink-0">
                  <PlusSquare size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">2. Add to Home Screen</h3>
                  <p className="text-neutral-400 leading-snug">Scroll down until you see this option.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-[#1DB954]/20 p-3 rounded-xl text-[#1DB954] shrink-0">
                  <span className="font-bold text-xl leading-none">Add</span>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">3. Tap 'Add'</h3>
                  <p className="text-neutral-400 leading-snug">Confirm in the top corner.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleDismiss}
              className="bg-[#1DB954] text-black font-bold py-3 px-12 rounded-full active:scale-95 transition-transform"
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
