"use client";

import { AlertTriangle, Check, X, Shield, Database } from "lucide-react";

interface DebugVaultRowProps {
  trackId: string;
  isAdded: boolean;
  lastError?: string;
}

export default function DebugVaultRow({ trackId, isAdded, lastError }: DebugVaultRowProps) {
  // Only show in dev. In prod we return null.
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="text-[10px] flex items-center gap-2 mt-1 px-2 py-1 bg-black/40 rounded border border-white/5 font-mono text-muted-foreground w-fit">
      
      <span className="flex items-center gap-1" title="Auth Status">
        <Shield size={10} className="text-green-500" />
        <span className="text-green-500">AUTH OK</span>
      </span>

      <span className="w-px h-3 bg-white/10" />

      <span className="flex items-center gap-1" title="Vault Status">
         <Database size={10} className={isAdded ? "text-blue-400" : "text-neutral-500"} />
         {isAdded ? <span className="text-blue-400">IN VAULT</span> : <span>NOT SAVED</span>}
      </span>

      {lastError && (
        <>
            <span className="w-px h-3 bg-white/10" />
            <span className="flex items-center gap-1 text-red-400 font-bold">
                <AlertTriangle size={10} />
                ERROR: {lastError}
            </span>
        </>
      )}
    </div>
  );
}
