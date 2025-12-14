"use client";

import Image from "next/image";

// Mock Data
const MOCK_BANK = Array.from({ length: 12 }).map((_, i) => ({
  id: `b-${i}`,
  name: `Favorite Song ${i + 1}`,
  artist: `Artist ${i + 1}`,
  image: `https://i.scdn.co/image/ab67616d0000b273e8b066f70c206551210d902b`,
}));

export default function BankPage() {
  return (
    <div className="py-6 sm:py-8 space-y-4 sm:space-y-6">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">My Bank</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {MOCK_BANK.map((item) => (
          <div key={item.id} className="bg-[#121212] p-3 rounded-md active:scale-95 transition-transform">
             <div className="relative aspect-square w-full mb-3 shadow-md">
                <Image src={item.image} alt={item.name} fill className="object-cover rounded-md" />
             </div>
             <p className="font-bold text-sm truncate text-white">{item.name}</p>
             <p className="text-xs text-[#B3B3B3] truncate">{item.artist}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
