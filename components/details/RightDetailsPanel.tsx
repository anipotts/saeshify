"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useFocus } from "@/lib/context/FocusContext";
import DetailsContent from "./DetailsContent";
import { X } from "lucide-react";

export default function RightDetailsPanel() {
  const { isDetailsOpen, closeDetails, focusedEntity } = useFocus();

  if (!focusedEntity) return null;

  return (
    <AnimatePresence>
      {isDetailsOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="hidden md:flex flex-col h-screen fixed right-0 top-0 z-40 bg-[#121212] border-l border-[#2A2A2A] shadow-xl overflow-hidden"
        >
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
             <span className="font-bold text-sm tracking-wider">{focusedEntity.data.name}</span>
             <button onClick={closeDetails} className="p-2 hover:bg-white/10 rounded-full transition-colors">
               <X size={20} />
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto w-[320px]">
             <DetailsContent />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
