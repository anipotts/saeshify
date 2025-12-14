"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Library, Trophy } from "lucide-react";
import clsx from "clsx";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Search", href: "/", icon: Search },
    { name: "My Bank", href: "/bank", icon: Library },
    { name: "Rankings", href: "/rankings", icon: Trophy },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur border-t border-white/10 pb-[env(safe-area-inset-bottom)] pt-2 sm:pt-4">
      <div className="flex justify-around items-center px-6 h-14 sm:h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full space-y-1 group"
            >
              <Icon
                size={24}
                className={clsx(
                  "transition-colors duration-200",
                  isActive ? "text-white" : "text-[#B3B3B3] group-hover:text-white"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={clsx(
                  "text-[10px] font-medium tracking-wide transition-colors duration-200",
                  isActive ? "text-white" : "text-[#B3B3B3] group-hover:text-white"
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
