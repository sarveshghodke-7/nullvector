/**
 * Module: app/results/[runId]/page.tsx
 *
 * Purpose:
 * Detailed result view for a single run. Shows detection metrics,
 * confusion matrix, Red vs Blue comparison, scenario breakdown,
 * and individual sample explanations.
 *
 * This is the strongest page of the prototype — designed to
 * communicate detection performance and explainability to judges.
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
  Download, FileText,
} from 'lucide-react';
import { API_BASE_URL } from '@/src/utils/config';
import type { AttackResult } from '@/src/types/results';
import type { SamplePrediction } from '@/src/types/detection';

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
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Run {runId}</h1>
        <div className="card p-8 text-center">
          <p className="text-sm mb-4" style={{ color: 'var(--muted-fg)' }}>
            No detection results yet. Run the defense to see results.
          </p>
          <button className="btn btn-success" onClick={handleDetect} disabled={detecting || !attackId}>
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
        <Link href="/results" className="hover:text-blue-500">Results</Link>
        <span>/</span>
        <span style={{ color: 'var(--foreground)' }}>{runId}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            Detection Results — {runId}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-fg)' }}>
            {attackIdToName(result.attack_id)} • Model {result.model_version}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: result.dataset_mode === 'balanced' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: result.dataset_mode === 'balanced' ? '#67e8b7' : '#fbbf24' }}>
            {datasetLabel}
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>Live evaluation</span>
        </div>
      </div>

      {/* Red vs Blue Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5" style={{ borderLeft: '4px solid var(--attack)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Swords size={16} style={{ color: 'var(--attack)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--attack)' }}>Red Team — Attack</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>Attack Type</span><span>{attackIdToName(result.attack_id)}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>Total Attacks</span><span>{result.summary.total_samples}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>Evasions (Missed)</span><span className="text-red-400 font-semibold">{result.summary.missed}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>Evasion Rate</span><span className="text-red-400">{formatPercent(1 - result.summary.detection_rate)}</span></div>
          </div>
        </div>
        <div className="card p-5" style={{ borderLeft: '4px solid var(--defense)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} style={{ color: 'var(--defense)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--defense)' }}>Blue Team — Defense</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>Model</span><span>{result.model_version}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>Detected</span><span className="text-emerald-500 font-semibold">{result.summary.detected}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>Detection Rate</span><span className="text-emerald-500">{formatPercent(result.summary.detection_rate)}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--muted-fg)' }}>False Positives</span><span className="text-amber-400">{cm.false_positive}</span></div>
          </div>
        </div>
      </div>

      {/* Metrics + Confusion Matrix Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Metrics */}
        <div className="col-span-1 space-y-3">
          {[
            { label: 'Precision', value: m.precision, color: 'blue' },
            { label: 'Recall', value: m.recall, color: 'green' },
            { label: 'F1 Score', value: m.f1, color: 'cyan' },
            { label: 'ROC-AUC', value: m.roc_auc, color: 'purple' },
          ].map(metric => (
            <div key={metric.label} className={`card metric-card metric-card--${metric.color} p-4`}>
              <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>{metric.label}</span>
              <span className="block text-xl font-bold mt-1">{formatMetric(metric.value)}</span>
            </div>
          ))}
        </div>

        {/* Confusion Matrix */}
        <div className="col-span-2 card p-5">
          <h3 className="text-sm font-semibold mb-4">Confusion Matrix</h3>
          <div className="grid grid-cols-[auto_1fr_1fr] gap-2 max-w-sm mx-auto">
            {/* Header */}
            <div />
            <div className="text-center text-xs font-medium pb-1" style={{ color: 'var(--muted-fg)' }}>Pred: Legit</div>
            <div className="text-center text-xs font-medium pb-1" style={{ color: 'var(--muted-fg)' }}>Pred: Fraud</div>
            {/* Row 1 */}
            <div className="flex items-center text-xs font-medium pr-2" style={{ color: 'var(--muted-fg)' }}>Actual: Legit</div>
            <div className="confusion-cell confusion-cell--tn">
              <span className="text-2xl font-bold">{cm.true_negative}</span>
              <span className="text-[0.65rem] mt-1">True Negative</span>
            </div>
            <div className="confusion-cell confusion-cell--fp">
              <span className="text-2xl font-bold">{cm.false_positive}</span>
              <span className="text-[0.65rem] mt-1">False Positive</span>
            </div>
            {/* Row 2 */}
            <div className="flex items-center text-xs font-medium pr-2" style={{ color: 'var(--muted-fg)' }}>Actual: Fraud</div>
            <div className="confusion-cell confusion-cell--fn">
              <span className="text-2xl font-bold">{cm.false_negative}</span>
              <span className="text-[0.65rem] mt-1">False Negative</span>
            </div>
            <div className="confusion-cell confusion-cell--tp">
              <span className="text-2xl font-bold">{cm.true_positive}</span>
              <span className="text-[0.65rem] mt-1">True Positive</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Breakdown */}
      {scenarioChartData.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">Performance by Scenario</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left text-xs" style={{ color: 'var(--muted-fg)' }}>
                  <th className="pb-2 font-medium">Scenario</th>
                  <th className="pb-2 font-medium text-right">Samples</th>
                  <th className="pb-2 font-medium text-right">Precision</th>
                  <th className="pb-2 font-medium text-right">Recall</th>
                  <th className="pb-2 font-medium text-right">F1</th>
                  <th className="pb-2 font-medium text-right">AUC</th>
                </tr>
              </thead>
              <tbody>
                {result.scenario_breakdown.map(s => (
                  <tr key={s.scenario_id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="py-2">{s.scenario_name}</td>
                    <td className="py-2 text-right">{s.sample_count}</td>
                    <td className="py-2 text-right">{formatMetric(s.metrics.precision)}</td>
                    <td className="py-2 text-right">{formatMetric(s.metrics.recall)}</td>
                    <td className="py-2 text-right">{formatMetric(s.metrics.f1)}</td>
                    <td className="py-2 text-right">{formatMetric(s.metrics.roc_auc)}</td>
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
                  <Bar dataKey="Precision" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Recall" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="F1" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {result.artifacts && result.artifacts.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">Generated Artifacts</h3>
          <div className="space-y-3">
            {result.artifacts.map(artifact => {
              const artifactUrl = artifact.data_location?.startsWith('http') ? artifact.data_location : `${API_BASE_URL}${artifact.data_location || ''}`;
              const previewText = artifactPreview[artifact.artifact_id] || '';

              return (
                <div key={artifact.artifact_id} className="border rounded-lg p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} style={{ color: 'var(--muted-fg)' }} />
                      <div>
                        <p className="text-xs font-semibold">{artifact.type}</p>
                        <p className="text-[10px]" style={{ color: 'var(--muted-fg)' }}>{artifact.format.toUpperCase()} • {artifact.count} items</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={artifactUrl} target="_blank" rel="noreferrer" className="btn btn-ghost text-[11px] px-2 py-1">
                        <Download size={12} />
                        Download
                      </a>
                      {artifact.format !== 'wav' && (
                        <button className="btn btn-ghost text-[11px] px-2 py-1" onClick={() => setExpandedArtifact(expandedArtifact === artifact.artifact_id ? null : artifact.artifact_id)}>
                          {expandedArtifact === artifact.artifact_id ? 'Hide preview' : 'Preview'}
                        </button>
                      )}
                    </div>
                  </div>

                  {artifact.format === 'wav' && artifactUrl && (
                    <div className="mt-3">
                      <audio controls className="w-full h-10" src={artifactUrl} />
                    </div>
                  )}

                  {artifact.format !== 'wav' && expandedArtifact === artifact.artifact_id && previewText && (
                    <pre className="mt-3 max-h-52 overflow-auto rounded bg-black/5 p-2 text-[10px] whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
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
          <h3 className="text-sm font-semibold mb-4">Sample-Level Analysis</h3>
          <div className="space-y-2">
            {samples.map(sample => (
              <div key={sample.sample_id} className="card-compact">
                <button
                  className="w-full flex items-center justify-between p-4 text-left"
                  onClick={() => setExpandedSample(expandedSample === sample.sample_id ? null : sample.sample_id)}
                >
                  <div className="flex items-center gap-3">
                    {sample.prediction === 'fraud' ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <XCircle size={16} className="text-red-400" />
                    )}
                    <span className="font-mono text-xs">{sample.sample_id}</span>
                    <span className={`badge ${sample.decision === 'flagged' ? 'badge--completed' : 'badge--failed'}`}>
                      {sample.decision}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span style={{ color: 'var(--muted-fg)' }}>Risk: <span className="font-medium" style={{ color: 'var(--foreground)' }}>{(sample.risk_score * 100).toFixed(0)}%</span></span>
                    {expandedSample === sample.sample_id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {expandedSample === sample.sample_id && (
                  <div className="px-4 pb-4 pt-0 border-t space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="grid grid-cols-4 gap-3 text-xs pt-3">
                      <div><span className="label">Ground Truth</span><span className="capitalize font-medium">{sample.ground_truth}</span></div>
                      <div><span className="label">Prediction</span><span className="capitalize font-medium">{sample.prediction}</span></div>
                      <div><span className="label">Confidence</span><span className="font-medium">{formatPercent(sample.confidence)}</span></div>
                      <div><span className="label">Risk Score</span><span className="font-medium">{formatPercent(sample.risk_score)}</span></div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold mb-2" style={{ color: sample.decision === 'flagged' ? 'var(--defense)' : 'var(--attack)' }}>
                        {sample.decision === 'flagged' ? '✓ Why was this flagged?' : '✗ Why was this missed?'}
                      </h4>
                      <ul className="space-y-1.5">
                        {sample.explanation.map((exp, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--muted-fg)' }}>
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                              style={{
                                background: exp.impact === 'high' ? '#f87171' : exp.impact === 'medium' ? '#fbbf24' : 'var(--muted-fg)',
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
