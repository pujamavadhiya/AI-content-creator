import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.scss';
import { AppProvider } from '@/context/AppContext';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Sevencore AI - Content Intelligence & Generation Platform',
  description: 'Enterprise reference-driven content intelligence, planning, generation, and multi-factor quality evaluation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
