"use client";

import Image from "next/image";
import { useAuthUser } from "@/lib/hooks/useData";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User } from "lucide-react";
import { motion } from "framer-motion";

export default function AccountPage() {
  const { user } = useAuthUser();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-zinc-900 rounded-lg p-6 flex flex-col items-center text-center border border-white/5">
        <div className="w-20 h-20 bg-zinc-800 rounded-full mb-4 flex items-center justify-center overflow-hidden relative">
          {user?.user_metadata?.avatar_url ? (
            <Image src={user.user_metadata.avatar_url} alt="Avatar" fill className="object-cover" />
          ) : (
            <User size={40} className="text-zinc-600" />
          )}
        </div>
        <h2 className="text-xl font-bold text-white">{user?.user_metadata?.full_name || "Guest User"}</h2>
        <p className="text-muted-foreground text-sm mt-1">{user?.email || "Not signed in"}</p>
        
        {user ? (
          <button 
            onClick={handleSignOut}
            className="mt-6 flex items-center gap-2 px-6 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium"
          >
            <LogOut size={16} /> Sign out
          </button>
        ) : (
          <button 
            onClick={async () => {
                const supabase = createClient();
                const origin = window.location.origin;
                const redirectUrl = `${origin}/auth/callback`;
                console.log("Signing in with redirect:", redirectUrl);
                
                await supabase.auth.signInWithOAuth({
                  provider: 'spotify',
                  options: {
                    redirectTo: redirectUrl,
                    scopes: 'user-read-recently-played user-read-currently-playing user-read-playback-state user-read-email user-read-private',
                    queryParams: {
                      access_type: 'offline',
                      prompt: 'consent',
                    },
                  },
                });
            }}
            className="mt-6 bg-[#1DB954] text-black font-bold py-3 px-8 rounded-full hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
          >
            Continue with Spotify
          </button>
        )}
      </div>
      

    </motion.div>
  );
}
