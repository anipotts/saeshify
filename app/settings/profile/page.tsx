"use client";

import { useAuthUser } from "@/lib/hooks/useData";
import { getUserPreferences, updateUserPreferences } from "@/lib/actions/preferences"; // Assuming these exist from earlier step
import { useEffect, useState } from "react";
import { User } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuthUser();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load prefs
    getUserPreferences().then(prefs => {
        if (prefs?.display_name) setDisplayName(prefs.display_name);
        else if (user?.user_metadata?.full_name) setDisplayName(user.user_metadata.full_name);
    });
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
        await updateUserPreferences({ display_name: displayName });
        // toast success
    } catch(e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="bg-zinc-900 rounded-lg p-6 border border-white/5 space-y-4">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          
          <div className="space-y-2">
             <label className="text-sm font-medium text-muted-foreground">Display Name</label>
             <input 
               type="text" 
               value={displayName} 
               onChange={(e) => setDisplayName(e.target.value)}
               className="w-full bg-zinc-800 border border-white/10 rounded-md p-3 text-white focus:border-accent outline-none"
             />
          </div>

          <div className="pt-2">
             <button 
               onClick={handleSave}
               disabled={loading}
               className="bg-white text-black font-bold py-2.5 px-6 rounded-full hover:scale-105 transition-transform disabled:opacity-50"
             >
                {loading ? "Saving..." : "Save Profile"}
             </button>
          </div>
       </div>
    </div>
  );
}
