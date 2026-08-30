/**
 * Module: app/architecture/page.tsx
 *
 * Purpose:
 * System architecture visualization — shows the overall system design
 * and plugin architecture. Makes the project architecture immediately
 * understandable to hackathon judges.
 *
 * Layer: PAGE
 */

'use client';

import { Network, ArrowDown, ArrowRight } from 'lucide-react';
import { getAllAttacks } from '@/src/registry/attackRegistry';

export default function ArchitecturePage() {
  const attacks = getAllAttacks();

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <Network size={24} />
          System Architecture
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-fg)' }}>
          End-to-end architecture of the AI Defense Lab for Payment Security.
        </p>
      </div>

      {/* Core Pipeline */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold mb-4">Core Pipeline</h3>
        <div className="flex items-center justify-between px-4">
          {[
            { label: 'IDENTIFY', desc: 'Define attack spec', bg: '#fef2f2', fg: '#dc2626' },
            { label: 'GENERATE', desc: 'Create attack data', bg: '#fef2f2', fg: '#dc2626' },
            { label: 'DETECT', desc: 'Run defense model', bg: '#ecfdf5', fg: '#059669' },
            { label: 'EVALUATE', desc: 'Measure performance', bg: '#ecfdf5', fg: '#059669' },
            { label: 'FEEDBACK', desc: 'Extract hard examples', bg: '#eff6ff', fg: '#2563eb' },
            { label: 'LEARN', desc: 'Retrain & improve', bg: '#eff6ff', fg: '#2563eb' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="text-center px-3 py-2.5 rounded-lg text-xs" style={{ background: step.bg, color: step.fg }}>
                <span className="font-semibold block">{step.label}</span>
                <span className="text-[0.6rem] opacity-80">{step.desc}</span>
              </div>
              {i < 5 && <ArrowRight size={14} style={{ color: 'var(--muted)' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Plugin Architecture */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold mb-4">Plugin Architecture</h3>
        <div className="flex flex-col items-center gap-3">
          <div className="px-6 py-3 rounded-lg text-sm font-medium" style={{ background: 'var(--surface-elevated)', color: 'var(--foreground)' }}>
            Frontend — Orchestration & Visualization Layer
          </div>
          <ArrowDown size={16} style={{ color: 'var(--muted)' }} />
          <div className="px-6 py-3 rounded-lg text-sm font-medium" style={{ background: 'var(--surface-elevated)', color: 'var(--foreground)' }}>
            FastAPI Orchestrator + Attack Registry
          </div>
          <ArrowDown size={16} style={{ color: 'var(--muted)' }} />
          <div className="grid grid-cols-4 gap-3 w-full">
            {attacks.map(a => (
              <div key={a.id} className="card-compact p-3 text-center" style={{ borderTop: `3px solid ${a.accentColor}` }}>
                <span className="text-xs font-semibold block" style={{ color: 'var(--foreground)' }}>
                  {a.name.replace(' Fraud', '').replace(' Social Engineering', '').replace(' Attack', '')}
                </span>
                <span className="text-[0.6rem] block mt-1" style={{ color: 'var(--muted-fg)' }}>
                  {a.artifacts.length} artifacts • {a.scenarios.length} scenarios
                </span>
              </div>
            ))}
          </div>
          <ArrowDown size={16} style={{ color: 'var(--muted)' }} />
          <div className="grid grid-cols-3 gap-3 w-full max-w-md">
            {['Generate', 'Detect', 'Evaluate'].map(stage => (
              <div key={stage} className="text-center py-2 rounded-md text-xs font-medium" style={{ background: 'var(--surface-elevated)' }}>
                {stage}
              </div>
            ))}
          </div>
          <ArrowDown size={16} style={{ color: 'var(--muted)' }} />
          <div className="px-6 py-3 rounded-lg text-sm font-medium text-center" style={{ background: 'var(--defense-bg)', color: 'var(--defense)' }}>
            Feedback Loop → Continuous Improvement
          </div>
        </div>
      </div>

      {/* Data Architecture */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold mb-4">Data Architecture</h3>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg" style={{ background: 'var(--surface-elevated)' }}>
            <h4 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Config/Control</h4>
            <p style={{ color: 'var(--muted-fg)' }}>JSON — Attack definitions, API requests/responses, module communication, metrics</p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: 'var(--surface-elevated)' }}>
            <h4 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>ML/Data</h4>
            <p style={{ color: 'var(--muted-fg)' }}>CSV/Parquet/SQLite — Transactions, users, merchants, predictions, results</p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: 'var(--surface-elevated)' }}>
            <h4 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Media</h4>
            <p style={{ color: 'var(--muted-fg)' }}>Files — PNG/PDF (documents), WAV (audio), MP4 (video)</p>
          </div>
        </div>
      </div>

      {/* API Contract */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold mb-4">API Contract</h3>
        <div className="space-y-2 font-mono text-xs">
          {[
            { method: 'GET', path: '/api/v1/attacks', desc: 'List available attacks' },
            { method: 'POST', path: '/api/v1/attacks/{attack_id}/generate', desc: 'Generate attack artifacts' },
            { method: 'POST', path: '/api/v1/attacks/{attack_id}/detect', desc: 'Run detection' },
            { method: 'GET', path: '/api/v1/runs/{run_id}', desc: 'Get run status' },
            { method: 'GET', path: '/api/v1/runs/{run_id}/results', desc: 'Get detection results' },
            { method: 'GET', path: '/api/v1/models', desc: 'List models' },
          ].map(ep => (
            <div key={ep.path} className="flex items-center gap-3 p-2 rounded" style={{ background: 'var(--surface-elevated)' }}>
              <span className={`px-2 py-0.5 rounded text-[0.65rem] font-bold ${ep.method === 'POST' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                {ep.method}
              </span>
              <span style={{ color: 'var(--foreground)' }}>{ep.path}</span>
              <span className="ml-auto" style={{ color: 'var(--muted-fg)' }}>{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
