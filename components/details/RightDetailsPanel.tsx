"use client";

import { useUIStore } from "@/lib/store";
import DetailsContent from "./DetailsContent";
import { X, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export default function RightDetailsPanel() {
  const { isDetailsOpen, closeDetails, focusedEntity } = useUIStore();

  // If not open or no entity, we can render nothing or just an empty shell.
  // Since the parent grid controls width, if isDetailsOpen is false, width is 0.
  // But we might want to preserve the DOM or just unmount.
  // Let's unmount content if not open to save resources, but we need to match the grid state.
  
  // We render the AnimatePresence here. Use absolute positioning within the grid cell if needed, 
  // or just let it fill. The Grid cell resizes. 
  // To avoid layout thrashing, checking if we should animate layout properties? 
  // The user said: "Avoid animating layout properties...".
  // The Grid animates width via CSS. The *content* inside should just fade/slide.
  
  return (
    <div className="h-full w-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {isDetailsOpen && focusedEntity && (
          <motion.div
            key="details-panel"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }} 
            className="flex flex-col h-full w-full bg-[#121212] border-l border-[#2A2A2A]"
          >
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
               <span className="font-bold text-sm tracking-wider truncate pr-2">
                  {focusedEntity.payload?.name || "Details"}
               </span>
               <button onClick={closeDetails} className="p-2 hover:bg-white/10 rounded-full transition-colors icon-micro">
                 <X size={20} />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
               <DetailsContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
