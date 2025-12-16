"use client";

import { Search, ChevronDown, User, ExternalLink, Settings, LogOut, Layout } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthUser } from "@/lib/hooks/useData";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/lib/hooks/useDebounce";
import confetti from "canvas-confetti";

export default function TopBarDesktop() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Search State
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300); // 300ms bounce
  
  // Sync query from URL if on search page (initial load only or if URL changes externally)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q !== query) setQuery(q);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect: When debounced query changes, push to router
  useEffect(() => {
     // Only push if different from current param to avoid loops?
     // Actually router.push might be heavy. 
     // We only push if we have a value OR we had a value and cleared it.
     // But we don't want to break hydration.
     
     // Only execute if component is mounted and user typed
     if (debouncedQuery !== (searchParams.get("q") || "")) {
         if (debouncedQuery) {
             router.replace(`/?q=${encodeURIComponent(debouncedQuery)}`);
         } else {
             // If cleared, go home but keep history clean?
             router.replace('/');
         }
     }
  }, [debouncedQuery]);

// ... (Move to top)


  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    // Easter Egg
    if (val.toLowerCase() === "ani" || val.toLowerCase() === "saesha" || val.toLowerCase() === "manan") {
       confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
       });
    }
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <header className="h-[64px] hidden md:flex items-center justify-between px-6 bg-black z-50 sticky top-0 w-full my-2">
       {/* Left: Favicon (Saeshify Logo) */}
       <div className="flex items-center gap-2 w-[280px]">
          <Link href="/" className="flex items-center gap-2">

                <Image src="/icon-192x192.png" alt="Saeshify" width={36} height={36} className="object-contain" />
          </Link>
          <div className="flex gap-2 ml-4">
             <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-black/50 items-center justify-center flex hover:bg-[#2A2A2A] text-muted-foreground hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.03.47a.75.75 0 0 1 0 1.06L4.56 8l6.47 6.47a.75.75 0 1 1-1.06 1.06L2.44 8 9.97.47a.75.75 0 0 1 1.06 0z"></path></svg>
             </button>
             <button onClick={() => router.forward()} className="w-8 h-8 rounded-full bg-black/50 items-center justify-center flex hover:bg-[#2A2A2A] text-muted-foreground hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.97.47a.75.75 0 1 0-1.06 1.06L10.44 8 3.91 14.47a.75.75 0 1 0 1.06 1.06l7.53-7.53a.75.75 0 0 0 0-1.06L4.97.47z"></path></svg>
             </button>
          </div>
       </div>

       {/* Center: Search Bar */}
       <div className="flex-1 max-w-[480px]">
          <div className="relative group">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3B3B3] group-focus-within:text-white transition-colors">
                <Search size={20} />
             </div>
             <input 
                type="text"
                value={query}
                onChange={handleSearch}
                placeholder="What do you want to search?"
                className="w-full h-12 bg-[#1F1F1F] rounded-full pl-11 pr-4 text-sm text-white placeholder:text-[#B3B3B3] outline-none border border-transparent focus:border-white/20 hover:bg-[#2A2A2A] hover:border-[#3E3E3E] transition-all font-medium"
             />
          </div>
       </div>

       {/* Right: Profile Menu */}
       <div className="flex justify-end w-[280px]" ref={menuRef}>
          <div 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 p-1 bg-black hover:bg-[#1F1F1F] rounded-full cursor-pointer transition-colors border border-transparent hover:border-[#2A2A2A]"
          >
             <div className="w-12 h-12 rounded-full bg-[#535353] relative overflow-hidden text-white flex items-center justify-center">
                {user?.user_metadata?.avatar_url ? (
                   <Image src={user.user_metadata.avatar_url} alt="Profile" fill className="object-cover" />
                ) : (
                   <User size={24} />
                )}
             </div>
          </div>

          {/* Dropdown Overlay */}
          <AnimatePresence>
            {isMenuOpen && (
               <motion.div 
                 initial={{ opacity: 0, y: -10, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: -10, scale: 0.95 }}
                 transition={{ duration: 0.1 }}
                 className="absolute top-[60px] right-6 w-56 bg-[#282828] rounded-md shadow-[0_16px_24px_rgba(0,0,0,0.5)] py-1 z-50 border border-white/5"
               >
                  <div className="px-1 py-1">
                     <Link href="/settings/account" className="flex items-center justify-between px-3 py-2.5 text-sm text-white/90 hover:bg-[#3E3E3E] rounded-sm group" onClick={() => setIsMenuOpen(false)}>
                        <span>Account</span>
                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                     </Link>
                     <Link href="/settings/profile" className="flex items-center justify-between px-3 py-2.5 text-sm text-white/90 hover:bg-[#3E3E3E] rounded-sm" onClick={() => setIsMenuOpen(false)}>
                        <span>Profile</span>
                     </Link>
                     <Link href="/settings" className="flex items-center justify-between px-3 py-2.5 text-sm text-white/90 hover:bg-[#3E3E3E] rounded-sm" onClick={() => setIsMenuOpen(false)}>
                        <span>Settings</span>
                     </Link>
                  </div>
                  <div className="h-[1px] bg-white/10 my-1 mx-2" />
                  <div className="px-1 py-1">
                     <button onClick={handleLogout} className="w-full text-left flex items-center justify-between px-3 py-2.5 text-sm text-white/90 hover:bg-[#3E3E3E] rounded-sm">
                        <span>Log out</span>
                     </button>
                  </div>

                  {/* "Your Updates" Placeholder Section */}
                  <div className="h-[1px] bg-white/10 my-1 mx-2" />
                  <div className="px-4 py-2">
                     <h3 className="text-xs font-bold text-white mb-2">Your Updates</h3>
                     <div className="space-y-3">
                        <div className="flex gap-3 items-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                           <div className="w-10 h-10 bg-blue-500 rounded-md shrink-0" />
                           <div className="text-xs space-y-0.5">
                              <p className="text-white leading-tight">Just days away: Danny Brown</p>
                              <p className="text-[#B3B3B3]">New York • Sun, Dec 14</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </motion.div>
            )}
          </AnimatePresence>
       </div>
    </header>
  );
}
