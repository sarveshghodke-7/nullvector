/**
 * Module: src/utils/adapters.ts
 *
 * Purpose:
 * Adapter functions that normalize attack-specific backend responses
 * into the common frontend data model. Each attack module can provide
 * differently shaped responses; adapters ensure the UI always works
 * with consistent types.
 *
 * Layer: UTILS / ADAPTER
 *
 * Consumed by:
 * - src/services/attackService.ts
 * - src/services/runService.ts
 *
 * Backend contract: Adapts varied backend payloads → common frontend types
 */

import type { AttackResult, MetricSet, ConfusionMatrixData, DetectionSummary } from '@/src/types/results';

/**
 * Normalize a raw backend detection response into an AttackResult.
 *
 * This adapter handles variations in backend response structure.
 * If a backend team changes their response shape, only this function
 * needs to be updated — not every UI component.
 */
export function adaptDetectionResponse(raw: Record<string, unknown>): AttackResult {
  const payload = (raw.payload || raw) as Record<string, unknown>;

  const summary: DetectionSummary = adaptSummary(payload.summary as Record<string, unknown> || payload);
  const metrics: MetricSet = adaptMetrics(payload.metrics as Record<string, unknown> || {});
  const confusionMatrix: ConfusionMatrixData = adaptConfusionMatrix(
    payload.confusion_matrix as Record<string, unknown> || {}
  );

  return {
    run_id: (raw.run_id as string) || '',
    attack_id: (raw.attack_id as string) || '',
    model_version: (payload.model_version as string) || (payload.model_id as string) || 'unknown',
    timestamp: (raw.timestamp as string) || new Date().toISOString(),
    dataset_mode: (payload.dataset_mode as AttackResult['dataset_mode']) || 'balanced',
    summary,
    metrics,
    confusion_matrix: confusionMatrix,
    scenario_breakdown: Array.isArray(payload.scenario_breakdown)
      ? payload.scenario_breakdown
      : [],
    artifacts: Array.isArray(payload.artifacts)
      ? payload.artifacts as AttackResult['artifacts']
      : [],
    status: (payload.status as AttackResult['status']) || 'completed',
  };
}

function adaptSummary(raw: Record<string, unknown>): DetectionSummary {
  const total = (raw.total_samples as number) || 0;
  const detected = (raw.detected as number) || 0;
  const missed = (raw.missed as number) || total - detected;
  return {
    total_samples: total,
    detected,
    missed,
    detection_rate: total > 0 ? detected / total : 0,
  };
}

function adaptMetrics(raw: Record<string, unknown>): MetricSet {
  return {
    precision: (raw.precision as number) || 0,
    recall: (raw.recall as number) || 0,
    f1: (raw.f1 as number) || 0,
    roc_auc: (raw.roc_auc as number) || (raw.auc_roc as number) || 0,
    false_positive_rate: raw.false_positive_rate as number | undefined,
    false_negative_rate: raw.false_negative_rate as number | undefined,
  };
}

function adaptConfusionMatrix(raw: Record<string, unknown>): ConfusionMatrixData {
  return {
    true_positive: (raw.true_positive as number) || 0,
    true_negative: (raw.true_negative as number) || 0,
    false_positive: (raw.false_positive as number) || 0,
    false_negative: (raw.false_negative as number) || 0,
  };
}
