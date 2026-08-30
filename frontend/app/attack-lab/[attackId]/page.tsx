/**
 * Module: app/attack-lab/[attackId]/page.tsx
 *
 * Purpose:
 * Dynamic attack configuration and generation page.
 * Loads the attack definition from registry and renders the
 * appropriate config form. Handles generation lifecycle.
 *
 * Layer: PAGE
 */

'use client';

import { useParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import { getAttack } from '@/src/registry/attackRegistry';
import { attackService } from '@/src/services/attackService';
import { Play, ArrowRight, CheckCircle2, Loader2, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import type { AttackConfig, ArtifactType } from '@/src/types/attacks';
import type { GenerationResponse, GenerationStage } from '@/src/types/generation';

/* ------------------------------------------------------------------ */
/*  Pipeline Step Component                                            */
/* ------------------------------------------------------------------ */

function PipelineSteps({ stage }: { stage: GenerationStage }) {
  const steps = [
    { id: 'validating', label: 'Configuration Validated' },
    { id: 'generating', label: 'Attack Generation' },
    { id: 'post_processing', label: 'Artifacts Generated' },
    { id: 'complete', label: 'Ready for Detection' },
  ];
  const stageOrder = ['idle', 'validating', 'queued', 'generating', 'post_processing', 'complete'];
  const currentIdx = stageOrder.indexOf(stage);

  return (
    <div className="space-y-2">
      {steps.map((step) => {
        const stepIdx = stageOrder.indexOf(step.id);
        const isComplete = currentIdx > stepIdx;
        const isActive = currentIdx === stepIdx;
        const isPending = currentIdx < stepIdx;
        return (
          <div
            key={step.id}
            className={`pipeline-step ${isComplete ? 'pipeline-step--complete' : ''} ${isActive ? 'pipeline-step--active' : ''} ${isPending ? 'pipeline-step--pending' : ''}`}
          >
            {isComplete && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
            {isActive && <Loader2 size={16} className="text-blue-500 animate-spin shrink-0" />}
            {isPending && <div className="w-4 h-4 rounded-full border-2 shrink-0" style={{ borderColor: 'var(--muted)' }} />}
            <span className="text-sm">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function AttackConfigPage() {
  const params = useParams();
  const attackId = params.attackId as string;
  const attack = getAttack(attackId);

  const [formValues, setFormValues] = useState<Record<string, string | number | boolean | string[]>>(() => {
    if (!attack) return {};
    const defaults: Record<string, string | number | boolean | string[]> = {};
    attack.configFields.forEach(f => {
      if (f.defaultValue !== undefined) defaults[f.id] = f.defaultValue;
    });
    return defaults;
  });
  const [genStage, setGenStage] = useState<GenerationStage>('idle');
  const [genResult, setGenResult] = useState<GenerationResponse | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const handleFieldChange = useCallback((fieldId: string, value: string | number | boolean | string[]) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!attack) return;
    setGenStage('validating');
    setGenError(null);

    try {
      await new Promise(r => setTimeout(r, 500));
      setGenStage('generating');

      const balancedRequested = Boolean(formValues.balanced_dataset ?? true);
      const config: AttackConfig = {
        attackId: attack.id,
        scenario: (formValues.scenario as string) || attack.scenarios[0]?.id || '',
        artifacts: ((formValues.artifact_types as string[]) || attack.artifacts) as ArtifactType[],
        parameters: { ...formValues, balanced_dataset: balancedRequested },
        balanced: balancedRequested,
        mixed_dataset: balancedRequested,
        severity: (formValues.severity as AttackConfig['severity']) || 'medium',
        seed: formValues.seed ? Number(formValues.seed) : undefined,
      };

      const result = await attackService.generateAttack(attack.id, config);
      setGenStage('post_processing');
      await new Promise(r => setTimeout(r, 400));
      setGenStage('complete');
      setGenResult(result);
    } catch (err) {
      setGenStage('error');
      setGenError(err instanceof Error ? err.message : 'Generation failed');
    }
  }, [attack, formValues]);

  if (!attack) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
          Attack type &quot;{attackId}&quot; not found in registry.
        </p>
        <Link href="/attack-lab" className="btn btn-ghost text-sm">Back to Attack Lab</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fadeIn">
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-fg)' }}>
        <Link href="/attack-lab" className="hover:text-blue-500">Attack Lab</Link>
        <span>/</span>
        <span style={{ color: 'var(--foreground)' }}>{attack.name}</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>{attack.name}</h1>
        <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>{attack.longDescription}</p>
      </div>

      <div className="grid grid-cols-[1.25fr_0.75fr] gap-5">
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Attack Configuration
            </h3>

            {attack.configFields.map(field => {
              // Check visibility condition
              if (field.visibleWhen) {
                const depVal = formValues[field.visibleWhen.field];
                const allowed = Array.isArray(field.visibleWhen.value)
                  ? field.visibleWhen.value
                  : [field.visibleWhen.value];
                if (!allowed.includes(String(depVal))) return null;
              }

              return (
                <div key={field.id}>
                  <label className="label" htmlFor={field.id}>{field.label}</label>
                  {field.helpText && (
                    <p className="text-[0.7rem] mb-1.5" style={{ color: 'var(--muted)' }}>{field.helpText}</p>
                  )}

                  {field.type === 'select' && (
                    <select
                      id={field.id}
                      className="select"
                      value={String(formValues[field.id] || '')}
                      onChange={e => handleFieldChange(field.id, e.target.value)}
                    >
                      {field.options?.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  )}

                  {field.type === 'multiselect' && (
                    <div className="space-y-1">
                      {field.options?.map(o => {
                        const selected = (formValues[field.id] as string[]) || [];
                        return (
                          <label key={o.value} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={selected.includes(o.value)}
                              onChange={e => {
                                const cur = [...selected];
                                if (e.target.checked) cur.push(o.value);
                                else cur.splice(cur.indexOf(o.value), 1);
                                handleFieldChange(field.id, cur);
                              }}
                            />
                            {o.label}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {field.type === 'checkbox' && (
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(formValues[field.id] ?? field.defaultValue ?? false)}
                        onChange={e => handleFieldChange(field.id, e.target.checked)}
                      />
                      <span>{field.label}</span>
                    </label>
                  )}

                  {field.type === 'slider' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        id={field.id}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={Number(formValues[field.id]) || field.min || 0}
                        onChange={e => handleFieldChange(field.id, Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono w-12 text-right" style={{ color: 'var(--foreground)' }}>
                        {formValues[field.id] ?? field.defaultValue}
                      </span>
                    </div>
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      id={field.id}
                      className="input"
                      placeholder={field.placeholder}
                      value={formValues[field.id] !== undefined ? String(formValues[field.id]) : ''}
                      onChange={e => handleFieldChange(field.id, e.target.value ? Number(e.target.value) : '')}
                    />
                  )}

                  {field.type === 'text' && (
                    <input
                      type="text"
                      id={field.id}
                      className="input"
                      placeholder={field.placeholder}
                      value={String(formValues[field.id] || '')}
                      onChange={e => handleFieldChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'file' && (
                    <div
                      className="border-2 border-dashed rounded-lg p-4 text-center text-xs cursor-pointer hover:border-blue-500 transition-colors"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--muted-fg)' }}
                    >
                      Click or drag to upload — {field.placeholder || 'Select file'}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-2">
              <button
                className="btn btn-danger w-full"
                onClick={handleGenerate}
                disabled={genStage !== 'idle' && genStage !== 'complete' && genStage !== 'error'}
                id="generate-attack-btn"
              >
                <Play size={16} />
                Generate Attack
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Generation Pipeline
            </h3>
            <PipelineSteps stage={genStage} />

            {genError && (
              <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: 'var(--attack-bg)', color: 'var(--attack)' }}>
                <div className="flex items-center gap-2 font-medium mb-1">
                  <AlertCircle size={14} />
                  Generation Failed
                </div>
                {genError}
              </div>
            )}

            {genResult && genStage === 'complete' && (
              <div className="mt-4 space-y-3">
                <div className="p-3 rounded-lg text-xs space-y-1" style={{ background: 'var(--defense-bg)', color: 'var(--defense)' }}>
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 size={14} />
                    Generation Complete
                  </div>
                  <p>Run ID: <span className="font-mono">{genResult.run_id}</span></p>
                  <p>Samples: {genResult.payload.sample_count}</p>
                  <p>Time: {genResult.payload.generation_time_ms}ms</p>
                  {genResult.payload.artifacts.length > 0 && (
                    <div className="pt-2">
                      <p className="mb-1 font-medium">Artifacts saved:</p>
                      <ul className="space-y-1 pl-3 list-disc">
                        {genResult.payload.artifacts.map(artifact => (
                          <li key={artifact.artifact_id}>
                            <span>{artifact.type}</span>
                            {artifact.data_location && (
                              <span className="block break-all text-[10px] opacity-80">{artifact.data_location}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <Link href={`/results/${genResult.run_id}`} className="btn btn-success w-full text-sm">
                  <Eye size={14} />
                  View & Run Detection
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
              Attack Info
            </h3>
            <div className="space-y-2 text-xs" style={{ color: 'var(--muted-fg)' }}>
              <div className="flex items-center justify-between gap-2">
                <span>Target</span>
                <span className="text-right" style={{ color: 'var(--foreground)' }}>{attack.target}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Category</span>
                <span className="capitalize" style={{ color: 'var(--foreground)' }}>{attack.category}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Scenarios</span>
                <span style={{ color: 'var(--foreground)' }}>{attack.scenarios.length}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Artifacts</span>
                <span style={{ color: 'var(--foreground)' }}>{attack.artifacts.length} types</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
