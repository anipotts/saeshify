"use client";

import { Layout, Check, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { getUserPreferences, updateUserPreferences } from "@/lib/actions/preferences";
import NotificationToggle from "@/components/settings/NotificationToggle";

export default function PreferencesPage() {
  // Local Prefs
  const [defaultOpen, setDefaultOpen] = useState(false);
  
  // Remote Prefs
  const [explicitContent, setExplicitContent] = useState(true);

  useEffect(() => {
     if (typeof window !== "undefined") {
       setDefaultOpen(localStorage.getItem("saeshify_pref_details_open") === 'true');
     }
     
     getUserPreferences().then(p => {
         if (p) setExplicitContent(p.explicit_content);
     });
  }, []);
  
  const toggleDefaultOpen = () => {
    const newVal = !defaultOpen;
    setDefaultOpen(newVal);
    localStorage.setItem("saeshify_pref_details_open", String(newVal));
  };

  const toggleExplicit = async () => {
      const newVal = !explicitContent;
      setExplicitContent(newVal);
      await updateUserPreferences({ explicit_content: newVal });
  };

  return (
    <div className="space-y-4">
       <NotificationToggle />

       {/* Local Prefs */}
       <div className="bg-zinc-900 rounded-lg overflow-hidden border border-white/5">
          <div className="p-4 border-b border-white/5 bg-white/5">
             <h3 className="font-bold text-white">App Preferences</h3>
          </div>
          
          <div 
            onClick={toggleDefaultOpen}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
          >
             <div className="flex items-center gap-3">
                <Layout size={20} className="text-muted-foreground" />
                <div>
                  <p className="font-medium text-white">Default Details Panel</p>
                  <p className="text-xs text-muted-foreground">Keep the details panel open by default on desktop</p>
                </div>
             </div>
             <div className={clsx("w-12 h-6 rounded-full relative transition-colors", defaultOpen ? "bg-accent" : "bg-zinc-700")}>
                <div className={clsx("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform", defaultOpen ? "left-7" : "left-1")} />
             </div>
          </div>
       </div>

       {/* Remote Prefs (Supabase) */}
       <div className="bg-zinc-900 rounded-lg overflow-hidden border border-white/5">
          <div className="p-4 border-b border-white/5 bg-white/5">
             <h3 className="font-bold text-white">Content Preferences</h3>
          </div>

          <div 
            onClick={toggleExplicit}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
          >
             <div className="flex items-center gap-3">
                <Shield size={20} className="text-muted-foreground" />
                <div>
                  <p className="font-medium text-white">Allow Explicit Content</p>
                  <p className="text-xs text-muted-foreground">Stream explicit content (Rated E)</p>
                </div>
             </div>
             <div className={clsx("w-12 h-6 rounded-full relative transition-colors", explicitContent ? "bg-accent" : "bg-zinc-700")}>
                <div className={clsx("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform", explicitContent ? "left-7" : "left-1")} />
             </div>
          </div>
       </div>

    </div>
  );
}
