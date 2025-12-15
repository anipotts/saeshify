"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Library, ListOrdered, Home } from "lucide-react";
import clsx from "clsx";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Search", href: "/", icon: Search },
    { name: "Vault", href: "/vault", icon: Library },
    { name: "Rankings", href: "/rankings", icon: ListOrdered },
  ];
  return (
    <aside className="hidden md:flex flex-col w-[280px] h-screen fixed left-0 top-0 bg-black p-4 gap-4 z-50">
      {/* Top Section: Navigation */}
      <div className="bg-[#121212] rounded-lg p-4 flex flex-col gap-5">
        <Link href="/" className="flex items-center gap-2 px-2">
           {/* Simple text logo matching specific request */}
           <span className="text-white font-bold text-xl tracking-tight">Saeshify</span>
        </Link>
        
        <nav className="flex flex-col gap-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center gap-4 px-2 transition-colors duration-200 group",
                  isActive ? "text-white" : "text-[#B3B3B3] hover:text-white"
                )}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                <span className={clsx("font-bold text-[16px]", isActive ? "text-white" : "text-[#B3B3B3] group-hover:text-white")}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Middle Section: Library-like placeholder (My Bank context) */}
      <div className="bg-[#121212] rounded-lg flex-1 p-4 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between px-2 text-[#B3B3B3] hover:text-white transition-colors cursor-pointer group">
          <div className="flex items-center gap-2">
            <Library size={24} strokeWidth={2} className="group-hover:text-white transition-colors"/>
            <span className="font-bold text-[16px]">Your Library</span>
          </div>
          {/* Plus icon placeholder for 'Create' interaction - non-functional but aesthetic */}
          <div className="hover:bg-[#1f1f1f] p-1 rounded-full text-[#B3B3B3] hover:text-white transition-colors">
            <svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M15.25 8a.75.75 0 0 1-.75.75H8.75v5.75a.75.75 0 0 1-1.5 0V8.75H1.5a.75.75 0 0 1 0-1.5h5.75V1.5a.75.75 0 0 1 1.5 0v5.75h5.75a.75.75 0 0 1 .75.75z"></path></svg>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mask-gradient">
           <button className="bg-[#232323] hover:bg-[#2a2a2a] text-white text-sm font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">Playlists</button>
           <button className="bg-[#232323] hover:bg-[#2a2a2a] text-white text-sm font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">Artists</button>
           <button className="bg-[#232323] hover:bg-[#2a2a2a] text-white text-sm font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">Albums</button>
        </div>
        
        {/* Scrollable List Placeholder */}
        {/* Scrollable List Placeholder */}
        <div className="flex-1 overflow-y-auto mt-2 space-y-2">
           {/* Library Items will go here */}
        </div>
      </div>
    </aside>
  );
}
