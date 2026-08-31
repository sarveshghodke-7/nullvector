/**
 * Module: src/components/layout/Sidebar.tsx
 *
 * Purpose:
 * Left navigation sidebar for the AI Defense Lab — Mastercard Cyber & Intelligence Theme.
 * Features the official Mastercard interlocking circles mark, clean Swiss-style
 * typography, and dynamic navigation dynamically loaded from the attack registry.
 *
 * Layer: LAYOUT
 *
 * Consumed by: AppShell.tsx
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FlaskConical,
  BarChart3,
  History,
  Cpu,
  GitBranch,
  ChevronDown,
  UserX,
  Mic,
  Shuffle,
  Store,
  ShieldAlert,
  MessageSquareWarning,
} from 'lucide-react';
import { useState } from 'react';
import { getAllAttacks } from '@/src/registry/attackRegistry';
import MastercardLogo from './MastercardLogo';

/** Map attack icon names to Lucide components */
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  UserX,
  Mic,
  Shuffle,
  Store,
  ShieldAlert,
  MessageSquareWarning,
};

/** Main navigation items */
const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/attack-lab', label: 'Attack Lab', icon: FlaskConical, hasChildren: true },
  { href: '/results', label: 'Detection Results', icon: BarChart3 },
  { href: '/history', label: 'Attack History', icon: History },
  { href: '/models', label: 'Defense Models', icon: Cpu },
  { href: '/learning', label: 'Learning Loop', icon: GitBranch },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [attacksOpen, setAttacksOpen] = useState(true);
  const attacks = getAllAttacks();

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-64 flex flex-col z-40 overflow-y-auto border-r transition-colors"
      style={{
        background: 'var(--sidebar-bg)',
        color: 'var(--sidebar-fg)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Brand Header */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <Link href="/" className="flex items-center gap-3 group">
          <MastercardLogo size={26} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                AI Defense Lab
              </span>
            </div>
            <p className="text-[0.68rem] tracking-tight font-medium" style={{ color: 'var(--muted-fg)' }}>
              Mastercard Payment Security
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <div key={item.href}>
              {item.hasChildren ? (
                <>
                  <button
                    onClick={() => setAttacksOpen(!attacksOpen)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: active ? 'var(--sidebar-active)' : 'transparent',
                      color: active ? 'var(--foreground)' : 'var(--muted-fg)',
                      borderLeft: active ? '3px solid #eb001b' : '3px solid transparent',
                    }}
                  >
                    <item.icon size={17} style={{ color: active ? '#ff5f00' : 'inherit' }} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${attacksOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {attacksOpen && (
                    <div
                      className="ml-4 mt-1 space-y-0.5 border-l pl-2.5"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      {attacks.map((attack) => {
                        const IconComp = ICON_MAP[attack.icon] || FlaskConical;
                        const attackHref = `/attack-lab/${attack.id}`;
                        const subActive = pathname === attackHref;
                        return (
                          <Link
                            key={attack.id}
                            href={attackHref}
                            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[0.75rem] font-medium transition-all"
                            style={{
                              background: subActive ? 'var(--sidebar-active)' : 'transparent',
                              color: subActive ? '#ff5f00' : 'var(--muted-fg)',
                              fontWeight: subActive ? 600 : 500,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{
                                background: subActive ? '#eb001b' : attack.accentColor || '#71717a',
                              }}
                            />
                            <span className="truncate">
                              {attack.name
                                .replace(' Fraud', '')
                                .replace(' Social Engineering', '')
                                .replace(' Attack', '')}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: active ? 'var(--sidebar-active)' : 'transparent',
                    color: active ? 'var(--foreground)' : 'var(--muted-fg)',
                    borderLeft: active ? '3px solid #eb001b' : '3px solid transparent',
                  }}
                >
                  <item.icon size={17} style={{ color: active ? '#ff5f00' : 'inherit' }} />
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer / Hackathon Metadata */}
      <div className="p-4 border-t space-y-2.5" style={{ borderColor: 'var(--border-color)' }}>
        <div
          className="p-3 rounded-xl border flex flex-col gap-1.5"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.62rem] uppercase font-bold tracking-wider" style={{ color: '#eb001b' }}>
              Mastercard
            </span>
            <span className="inline-flex items-center gap-1 text-[0.62rem] font-semibold text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Lab
            </span>
          </div>
          <p className="text-[0.68rem] leading-tight" style={{ color: 'var(--foreground)' }}>
            Innovation Challenge @ GFF 2026
          </p>
          <p className="text-[0.62rem]" style={{ color: 'var(--muted-fg)' }}>
            Adversarial Defense Sandbox
          </p>
        </div>
      </div>
    </aside>
  );
}
