"use client";

import { useUIStore } from "@/lib/store";
import DetailsContent from "./DetailsContent";
import { X, Settings } from "lucide-react";
import clsx from "clsx";

export default function RightDetailsPanel() {
  const { isDetailsOpen, closeDetails, focusedEntity } = useUIStore();

  // If not open or no entity, we can render nothing or just an empty shell.
  // Since the parent grid controls width, if isDetailsOpen is false, width is 0.
  // But we might want to preserve the DOM or just unmount.
  // Let's unmount content if not open to save resources, but we need to match the grid state.
  
  if (!isDetailsOpen || !focusedEntity) return null;

  return (
    <div className="flex flex-col h-full w-full bg-[#121212] relative">
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
         <span className="font-bold text-sm tracking-wider truncate pr-2">
            {focusedEntity.payload?.name || "Details"}
         </span>
         <button onClick={closeDetails} className="p-2 hover:bg-white/10 rounded-full transition-colors">
           <X size={20} />
         </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
         <DetailsContent />
      </div>
    </div>
  );
}
