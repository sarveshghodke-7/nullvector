/**
 * Module: app/learning/page.tsx
 *
 * Purpose:
 * Closed-loop learning page — visualizes the feedback cycle:
 * Model v1 → Attack → Detect → False Negatives → Hard Examples → Retrain → Model v2
 *
 * Layer: PAGE
 *
 * Does NOT implement actual retraining — only visualizes backend state.
 */

'use client';

import { useEffect, useState } from 'react';
import { modelService } from '@/src/services/modelService';
import { formatMetric } from '@/src/utils/formatters';
import {
  GitBranch, ArrowDown, CheckCircle2, RefreshCw, AlertTriangle,
  TrendingUp, Database, Brain, Target,
} from 'lucide-react';
import type { ModelInfo } from '@/src/types/models';

export default function LearningPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [retraining, setRetraining] = useState(false);

  async function refreshModels() {
    const nextModels = await modelService.listModels();
    setModels(nextModels);
  }

  useEffect(() => {
    refreshModels();
  }, []);

  // Find the adversarial model which has v1→v2 for demo
  const advModel = models.find(m => m.versions.length > 1);
  const currentVersion = advModel?.versions.find(v => v.is_active);
  const previousVersion = advModel?.versions.find(v => !v.is_active);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <GitBranch size={24} />
          Defense Improvement
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-fg)' }}>
          False negatives from attack runs feed the retraining cycle for stronger detection coverage.
        </p>
      </div>

      {/* Pipeline Visualization */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold mb-6" style={{ color: 'var(--foreground)' }}>
          Feedback Cycle
        </h3>
        <div className="flex flex-col items-center gap-1">
          {[
            { icon: Brain, label: 'Current Model', sub: currentVersion?.version || 'v1.0', color: '#3b82f6' },
            { icon: Target, label: 'Attack Simulation', sub: 'Red Team generates attacks', color: '#ef4444' },
            { icon: CheckCircle2, label: 'Detection', sub: 'Blue Team runs defense', color: '#10b981' },
            { icon: AlertTriangle, label: 'False Negatives', sub: previousVersion ? '66 hard examples discovered' : '7 hard examples discovered', color: '#f59e0b' },
            { icon: Database, label: 'Hard Example Collection', sub: 'Missed attacks extracted', color: '#8b5cf6' },
            { icon: RefreshCw, label: 'Adversarial Retraining', sub: 'Model retrained with hard examples', color: '#06b6d4' },
            { icon: TrendingUp, label: 'Improved Model', sub: currentVersion?.version || 'v2.0', color: '#10b981' },
          ].map((step, i) => (
            <div key={step.label} className="flex flex-col items-center">
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl w-80" style={{ background: 'var(--surface-elevated)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${step.color}18`, color: step.color }}>
                  <step.icon size={18} />
                </div>
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{step.label}</span>
                  <p className="text-[0.7rem]" style={{ color: 'var(--muted-fg)' }}>{step.sub}</p>
                </div>
              </div>
              {i < 6 && (
                <ArrowDown size={16} className="my-1" style={{ color: 'var(--muted)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {advModel && (
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-semibold">Retraining Control</h3>
            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  setRetraining(true);
                  await modelService.retrainModel(advModel.attack_id, 0.01);
                  await refreshModels();
                } finally {
                  setRetraining(false);
                }
              }}
              disabled={retraining}
            >
              {retraining ? 'Retraining…' : 'Run Retraining'}
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>
            The service collects false negatives from completed runs, stores them as hard examples, and retrains the active model for {advModel.attack_name}.
          </p>
        </div>
      )}

      {/* Before/After Comparison */}
      {previousVersion && currentVersion && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">Performance Improvement</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-elevated)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>Before ({previousVersion.version})</span>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div><span className="label">Precision</span><span className="block font-semibold">{formatMetric(previousVersion.performance.precision)}</span></div>
                <div><span className="label">Recall</span><span className="block font-semibold">{formatMetric(previousVersion.performance.recall)}</span></div>
                <div><span className="label">F1</span><span className="block font-semibold">{formatMetric(previousVersion.performance.f1)}</span></div>
                <div><span className="label">AUC</span><span className="block font-semibold">{formatMetric(previousVersion.performance.roc_auc)}</span></div>
              </div>
            </div>
            <div className="p-4 rounded-lg" style={{ borderLeft: '4px solid var(--defense)', background: 'var(--surface-elevated)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--defense)' }}>After ({currentVersion.version})</span>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                {[
                  { label: 'Precision', before: previousVersion.performance.precision, after: currentVersion.performance.precision },
                  { label: 'Recall', before: previousVersion.performance.recall, after: currentVersion.performance.recall },
                  { label: 'F1', before: previousVersion.performance.f1, after: currentVersion.performance.f1 },
                  { label: 'AUC', before: previousVersion.performance.roc_auc, after: currentVersion.performance.roc_auc },
                ].map(m => {
                  const delta = m.after - m.before;
                  return (
                    <div key={m.label}>
                      <span className="label">{m.label}</span>
                      <span className="block font-semibold">{formatMetric(m.after)}</span>
                      <span className={`text-[0.65rem] ${delta >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                        {delta >= 0 ? '+' : ''}{(delta * 100).toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
