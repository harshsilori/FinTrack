import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ArrowLeftRight, Wallet, BarChart3, Lightbulb, Settings } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
}

export const NAV_LINKS: NavLink[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    match: (pathname) => pathname === '/',
  },
  {
    href: '/transactions',
    label: 'Transactions',
    icon: ArrowLeftRight,
  },
  {
    href: '/assets',
    label: 'Assets',
    icon: Wallet,
  },
  {
    href: '/insights',
    label: 'AI Insights',
    icon: Lightbulb,
  },
];

export const BOTTOM_NAV_LINKS: NavLink[] = [
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];
