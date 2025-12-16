"use client";

import clsx from "clsx";
import React from "react";
import Image from "next/image";
import { useUIStore } from "@/lib/store";

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode; 
  // Children is the "secondary row" content (e.g. search, pills, counts)
}

export default function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className={clsx(
      "flex flex-col",
      // Negative margins to bleed to the edge of the panel
      // Matches the padding defined in the new ClientLayout (px-6 md:px-8)
      "", 
      "px-4 ",
      "pt-6 pb-2", // Top Padding
      "sticky top-0 z-30",
      "bg-[#121212]/95 backdrop-blur-md", // Matches panel bg
      "border-b border-[#2A2A2A]" // Divider
    )}>
       {/* Row 1: Title */}
       <div className="flex items-center h-10 mb-2 gap-3 md:gap-0">
         {/* Mobile Avatar - Replaces fixed ClientLayout one */}
         <div 
            onClick={() => useUIStore.getState().setMobileSettingsOpen(true)}
            className="md:hidden w-8 h-8 rounded-full overflow-hidden relative border border-white/10 shrink-0 cursor-pointer"
         >
            <Image src="/icon-192x192.png" alt="Settings" fill className="object-cover" />
         </div>
         <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
       </div>

       {/* Row 2: Secondary Content (Fixed Height) */}
       {/* If no children, we might still want the spacing or just collapse? 
           Request says "Row 2 'secondary row' with fixed height (48px)".
           Even if empty, sticking to height keeps alignment? 
           Let's render it if children exist, or just placeholder if enforced.
           User said "fixed height (48px) that *can* hold...". 
           If empty, maybe 0? Let's assume auto if empty to avoid big gaps, 
           but enforce min-height if children present.
       */}
       {children && (
          <div className="h-[48px] flex items-center w-full">
            {children}
          </div>
       )}
    </div>
  );
}
