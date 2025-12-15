"use client";

import PageHeader from "@/components/PageHeader";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { User, Trash2, Settings, UserCircle } from "lucide-react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/settings/account", label: "Account", icon: User },
    // Profile matches account often, but let's separate if requested or just alias. 
    // User requested /settings/profile. Let's make a Profile tab?
    { href: "/settings/profile", label: "Profile", icon: UserCircle },
    { href: "/settings/preferences", label: "Preferences", icon: Settings },
    { href: "/settings/data", label: "Data", icon: Trash2 },
  ];

  return (
    <div className="min-h-full pb-safe">
      <PageHeader title="Settings">
         <div className="flex gap-6 overflow-x-auto no-scrollbar h-full items-center">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={clsx(
                    "flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap h-full border-b-2 hover:text-white px-2",
                    isActive 
                      ? "border-accent text-accent" 
                      : "border-transparent text-muted-foreground"
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </Link>
              );
            })}
         </div>
      </PageHeader>
      
      <div className="p-4 max-w-2xl mx-auto">
        {children}
      </div>
    </div>
  );
}
