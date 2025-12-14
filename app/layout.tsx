import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google"; // Point 7: Use Inter
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import PwaInstallBanner from "@/components/PwaInstallBanner";

// Point 7: Inter font stack
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: "#0a0a0a", // neutral-950
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, 
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Saeshify",
  description: "Your Music Bank & Rankings",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Saeshify",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Point 6: bg-neutral-950 */}
      {/* Point 7: font-sans */}
      <body className={`${inter.variable} font-sans antialiased bg-neutral-950 text-white selection:bg-[#1DB954] selection:text-black`}>
        {/* Point 6: Top wash overlay */}
        <div className="fixed inset-0 z-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Point 1: Centered container wrapper */}
        <main className="relative z-10 pb-[calc(env(safe-area-inset-bottom)+80px)] mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        
        {/* Point 8: Bottom Nav (fixed) */}
        <PwaInstallBanner />
        <BottomNav />
      </body>
    </html>
  );
}
