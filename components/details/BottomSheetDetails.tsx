"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useFocus } from "@/lib/context/FocusContext";
import DetailsContent from "./DetailsContent";
import { useEffect } from "react";

export default function BottomSheetDetails() {
  const { isDetailsOpen, closeDetails } = useFocus();

  // Prevent background scroll when open
  useEffect(() => {
    if (isDetailsOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; }
  }, [isDetailsOpen]);

  return (
    <AnimatePresence>
      {isDetailsOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetails}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[61] h-[85vh] bg-[#181818] rounded-t-[20px] overflow-hidden md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.5)] border-t border-white/10"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-1" onClick={closeDetails}>
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            
            <div className="h-full pb-safe">
              <DetailsContent />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
