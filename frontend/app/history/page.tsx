/**
 * Module: app/history/page.tsx
 *
 * Purpose:
 * Run history page — shows all pipeline executions with full metadata.
 * Supports filtering by attack type and status.
 * Styled with Mastercard Cyber & Intelligence design system.
 *
 * Layer: PAGE
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { runService } from '@/src/services/runService';
import { formatDateTime, attackIdToName } from '@/src/utils/formatters';
import { History, ArrowRight, Filter } from 'lucide-react';
import type { Run } from '@/src/types/runs';
import MastercardLogo from '@/src/components/layout/MastercardLogo';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="mc-pill">
              <MastercardLogo size={14} />
              <span>Audit Ledger</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--foreground)' }}>
            <History size={22} style={{ color: '#eb001b' }} />
            Attack Simulation History
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted-fg)' }}>
            Immutable chronological audit log of all Red Team generations and Blue Team defense decisions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} style={{ color: 'var(--muted-fg)' }} />
          <select className="select w-44 text-xs" value={filterAttack} onChange={e => setFilterAttack(e.target.value)}>
            <option value="">All Attack Vectors</option>
            {attackTypes.map(id => (<option key={id} value={id}>{attackIdToName(id)}</option>))}
          </select>
          <select className="select w-36 text-xs" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="generating">Generating</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs border-b" style={{ color: 'var(--muted-fg)', borderColor: 'var(--border-color)', background: 'var(--surface-elevated)' }}>
                <th className="px-4 py-3.5 font-semibold">Run ID</th>
                <th className="px-4 py-3.5 font-semibold">Attack Vector</th>
                <th className="px-4 py-3.5 font-semibold">Scenario</th>
                <th className="px-4 py-3.5 font-semibold text-right">Req</th>
                <th className="px-4 py-3.5 font-semibold text-right">Gen</th>
                <th className="px-4 py-3.5 font-semibold text-right">Detected</th>
                <th className="px-4 py-3.5 font-semibold text-right">Missed</th>
                <th className="px-4 py-3.5 font-semibold">Model</th>
                <th className="px-4 py-3.5 font-semibold">Timestamp</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-4 py-3.5 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-xs" style={{ color: 'var(--muted-fg)' }}>
                    No execution logs matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(run => (
                  <tr key={run.run_id} className="border-t hover:bg-zinc-800/20 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: '#ff5f00' }}>
                      <Link href={`/results/${run.run_id}`} className="hover:underline">
                        {run.run_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium">{attackIdToName(run.attack_id)}</td>
                    <td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--muted-fg)' }}>
                      {run.scenario.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{run.requested_count}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{run.generated_count}</td>
                    <td className="px-4 py-3 text-right text-emerald-500 font-mono text-xs font-bold">{run.detected_count}</td>
                    <td className="px-4 py-3 text-right text-rose-400 font-mono text-xs font-bold">{run.missed_count}</td>
                    <td className="px-4 py-3 font-mono text-xs">{run.model_version}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--muted-fg)' }}>
                      {formatDateTime(run.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge badge--${run.status}`}>{run.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {run.status === 'completed' && (
                        <Link
                          href={`/results/${run.run_id}`}
                          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[#ff5f00]/15"
                          style={{ color: '#ff5f00' }}
                        >
                          <ArrowRight size={15} />
                        </Link>
                      )}
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
