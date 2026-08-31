/**
 * Module: app/architecture/page.tsx
 *
 * Purpose:
 * System architecture visualization — shows the overall system design
 * and plugin architecture. Makes the project architecture immediately
 * understandable to hackathon judges.
 * Styled with Mastercard Cyber & Intelligence design system.
 *
 * Layer: PAGE
 */

'use client';

import { Network, ArrowDown, ArrowRight } from 'lucide-react';
import { getAllAttacks } from '@/src/registry/attackRegistry';
import MastercardLogo from '@/src/components/layout/MastercardLogo';

export default function ArchitecturePage() {
  const attacks = getAllAttacks();

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="mc-pill">
              <MastercardLogo size={14} />
              <span>System Topology</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--foreground)' }}>
            <Network size={22} style={{ color: '#eb001b' }} />
            System & Closed-Loop Architecture
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted-fg)' }}>
            End-to-end architecture of the Mastercard AI Defense Lab for Payment Security.
          </p>
        </div>
      </div>

      {/* Core Pipeline */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Closed-Loop Core Pipeline</h3>
          <span className="text-[0.65rem] font-mono uppercase tracking-wider" style={{ color: 'var(--muted-fg)' }}>
            Red Team ➔ Blue Team ➔ Feedback
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {[
            { label: '1. IDENTIFY', desc: 'Threat space & scenarios', bg: 'rgba(235, 0, 27, 0.1)', fg: '#eb001b', border: 'rgba(235, 0, 27, 0.25)' },
            { label: '2. GENERATE', desc: 'Seeded synthetic artifacts', bg: 'rgba(255, 95, 0, 0.1)', fg: '#ff5f00', border: 'rgba(255, 95, 0, 0.25)' },
            { label: '3. DETECT', desc: 'Multi-signal ML scoring', bg: 'rgba(16, 185, 129, 0.1)', fg: '#10b981', border: 'rgba(16, 185, 129, 0.25)' },
            { label: '4. EVALUATE', desc: 'Balanced payment metrics', bg: 'rgba(16, 185, 129, 0.1)', fg: '#10b981', border: 'rgba(16, 185, 129, 0.25)' },
            { label: '5. FEEDBACK', desc: 'Mine false negative cases', bg: 'rgba(247, 158, 27, 0.1)', fg: '#f79e1b', border: 'rgba(247, 158, 27, 0.25)' },
            { label: '6. RETRAIN', desc: 'Harden decision boundary', bg: 'rgba(235, 0, 27, 0.1)', fg: '#eb001b', border: 'rgba(235, 0, 27, 0.25)' },
          ].map((step) => (
            <div
              key={step.label}
              className="text-center p-3 rounded-xl border flex flex-col justify-center transition-all hover:scale-[1.02]"
              style={{ background: step.bg, borderColor: step.border }}
            >
              <span className="font-bold text-xs" style={{ color: step.fg }}>{step.label}</span>
              <span className="text-[0.65rem] mt-1" style={{ color: 'var(--muted-fg)' }}>{step.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plugin Architecture */}
      <div className="card p-6">
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--foreground)' }}>Modular Plugin Architecture</h3>
        <div className="flex flex-col items-center gap-3">
          <div className="px-6 py-3 rounded-xl border text-xs sm:text-sm font-semibold shadow-xs" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border-color)', color: 'var(--foreground)' }}>
            Next.js 16 Presentation & Visualization Layer
          </div>
          <ArrowDown size={14} style={{ color: '#ff5f00' }} />
          <div className="px-6 py-3 rounded-xl border text-xs sm:text-sm font-semibold shadow-xs" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border-color)', color: 'var(--foreground)' }}>
            FastAPI REST Orchestrator + Attack Registry Contract
          </div>
          <ArrowDown size={14} style={{ color: '#ff5f00' }} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
            {attacks.map(a => (
              <div key={a.id} className="card-compact p-3 text-center border-t-2" style={{ borderTopColor: a.accentColor || '#ff5f00' }}>
                <span className="text-xs font-bold block truncate" style={{ color: 'var(--foreground)' }}>
                  {a.name.replace(' Fraud', '').replace(' Social Engineering', '').replace(' Attack', '')}
                </span>
                <span className="text-[0.65rem] block mt-1" style={{ color: 'var(--muted-fg)' }}>
                  {a.scenarios.length} scenarios
                </span>
              </div>
            ))}
          </div>
          <ArrowDown size={14} style={{ color: '#ff5f00' }} />
          <div className="grid grid-cols-3 gap-3 w-full max-w-md">
            {['Seeded Generator', 'Random Forest ML', 'Metric Evaluator'].map(stage => (
              <div key={stage} className="text-center py-2 rounded-lg border text-xs font-semibold" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border-color)' }}>
                {stage}
              </div>
            ))}
          </div>
          <ArrowDown size={14} style={{ color: '#10b981' }} />
          <div className="px-6 py-2.5 rounded-xl border text-xs font-bold text-center" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#10b981' }}>
            SQLite Feedback Datastore ➔ Automated Model Hardening Loop
          </div>
        </div>
      </div>

      {/* Data Architecture */}
      <div className="card p-6">
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--foreground)' }}>Data & Artifact Architecture</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border-color)' }}>
            <h4 className="font-bold mb-1.5" style={{ color: '#eb001b' }}>JSON Metadata & Dossiers</h4>
            <p style={{ color: 'var(--muted-fg)' }}>Configuration schemas, synthetic KYC documents, merchant dossiers, and API telemetry.</p>
          </div>
          <div className="p-4 rounded-xl border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border-color)' }}>
            <h4 className="font-bold mb-1.5" style={{ color: '#ff5f00' }}>Tabular ML & Relational DB</h4>
            <p style={{ color: 'var(--muted-fg)' }}>Feature matrices (CSV), SQLite persistent tables (`runs`, `results`, `models`, `feedback`).</p>
          </div>
          <div className="p-4 rounded-xl border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border-color)' }}>
            <h4 className="font-bold mb-1.5" style={{ color: '#f79e1b' }}>Synthesized Audio Media</h4>
            <p style={{ color: 'var(--muted-fg)' }}>11,025 Hz binary audio waveforms (WAV) generated for call-center biometric verification.</p>
          </div>
        </div>
      </div>

      {/* API Contract */}
      <div className="card p-6">
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--foreground)' }}>REST API Interface Contract</h3>
        <div className="space-y-2 font-mono text-xs">
          {[
            { method: 'GET', path: '/api/v1/attacks', desc: 'Enumerate registered attack plugins' },
            { method: 'POST', path: '/api/v1/attacks/{id}/generate', desc: 'Trigger Red Team sample generation' },
            { method: 'POST', path: '/api/v1/attacks/{id}/detect', desc: 'Execute Blue Team ML defense' },
            { method: 'GET', path: '/api/v1/runs/{id}', desc: 'Retrieve run status and counts' },
            { method: 'GET', path: '/api/v1/runs/{id}/results', desc: 'Fetch predictions & confusion matrix' },
            { method: 'POST', path: '/api/v1/models/retrain', desc: 'Execute adversarial model retraining' },
          ].map(ep => (
            <div key={ep.path} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 rounded-lg border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border-color)' }}>
              <span className={`px-2 py-0.5 rounded text-[0.65rem] font-bold w-16 text-center ${ep.method === 'POST' ? 'bg-[#ff5f00]/15 text-[#ff5f00]' : 'bg-emerald-500/15 text-emerald-500'}`}>
                {ep.method}
              </span>
              <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{ep.path}</span>
              <span className="sm:ml-auto text-[0.7rem]" style={{ color: 'var(--muted-fg)' }}>{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
