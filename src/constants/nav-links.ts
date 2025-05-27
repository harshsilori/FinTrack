
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ArrowLeftRight, Wallet, Lightbulb, Settings, PiggyBank, Target, AreaChart, CreditCard } from 'lucide-react'; // Added CreditCard for Debts

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
    href: '/debts', // New Debts link
    label: 'Debts',
    icon: CreditCard,
  },
  {
    href: '/reports',
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
