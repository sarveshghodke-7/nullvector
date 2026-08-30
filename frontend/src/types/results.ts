import type { SamplePrediction } from './detection';
import type { GeneratedArtifact } from './generation';

/**
 * Module: src/types/results.ts
 *
 * Purpose:
 * TypeScript interfaces for attack results, metrics, and evaluation.
 * This is the common result schema consumed by the results page.
 * All attack types produce results conforming to these interfaces.
 *
 * Layer: TYPES
 *
 * Consumed by:
 * - src/services/runService.ts
 * - Results pages and chart components
 * - src/utils/adapters.ts
 *
 * Backend contract: GET /api/v1/runs/{run_id}/results
 */

/** Standard ML classification metrics */
export interface MetricSet {
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  false_positive_rate?: number;
  false_negative_rate?: number;
}

/** 2×2 confusion matrix values */
export interface ConfusionMatrixData {
  true_positive: number;
  true_negative: number;
  false_positive: number;
  false_negative: number;
}

/** Per-scenario performance breakdown */
export interface ScenarioMetric {
  scenario_id: string;
  scenario_name: string;
  sample_count: number;
  detected: number;
  missed: number;
  metrics: MetricSet;
}

/** Summary-level detection statistics */
export interface DetectionSummary {
  total_samples: number;
  detected: number;
  missed: number;
  detection_rate: number;
}

/**
 * AttackResult — the unified result object for any attack run.
 *
 * This is the frontend's normalized view of detection results.
 * The adapter layer (src/utils/adapters.ts) converts attack-specific
 * backend responses into this common format.
 */
export interface AttackResult {
  run_id: string;
  attack_id: string;
  model_version: string;
  timestamp: string;
  dataset_mode?: 'balanced' | 'fraud_only' | string;
  summary: DetectionSummary;
  metrics: MetricSet;
  confusion_matrix: ConfusionMatrixData;
  scenario_breakdown: ScenarioMetric[];
  artifacts?: GeneratedArtifact[];
  predictions?: SamplePrediction[];
  status: 'completed' | 'failed' | 'partial';
}

/** Aggregated benchmark view by attack family */
export interface AttackBenchmark {
  attack_id: string;
  attack_name: string;
  total_runs: number;
  total_samples: number;
  total_detected: number;
  total_missed: number;
  avg_detection_rate: number;
}

/** Dashboard-level aggregated statistics */
export interface DashboardMetrics {
  total_runs: number;
  total_artifacts: number;
  total_detected: number;
  overall_detection_rate: number;
  overall_false_positive_rate: number;
  overall_false_negative_rate: number;
  average_risk_score: number;
  current_model_version: string;
  attack_distribution: { attack_id: string; count: number }[];
  defense_performance: MetricSet;
  recent_runs: RecentRun[];
}

/** A run entry for the recent runs table on the dashboard */
export interface RecentRun {
  run_id: string;
  attack_id: string;
  attack_name: string;
  timestamp: string;
  total_artifacts: number;
  detected: number;
  missed: number;
  detection_rate: number;
  status: 'completed' | 'failed' | 'in_progress';
}
