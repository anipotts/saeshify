"use client";

import Image from "next/image";

export default function AccessDenied() {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-500 max-w-md">
        <div className="w-16 h-16 relative opacity-50 grayscale">
             <Image src="/favicon.ico" alt="Saeshify" fill className="object-contain" />
        </div>
        
        <h1 className="text-xl font-medium tracking-tight text-white/60">
            Access Restricted
        </h1>
        
        <p className="text-sm text-neutral-500 leading-relaxed">
            This workspace is private. <br />
            Only authorized accounts may access this application.
        </p>
      </div>
    </div>
  );
}
