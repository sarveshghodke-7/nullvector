/**
 * Module: src/components/layout/AppShell.tsx
 *
 * Purpose:
 * Application shell that composes the Sidebar, Header, and main content area.
 * All pages are rendered inside this shell.
 *
 * Layer: LAYOUT
 *
 * Consumed by: app/layout.tsx
 */

'use client';

import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { ThemeProvider } from './ThemeProvider';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-60 flex flex-col">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto" style={{ background: 'var(--background)' }}>
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
