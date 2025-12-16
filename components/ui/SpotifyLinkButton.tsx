"use client";

import Image from "next/image";
import clsx from "clsx";

interface SpotifyLinkButtonProps {
  type: 'track' | 'album' | 'artist';
  id: string;
  className?: string;
  variant?: 'primary' | 'outline' | 'minimal';
}

export default function SpotifyLinkButton({ type, id, className, variant = 'outline' }: SpotifyLinkButtonProps) {
  
  const handleNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const appUrl = `spotify:${type}:${id}`;
    const webUrl = `https://open.spotify.com/${type}/${id}`;

    // 1. Try App deep link
    window.location.href = appUrl;

    // 2. Fallback to Web (setTimeout to allow App to open first)
    // Note: On Mobile Safari, this timeout logic is flaky but standard for simple deep linking.
    // If App opens, the page freezes and timeout effectively pauses.
    // If App fails (invalid scheme), it might error.
    setTimeout(() => {
        window.open(webUrl, '_blank');
    }, 1000);
  };

  if (variant === 'minimal') {
      return (
        <button 
          onClick={handleNavigation}
          className={clsx("flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-xs font-medium uppercase tracking-wider", className)}
        >
          <Image src="/spotify-icon-black.png" alt="Spotify" width={16} height={16} className="invert opacity-60" />
          View on Spotify
        </button>
      )
  }

  return (
    <button 
      onClick={handleNavigation}
      className={clsx(
        "flex items-center justify-center gap-2 w-full h-12 rounded-full font-bold text-sm btn-micro",
        variant === 'primary' && "bg-[#1DB954] text-black",
        variant === 'outline' && "border border-[#727272] text-white hover:border-white",
        className
      )}
    >
       {/* Use white logo for outline, black for primary? 
           Our icon is black. For outline (dark bg), we need invert. 
           For primary (green bg, black text), we usually keep black or use white. 
           Spotify logo on Green is usually Black or White. Let's use Black to match text.
       */}
       <div className={clsx("relative w-5 h-5", variant === 'outline' && "invert")}>
          <Image src="/spotify-icon-black.png" alt="Spotify" fill className="object-contain" />
       </div>
       <span>View in Spotify</span>
    </button>
  );
}
