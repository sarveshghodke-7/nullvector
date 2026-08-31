/**
 * Module: app/layout.tsx
 *
 * Purpose:
 * Root layout for the AI Defense Lab application.
 * Sets up fonts (Inter + JetBrains Mono), metadata, and wraps
 * all pages in the AppShell (sidebar + header + content area).
 *
 * Layer: APP / LAYOUT
 */

import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import AppShell from '@/src/components/layout/AppShell';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mastercard AI Defense Lab — Payment Security | GFF 2026',
  description:
    'Mastercard Cyber & Intelligence AI Defense Lab — End-to-end Red Team adversarial simulation and Blue Team defense for modern payment security. Mastercard Innovation Challenge @ GFF 2026.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
