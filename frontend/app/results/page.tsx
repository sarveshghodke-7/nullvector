/**
 * Module: app/results/page.tsx
 *
 * Purpose:
 * Results overview — lists all completed runs with their detection metrics.
 *
 * Layer: PAGE
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { runService } from '@/src/services/runService';
import { formatPercent, formatDateTime, attackIdToName } from '@/src/utils/formatters';
import { ArrowRight } from 'lucide-react';
import type { Run } from '@/src/types/runs';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Results</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-fg)' }}>
            Detection results for all completed runs.
          </p>
        </div>
        <select
          className="select w-48"
          value={filterAttack}
          onChange={e => setFilterAttack(e.target.value)}
        >
          <option value="">All Attacks</option>
          {attackTypes.map(id => (
            <option key={id} value={id}>{attackIdToName(id)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs border-b" style={{ color: 'var(--muted-fg)', borderColor: 'var(--border-color)' }}>
              <th className="px-5 py-3 font-medium">Run ID</th>
              <th className="px-5 py-3 font-medium">Attack</th>
              <th className="px-5 py-3 font-medium">Scenario</th>
              <th className="px-5 py-3 font-medium text-right">Samples</th>
              <th className="px-5 py-3 font-medium text-right">Detected</th>
              <th className="px-5 py-3 font-medium text-right">Missed</th>
              <th className="px-5 py-3 font-medium text-right">Detection Rate</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {completedRuns.map(run => (
              <tr
                key={run.run_id}
                className="border-t hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <td className="px-5 py-3 font-mono text-xs">{run.run_id}</td>
                <td className="px-5 py-3">{attackIdToName(run.attack_id)}</td>
                <td className="px-5 py-3 text-xs capitalize" style={{ color: 'var(--muted-fg)' }}>
                  {run.scenario.replace(/_/g, ' ')}
                </td>
                <td className="px-5 py-3 text-right">{run.generated_count}</td>
                <td className="px-5 py-3 text-right text-emerald-500">{run.detected_count}</td>
                <td className="px-5 py-3 text-right text-red-400">{run.missed_count}</td>
                <td className="px-5 py-3 text-right font-medium">
                  {run.detection_rate !== null ? formatPercent(run.detection_rate) : '—'}
                </td>
                <td className="px-5 py-3 text-xs" style={{ color: 'var(--muted-fg)' }}>
                  {formatDateTime(run.timestamp)}
                </td>
                <td className="px-5 py-3">
                  <Link href={`/results/${run.run_id}`} className="text-blue-500 hover:text-blue-400">
                    <ArrowRight size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
