
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from "@/components/ui/toaster";
import { AssetProvider } from '@/contexts/AssetContext'; // Import AssetProvider

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
      <body className={`${roboto.variable} font-sans antialiased`}>
        <AssetProvider> {/* Wrap AppShell and children with AssetProvider */}
          <AppShell>
            {children}
          </AppShell>
        </AssetProvider>
        <Toaster />
      </body>
    </html>
  );
}
