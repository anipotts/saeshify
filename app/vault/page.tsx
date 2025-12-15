"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Real implementation would fetch from Supabase
export default function VaultPage() {
  const bank: any[] = []; // Empty for now to verify onboarding/empty state

  // Spotify Header Style
  // If scrolled, title scales down/moves to center (complex to do quickly without scroll listener)
  // We'll stick to big title left aligned.

  return (
    <div className="min-h-screen pb-safe">
      
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-safe px-4 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between pt-2">
           <div className="flex items-center gap-3">
             <h1 className="text-2xl font-bold tracking-tight text-foreground">Vault</h1>
           </div>
           {/* Add Action (Optional) */}
           <Link href="/">
             <Search size={24} className="text-foreground" />
           </Link>
        </div>
        {/* Filters (Optional visual polish) */}
        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
           <button className="bg-surface hover:bg-white/10 text-foreground text-xs font-medium px-4 py-1.5 rounded-full border border-transparent transition-colors whitespace-nowrap">Playlists</button>
           <button className="bg-surface hover:bg-white/10 text-foreground text-xs font-medium px-4 py-1.5 rounded-full border border-transparent transition-colors whitespace-nowrap">Artists</button>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 py-6">
        {bank.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-100 space-y-6 text-center">
             <div className="space-y-2">
               <h2 className="text-xl font-bold text-foreground">Vault is empty</h2>
               <p className="text-sm text-muted">Search and add songs to start ranking.</p>
             </div>
             <Link href="/" className="bg-white text-black font-bold py-3 px-8 rounded-full text-sm hover:scale-105 transition-transform">
               Find songs
             </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Real mapping would go here */}
          </div>
        )}
      </div>
    </div>
  );
}
