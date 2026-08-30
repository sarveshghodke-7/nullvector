/**
 * Module: src/components/layout/Sidebar.tsx
 *
 * Purpose:
 * Left navigation sidebar for the AI Defense Lab. Renders navigation
 * items dynamically from the attack registry — adding a new attack
 * automatically adds it to the sidebar nav.
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
  Shield,
  UserX,
  Mic,
  Shuffle,
  Store,
} from 'lucide-react';
import { useState } from 'react';
import { getAllAttacks } from '@/src/registry/attackRegistry';

/** Map attack icon names to Lucide components */
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  UserX,
  Mic,
  Shuffle,
  Store,
};

/** Main navigation items */
const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/attack-lab', label: 'Attack Lab', icon: FlaskConical, hasChildren: true },
  { href: '/results', label: 'Results', icon: BarChart3 },
  { href: '/history', label: 'Attack History', icon: History },
  { href: '/models', label: 'Model / Defense', icon: Cpu },
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
      className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-40 overflow-y-auto border-r"
      style={{ background: 'var(--sidebar-bg)', color: 'var(--sidebar-fg)', borderColor: 'rgba(148, 163, 184, 0.12)' }}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--sidebar-fg)' }}>AI Defense Lab</h1>
          <p className="text-[0.65rem]" style={{ color: 'var(--muted-fg)' }}>Payment Security</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(item => (
          <div key={item.href}>
            {item.hasChildren ? (
              <>
                <button
                  onClick={() => setAttacksOpen(!attacksOpen)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                  style={{
                    background: isActive(item.href) ? 'var(--sidebar-active)' : 'transparent',
                    color: 'var(--sidebar-fg)',
                  }}
                >
                  <item.icon size={18} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${attacksOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {attacksOpen && (
                  <div className="ml-5 mt-1 space-y-0.5 border-l pl-3" style={{ borderColor: 'var(--border-color)' }}>
                    {attacks.map(attack => {
                      const IconComp = ICON_MAP[attack.icon];
                      const attackHref = `/attack-lab/${attack.id}`;
                      const active = pathname === attackHref;
                      return (
                        <Link
                          key={attack.id}
                          href={attackHref}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors"
                          style={{
                            background: active ? 'var(--sidebar-active)' : 'transparent',
                            color: 'var(--sidebar-fg)',
                          }}
                        >
                          {IconComp && <IconComp size={14} />}
                          <span className="truncate">{attack.name.replace(' Fraud', '').replace(' Social Engineering', '').replace(' Attack', '')}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                style={{
                  background: isActive(item.href) ? 'var(--sidebar-active)' : 'transparent',
                  color: 'var(--sidebar-fg)',
                }}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="text-[0.6rem] uppercase tracking-[0.12em]" style={{ color: 'var(--muted-fg)' }}>Live Mode</div>
        <p className="text-[0.6rem] mt-2" style={{ color: 'var(--muted)' }}>MIC @ GFF 2026</p>
      </div>
    </aside>
  );
}
