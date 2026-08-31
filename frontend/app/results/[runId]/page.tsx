/**
 * Module: app/results/[runId]/page.tsx
 *
 * Purpose:
 * Detailed result view for a single run. Shows detection metrics,
 * confusion matrix, Red vs Blue comparison, scenario breakdown,
 * and individual sample explanations.
 *
 * Styled with Mastercard Cyber & Intelligence design system.
 *
 * Layer: PAGE
 */

'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { runService } from '@/src/services/runService';
import { attackService } from '@/src/services/attackService';
import {
  formatPercent, formatMetric, attackIdToName,
} from '@/src/utils/formatters';
import {
  Shield, Swords, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, AlertTriangle, Loader2, Play,
  Download, FileText, ArrowLeft,
} from 'lucide-react';
import { API_BASE_URL } from '@/src/utils/config';
import type { AttackResult } from '@/src/types/results';
import type { SamplePrediction } from '@/src/types/detection';
import MastercardLogo from '@/src/components/layout/MastercardLogo';

export default function RunResultPage() {
  const params = useParams();
  const runId = params.runId as string;

  const [result, setResult] = useState<AttackResult | null>(null);
  const [attackId, setAttackId] = useState<string | null>(null);
  const [samples, setSamples] = useState<SamplePrediction[]>([]);
  const [expandedSample, setExpandedSample] = useState<string | null>(null);
  const [expandedArtifact, setExpandedArtifact] = useState<string | null>(null);
  const [artifactPreview, setArtifactPreview] = useState<Record<string, string>>({});
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [resultData, runData] = await Promise.all([
          runService.getRunResult(runId),
          runService.getRun(runId).catch(() => null),
        ]);

        const liveResult = resultData as AttackResult & { predictions?: SamplePrediction[] };
        setResult(liveResult);
        setAttackId(liveResult.attack_id || runData?.attack_id || null);
        setSamples(liveResult.predictions || []);
      } catch {
        try {
          const run = await runService.getRun(runId);
          setAttackId(run.attack_id);
        } catch {
          // The run itself is unavailable.
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [runId]);

  useEffect(() => {
    if (!loading && !result && attackId) {
      void handleDetect();
    }
  }, [loading, result, attackId]);

  useEffect(() => {
    if (!result?.artifacts?.length) return;
    const previewEntries: Record<string, string> = {};

    Promise.all(result.artifacts.filter(a => a.format !== 'wav').map(async artifact => {
      if (!artifact.data_location) return;
      const url = artifact.data_location.startsWith('http') ? artifact.data_location : `${API_BASE_URL}${artifact.data_location}`;
      const response = await fetch(url, { headers: { Accept: 'application/json,text/csv,text/plain' } });
      const text = await response.text();
      previewEntries[artifact.artifact_id] = text.slice(0, 240).replace(/\s+/g, ' ');
      return artifact.artifact_id;
    })).finally(() => setArtifactPreview(previewEntries));
  }, [result]);

  const handleDetect = async () => {
    if (!attackId) return;
    setDetecting(true);
    try {
      const response = await attackService.detectAttack(attackId, runId);
      const livePredictions = response.payload.predictions || [];
      setSamples(livePredictions);
      const updatedResult = await runService.getRunResult(runId) as AttackResult & { predictions?: SamplePrediction[] };
      setResult(updatedResult);
      setSamples(updatedResult.predictions || livePredictions);
      setDetecting(false);
    } catch {
      setDetecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 size={26} className="animate-spin text-[#ff5f00]" />
        <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>Loading evaluation records…</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Run {runId}</h1>
        <div className="card p-8 text-center">
          <p className="text-sm mb-4" style={{ color: 'var(--muted-fg)' }}>
            No detection results yet. Trigger the defense engine to evaluate generated artifacts.
          </p>
          <button className="btn btn-primary" onClick={handleDetect} disabled={detecting || !attackId}>
            {detecting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Run Detection
          </button>
        </div>
      </div>
    );
  }

  const cm = result.confusion_matrix;
  const m = result.metrics;
  const datasetLabel = result.dataset_mode === 'balanced'
    ? 'Balanced mixed dataset'
    : result.dataset_mode === 'fraud_only'
      ? 'Fraud-only dataset'
      : 'Dataset mode unavailable';

  const scenarioChartData = result.scenario_breakdown.map(s => ({
    name: s.scenario_name.length > 18 ? s.scenario_name.slice(0, 18) + '…' : s.scenario_name,
    Precision: s.metrics.precision,
    Recall: s.metrics.recall,
    F1: s.metrics.f1,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-fg)' }}>
        <Link href="/results" className="hover:text-[#ff5f00] flex items-center gap-1">
          <ArrowLeft size={12} />
          Detection Results
        </Link>
        <span>/</span>
        <span className="font-mono" style={{ color: 'var(--foreground)' }}>{runId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="mc-pill">
              <MastercardLogo size={13} />
              <span>Evaluation Dossier</span>
            </div>
            <span className="text-[0.68rem] font-mono px-2 py-0.5 rounded" style={{ background: 'var(--surface-elevated)', color: 'var(--muted-fg)' }}>
              {runId}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            {attackIdToName(result.attack_id)}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted-fg)' }}>
            Random Forest Defense Detector • Model {result.model_version}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full border"
            style={{
              background: result.dataset_mode === 'balanced' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
              borderColor: result.dataset_mode === 'balanced' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)',
              color: result.dataset_mode === 'balanced' ? '#10b981' : '#f59e0b',
            }}
          >
            {datasetLabel}
          </span>
        </div>
      </div>

      {/* Red vs Blue Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5" style={{ borderLeft: '4px solid #eb001b' }}>
          <div className="flex items-center gap-2 mb-3">
            <Swords size={16} style={{ color: '#eb001b' }} />
            <h3 className="text-sm font-bold tracking-tight" style={{ color: '#eb001b' }}>
              Red Team — Adversarial Simulation
            </h3>
          </div>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>Attack Vector</span><span className="font-medium">{attackIdToName(result.attack_id)}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>Total Attacks</span><span className="font-mono font-semibold">{result.summary.total_samples}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>Evasions (Missed)</span><span className="text-rose-400 font-mono font-bold">{result.summary.missed}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>Evasion Rate</span><span className="text-rose-400 font-mono">{formatPercent(1 - result.summary.detection_rate)}</span></div>
          </div>
        </div>
        <div className="card p-5" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-emerald-500" />
            <h3 className="text-sm font-bold tracking-tight text-emerald-500">
              Blue Team — Payment Defense
            </h3>
          </div>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>Active Model</span><span className="font-mono">{result.model_version}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>Intercepted (Detected)</span><span className="text-emerald-500 font-mono font-bold">{result.summary.detected}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>Detection Rate</span><span className="text-emerald-500 font-mono font-bold">{formatPercent(result.summary.detection_rate)}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>False Positives</span><span className="text-amber-400 font-mono">{cm.false_positive}</span></div>
          </div>
        </div>
      </div>

      {/* Metrics + Confusion Matrix Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Metrics */}
        <div className="col-span-1 space-y-3">
          {[
            { label: 'Precision', value: m.precision, color: 'orange' },
            { label: 'Recall (Detection Rate)', value: m.recall, color: 'green' },
            { label: 'F1 Score', value: m.f1, color: 'red' },
            { label: 'ROC-AUC', value: m.roc_auc, color: 'amber' },
          ].map(metric => (
            <div key={metric.label} className={`card metric-card metric-card--${metric.color} p-4`}>
              <span className="text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>{metric.label}</span>
              <span className="block text-2xl font-bold font-mono mt-1" style={{ color: 'var(--foreground)' }}>
                {formatMetric(metric.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Confusion Matrix */}
        <div className="col-span-1 lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Confusion Matrix</h3>
            <span className="text-[0.65rem] uppercase tracking-wider font-semibold" style={{ color: 'var(--muted-fg)' }}>
              Binary Ground Truth vs Prediction
            </span>
          </div>
          <div className="grid grid-cols-[auto_1fr_1fr] gap-2.5 max-w-md mx-auto pt-2">
            {/* Header */}
            <div />
            <div className="text-center text-xs font-semibold pb-1" style={{ color: 'var(--muted-fg)' }}>Pred: Legit</div>
            <div className="text-center text-xs font-semibold pb-1" style={{ color: '#eb001b' }}>Pred: Fraud</div>
            {/* Row 1 */}
            <div className="flex items-center text-xs font-semibold pr-2" style={{ color: 'var(--muted-fg)' }}>Actual: Legit</div>
            <div className="confusion-cell confusion-cell--tn">
              <span className="text-2xl font-bold font-mono">{cm.true_negative}</span>
              <span className="text-[0.68rem] mt-1 font-medium">True Negative</span>
            </div>
            <div className="confusion-cell confusion-cell--fp">
              <span className="text-2xl font-bold font-mono">{cm.false_positive}</span>
              <span className="text-[0.68rem] mt-1 font-medium">False Positive</span>
            </div>
            {/* Row 2 */}
            <div className="flex items-center text-xs font-semibold pr-2" style={{ color: '#eb001b' }}>Actual: Fraud</div>
            <div className="confusion-cell confusion-cell--fn">
              <span className="text-2xl font-bold font-mono">{cm.false_negative}</span>
              <span className="text-[0.68rem] mt-1 font-medium">False Negative</span>
            </div>
            <div className="confusion-cell confusion-cell--tp">
              <span className="text-2xl font-bold font-mono">{cm.true_positive}</span>
              <span className="text-[0.68rem] mt-1 font-medium">True Positive</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Breakdown */}
      {scenarioChartData.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--foreground)' }}>Performance by Scenario</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left text-xs border-b" style={{ color: 'var(--muted-fg)', borderColor: 'var(--border-color)' }}>
                  <th className="pb-2 font-semibold">Scenario</th>
                  <th className="pb-2 font-semibold text-right">Samples</th>
                  <th className="pb-2 font-semibold text-right">Precision</th>
                  <th className="pb-2 font-semibold text-right">Recall</th>
                  <th className="pb-2 font-semibold text-right">F1</th>
                  <th className="pb-2 font-semibold text-right">AUC</th>
                </tr>
              </thead>
              <tbody>
                {result.scenario_breakdown.map(s => (
                  <tr key={s.scenario_id} className="border-t hover:bg-zinc-800/20 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="py-2.5 font-medium">{s.scenario_name}</td>
                    <td className="py-2.5 text-right font-mono text-xs">{s.sample_count}</td>
                    <td className="py-2.5 text-right font-mono text-xs font-semibold">{formatMetric(s.metrics.precision)}</td>
                    <td className="py-2.5 text-right font-mono text-xs font-semibold text-emerald-500">{formatMetric(s.metrics.recall)}</td>
                    <td className="py-2.5 text-right font-mono text-xs font-semibold text-[#ff5f00]">{formatMetric(s.metrics.f1)}</td>
                    <td className="py-2.5 text-right font-mono text-xs font-semibold">{formatMetric(s.metrics.roc_auc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {scenarioChartData.length > 1 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarioChartData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-fg)' }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: 'var(--muted-fg)' }} />
                  <Tooltip
                    formatter={(v) => formatPercent(Number(v))}
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.75rem' }}
                  />
                  <Bar dataKey="Precision" fill="#eb001b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Recall" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="F1" fill="#ff5f00" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Generated Artifacts */}
      {result.artifacts && result.artifacts.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--foreground)' }}>Generated Artifacts & Dossiers</h3>
          <div className="space-y-3">
            {result.artifacts.map(artifact => {
              const artifactUrl = artifact.data_location?.startsWith('http') ? artifact.data_location : `${API_BASE_URL}${artifact.data_location || ''}`;
              const previewText = artifactPreview[artifact.artifact_id] || '';

              return (
                <div key={artifact.artifact_id} className="border rounded-xl p-3.5" style={{ borderColor: 'var(--border-color)', background: 'var(--surface-elevated)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <FileText size={15} style={{ color: '#ff5f00' }} />
                      <div>
                        <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{artifact.type}</p>
                        <p className="text-[10px]" style={{ color: 'var(--muted-fg)' }}>{artifact.format.toUpperCase()} • {artifact.count} items</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={artifactUrl} target="_blank" rel="noreferrer" className="btn btn-ghost text-[11px] px-2.5 py-1">
                        <Download size={12} />
                        Download
                      </a>
                      {artifact.format !== 'wav' && (
                        <button className="btn btn-ghost text-[11px] px-2.5 py-1" onClick={() => setExpandedArtifact(expandedArtifact === artifact.artifact_id ? null : artifact.artifact_id)}>
                          {expandedArtifact === artifact.artifact_id ? 'Hide preview' : 'Preview'}
                        </button>
                      )}
                    </div>
                  </div>

                  {artifact.format === 'wav' && artifactUrl && (
                    <div className="mt-3">
                      <audio controls className="w-full h-9 rounded-lg" src={artifactUrl} />
                    </div>
                  )}

                  {artifact.format !== 'wav' && expandedArtifact === artifact.artifact_id && previewText && (
                    <pre className="mt-3 max-h-52 overflow-auto rounded-lg bg-black/20 p-2.5 text-[10px] whitespace-pre-wrap font-mono" style={{ color: 'var(--foreground)', border: '1px solid var(--border-color)' }}>
                      {previewText}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual Sample Explanations */}
      {samples.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Sample-Level Explainability</h3>
              <p className="text-[0.7rem]" style={{ color: 'var(--muted-fg)' }}>Feature attributions and model decision factors per sample</p>
            </div>
            <span className="text-[0.65rem] font-mono" style={{ color: 'var(--muted-fg)' }}>
              {samples.length} evaluated
            </span>
          </div>
          <div className="space-y-2">
            {samples.map(sample => (
              <div key={sample.sample_id} className="card-compact transition-colors">
                <button
                  className="w-full flex items-center justify-between p-3.5 text-left hover:bg-zinc-800/20 rounded-lg transition-colors"
                  onClick={() => setExpandedSample(expandedSample === sample.sample_id ? null : sample.sample_id)}
                >
                  <div className="flex items-center gap-3">
                    {sample.prediction === 'fraud' ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <XCircle size={16} className="text-rose-400" />
                    )}
                    <span className="font-mono text-xs font-semibold">{sample.sample_id}</span>
                    <span className={`badge ${sample.decision === 'flagged' ? 'badge--failed' : 'badge--completed'}`}>
                      {sample.decision === 'flagged' ? 'Flagged (Fraud)' : 'Passed (Legit)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span style={{ color: 'var(--muted-fg)' }}>
                      Risk: <span className="font-bold font-mono" style={{ color: 'var(--foreground)' }}>{(sample.risk_score * 100).toFixed(0)}%</span>
                    </span>
                    {expandedSample === sample.sample_id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {expandedSample === sample.sample_id && (
                  <div className="px-4 pb-4 pt-0 border-t space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="grid grid-cols-4 gap-3 text-xs pt-3">
                      <div><span className="label">Ground Truth</span><span className="capitalize font-semibold">{sample.ground_truth}</span></div>
                      <div><span className="label">Prediction</span><span className="capitalize font-semibold">{sample.prediction}</span></div>
                      <div><span className="label">Confidence</span><span className="font-mono font-medium">{formatPercent(sample.confidence)}</span></div>
                      <div><span className="label">Risk Score</span><span className="font-mono font-bold" style={{ color: sample.risk_score >= 0.5 ? '#eb001b' : '#10b981' }}>{formatPercent(sample.risk_score)}</span></div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold mb-2" style={{ color: sample.decision === 'flagged' ? '#eb001b' : '#10b981' }}>
                        {sample.decision === 'flagged' ? '✓ Why was this flagged?' : '✗ Why was this passed?'}
                      </h4>
                      <ul className="space-y-1.5">
                        {sample.explanation.map((exp, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--muted-fg)' }}>
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                              style={{
                                background: exp.impact === 'high' ? '#eb001b' : exp.impact === 'medium' ? '#ff5f00' : 'var(--muted-fg)',
                              }}
                            />
                            <span>
                              <strong style={{ color: 'var(--foreground)' }}>{exp.feature}:</strong>{' '}
                              {exp.description}
                              {exp.value && <span className="font-mono text-[0.65rem]"> ({exp.value})</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
