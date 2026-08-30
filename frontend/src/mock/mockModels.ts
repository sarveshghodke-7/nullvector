/**
 * Module: src/mock/mockModels.ts
 *
 * Purpose: Mock ML model information for the models and learning pages.
 * Layer: MOCK
 *
 * IMPORTANT: All data is SYNTHETIC / DEMONSTRATION DATA.
 */

import type { ModelInfo } from '@/src/types/models';

export const MOCK_MODELS: ModelInfo[] = [
  {
    model_id: 'xgb_synthetic_identity',
    attack_id: 'synthetic_identity',
    attack_name: 'Synthetic Identity Fraud',
    description: 'XGBoost gradient-boosted classifier trained on tabular behavioral features for synthetic identity detection.',
    current_version: 'v1.0',
    versions: [
      {
        model_id: 'xgb_synthetic_identity',
        version: 'v1.0',
        attack_id: 'synthetic_identity',
        model_type: 'XGBoost',
        trained_at: '2026-08-20T08:00:00Z',
        training_samples: 12500,
        performance: { precision: 0.88, recall: 0.86, f1: 0.87, roc_auc: 0.92 },
        is_active: true,
      },
    ],
  },
  {
    model_id: 'deepfake_detector',
    attack_id: 'deepfake_voice',
    attack_name: 'Deepfake Voice Social Engineering',
    description: 'CNN-based spectrogram analysis model for detecting AI-generated voice artifacts.',
    current_version: 'v1.0',
    versions: [
      {
        model_id: 'deepfake_detector',
        version: 'v1.0',
        attack_id: 'deepfake_voice',
        model_type: 'CNN',
        trained_at: '2026-08-18T12:00:00Z',
        training_samples: 5000,
        performance: { precision: 0.90, recall: 0.90, f1: 0.90, roc_auc: 0.94 },
        is_active: true,
      },
    ],
  },
  {
    model_id: 'xgb_fraud_classifier',
    attack_id: 'adversarial_perturbation',
    attack_name: 'Adversarial Perturbation Attack',
    description: 'XGBoost fraud detection model — the target of adversarial perturbation attacks. Includes adversarial retraining capability.',
    current_version: 'v2.0',
    versions: [
      {
        model_id: 'xgb_fraud_classifier',
        version: 'v2.0',
        attack_id: 'adversarial_perturbation',
        model_type: 'XGBoost',
        trained_at: '2026-08-24T10:00:00Z',
        training_samples: 25000,
        performance: { precision: 0.82, recall: 0.78, f1: 0.80, roc_auc: 0.87 },
        is_active: true,
      },
      {
        model_id: 'xgb_fraud_classifier',
        version: 'v1.0',
        attack_id: 'adversarial_perturbation',
        model_type: 'XGBoost',
        trained_at: '2026-08-15T08:00:00Z',
        training_samples: 15000,
        performance: { precision: 0.78, recall: 0.72, f1: 0.75, roc_auc: 0.81 },
        is_active: false,
      },
    ],
  },
  {
    model_id: 'merchant_risk_model',
    attack_id: 'fake_merchant',
    attack_name: 'Fake Merchant / Invoice Fraud',
    description: 'XGBoost merchant risk scoring model with invoice anomaly detection.',
    current_version: 'v1.0',
    versions: [
      {
        model_id: 'merchant_risk_model',
        version: 'v1.0',
        attack_id: 'fake_merchant',
        model_type: 'XGBoost',
        trained_at: '2026-08-22T14:00:00Z',
        training_samples: 8000,
        performance: { precision: 0.90, recall: 0.90, f1: 0.90, roc_auc: 0.93 },
        is_active: true,
      },
    ],
  },
];
