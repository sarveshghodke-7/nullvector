/**
 * Module: src/types/models.ts
 *
 * Purpose:
 * TypeScript interfaces for ML model metadata and versioning.
 *
 * Layer: TYPES
 *
 * Consumed by:
 * - src/services/modelService.ts
 * - Models page
 * - Learning/feedback page
 *
 * Backend contract: GET /api/v1/models
 */

import type { MetricSet } from './results';

/** A single model version record */
export interface ModelVersion {
  model_id: string;
  version: string;
  attack_id: string;
  model_type: string;       // e.g. "xgboost", "cnn", "spectrogram"
  trained_at: string;
  training_samples: number;
  performance: MetricSet;
  is_active: boolean;
}

/** Model info with version history */
export interface ModelInfo {
  model_id: string;
  attack_id: string;
  attack_name: string;
  description: string;
  current_version: string;
  versions: ModelVersion[];
}

/** Feedback/learning loop state */
export interface LearningState {
  current_model: ModelVersion;
  previous_model: ModelVersion | null;
  hard_examples_count: number;
  retraining_status: 'idle' | 'collecting' | 'retraining' | 'evaluating' | 'complete';
  performance_before: MetricSet | null;
  performance_after: MetricSet | null;
  improvement_delta: Partial<MetricSet> | null;
}
