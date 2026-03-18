"use client";

import Image from "next/image";

export default function AccessDenied() {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center">
      <header className="absolute top-10 left-0 right-0 text-center z-10">
        <a
          href="https://instagram.com/anipottsbuilds"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#1DB954]/50 hover:text-[#1DB954] transition-colors duration-150"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ani potts
        </a>
      </header>
      <div className="flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-500 max-w-md">
        <div className="w-16 h-16 relative opacity-50 grayscale">
             <Image src="/icon-192x192.png" alt="Saeshify" fill className="object-contain" />
        </div>
        
        <h1 className="text-xl font-medium tracking-tight text-white/60">
            Access Blocked
        </h1>
        
        <p className="text-sm text-neutral-500 leading-relaxed">
            You are not valid.
        </p>
      </div>
    </div>
  );
}
