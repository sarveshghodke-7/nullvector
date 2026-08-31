/**
 * Module: app/models/page.tsx
 *
 * Purpose:
 * Model / Defense page — shows ML model information per attack type.
 * Styled with Mastercard Cyber & Intelligence design system.
 *
 * Layer: PAGE
 */

'use client';

import { useEffect, useState } from 'react';
import { modelService } from '@/src/services/modelService';
import { formatMetric, formatDate } from '@/src/utils/formatters';
import { Cpu, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { ModelInfo } from '@/src/types/models';
import MastercardLogo from '@/src/components/layout/MastercardLogo';

export default function ModelsPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);

  useEffect(() => {
    modelService.listModels().then(setModels);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="mc-pill">
              <MastercardLogo size={14} />
              <span>Model Registry</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--foreground)' }}>
            <Cpu size={22} style={{ color: '#eb001b' }} />
            Defense Models & Version Registry
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted-fg)' }}>
            Random Forest classifiers, hyperparameter profiles, and serialized model artifacts deployed across fraud vectors.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {models.map(model => (
          <div key={model.model_id} className="card p-5 relative overflow-hidden transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                {model.attack_name}
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border-color)', color: '#ff5f00' }}>
                Active: {model.current_version}
              </span>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--muted-fg)' }}>
              {model.description}
            </p>

            <div className="space-y-2.5">
              {model.versions.map(v => (
                <div key={v.version} className="card-compact p-3.5 border transition-colors" style={{ borderColor: v.is_active ? 'rgba(255, 95, 0, 0.35)' : 'var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold" style={{ color: v.is_active ? '#ff5f00' : 'inherit' }}>{v.version}</span>
                      <span style={{ color: 'var(--muted)' }}>•</span>
                      <span className="text-xs capitalize font-medium" style={{ color: 'var(--muted-fg)' }}>{v.model_type.replace('_', ' ')}</span>
                      {v.is_active && (
                        <span className="flex items-center gap-1 text-emerald-500 font-semibold text-[0.68rem] px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                          <CheckCircle2 size={10} /> Active
                        </span>
                      )}
                    </div>
                    <span className="text-[0.65rem] font-mono" style={{ color: 'var(--muted)' }}>
                      {v.training_samples.toLocaleString()} samples
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {[
                      { label: 'Precision', value: v.performance.precision },
                      { label: 'Recall', value: v.performance.recall },
                      { label: 'F1', value: v.performance.f1 },
                      { label: 'AUC', value: v.performance.roc_auc },
                    ].map(m => (
                      <div key={m.label} className="text-center p-1.5 rounded-lg border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border-color)' }}>
                        <span className="block text-[0.62rem]" style={{ color: 'var(--muted-fg)' }}>{m.label}</span>
                        <span className="font-bold font-mono text-[0.75rem]" style={{ color: 'var(--foreground)' }}>{formatMetric(m.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
