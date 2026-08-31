/**
 * Module: src/components/layout/Header.tsx
 *
 * Purpose:
 * Top navigation header with page title, Mastercard branding pill,
 * live system status, and theme toggle.
 *
 * Layer: LAYOUT
 *
 * Consumed by: AppShell.tsx
 */

'use client';

import { Sun, Moon, Wifi, WifiOff, ShieldCheck } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { MOCK_MODE } from '@/src/utils/config';
import MastercardLogo from './MastercardLogo';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 border-b backdrop-blur-md transition-colors"
      style={{
        background: 'var(--header-bg)',
        borderColor: 'var(--header-border)',
      }}
    >
      <div className="flex items-center gap-3">
        {title ? (
          <div>
            <h2 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-[0.68rem]" style={{ color: 'var(--muted-fg)' }}>
                {subtitle}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
              AI Defense Lab
            </span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>•</span>
            <span className="text-xs font-medium text-amber-500">
              Payment Security
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Mastercard Hackathon Badge */}
        <div
          className="hidden md:inline-flex items-center gap-2 text-[0.72rem] px-3 py-1 rounded-full border shadow-xs"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border-color)',
            color: 'var(--foreground)',
          }}
        >
          <MastercardLogo size={14} />
          <span className="font-medium text-xs">Mastercard @ GFF 2026</span>
        </div>

        {/* Connection Status */}
        <div
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border-color)',
            color: 'var(--muted-fg)',
          }}
        >
          {MOCK_MODE ? (
            <>
              <WifiOff size={12} className="text-amber-500" />
              <span className="text-[0.7rem] font-medium">Demo Mode</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[0.7rem] font-medium text-emerald-500">Live API</span>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors hover:bg-zinc-800/40"
          style={{ color: 'var(--muted-fg)' }}
          aria-label="Toggle theme"
          id="theme-toggle"
        >
          {theme === 'dark' ? <Sun size={17} className="hover:text-amber-400" /> : <Moon size={17} className="hover:text-zinc-900" />}
        </button>
      </div>
    </header>
  );
}
