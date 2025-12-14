"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import Link from "next/link";

// Real implementation would fetch from Supabase
export default function BankPage() {
  const bank = []; // Empty for now to verify onboarding/empty state

  return (
    <div className="py-6 sm:py-8 space-y-4 sm:space-y-6 px-4">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">My Bank</h1>
      
      {bank.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4 text-center">
           <div className="bg-white/10 p-4 rounded-full">
             <Search size={32} />
           </div>
           <div className="space-y-1">
             <p className="text-lg font-bold">Your bank is empty</p>
             <p className="text-sm text-neutral-400">Go search and add songs to start ranking.</p>
           </div>
           <Link href="/" className="mt-4 bg-white text-black font-bold py-2 px-6 rounded-full text-sm hover:scale-105 transition-transform">
             Find Songs
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {/* Real mapping would go here */}
        </div>
      )}
    </div>
  );
}
