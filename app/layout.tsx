import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import Sidebar from "@/components/Sidebar";

// Figtree is now loaded via globals.css import as requested

export const viewport: Viewport = {
  themeColor: "#121212", // Matched to new background
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, 
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Saeshify",
  description: "Spotify for Saesha",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Saeshify",
  },
};

import { FocusProvider } from "@/lib/context/FocusContext";
import BottomSheetDetails from "@/components/details/BottomSheetDetails";
import RightDetailsPanel from "@/components/details/RightDetailsPanel";

// ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground selection:bg-accent selection:text-black overflow-x-hidden pb-safe">
        <FocusProvider>
          {/* Subtle top wash */}
          <div className="fixed inset-0 z-0 bg-gradient-to-b from-accent/5 via-background to-background pointer-events-none" />
          
          <Sidebar />

          {/* Centered container wrapper with max-width constraint for desktop */}
          <main className="relative z-10 
            pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-8 
            md:ml-[280px] 
            mx-auto w-full 
            px-4 sm:px-6 
            md:max-w-[1200px] md:px-8">
            {children}
          </main>
          
          {/* Details Surfaces */}
          <BottomSheetDetails />
          <RightDetailsPanel />
          
          {/* Bottom Nav (fixed) - Hide on desktop */}
          <PwaInstallBanner />
          <div className="md:hidden">
            <BottomNav />
          </div>
        </FocusProvider>
      </body>
    </html>
  );
}
