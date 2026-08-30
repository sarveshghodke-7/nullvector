/**
 * Module: src/registry/definitions/adversarialPerturbation.ts
 *
 * Purpose:
 * AttackDefinition for the Adversarial Perturbation attack module.
 * This attack is fundamentally different — no documents, no media.
 * It operates purely on tabular transaction features.
 *
 * Layer: REGISTRY / DEFINITION
 * Attack association: adversarial_perturbation
 */

import type { AttackDefinition } from '@/src/types/attacks';

export const adversarialPerturbationAttack: AttackDefinition = {
  id: 'adversarial_perturbation',
  name: 'Adversarial Perturbation Attack',
  description: 'Generate adversarial transaction variants to test fraud model robustness.',
  longDescription:
    'Creates controlled perturbations of known fraudulent transactions to test whether the fraud detection model can be evaded. Operates entirely on tabular transaction features — no documents or media artifacts. The Red Team tests whether plausible feature changes can move transactions across the model\'s decision boundary.',
  icon: 'Shuffle',
  category: 'model',
  target: 'Fraud detection model',
  accentColor: '#ef4444',
  artifacts: ['tabular_transaction', 'adversarial_variant'],
  scenarios: [
    { id: 'amount_perturbation', name: 'Amount Perturbation', description: 'Modify transaction amounts within plausible ranges' },
    { id: 'feature_perturbation', name: 'Multi-Feature Perturbation', description: 'Coordinate changes across multiple transaction features' },
    { id: 'boundary_search', name: 'Decision Boundary Search', description: 'Systematically search for the model\'s decision boundary' },
    { id: 'constraint_based', name: 'Constraint-Based Evasion', description: 'Generate evasions under realistic business constraints' },
  ],
  configFields: [
    {
      id: 'scenario',
      label: 'Attack Objective',
      type: 'select',
      required: true,
      defaultValue: 'feature_perturbation',
      options: [
        { value: 'amount_perturbation', label: 'Amount Perturbation' },
        { value: 'feature_perturbation', label: 'Multi-Feature Perturbation' },
        { value: 'boundary_search', label: 'Decision Boundary Search' },
        { value: 'constraint_based', label: 'Constraint-Based Evasion' },
      ],
    },
    {
      id: 'input_method',
      label: 'Transaction Input Method',
      type: 'select',
      required: true,
      defaultValue: 'dataset',
      options: [
        { value: 'dataset', label: 'Select from Dataset' },
        { value: 'upload', label: 'Upload CSV' },
        { value: 'manual', label: 'Manual Entry' },
      ],
    },
    {
      id: 'transaction_upload',
      label: 'Upload Transaction CSV',
      type: 'file',
      required: false,
      helpText: 'CSV with transaction features',
      visibleWhen: { field: 'input_method', value: 'upload' },
    },
    {
      id: 'perturbation_budget',
      label: 'Perturbation Budget',
      type: 'slider',
      required: true,
      defaultValue: 20,
      min: 5,
      max: 50,
      step: 5,
      helpText: 'Maximum allowed change per feature (%)',
    },
    {
      id: 'max_variants',
      label: 'Maximum Adversarial Variants',
      type: 'slider',
      required: true,
      defaultValue: 50,
      min: 10,
      max: 500,
      step: 10,
      helpText: 'Number of adversarial variants to generate',
    },
    {
      id: 'target_model',
      label: 'Target Model Version',
      type: 'select',
      required: false,
      defaultValue: 'latest',
      options: [
        { value: 'latest', label: 'Latest Model' },
        { value: 'v1.0', label: 'Model v1.0' },
        { value: 'v2.0', label: 'Model v2.0' },
      ],
    },
    {
      id: 'balanced_dataset',
      label: 'Balanced mixed dataset (recommended)',
      type: 'checkbox',
      required: false,
      defaultValue: true,
      helpText: 'Evaluate against benign and adversarial transaction patterns together so performance is not overstated.',
    },
  ],
  generationEndpoint: '/attacks/adversarial_perturbation/generate',
  detectionEndpoint: '/attacks/adversarial_perturbation/detect',
  limits: {
    max_variants: 500,
    max_perturbation_percent: 50,
  },
};
