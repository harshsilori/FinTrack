
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from "@/components/ui/toaster";
import { AssetProvider } from '@/contexts/AssetContext';
import { GoalProvider } from '@/contexts/GoalContext';
import { TransactionProvider } from '@/contexts/TransactionContext';
import { DebtProvider } from '@/contexts/DebtContext'; // Import DebtProvider
import Script from 'next/script';


const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'FinTrack Mobile',
  description: 'Track your finances with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      <Script id="theme-loader" strategy="beforeInteractive">
          {`
            try {
              const darkMode = localStorage.getItem('darkMode');
              const accentTheme = localStorage.getItem('accentTheme');
              if (darkMode === 'true') {
                document.documentElement.classList.add('dark');
              }
              if (accentTheme && accentTheme !== 'theme-default') {
                document.documentElement.classList.add(accentTheme);
              } else if (!accentTheme) {
                 document.documentElement.classList.add('theme-default');
              }
            } catch (e) {}
          `}
        </Script>
      </head>
      <body className={`${roboto.variable} font-sans antialiased`}>
        <AssetProvider>
          <GoalProvider>
            <TransactionProvider>
              <DebtProvider> {/* Wrap with DebtProvider */}
                <AppShell>
                  {children}
                </AppShell>
              </DebtProvider>
            </TransactionProvider>
          </GoalProvider>
        </AssetProvider>
        <Toaster />
      </body>
    </html>
  );
}
