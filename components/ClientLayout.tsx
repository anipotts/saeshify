"use client";

import React from 'react';
import { useUIStore } from "@/lib/store";
import Sidebar from "./Sidebar";
import RightDetailsPanel from "./details/RightDetailsPanel";
import BottomSheetDetails from "./details/BottomSheetDetails";
import BottomNav from "./BottomNav"; 
import PwaInstallBanner from "./PwaInstallBanner";
import clsx from "clsx";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isDetailsOpen, detailsWidth } = useUIStore();
  
  return (
    <div 
        className={clsx(
            "min-h-screen bg-black text-white",
            // Desktop: Grid layout
            "md:grid md:h-screen md:overflow-hidden"
        )}
        style={{
            // Applied only when display is grid (md+)
            gridTemplateColumns: `280px 1fr ${isDetailsOpen ? detailsWidth : 0}px`,
            transition: 'grid-template-columns 300ms ease-in-out'
        }}
    >
       {/* Sidebar - Desktop */}
       {/* Sidebar component has 'hidden md:flex' itself, but wrapping it explicitly helps grid cell assignment */}
       <div className="hidden md:block h-full bg-black border-r border-[#2A2A2A] overflow-hidden z-20">
            <Sidebar />
       </div>

       {/* Main Content */}
       <main className={clsx(
           "relative w-full h-full bg-background",
           "md:overflow-y-auto md:overflow-x-hidden",
       )}>
           {/* Background Gradient */}
           <div className="fixed inset-0 z-0 bg-gradient-to-b from-accent/5 via-background to-background pointer-events-none" />
           
           {/* Desktop Settings Icon */}
           <div className="absolute top-6 right-6 z-40 hidden md:block mix-blend-difference text-white/50 hover:text-white transition-colors">
               <a href="/settings" aria-label="Settings">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
               </a>
           </div>

           <div className={clsx(
               "relative z-10 mx-auto w-full",
               "px-4 sm:px-6 md:px-8", // Padding
               "pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-8" // Bottom padding handling
           )}>
               {children}
           </div>
       </main>

       {/* Right Panel - Desktop */}
       <div className="hidden md:block h-full bg-[#121212] border-l border-[#2A2A2A] overflow-hidden z-20">
           <RightDetailsPanel />
       </div>

       {/* Mobile Overlays */}
       <BottomSheetDetails />
       
       <div className="md:hidden">
          <PwaInstallBanner />
          <BottomNav />
       </div>
    </div>
  );
}
