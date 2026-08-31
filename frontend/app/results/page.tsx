/**
 * Module: app/results/page.tsx
 *
 * Purpose:
 * Results overview — lists all completed runs with their detection metrics.
 * Styled with Mastercard Cyber & Intelligence design system.
 *
 * Layer: PAGE
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { runService } from '@/src/services/runService';
import { formatPercent, formatDateTime, attackIdToName } from '@/src/utils/formatters';
import { ArrowRight, BarChart3, Filter } from 'lucide-react';
import type { Run } from '@/src/types/runs';
import MastercardLogo from '@/src/components/layout/MastercardLogo';

export default function ResultsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [filterAttack, setFilterAttack] = useState('');

  useEffect(() => {
    runService.listRuns().then(setRuns);
  }, []);

  const filtered = filterAttack ? runs.filter(r => r.attack_id === filterAttack) : runs;
  const completedRuns = filtered.filter(r => r.status === 'completed');
  const attackTypes = [...new Set(runs.map(r => r.attack_id))];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="mc-pill">
              <MastercardLogo size={14} />
              <span>Blue Team Defense</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--foreground)' }}>
            <BarChart3 size={22} style={{ color: '#ff5f00' }} />
            Detection Results & Benchmark
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted-fg)' }}>
            Historical evaluation outcomes, evasion rates, and model triage decisions across simulated attack runs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} style={{ color: 'var(--muted-fg)' }} />
          <select
            className="select w-48 text-xs"
            value={filterAttack}
            onChange={e => setFilterAttack(e.target.value)}
          >
            <option value="">All Attack Vectors</option>
            {attackTypes.map(id => (
              <option key={id} value={id}>{attackIdToName(id)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs border-b" style={{ color: 'var(--muted-fg)', borderColor: 'var(--border-color)', background: 'var(--surface-elevated)' }}>
                <th className="px-5 py-3.5 font-semibold">Run ID</th>
                <th className="px-5 py-3.5 font-semibold">Attack Family</th>
                <th className="px-5 py-3.5 font-semibold">Scenario</th>
                <th className="px-5 py-3.5 font-semibold text-right">Samples</th>
                <th className="px-5 py-3.5 font-semibold text-right">Detected</th>
                <th className="px-5 py-3.5 font-semibold text-right">Missed</th>
                <th className="px-5 py-3.5 font-semibold text-right">Detection Rate</th>
                <th className="px-5 py-3.5 font-semibold">Date & Time</th>
                <th className="px-5 py-3.5 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {completedRuns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-xs" style={{ color: 'var(--muted-fg)' }}>
                    No completed evaluation runs found. Launch an attack from the Attack Lab to populate results.
                  </td>
                </tr>
              ) : (
                completedRuns.map(run => (
                  <tr
                    key={run.run_id}
                    className="border-t hover:bg-zinc-800/20 transition-colors"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold" style={{ color: '#ff5f00' }}>
                      <Link href={`/results/${run.run_id}`} className="hover:underline">
                        {run.run_id}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-medium">{attackIdToName(run.attack_id)}</td>
                    <td className="px-5 py-3.5 text-xs capitalize" style={{ color: 'var(--muted-fg)' }}>
                      {run.scenario.replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs">{run.generated_count}</td>
                    <td className="px-5 py-3.5 text-right text-emerald-500 font-mono text-xs font-bold">{run.detected_count}</td>
                    <td className="px-5 py-3.5 text-right text-rose-400 font-mono text-xs font-bold">{run.missed_count}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold">
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          background: (run.detection_rate ?? 0) >= 0.8 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(235, 0, 27, 0.12)',
                          color: (run.detection_rate ?? 0) >= 0.8 ? '#10b981' : '#eb001b',
                        }}
                      >
                        {run.detection_rate !== null ? formatPercent(run.detection_rate) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono" style={{ color: 'var(--muted-fg)' }}>
                      {formatDateTime(run.timestamp)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/results/${run.run_id}`}
                        className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[#ff5f00]/15"
                        style={{ color: '#ff5f00' }}
                      >
                        <ArrowRight size={15} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
