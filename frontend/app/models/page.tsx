/**
 * Module: app/models/page.tsx
 *
 * Purpose:
 * Model / Defense page — shows ML model information per attack type.
 *
 * Layer: PAGE
 */

'use client';

import { useEffect, useState } from 'react';
import { modelService } from '@/src/services/modelService';
import { formatMetric, formatDate } from '@/src/utils/formatters';
import { Cpu, CheckCircle2 } from 'lucide-react';
import type { ModelInfo } from '@/src/types/models';

export default function ModelsPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);

  useEffect(() => {
    modelService.listModels().then(setModels);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <Cpu size={24} />
          Model / Defense
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-fg)' }}>
          Detection models deployed per attack type.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {models.map(model => (
          <div key={model.model_id} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {model.attack_name}
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: 'var(--surface-elevated)', color: 'var(--muted-fg)' }}>
                {model.current_version}
              </span>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--muted-fg)' }}>
              {model.description}
            </p>

            {model.versions.map(v => (
              <div key={v.version} className="card-compact p-3 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-semibold">{v.version}</span>
                    <span style={{ color: 'var(--muted)' }}>|</span>
                    <span style={{ color: 'var(--muted-fg)' }}>{v.model_type}</span>
                    {v.is_active && (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <CheckCircle2 size={11} /> Active
                      </span>
                    )}
                  </div>
                  <span className="text-[0.65rem]" style={{ color: 'var(--muted)' }}>
                    Trained {formatDate(v.trained_at)} • {v.training_samples.toLocaleString()} samples
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[
                    { label: 'Precision', value: v.performance.precision },
                    { label: 'Recall', value: v.performance.recall },
                    { label: 'F1', value: v.performance.f1 },
                    { label: 'AUC', value: v.performance.roc_auc },
                  ].map(m => (
                    <div key={m.label} className="text-center p-1.5 rounded" style={{ background: 'var(--surface-elevated)' }}>
                      <span className="block text-[0.65rem]" style={{ color: 'var(--muted-fg)' }}>{m.label}</span>
                      <span className="font-semibold">{formatMetric(m.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
