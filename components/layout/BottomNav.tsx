"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, LibraryBig, Trophy } from "lucide-react";
import clsx from "clsx";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Search", href: "/", icon: Search },
    { name: "Library", href: "/library", icon: LibraryBig },
    { name: "Rankings", href: "/rankings", icon: Trophy },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-md border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-[60px] px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full space-y-[4px] group active:scale-95 transition-transform"
            >
              <Icon
                size={24}
                className={clsx(
                  "transition-colors duration-200",
                  isActive ? "text-white" : "text-muted group-hover:text-white"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={clsx(
                  "text-[10px] font-medium tracking-wide transition-colors duration-200",
                  isActive ? "text-white" : "text-muted group-hover:text-white"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
