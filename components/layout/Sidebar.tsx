"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, LibraryBig, Trophy, Clock, Disc, Mic, Music, Library } from "lucide-react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useUIStore } from "@/lib/store";

interface RecentItem {
  id: string;
  type: 'track' | 'album' | 'artist';
  title: string;
  subtitle: string;
  image?: string;
  data: any;
}

import { getRecentSearches } from "@/lib/actions/recents";

// ... existing imports

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { openDetails } = useUIStore();
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const loadRecents = async () => {
        // 1. Local
        let local: RecentItem[] = [];
        const stored = localStorage.getItem("saeshify_recent_searches");
        if (stored) {
           try { local = JSON.parse(stored); } catch(e) {}
        }
        setRecents(local); // Show immediate

        // 2. Server (Merge)
        try {
            const serverRecents = await getRecentSearches();
            if (serverRecents && serverRecents.length > 0) {
               // Merge: Server items first, then local items that aren't in server
               // Dedupe by id or title (using Set for O(1) ideally, or simple filter)
               // serverRecents are RecentItem[] already transformed
               const seen = new Set(serverRecents.map((x: any) => x.id || x.title));
               const merged = [
                   ...serverRecents,
                   ...local.filter(l => !seen.has(l.id || l.title))
               ];
               setRecents(merged.slice(0, 50)); // Limit
               
               // Optional: Update local to match strict sync?
               localStorage.setItem("saeshify_recent_searches", JSON.stringify(merged.slice(0, 50)));
            }
        } catch (err) {
            console.error("Recents fetch failed", err);
        }
    };
    loadRecents();
    
    // Listen for local storage updates (from other tabs or search page)
    window.addEventListener('storage', loadRecents);
    return () => window.removeEventListener('storage', loadRecents);
  }, []);

  const handleItemClick = (item: RecentItem) => {
      if (item.data && item.type === 'track') {
          openDetails({ kind: 'track', id: item.id, payload: item.data });
      } else if (item.data && item.type === 'album') {
          // If we have album details, open or navigate
           router.push(`/?q=${encodeURIComponent(item.title)}`);
      } else {
          router.push(`/?q=${encodeURIComponent(item.title)}`);
      }
  };

  const navItems = [
    { name: "Search", href: "/", icon: Search },
    { name: "Library", href: "/library", icon: LibraryBig },
    { name: "Rankings", href: "/rankings", icon: Trophy },
  ];

  return (
    <aside className="hidden md:flex flex-col w-full h-full bg-black gap-2">
      {/* Top Section: Navigation */}
      <div className="bg-[#121212] rounded-lg p-4 flex flex-col gap-4">
        <Link href="/" className="flex items-center gap-2 px-2 py-1">
           <span className="text-white font-bold text-xl tracking-tight">Saeshify</span>
        </Link>
        
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center gap-4 px-2 py-2 group row-micro rounded-md",
                  isActive ? "text-white" : "text-[#B3B3B3] hover:text-white"
                )}
              >
                <Icon size={24} className={clsx("shrink-0", isActive && "text-white")} />
                <span className={clsx("font-bold text-[16px]", isActive ? "text-white" : "text-[#B3B3B3] group-hover:text-white")}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Middle Section: Recents */}
      <div className="bg-[#121212] rounded-lg flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 shadow-sm z-10 sticky top-0 bg-[#121212]">
           <button className="flex items-center gap-2 text-[#B3B3B3] hover:text-white transition-colors group w-full">
             <Library size={24} className="shrink-0 group-hover:text-white" />
             <span className="font-bold text-[16px]">Recents</span>
           </button>
        </div>
        
        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800 hover:scrollbar-thumb-zinc-700">
           {mounted && recents.length === 0 ? (
               <div className="bg-[#242424] rounded-lg p-6 m-2 flex flex-col gap-4 items-start mt-4">
                  <div className="space-y-1">
                     <h3 className="text-white font-bold text-[16px]">Play what you love</h3>
                     <p className="text-sm text-white font-medium">Go search up recent songs</p>
                  </div>
                  <Link href="/" className="bg-white text-black font-bold text-sm px-4 py-1.5 rounded-full hover:scale-105 transition-transform">
                     Search
                  </Link>
               </div>
           ) : (
             recents.map((item, i) => (
                <div 
                   key={item.id + i} // handle duplicates
                   onClick={() => handleItemClick(item)}
                   className="group flex items-center gap-3 p-2 rounded-md cursor-pointer row-micro text-left"
                >
                   {/* Image */}
                   <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-[#282828]">
                      {item.image ? (
                        <Image src={item.image} alt={item.title} fill className={clsx("object-cover", item.type === 'artist' ? "rounded-full" : "rounded-md")} />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-zinc-500">
                           {item.type === 'track' ? <Music size={20} /> : item.type === 'album' ? <Disc size={20} /> : <Mic size={20} />}
                        </div>
                      )}
                   </div>
                   
                   {/* Text */}
                   <div className="flex-1 min-w-0">
                      <h4 className={clsx(
                        "text-[16px] font-medium truncate",
                        item.type === 'track' && pathname === '/' ? "text-accent" : "text-white"
                      )}>
                        {item.title}
                      </h4>
                      <p className="text-sm text-[#B3B3B3] truncate flex items-center gap-1">
                         <span className="capitalize text-xs">{item.type}</span> • <span>{item.subtitle}</span>
                      </p>
                   </div>
                </div>
             ))
           )}
        </div>
      </div>
    </aside>
  );
}
