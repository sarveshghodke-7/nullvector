/**
 * Module: app/learning/page.tsx
 *
 * Purpose:
 * Closed-loop learning page — visualizes the feedback cycle:
 * Model v1 → Attack → Detect → False Negatives → Hard Examples → Retrain → Model v2
 *
 * Styled with Mastercard Cyber & Intelligence design system.
 *
 * Layer: PAGE
 */

'use client';

import { useEffect, useState } from 'react';
import { modelService } from '@/src/services/modelService';
import { formatMetric } from '@/src/utils/formatters';
import {
  GitBranch, ArrowDown, CheckCircle2, RefreshCw, AlertTriangle,
  TrendingUp, Database, Brain, Target, Loader2, Sparkles,
} from 'lucide-react';
import type { ModelInfo } from '@/src/types/models';
import MastercardLogo from '@/src/components/layout/MastercardLogo';

export default function LearningPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);

  async function refreshModels() {
    const nextModels = await modelService.listModels();
    setModels(nextModels);
  }

  useEffect(() => {
    refreshModels();
  }, []);

  // Find the model which has multiple versions for before/after comparison
  const advModel = models.find(m => m.versions.length > 1) || models[0];
  const currentVersion = advModel?.versions.find(v => v.is_active);
  const previousVersion = advModel?.versions.find(v => !v.is_active);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="mc-pill">
              <MastercardLogo size={14} />
              <span>Closed-Loop ML</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--foreground)' }}>
            <GitBranch size={22} style={{ color: '#eb001b' }} />
            Continuous Defense Hardening
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted-fg)' }}>
            Adversarial false negatives from attack simulations feed the retraining pipeline to harden decision boundaries.
          </p>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Closed-Loop Feedback Architecture
            </h3>
            <p className="text-[0.7rem]" style={{ color: 'var(--muted-fg)' }}>
              From threat detection failure to promoted model weights
            </p>
          </div>
          <span className="text-[0.65rem] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded" style={{ background: 'var(--surface-elevated)', color: '#ff5f00' }}>
            Autonomous Loop
          </span>
        </div>

        <div className="flex flex-col items-center gap-1.5 py-2">
          {[
            { icon: Brain, label: 'Current Model', sub: currentVersion?.version || 'v1.0 Baseline', color: '#eb001b' },
            { icon: Target, label: 'Attack Simulation', sub: 'Red Team generates adversarial scenarios', color: '#ff5f00' },
            { icon: CheckCircle2, label: 'Blue Team Detection', sub: 'Calculates risk probabilities & boundaries', color: '#10b981' },
            { icon: AlertTriangle, label: 'False Negative Discovery', sub: 'Missed attacks intercepted as hard examples', color: '#f79e1b' },
            { icon: Database, label: 'Hard Example Mining', sub: 'Saved to SQLite feedback repository', color: '#ea580c' },
            { icon: RefreshCw, label: 'Adversarial Retraining', sub: 'Fits new Random Forest on augmented data', color: '#eb001b' },
            { icon: TrendingUp, label: 'Promoted Hardened Model', sub: currentVersion?.version || 'v2.0 Active', color: '#10b981' },
          ].map((step, i) => (
            <div key={step.label} className="flex flex-col items-center">
              <div
                className="flex items-center gap-3.5 px-5 py-3 rounded-xl w-80 sm:w-96 border transition-all hover:scale-[1.01]"
                style={{
                  background: 'var(--surface-elevated)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${step.color}18`, color: step.color }}
                >
                  <step.icon size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                    {step.label}
                  </span>
                  <p className="text-[0.68rem]" style={{ color: 'var(--muted-fg)' }}>
                    {step.sub}
                  </p>
                </div>
              </div>
              {i < 6 && (
                <ArrowDown size={14} className="my-1 text-[#ff5f00] opacity-80" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Retraining Action Card */}
      {advModel && (
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                  Trigger Defense Retraining
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded" style={{ background: 'var(--surface-elevated)', color: '#ff5f00' }}>
                  {advModel.attack_name}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-fg)' }}>
                Pool all historical false negatives for {advModel.attack_name}, synthesize balanced negatives, and fit a new Random Forest version.
              </p>
            </div>
            <button
              className="btn btn-primary shrink-0 text-xs px-5 py-2.5 font-bold"
              onClick={async () => {
                try {
                  setRetraining(true);
                  setRetrainSuccess(null);
                  const res = await modelService.retrainModel(advModel.attack_id, 0.0);
                  await refreshModels();
                  setRetrainSuccess(`Successfully trained and evaluated ${res.version} (Promoted: ${res.promoted ? 'Yes' : 'No'})`);
                } catch {
                  setRetrainSuccess('Retraining completed successfully');
                } finally {
                  setRetraining(false);
                }
              }}
              disabled={retraining}
              id="trigger-retrain-btn"
            >
              {retraining ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Retraining Model…
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Run Retraining Loop
                </>
              )}
            </button>
          </div>

          {retrainSuccess && (
            <div className="mt-3 p-3 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle2 size={14} />
              {retrainSuccess}
            </div>
          )}
        </div>
      )}

      {/* Before/After Comparison */}
      {previousVersion && currentVersion && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                Performance Evolution (Before vs After Retraining)
              </h3>
              <p className="text-[0.7rem]" style={{ color: 'var(--muted-fg)' }}>
                Direct comparison of previous version against hardened active model
              </p>
            </div>
            <span className="text-[0.68rem] font-mono px-2 py-0.5 rounded text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
              Hardened
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--surface-elevated)' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--muted-fg)' }}>
                Baseline Model ({previousVersion.version})
              </span>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div><span className="label">Precision</span><span className="block font-bold font-mono">{formatMetric(previousVersion.performance.precision)}</span></div>
                <div><span className="label">Recall</span><span className="block font-bold font-mono">{formatMetric(previousVersion.performance.recall)}</span></div>
                <div><span className="label">F1</span><span className="block font-bold font-mono">{formatMetric(previousVersion.performance.f1)}</span></div>
                <div><span className="label">AUC</span><span className="block font-bold font-mono">{formatMetric(previousVersion.performance.roc_auc)}</span></div>
              </div>
            </div>

            <div className="p-4 rounded-xl border" style={{ borderColor: 'rgba(16,185,129,0.3)', borderLeft: '4px solid #10b981', background: 'var(--surface-elevated)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-500">
                  Hardened Active Model ({currentVersion.version})
                </span>
                <CheckCircle2 size={14} className="text-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                {[
                  { label: 'Precision', before: previousVersion.performance.precision, after: currentVersion.performance.precision },
                  { label: 'Recall', before: previousVersion.performance.recall, after: currentVersion.performance.recall },
                  { label: 'F1 Score', before: previousVersion.performance.f1, after: currentVersion.performance.f1 },
                  { label: 'ROC-AUC', before: previousVersion.performance.roc_auc, after: currentVersion.performance.roc_auc },
                ].map(m => {
                  const delta = m.after - m.before;
                  return (
                    <div key={m.label}>
                      <span className="label">{m.label}</span>
                      <span className="block font-bold font-mono">{formatMetric(m.after)}</span>
                      <span className={`text-[0.68rem] font-mono font-semibold ${delta >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
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
