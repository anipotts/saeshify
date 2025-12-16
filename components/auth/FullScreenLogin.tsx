"use client";

import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function FullScreenLogin() {
  const handleLogin = async () => {
    const supabase = createClient();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 hidden relative">
             {/* Using favicon as requested/implied for 'center of Saesha' */}
             <Image src="/icon-192x192.png" alt="Saeshify" fill className="object-contain" />
        </div>
      
        <button 
            onClick={handleLogin}
            className="bg-[#1DB954] text-black font-bold py-2 px-4 rounded-full text-lg hover:scale-105 active:scale-95 transition-transform flex items-center gap-3 shadow-lg shadow-[#1DB954]/20"
        >
            <Image src="/spotify-icon-black.png" alt="" width={24} height={24} />
            Sign in with Spotify
        </button>
      </div>
    </div>
  );
}
