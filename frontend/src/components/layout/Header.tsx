/**
 * Module: src/components/layout/Header.tsx
 *
 * Purpose:
 * Top navigation header with page title, theme toggle, and system status.
 *
 * Layer: LAYOUT
 *
 * Consumed by: AppShell.tsx
 */

'use client';

import { Sun, Moon, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { MOCK_MODE } from '@/src/utils/config';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 border-b"
      style={{
        background: 'var(--header-bg)',
        borderColor: 'var(--header-border)',
      }}
    >
      <div>
        {title && (
          <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Connection Status */}
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
          style={{ background: 'var(--surface-elevated)', color: 'var(--muted-fg)' }}
        >
          {MOCK_MODE ? (
            <>
              <WifiOff size={12} />
              <span>Demo Mode</span>
            </>
          ) : (
            <>
              <Wifi size={12} className="text-emerald-500" />
              <span>Connected</span>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--muted-fg)' }}
          aria-label="Toggle theme"
          id="theme-toggle"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
