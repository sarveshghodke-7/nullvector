/**
 * Module: app/history/page.tsx
 *
 * Purpose:
 * Run history page — shows all pipeline executions with full metadata.
 * Supports filtering by attack type and status.
 *
 * Layer: PAGE
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { runService } from '@/src/services/runService';
import { formatDateTime, attackIdToName } from '@/src/utils/formatters';
import { History, ArrowRight } from 'lucide-react';
import type { Run } from '@/src/types/runs';

export default function HistoryPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [filterAttack, setFilterAttack] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    runService.listRuns().then(setRuns);
  }, []);

  let filtered = runs;
  if (filterAttack) filtered = filtered.filter(r => r.attack_id === filterAttack);
  if (filterStatus) filtered = filtered.filter(r => r.status === filterStatus);
  const attackTypes = [...new Set(runs.map(r => r.attack_id))];

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight" style={{ color: 'var(--foreground)' }}>
            <History size={24} />
            Attack History
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-fg)' }}>
            Complete record of all pipeline executions for reproducibility.
          </p>
        </div>
        <div className="flex gap-2">
          <select className="select w-44" value={filterAttack} onChange={e => setFilterAttack(e.target.value)}>
            <option value="">All Attacks</option>
            {attackTypes.map(id => (<option key={id} value={id}>{attackIdToName(id)}</option>))}
          </select>
          <select className="select w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="generating">Generating</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs border-b" style={{ color: 'var(--muted-fg)', borderColor: 'var(--border-color)' }}>
              <th className="px-4 py-3 font-medium">Run ID</th>
              <th className="px-4 py-3 font-medium">Attack</th>
              <th className="px-4 py-3 font-medium">Scenario</th>
              <th className="px-4 py-3 font-medium text-right">Requested</th>
              <th className="px-4 py-3 font-medium text-right">Generated</th>
              <th className="px-4 py-3 font-medium text-right">Detected</th>
              <th className="px-4 py-3 font-medium text-right">Missed</th>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(run => (
              <tr key={run.run_id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                <td className="px-4 py-3 font-mono text-xs">{run.run_id}</td>
                <td className="px-4 py-3">{attackIdToName(run.attack_id)}</td>
                <td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--muted-fg)' }}>
                  {run.scenario.replace(/_/g, ' ')}
                </td>
                <td className="px-4 py-3 text-right">{run.requested_count}</td>
                <td className="px-4 py-3 text-right">{run.generated_count}</td>
                <td className="px-4 py-3 text-right text-emerald-500">{run.detected_count}</td>
                <td className="px-4 py-3 text-right text-red-400">{run.missed_count}</td>
                <td className="px-4 py-3 font-mono text-xs">{run.model_version}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-fg)' }}>
                  {formatDateTime(run.timestamp)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`badge badge--${run.status}`}>{run.status}</span>
                </td>
                <td className="px-4 py-3">
                  {run.status === 'completed' && (
                    <Link href={`/results/${run.run_id}`} className="text-blue-500 hover:text-blue-400">
                      <ArrowRight size={16} />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
