
'use client';

import type { ReactNode } from 'react';
import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
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
import { Loader2 } from 'lucide-react';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    // Only show loader if the pathname has actually changed from the last one we processed
    if (previousPathnameRef.current !== pathname) {
      setIsLoading(true);

      // Set a timer to hide the loader after a short period.
      // This gives a visual cue during client-side navigation.
      const timer = setTimeout(() => {
        setIsLoading(false);
        previousPathnameRef.current = pathname; // Update the ref to the new pathname after "loading"
      }, 300); // Adjust duration as needed (e.g., 300-500ms)

      return () => clearTimeout(timer);
    } else {
      // If the pathname hasn't changed (e.g. on initial load or a non-route query param change),
      // ensure loading is false.
      setIsLoading(false);
    }
  }, [pathname]);

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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative"> {/* Added position:relative for overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/75 backdrop-blur-sm">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
