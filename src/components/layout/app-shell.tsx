
'use client';

import type { ReactNode } from 'react';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { MainNav } from '@/components/layout/main-nav';
import { NAV_LINKS, BOTTOM_NAV_LINKS } from '@/constants/nav-links';
import Link from 'next/link';
import { OnboardingModal } from '@/components/onboarding/onboarding-modal';

const ONBOARDING_COMPLETED_KEY = 'hasCompletedFinTrackOnboarding';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    let shouldShow = true; // Default to show if localStorage fails or key not 'true'
    try {
      const hasCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
      if (hasCompleted === 'true') {
        shouldShow = false;
      }
    } catch (error) {
      console.warn('localStorage not available for onboarding check. Assuming onboarding is needed.');
      // shouldShow remains true, so onboarding will be shown
    }
    
    if (shouldShow) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    try {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } catch (error) {
       console.warn('localStorage not available for setting onboarding flag.');
    }
    setShowOnboarding(false);
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="border-r" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2 text-sidebar-foreground">
             <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-sidebar-primary"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-lg font-semibold">FinTrack</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex-grow p-2">
          <MainNav links={NAV_LINKS} />
        </SidebarContent>
        <SidebarFooter className="p-2">
          <MainNav links={BOTTOM_NAV_LINKS} />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <SiteHeader />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {isMounted ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }} 
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          ) : (
             <>{children}</> // Render children directly on server and initial client render
          )}
        </main>
        {isMounted && <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />}
      </SidebarInset>
    </SidebarProvider>
  );
}
