"use client";

import React from 'react';
import { useUIStore } from "@/lib/store";
import Sidebar from "./Sidebar";
import RightDetailsPanel from "../details/RightDetailsPanel";
import BottomSheetDetails from "../details/BottomSheetDetails";
import BottomNav from "./BottomNav"; 
import PwaInstallBanner from "./PwaInstallBanner";
import clsx from "clsx";
import Image from "next/image";
import TopBarDesktop from "./TopBarDesktop";
import MobileSettingsDrawer from "./MobileSettingsDrawer";

import { useAuthUser } from "@/lib/hooks/useData";
import FullScreenLogin from "@/components/auth/FullScreenLogin";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { hasOnboarded } from "@/lib/utils/pwa";
import { getUserPreferences, updateUserPreferences } from "@/lib/actions/preferences";
import AccessDenied from "@/components/auth/AccessDenied";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";

import { MotionConfig, AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

const ALLOWED_EMAILS = ['anirudhpottammal@gmail.com', 'saesharajput@gmail.com'];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isDetailsOpen, detailsWidth, isMobileSettingsOpen, setMobileSettingsOpen } = useUIStore();
  const { user, loading } = useAuthUser();
  const [isOnboardingComplete, setIsOnboardingComplete] = React.useState(false);
  const [prefsLoaded, setPrefsLoaded] = React.useState(false);
  const isOnline = useOnlineStatus();

  // Check onboarding & Load Prefs on mount
  React.useEffect(() => {
      // 1. Onboarding Check
      setIsOnboardingComplete(hasOnboarded());

      // 2. Load Preferences
      const load = async () => {
          try {
              const prefs = await getUserPreferences();
              if (prefs) {
                  if (typeof prefs.details_panel_open === 'boolean') {
                      useUIStore.setState({ isDetailsOpen: prefs.details_panel_open });
                  }
                  // if (prefs.details_width) useUIStore.setState({ detailsWidth: prefs.details_width });
              }
          } catch (e) {
              console.error("Failed to load prefs", e);
          } finally {
              setPrefsLoaded(true);
          }
      };
      load();
  }, []);

  // Sync Panel State to DB
  React.useEffect(() => {
      if (prefsLoaded && user) {
          updateUserPreferences({ details_panel_open: isDetailsOpen }).catch(err => console.error(err));
      }
  }, [isDetailsOpen, prefsLoaded, user]);

  // 1. Loading State
  if (loading) return <div className="h-screen bg-black" />;

  // 2. Not Logged In -> Full Screen Login
  if (!user) {
      return <FullScreenLogin />;
  }

  // 3. Security Check: Email Allowlist
  if (user.email && !ALLOWED_EMAILS.includes(user.email)) {
      return <AccessDenied />;
  }

  // 4. Logged In & Allowed BUT Onboarding Not Complete -> Show Onboarding Flow ONLY
  if (!isOnboardingComplete) {
      return (
        <div className="h-screen bg-black text-white">
            <OnboardingFlow onComplete={() => setIsOnboardingComplete(true)} />
        </div>
      );
  }

  // 5. Logged In, Allowed & Onboarded -> Main App
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}>
      <div className="h-full bg-black text-white flex flex-col md:h-screen md:overflow-hidden relative">
         {!isOnline && (
            <div className="bg-[#E91429] text-white text-[11px] font-bold text-center py-1 absolute top-0 left-0 right-0 z-[100] tracking-wider uppercase">
               No Internet Connection
            </div>
         )}
          
         {/* 1. Desktop Top Bar */}
         <React.Suspense fallback={<div className="h-[64px] hidden md:block bg-black mb-2" />}>
           <TopBarDesktop />
         </React.Suspense>
  
         {/* 2. Main Content Layout (Sidebar | Main | Details) */}
         {/* Desktop: Grid with gutters. Mobile: Flow. */}
         <div 
           className={clsx(
             "flex-1 relative",
             "md:grid md:gap-2 md:px-2 md:pb-2" // Gutters for Spotify Desktop Look
           )}
           style={{
              // On desktop, we use grid. On mobile, this style is ignored/overridden by class or just doesn't matter if not display:grid
              // We need to conditionally apply grid template style ONLY if md match, but since we can't do media query in inline style easily,
              // we rely on the fact that on mobile it's 'block'.
              // However, React inline styles apply always.
              // Better: use a CSS variable or a class that sets variables.
              // For simplicity: We keep the grid styles but ensure it's `display: block` on mobile (md:grid handles display).
              gridTemplateColumns: `280px 1fr ${isDetailsOpen ? detailsWidth : 0}px`,
              transition: 'grid-template-columns 300ms cubic-bezier(0.2, 0, 0, 1)'
           }}
         >
            {/* Sidebar Area */}
            <div className="hidden md:block h-full bg-[#121212] rounded-lg overflow-hidden border border-[#2A2A2A] z-20">
               <Sidebar />
            </div>
  
            {/* Main Content Area */}
            <main className={clsx(
                "relative w-full h-full bg-background md:bg-[#121212] md:rounded-lg md:border md:border-[#2A2A2A]",
                "md:overflow-y-auto md:overflow-x-hidden",
                "flex flex-col"
            )}>
                 {/* Mobile Header Elements (Avatar + Settings Trigger) */}
                 {/* Search bar for mobile is inside page content, but Avatar is global topmost */}
                 {/* Mobile Header Elements (Avatar + Settings Trigger) - Moved to PageHeader */}
                 {/* <div className="md:hidden fixed top-4 left-4 z-50">...</div> */}
  
                 {/* Background Gradient (Mobile Only mostly, or inside rounded container) */}
                 <div className="absolute inset-0 z-0 bg-gradient-to-b from-accent/5 via-background to-background pointer-events-none rounded-lg" />
                 
                 <div className={clsx(
                     "relative z-10 mx-auto w-full min-h-full",
                     // Removed mx-4 horizontally as requested.
                     "pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-8"
                 )}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                     {children}
                  </motion.div>
                </AnimatePresence>
                 </div>
            </main>
  
             {/* Right Details Panel - Desktop */}
             <div className={clsx(
               "hidden md:block h-full bg-[#121212] rounded-lg overflow-hidden border border-[#2A2A2A] z-20",
               !isDetailsOpen && "border-none bg-transparent" // Hide border/bg when closed to avoid thin line?
             )}>
                 <RightDetailsPanel />
             </div>
  
         </div>
  
         {/* Mobile Overlays */}
         <BottomSheetDetails />
         <MobileSettingsDrawer isOpen={isMobileSettingsOpen} onClose={() => setMobileSettingsOpen(false)} />
         
         <div className="md:hidden">
            <PwaInstallBanner />
            <BottomNav />
         </div>
      </div>
    </MotionConfig>
  );
}
