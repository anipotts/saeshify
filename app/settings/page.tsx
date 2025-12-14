"use client";

import { ArrowLeft, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-950 pb-24">
      <div className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md px-4 py-3 flex items-center gap-4 pt-[env(safe-area-inset-top)] border-b border-white/5">
        <button onClick={() => router.back()} className="text-white hover:bg-white/10 p-2 rounded-full -ml-2 transition-colors">
          <ArrowLeft />
        </button>
        <span className="font-bold">Settings</span>
      </div>

      <div className="p-6 space-y-8">
        
        <div className="bg-neutral-900/50 rounded-xl p-6 border border-white/5 space-y-4">
           <div className="flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-full">
                <User size={24} />
              </div>
              <div>
                <h2 className="font-bold text-lg">Sync your Data</h2>
                <p className="text-sm text-neutral-400">Sign in with Spotify to sync rankings across devices.</p>
              </div>
           </div>
           
           <div className="pt-2">
             <button className="w-full bg-[#1DB954] text-black font-bold py-3 rounded-full active:scale-95 transition-transform" onClick={() => alert("Implementation pending")}>
               Sign in with Spotify
             </button>
             <p className="text-xs text-center text-neutral-500 mt-3">
               No sign-in = rankings stay on this device only.
             </p>
           </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-neutral-600">Saeshify v0.1.0</p>
        </div>

      </div>
    </div>
  );
}
