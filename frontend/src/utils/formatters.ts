/**
 * Module: src/utils/formatters.ts
 *
 * Purpose:
 * Utility functions for formatting numbers, dates, percentages,
 * and durations for display throughout the UI.
 *
 * Layer: UTILS
 *
 * Consumed by: All page and component files
 */

/** Format a number with locale-appropriate thousands separators */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/** Format a decimal as a percentage string, e.g. 0.87 → "87.0%" */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/** Format a metric value (0-1) as a display percentage */
export function formatMetric(value: number): string {
  return formatPercent(value, 1);
}

/** Format a risk score with 2 decimal places */
export function formatRiskScore(value: number): string {
  return value.toFixed(2);
}

/** Format an ISO timestamp to a readable date string */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Format an ISO timestamp to a readable date+time string */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format milliseconds to a human-readable duration */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/** Convert an attack_id to a human-readable name */
export function attackIdToName(id: string): string {
  const names: Record<string, string> = {
    synthetic_identity: 'Synthetic Identity',
    deepfake_voice: 'Deepfake Voice',
    adversarial_perturbation: 'Adversarial Perturbation',
    fake_merchant: 'Fake Merchant',
    account_takeover: 'Account Takeover',
    social_engineering: 'Social Engineering',
  };
  return names[id] || id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Get a status color class name */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'text-emerald-500',
    failed: 'text-red-500',
    in_progress: 'text-amber-500',
    generating: 'text-blue-500',
    detecting: 'text-cyan-500',
    pending: 'text-slate-500',
    generated: 'text-teal-500',
  };
  return colors[status] || 'text-slate-500';
}
