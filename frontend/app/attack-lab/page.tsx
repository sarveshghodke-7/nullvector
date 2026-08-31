/**
 * Module: app/attack-lab/page.tsx
 *
 * Purpose:
 * Attack selection page — shows all available attacks as cards.
 * Styled with Mastercard Cyber & Intelligence design language.
 * Dynamically populated from the attack registry.
 *
 * Layer: PAGE
 */

'use client';

import Link from 'next/link';
import { getAllAttacks } from '@/src/registry/attackRegistry';
import {
  UserX,
  Mic,
  Shuffle,
  Store,
  ShieldAlert,
  MessageSquareWarning,
  ArrowRight,
  FlaskConical,
} from 'lucide-react';
import MastercardLogo from '@/src/components/layout/MastercardLogo';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  UserX,
  Mic,
  Shuffle,
  Store,
  ShieldAlert,
  MessageSquareWarning,
};

const CATEGORY_COLORS: Record<string, string> = {
  identity: '#ff5f00',
  media: '#eb001b',
  model: '#f79e1b',
  merchant: '#ea580c',
  account: '#d97706',
  social: '#e11d48',
};

export default function AttackLabPage() {
  const attacks = getAllAttacks();

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="mc-pill">
              <MastercardLogo size={14} />
              <span>Red Team Sandbox</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Attack Simulation Lab
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted-fg)' }}>
            Select a payment fraud vector to configure, synthesize attack variants, and evaluate against detection models.
          </p>
        </div>
      </div>

      {/* Grid of Attacks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {attacks.map((attack) => {
          const Icon = ICON_MAP[attack.icon] || FlaskConical;
          const color = CATEGORY_COLORS[attack.category] || attack.accentColor || '#ff5f00';
          return (
            <Link
              key={attack.id}
              href={`/attack-lab/${attack.id}`}
              className="card p-6 group transition-all duration-200 hover:scale-[1.015] relative overflow-hidden"
              id={`attack-card-${attack.id}`}
            >
              {/* Subtle top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ background: color }}
              />

              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  style={{
                    background: `${color}16`,
                    color,
                    border: `1px solid ${color}30`,
                  }}
                >
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold tracking-tight group-hover:text-[#ff5f00] transition-colors" style={{ color: 'var(--foreground)' }}>
                      {attack.name}
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed mb-3.5 line-clamp-2" style={{ color: 'var(--muted-fg)' }}>
                    {attack.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-medium" style={{ color: 'var(--muted)' }}>
                    <span className="px-2 py-0.5 rounded" style={{ background: 'var(--surface-elevated)', color: 'var(--muted-fg)' }}>
                      Target: {attack.target}
                    </span>
                    <span>•</span>
                    <span>{attack.scenarios.length} scenarios</span>
                    <span>•</span>
                    <span>{attack.artifacts.length} artifacts</span>
                  </div>
                </div>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors group-hover:bg-[#eb001b]/10 group-hover:text-[#eb001b]"
                  style={{ color: 'var(--muted-fg)' }}
                >
                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
