
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ArrowLeftRight, Wallet, Lightbulb, Settings, PiggyBank, Target, AreaChart } from 'lucide-react'; // Added AreaChart

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
    href: '/budgets',
    label: 'Budgets',
    icon: PiggyBank,
  },
  {
    href: '/goals',
    label: 'Goals',
    icon: Target,
  },
  {
    href: '/reports', // New Reports link
    label: 'Reports',
    icon: AreaChart,
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
