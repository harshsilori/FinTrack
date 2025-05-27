
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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"> {/* Removed relative class as overlay is gone */}
          {isMounted ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname} // Keyed by pathname for page transitions
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          ) : (
            // Render children directly on server and initial client render to prevent hydration mismatch
            <>{children}</> 
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
