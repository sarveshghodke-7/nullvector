/**
 * Module: src/registry/definitions/syntheticIdentity.ts
 *
 * Purpose:
 * AttackDefinition for the Synthetic Identity Fraud attack module.
 * Describes all configuration fields, scenarios, artifacts, and endpoints.
 *
 * Layer: REGISTRY / DEFINITION
 * Attack association: synthetic_identity
 */

import type { AttackDefinition } from '@/src/types/attacks';

export const syntheticIdentityAttack: AttackDefinition = {
  id: 'synthetic_identity',
  name: 'Synthetic Identity Fraud',
  description: 'Generate synthetic customer identities to test KYC and onboarding defenses.',
  longDescription:
    'Creates realistic synthetic customer identities including KYC artifacts, transaction histories, credit profiles, and behavioral patterns. Tests whether the fraud detection system can distinguish synthetic identities from real customers during digital onboarding.',
  icon: 'UserX',
  category: 'identity',
  target: 'Customer onboarding / KYC',
  accentColor: '#f97316',
  artifacts: ['kyc_document', 'transaction_history', 'credit_history', 'behavioral_profile'],
  scenarios: [
    { id: 'kyc_inconsistency', name: 'KYC Inconsistency', description: 'Identity documents with subtle inconsistencies in personal details' },
    { id: 'behavioral_anomaly', name: 'Behavioral Anomaly', description: 'Identities with unusual behavioral patterns during onboarding' },
    { id: 'credit_history_anomaly', name: 'Credit/History Anomaly', description: 'Synthetic credit profiles with statistical anomalies' },
    { id: 'multi_signal', name: 'Multi-Signal Synthetic', description: 'Full synthetic identity with coordinated anomalies across all signals' },
  ],
  configFields: [
    {
      id: 'scenario',
      label: 'Attack Scenario',
      type: 'select',
      required: true,
      defaultValue: 'kyc_inconsistency',
      options: [
        { value: 'kyc_inconsistency', label: 'KYC Inconsistency' },
        { value: 'behavioral_anomaly', label: 'Behavioral Anomaly' },
        { value: 'credit_history_anomaly', label: 'Credit/History Anomaly' },
        { value: 'multi_signal', label: 'Multi-Signal Synthetic Identity' },
      ],
    },
    {
      id: 'artifact_types',
      label: 'Artifact Types',
      type: 'multiselect',
      required: true,
      defaultValue: ['kyc_document', 'transaction_history'],
      options: [
        { value: 'kyc_document', label: 'Aadhaar-like KYC Artifact' },
        { value: 'transaction_history', label: 'Transaction History' },
        { value: 'credit_history', label: 'Credit History' },
        { value: 'behavioral_profile', label: 'Behavioral Profile' },
      ],
    },
    {
      id: 'instance_count',
      label: 'Number of Synthetic Identities',
      type: 'slider',
      required: true,
      defaultValue: 10,
      min: 1,
      max: 100,
      step: 1,
      helpText: 'Number of synthetic identity instances to generate',
    },
    {
      id: 'severity',
      label: 'Attack Severity',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        { value: 'low', label: 'Low — Subtle anomalies' },
        { value: 'medium', label: 'Medium — Moderate signals' },
        { value: 'high', label: 'High — Obvious fraud patterns' },
        { value: 'critical', label: 'Critical — Extreme evasion' },
      ],
    },
    {
      id: 'balanced_dataset',
      label: 'Balanced mixed dataset (recommended)',
      type: 'checkbox',
      required: false,
      defaultValue: true,
      helpText: 'Include legitimate negatives alongside fraud samples for realistic evaluation and false-positive measurement.',
    },
    {
      id: 'seed',
      label: 'Generation Seed',
      type: 'number',
      required: false,
      placeholder: 'Random',
      helpText: 'Fixed seed for reproducible generation',
    },
  ],
  generationEndpoint: '/attacks/synthetic_identity/generate',
  detectionEndpoint: '/attacks/synthetic_identity/detect',
  limits: {
    max_instances: 100,
    max_transactions_per_identity: 500,
  },
};
