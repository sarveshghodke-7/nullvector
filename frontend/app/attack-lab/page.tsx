/**
 * Module: app/attack-lab/page.tsx
 *
 * Purpose:
 * Attack selection page — shows all available attacks as cards.
 * Dynamically populated from the attack registry.
 *
 * Layer: PAGE
 */

'use client';

import Link from 'next/link';
import { getAllAttacks } from '@/src/registry/attackRegistry';
import { UserX, Mic, Shuffle, Store, ArrowRight } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  UserX, Mic, Shuffle, Store,
};

const CATEGORY_COLORS: Record<string, string> = {
  identity: '#f97316',
  media: '#8b5cf6',
  model: '#ef4444',
  merchant: '#06b6d4',
};

export default function AttackLabPage() {
  const attacks = getAllAttacks();

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          Attack Lab
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-fg)' }}>
          Select an attack type to configure, generate, and test against defense systems.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {attacks.map(attack => {
          const Icon = ICON_MAP[attack.icon];
          const color = CATEGORY_COLORS[attack.category];
          return (
            <Link
              key={attack.id}
              href={`/attack-lab/${attack.id}`}
              className="card p-6 group transition-all hover:scale-[1.01]"
              id={`attack-card-${attack.id}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${color}18`, color }}
                >
                  {Icon && <Icon size={22} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                    {attack.name}
                  </h3>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--muted-fg)' }}>
                    {attack.description}
                  </p>
                  <div className="flex items-center gap-3 text-[0.7rem]" style={{ color: 'var(--muted)' }}>
                    <span>Target: {attack.target}</span>
                    <span>•</span>
                    <span>{attack.scenarios.length} scenarios</span>
                    <span>•</span>
                    <span>{attack.artifacts.length} artifact types</span>
                  </div>
                </div>
                <ArrowRight size={18} className="group-hover:text-blue-500 transition-colors mt-1" style={{ color: 'var(--muted-fg)' }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
