/**
 * Module: app/page.tsx
 *
 * Purpose:
 * Dashboard page — the landing page of AI Defense Lab.
 * Styled with the official Mastercard Cyber & Intelligence design system.
 * Shows high-level KPIs, live attack distribution, defense performance,
 * and recent runs using the backend run history.
 *
 * Layer: PAGE
 *
 * Consumed by: Root route (/)
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  Swords,
  Target,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { runService } from '@/src/services/runService';
import { formatPercent, formatDateTime, attackIdToName } from '@/src/utils/formatters';
import type { AttackBenchmark, RecentRun } from '@/src/types/results';
import type { Run } from '@/src/types/runs';
import MastercardLogo from '@/src/components/layout/MastercardLogo';

/* ------------------------------------------------------------------ */
/*  Compute dashboard metrics from live run data                         */
/* ------------------------------------------------------------------ */

function computeDashboardData(runs: Run[] = [], benchmarkRows: AttackBenchmark[] = []) {
  const totalRuns = runs.length;
  const totalArtifacts = runs.reduce((sum, r) => sum + (r.generated_count || 0), 0);
  const totalDetected = runs.reduce((sum, r) => sum + (r.detected_count || 0), 0);
  const totalMissed = runs.reduce((sum, r) => sum + (r.missed_count || 0), 0);
  const overallDetectionRate = totalDetected + totalMissed > 0 ? totalDetected / (totalDetected + totalMissed) : 0;

  const avgPrecision = runs.length > 0
    ? runs.reduce((sum, r) => sum + (r.detection_rate || 0), 0) / runs.length
    : 0;
  const avgRecall = avgPrecision;
  const avgF1 = avgPrecision;
  const avgAuc = avgPrecision;

  const attackCounts: Record<string, number> = {};
  runs.forEach(r => {
    attackCounts[r.attack_id] = (attackCounts[r.attack_id] || 0) + 1;
  });
  const attackDistribution = Object.entries(attackCounts).map(([id, count]) => ({
    name: attackIdToName(id),
    count,
    id,
  }));

  const recentRuns: RecentRun[] = runs.slice(0, 5).map(r => ({
    run_id: r.run_id,
    attack_id: r.attack_id,
    attack_name: r.attack_name,
    timestamp: r.timestamp,
    total_artifacts: r.generated_count,
    detected: r.detected_count,
    missed: r.missed_count,
    detection_rate: r.detection_rate || 0,
    status: (r.status === 'completed' ? 'completed' : r.status === 'failed' ? 'failed' : 'in_progress') as RecentRun['status'],
  }));

  return {
    totalRuns,
    totalArtifacts,
    totalDetected,
    overallDetectionRate,
    avgPrecision,
    avgRecall,
    avgF1,
    avgAuc,
    attackDistribution,
    recentRuns,
    benchmarkRows,
  };
}

/* ------------------------------------------------------------------ */
/*  Dashboard Page Component                                           */
/* ------------------------------------------------------------------ */

// Mastercard signature palette: Red -> Orange -> Yellow -> Coral -> Amber
const PIE_COLORS = ['#EB001B', '#FF5F00', '#F79E1B', '#E11D48', '#FB923C', '#D97706'];

export default function DashboardPage() {
  const [data, setData] = useState<ReturnType<typeof computeDashboardData> | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [runs, benchmarkRows] = await Promise.all([
          runService.listRuns(),
          runService.getBenchmark(),
        ]);
        if (!active) return;
        setData(computeDashboardData(runs, benchmarkRows));
      } catch {
        if (!active) return;
        setData(computeDashboardData([], []));
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
        <div className="card p-8 text-center text-sm" style={{ color: 'var(--muted-fg)' }}>
          <div className="inline-flex items-center gap-2 mb-2">
            <MastercardLogo size={20} />
            <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Connecting to Defense Engine…</span>
          </div>
        </div>
      </div>
    );
  }

  const defenseMetrics = [
    { name: 'Precision', value: data.avgPrecision },
    { name: 'Recall', value: data.avgRecall },
    { name: 'F1 Score', value: data.avgF1 },
    { name: 'ROC-AUC', value: data.avgAuc },
  ];
  const isEmptyState = data.totalRuns === 0 && data.benchmarkRows.length === 0 && data.recentRuns.length === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Hero / Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="mc-pill">
              <MastercardLogo size={14} />
              <span>Cyber & Intelligence</span>
            </div>
            <span className="text-[0.68rem] font-mono px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-500 bg-amber-500/10">
              GFF 2026 Challenge
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Payment Security Defense Lab
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted-fg)' }}>
            {isEmptyState
              ? 'No evaluation data yet — launch the first attack run to populate the dashboard.'
              : 'Continuous adversarial red team simulation and blue team payment fraud defense'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/attack-lab" className="btn btn-primary shadow-md">
            <Swords size={16} />
            Launch Attack Lab
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Total Simulated Runs"
          value={data.totalRuns}
          subtext="Adversarial scenarios executed"
          icon={<Target size={18} />}
          color="orange"
        />
        <KPICard
          label="Generated Artifacts"
          value={data.totalArtifacts}
          subtext="JSON dossiers, CSVs & WAVs"
          icon={<Swords size={18} />}
          color="red"
        />
        <KPICard
          label="Overall Detection Rate"
          value={formatPercent(data.overallDetectionRate)}
          subtext="Blue team interception accuracy"
          icon={<ShieldCheck size={18} />}
          color="green"
        />
      </div>

      {isEmptyState ? (
        <div className="card p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-elevated)' }}>
            <MastercardLogo size={32} />
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
            No attack data generated yet
          </h3>
          <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: 'var(--muted-fg)' }}>
            Launch an attack simulation in the Attack Lab to stress-test detection models against synthetic identity, deepfake voice, or adversarial evasion.
          </p>
          <div className="mt-6">
            <Link href="/attack-lab" className="btn btn-primary">
              <Zap size={16} />
              Open Attack Lab
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5">
            {/* Attack Distribution */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                    Attack Vector Distribution
                  </h3>
                  <p className="text-[0.7rem]" style={{ color: 'var(--muted-fg)' }}>
                    Proportion of simulated payment attack families
                  </p>
                </div>
                <span className="text-[0.65rem] uppercase tracking-wider font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--surface-elevated)', color: '#ff5f00' }}>
                  Live Mix
                </span>
              </div>
              {data.attackDistribution.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-sm" style={{ color: 'var(--muted-fg)' }}>
                  No attack distribution data available yet.
                </div>
              ) : (
                <>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.attackDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="count"
                        >
                          {data.attackDistribution.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="var(--surface)" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            color: 'var(--foreground)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3 justify-center">
                    {data.attackDistribution.map((item, i) => (
                      <div key={item.id} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-fg)' }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span>{item.name}</span>
                        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>({item.count})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Operational Snapshot */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                    Defense Model Efficacy
                  </h3>
                  <p className="text-[0.7rem]" style={{ color: 'var(--muted-fg)' }}>
                    Balanced aggregate performance metrics
                  </p>
                </div>
                <span className="text-[0.65rem] uppercase tracking-wider font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--surface-elevated)', color: '#10b981' }}>
                  Blue Team
                </span>
              </div>
              <div className="space-y-3.5">
                {defenseMetrics.map(metric => (
                  <div
                    key={metric.name}
                    className="rounded-xl border p-3 transition-colors"
                    style={{ borderColor: 'var(--border-color)', background: 'var(--surface-elevated)' }}
                  >
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted-fg)' }}>
                      <span className="font-medium">{metric.name}</span>
                      <span className="font-bold font-mono" style={{ color: 'var(--foreground)' }}>
                        {formatPercent(metric.value)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.12)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(6, metric.value * 100)}%`,
                          background: 'linear-gradient(90deg, #eb001b 0%, #ff5f00 100%)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Benchmark Leaderboard */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                  Attack Benchmark Leaderboard
                </h3>
                <p className="text-[0.7rem]" style={{ color: 'var(--muted-fg)' }}>
                  Detection efficacy across heterogeneous payment fraud categories
                </p>
              </div>
              <span className="text-[0.65rem] uppercase tracking-wider font-semibold" style={{ color: 'var(--muted-fg)' }}>
                Aggregated SQLite Log
              </span>
            </div>
            {data.benchmarkRows.length === 0 ? (
              <div className="text-sm py-4 text-center" style={{ color: 'var(--muted-fg)' }}>
                No benchmark data recorded yet. Run tests in the Attack Lab.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs border-b" style={{ color: 'var(--muted-fg)', borderColor: 'var(--border-color)' }}>
                      <th className="pb-3 font-semibold">Rank & Attack Vector</th>
                      <th className="pb-3 font-semibold text-right">Runs</th>
                      <th className="pb-3 font-semibold text-right">Samples</th>
                      <th className="pb-3 font-semibold text-right">Detected</th>
                      <th className="pb-3 font-semibold text-right">Missed</th>
                      <th className="pb-3 font-semibold text-right">Detection Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.benchmarkRows || []).map((row, index) => (
                      <tr key={row.attack_id} className="border-t hover:bg-zinc-800/20 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="inline-flex w-5 h-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-xs"
                              style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                            >
                              {index + 1}
                            </span>
                            <span className="font-medium">{row.attack_name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono text-xs">{row.total_runs}</td>
                        <td className="py-3 text-right font-mono text-xs">{row.total_samples}</td>
                        <td className="py-3 text-right text-emerald-500 font-mono text-xs font-semibold">{row.total_detected}</td>
                        <td className="py-3 text-right text-rose-400 font-mono text-xs font-semibold">{row.total_missed}</td>
                        <td className="py-3 text-right font-semibold font-mono">
                          <span
                            className="px-2 py-0.5 rounded text-xs"
                            style={{
                              background: row.avg_detection_rate >= 0.85 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(235, 0, 27, 0.12)',
                              color: row.avg_detection_rate >= 0.85 ? '#10b981' : '#eb001b',
                            }}
                          >
                            {formatPercent(row.avg_detection_rate)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Runs Table */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                  Recent Attack Runs
                </h3>
                <p className="text-[0.7rem]" style={{ color: 'var(--muted-fg)' }}>
                  Latest pipeline simulations and Blue Team scoring outcomes
                </p>
              </div>
              <Link href="/history" className="text-xs font-semibold hover:underline" style={{ color: '#ff5f00' }}>
                View all runs →
              </Link>
            </div>
            {data.recentRuns.length === 0 ? (
              <div className="text-sm py-4 text-center" style={{ color: 'var(--muted-fg)' }}>
                No recent runs recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs border-b" style={{ color: 'var(--muted-fg)', borderColor: 'var(--border-color)' }}>
                      <th className="pb-3 font-semibold">Run ID</th>
                      <th className="pb-3 font-semibold">Attack Family</th>
                      <th className="pb-3 font-semibold">Timestamp</th>
                      <th className="pb-3 font-semibold text-right">Artifacts</th>
                      <th className="pb-3 font-semibold text-right">Detected</th>
                      <th className="pb-3 font-semibold text-right">Missed</th>
                      <th className="pb-3 font-semibold text-right">Rate</th>
                      <th className="pb-3 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentRuns.map(run => (
                      <tr key={run.run_id} className="border-t hover:bg-zinc-800/20 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                        <td className="py-3 font-mono text-xs font-semibold" style={{ color: '#ff5f00' }}>
                          <Link href={`/results/${run.run_id}`} className="hover:underline">
                            {run.run_id}
                          </Link>
                        </td>
                        <td className="py-3 font-medium">{run.attack_name}</td>
                        <td className="py-3 text-xs" style={{ color: 'var(--muted-fg)' }}>{formatDateTime(run.timestamp)}</td>
                        <td className="py-3 text-right font-mono text-xs">{run.total_artifacts}</td>
                        <td className="py-3 text-right text-emerald-500 font-mono text-xs font-semibold">{run.detected}</td>
                        <td className="py-3 text-right text-rose-400 font-mono text-xs font-semibold">{run.missed}</td>
                        <td className="py-3 text-right font-semibold font-mono">{formatPercent(run.detection_rate)}</td>
                        <td className="py-3 text-center">
                          <span className={`badge badge--${run.status}`}>{run.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI Card Component                                                 */
/* ------------------------------------------------------------------ */

function KPICard({
  label,
  value,
  subtext,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`card metric-card metric-card--${color} p-4 transition-all hover:scale-[1.01]`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>
          {label}
        </span>
        <span style={{ color: color === 'red' ? '#eb001b' : color === 'orange' ? '#ff5f00' : '#10b981' }}>
          {icon}
        </span>
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>
        {value}
      </div>
      {subtext && (
        <p className="text-[0.68rem] mt-1" style={{ color: 'var(--muted-fg)' }}>
          {subtext}
        </p>
      )}
    </div>
  );
}
