'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavLink } from '@/constants/nav-links';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

interface MainNavProps {
  links: NavLink[];
  className?: string;
}

export function MainNav({ links, className }: MainNavProps) {
  const pathname = usePathname();

  if (!links?.length) {
    return null;
  }

  return (
    <nav className={cn('flex flex-col', className)}>
      <SidebarMenu>
        {links.map((link, index) => {
          const isActive = link.match
            ? link.match(pathname)
            : pathname.startsWith(link.href);
          return (
            <SidebarMenuItem key={index}>
              <Link href={link.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  variant="default"
                  size="default"
                  isActive={isActive}
                  tooltip={link.label}
                >
                  <a>
                    <link.icon aria-hidden="true" />
                    <span>{link.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}
