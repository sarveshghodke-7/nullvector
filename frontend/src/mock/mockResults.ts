/**
 * Module: src/mock/mockResults.ts
 *
 * Purpose: Pre-built mock detection results for demo runs.
 * Layer: MOCK
 *
 * IMPORTANT: All data is SYNTHETIC / DEMONSTRATION DATA.
 */

import type { AttackResult } from '@/src/types/results';

export const MOCK_RESULTS: Record<string, AttackResult> = {
  RUN_001: {
    run_id: 'RUN_001',
    attack_id: 'synthetic_identity',
    model_version: 'v1.0',
    timestamp: '2026-08-26T10:15:00Z',
    summary: { total_samples: 50, detected: 43, missed: 7, detection_rate: 0.86 },
    metrics: { precision: 0.88, recall: 0.86, f1: 0.87, roc_auc: 0.92, false_positive_rate: 0.04, false_negative_rate: 0.14 },
    confusion_matrix: { true_positive: 43, true_negative: 45, false_positive: 2, false_negative: 7 },
    scenario_breakdown: [
      { scenario_id: 'kyc_inconsistency', scenario_name: 'KYC Inconsistency', sample_count: 15, detected: 14, missed: 1, metrics: { precision: 0.93, recall: 0.93, f1: 0.93, roc_auc: 0.96 } },
      { scenario_id: 'behavioral_anomaly', scenario_name: 'Behavioral Anomaly', sample_count: 15, detected: 13, missed: 2, metrics: { precision: 0.87, recall: 0.87, f1: 0.87, roc_auc: 0.91 } },
      { scenario_id: 'multi_signal', scenario_name: 'Multi-Signal', sample_count: 20, detected: 16, missed: 4, metrics: { precision: 0.84, recall: 0.80, f1: 0.82, roc_auc: 0.88 } },
    ],
    status: 'completed',
  },
  RUN_002: {
    run_id: 'RUN_002',
    attack_id: 'deepfake_voice',
    model_version: 'v1.0',
    timestamp: '2026-08-26T09:42:00Z',
    summary: { total_samples: 20, detected: 18, missed: 2, detection_rate: 0.90 },
    metrics: { precision: 0.90, recall: 0.90, f1: 0.90, roc_auc: 0.94, false_positive_rate: 0.05, false_negative_rate: 0.10 },
    confusion_matrix: { true_positive: 18, true_negative: 19, false_positive: 1, false_negative: 2 },
    scenario_breakdown: [
      { scenario_id: 'bank_impersonation', scenario_name: 'Bank Impersonation', sample_count: 20, detected: 18, missed: 2, metrics: { precision: 0.90, recall: 0.90, f1: 0.90, roc_auc: 0.94 } },
    ],
    status: 'completed',
  },
  RUN_003: {
    run_id: 'RUN_003',
    attack_id: 'adversarial_perturbation',
    model_version: 'v1.0',
    timestamp: '2026-08-26T08:30:00Z',
    summary: { total_samples: 100, detected: 72, missed: 28, detection_rate: 0.72 },
    metrics: { precision: 0.78, recall: 0.72, f1: 0.75, roc_auc: 0.81, false_positive_rate: 0.08, false_negative_rate: 0.28 },
    confusion_matrix: { true_positive: 72, true_negative: 88, false_positive: 8, false_negative: 28 },
    scenario_breakdown: [
      { scenario_id: 'feature_perturbation', scenario_name: 'Multi-Feature Perturbation', sample_count: 100, detected: 72, missed: 28, metrics: { precision: 0.78, recall: 0.72, f1: 0.75, roc_auc: 0.81 } },
    ],
    status: 'completed',
  },
  RUN_004: {
    run_id: 'RUN_004',
    attack_id: 'fake_merchant',
    model_version: 'v1.0',
    timestamp: '2026-08-25T16:00:00Z',
    summary: { total_samples: 10, detected: 9, missed: 1, detection_rate: 0.90 },
    metrics: { precision: 0.90, recall: 0.90, f1: 0.90, roc_auc: 0.93, false_positive_rate: 0.05, false_negative_rate: 0.10 },
    confusion_matrix: { true_positive: 9, true_negative: 18, false_positive: 1, false_negative: 1 },
    scenario_breakdown: [
      { scenario_id: 'shell_business', scenario_name: 'Shell Business', sample_count: 10, detected: 9, missed: 1, metrics: { precision: 0.90, recall: 0.90, f1: 0.90, roc_auc: 0.93 } },
    ],
    status: 'completed',
  },
  RUN_005: {
    run_id: 'RUN_005',
    attack_id: 'synthetic_identity',
    model_version: 'v1.0',
    timestamp: '2026-08-25T14:20:00Z',
    summary: { total_samples: 25, detected: 23, missed: 2, detection_rate: 0.92 },
    metrics: { precision: 0.92, recall: 0.92, f1: 0.92, roc_auc: 0.95, false_positive_rate: 0.03, false_negative_rate: 0.08 },
    confusion_matrix: { true_positive: 23, true_negative: 24, false_positive: 1, false_negative: 2 },
    scenario_breakdown: [
      { scenario_id: 'kyc_inconsistency', scenario_name: 'KYC Inconsistency', sample_count: 25, detected: 23, missed: 2, metrics: { precision: 0.92, recall: 0.92, f1: 0.92, roc_auc: 0.95 } },
    ],
    status: 'completed',
  },
  RUN_006: {
    run_id: 'RUN_006',
    attack_id: 'adversarial_perturbation',
    model_version: 'v2.0',
    timestamp: '2026-08-25T11:00:00Z',
    summary: { total_samples: 200, detected: 134, missed: 66, detection_rate: 0.67 },
    metrics: { precision: 0.74, recall: 0.67, f1: 0.70, roc_auc: 0.76, false_positive_rate: 0.10, false_negative_rate: 0.33 },
    confusion_matrix: { true_positive: 134, true_negative: 170, false_positive: 18, false_negative: 66 },
    scenario_breakdown: [
      { scenario_id: 'boundary_search', scenario_name: 'Decision Boundary Search', sample_count: 200, detected: 134, missed: 66, metrics: { precision: 0.74, recall: 0.67, f1: 0.70, roc_auc: 0.76 } },
    ],
    status: 'completed',
  },
};
