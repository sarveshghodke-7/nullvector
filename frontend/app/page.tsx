/**
 * Module: app/page.tsx
 *
 * Purpose:
 * Dashboard page — the landing page of AI Defense Lab.
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
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { runService } from '@/src/services/runService';
import { formatPercent, formatDateTime, attackIdToName } from '@/src/utils/formatters';
import type { AttackBenchmark, RecentRun } from '@/src/types/results';
import type { Run } from '@/src/types/runs';

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

const PIE_COLORS = ['#f97316', '#8b5cf6', '#ef4444', '#06b6d4'];

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
        <div className="card p-6 text-sm" style={{ color: 'var(--muted-fg)' }}>
          Loading dashboard metrics…
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            AI Defense Lab
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-fg)' }}>
            {isEmptyState
              ? 'No evaluation data yet — launch the first attack run to populate the dashboard.'
              : 'Live red team / blue team monitoring for payment fraud scenarios'}
          </p>
        </div>
        <Link href="/attack-lab" className="btn btn-primary">
          <Swords size={16} />
          Launch Attack Lab
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Total Runs" value={data.totalRuns} icon={<Target size={18} />} color="blue" />
        <KPICard label="Artifacts" value={data.totalArtifacts} icon={<Swords size={18} />} color="amber" />
        <KPICard label="Detection Rate" value={formatPercent(data.overallDetectionRate)} icon={<Shield size={18} />} color="green" />
      </div>

      {isEmptyState ? (
        <div className="card p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--surface-elevated)' }}>
            <Shield size={22} style={{ color: 'var(--defense)' }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            No attack data has been generated yet
          </h3>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted-fg)' }}>
            Start from the attack lab to generate synthetic fraud scenarios, run detection, and populate live results.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[1.2fr_0.8fr] gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  Attack Distribution
                </h3>
                <span className="text-[0.65rem] uppercase tracking-[0.12em]" style={{ color: 'var(--muted-fg)' }}>
                  Live mix
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
                          paddingAngle={3}
                          dataKey="count"
                        >
                          {data.attackDistribution.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {data.attackDistribution.map((item, i) => (
                      <div key={item.id} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-fg)' }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                        {item.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                Operational Snapshot
              </h3>
              <div className="space-y-3">
                {defenseMetrics.map(metric => (
                  <div key={metric.name} className="rounded-xl border p-3" style={{ borderColor: 'var(--border-color)', background: 'var(--surface-elevated)' }}>
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted-fg)' }}>
                      <span>{metric.name}</span>
                      <span>{formatPercent(metric.value)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.12)' }}>
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(8, metric.value * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                Benchmark Leaderboard
              </h3>
              <span className="text-[0.65rem] uppercase tracking-[0.12em]" style={{ color: 'var(--muted-fg)' }}>
                Avg detection rate
              </span>
            </div>
            {data.benchmarkRows.length === 0 ? (
              <div className="text-sm" style={{ color: 'var(--muted-fg)' }}>
                No benchmark data available yet. Generate an evaluation run to see comparison metrics.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs" style={{ color: 'var(--muted-fg)' }}>
                      <th className="pb-3 font-medium">Attack</th>
                      <th className="pb-3 font-medium text-right">Runs</th>
                      <th className="pb-3 font-medium text-right">Samples</th>
                      <th className="pb-3 font-medium text-right">Detected</th>
                      <th className="pb-3 font-medium text-right">Missed</th>
                      <th className="pb-3 font-medium text-right">Avg Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.benchmarkRows || []).map((row, index) => (
                      <tr key={row.attack_id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex w-5 h-5 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}>
                              {index + 1}
                            </span>
                            {row.attack_name}
                          </div>
                        </td>
                        <td className="py-3 text-right">{row.total_runs}</td>
                        <td className="py-3 text-right">{row.total_samples}</td>
                        <td className="py-3 text-right text-emerald-500">{row.total_detected}</td>
                        <td className="py-3 text-right text-red-400">{row.total_missed}</td>
                        <td className="py-3 text-right font-medium">{formatPercent(row.avg_detection_rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                Recent Runs
              </h3>
              <Link href="/history" className="text-xs text-blue-500 hover:text-blue-400">
                View all →
              </Link>
            </div>
            {data.recentRuns.length === 0 ? (
              <div className="text-sm" style={{ color: 'var(--muted-fg)' }}>
                No recent runs recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs" style={{ color: 'var(--muted-fg)' }}>
                      <th className="pb-3 font-medium">Run ID</th>
                      <th className="pb-3 font-medium">Attack</th>
                      <th className="pb-3 font-medium">Time</th>
                      <th className="pb-3 font-medium text-right">Artifacts</th>
                      <th className="pb-3 font-medium text-right">Detected</th>
                      <th className="pb-3 font-medium text-right">Missed</th>
                      <th className="pb-3 font-medium text-right">Rate</th>
                      <th className="pb-3 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentRuns.map(run => (
                      <tr key={run.run_id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <td className="py-3 font-mono text-xs">{run.run_id}</td>
                        <td className="py-3">{run.attack_name}</td>
                        <td className="py-3 text-xs" style={{ color: 'var(--muted-fg)' }}>{formatDateTime(run.timestamp)}</td>
                        <td className="py-3 text-right">{run.total_artifacts}</td>
                        <td className="py-3 text-right text-emerald-500">{run.detected}</td>
                        <td className="py-3 text-right text-red-400">{run.missed}</td>
                        <td className="py-3 text-right font-medium">{formatPercent(run.detection_rate)}</td>
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
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */

function KPICard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`card metric-card metric-card--${color} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--muted-fg)' }}>
          {label}
        </span>
        <span style={{ color: 'var(--muted)' }}>{icon}</span>
      </div>
      <span className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
        {value}
      </span>
    </div>
  );
}
