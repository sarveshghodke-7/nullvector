/**
 * Module: src/registry/definitions/fakeMerchant.ts
 *
 * Purpose:
 * AttackDefinition for the Fake Merchant / Invoice Fraud attack module.
 *
 * Layer: REGISTRY / DEFINITION
 * Attack association: fake_merchant
 */

import type { AttackDefinition } from '@/src/types/attacks';

export const fakeMerchantAttack: AttackDefinition = {
  id: 'fake_merchant',
  name: 'Fake Merchant / Invoice Fraud',
  description: 'Simulate fraudulent merchants and invoices to test merchant onboarding defenses.',
  longDescription:
    'Creates realistic fake merchant profiles, business storefronts, invoices, and transaction patterns. Tests whether the merchant risk detection system can identify shell businesses, stolen identities, fake tax documents, and suspicious invoice patterns.',
  icon: 'Store',
  category: 'merchant',
  target: 'Merchant onboarding / Invoice processing',
  accentColor: '#06b6d4',
  artifacts: ['merchant_profile', 'invoice', 'merchant_behavior'],
  scenarios: [
    { id: 'shell_business', name: 'Shell Business', description: 'Merchants with minimal real business activity' },
    { id: 'stolen_identity', name: 'Stolen Identity', description: 'Merchant using stolen business registration details' },
    { id: 'fake_tax_document', name: 'Fake Tax Document', description: 'Forged GST or business tax certificates' },
    { id: 'bank_mismatch', name: 'Bank/Business Mismatch', description: 'Bank account details inconsistent with business profile' },
    { id: 'domain_mismatch', name: 'Domain/Address Mismatch', description: 'Web domain inconsistent with physical business address' },
    { id: 'invoice_manipulation', name: 'Invoice Amount Manipulation', description: 'Invoices with inflated or suspicious amounts' },
    { id: 'multi_signal', name: 'Multi-Signal Synthetic', description: 'Full synthetic merchant with coordinated fraud signals' },
  ],
  configFields: [
    {
      id: 'scenario',
      label: 'Fraud Scenario',
      type: 'select',
      required: true,
      defaultValue: 'shell_business',
      options: [
        { value: 'shell_business', label: 'Shell Business' },
        { value: 'stolen_identity', label: 'Stolen Identity' },
        { value: 'fake_tax_document', label: 'Fake Tax Document' },
        { value: 'bank_mismatch', label: 'Bank/Business Mismatch' },
        { value: 'domain_mismatch', label: 'Domain/Address Mismatch' },
        { value: 'invoice_manipulation', label: 'Invoice Amount Manipulation' },
        { value: 'multi_signal', label: 'Multi-Signal Synthetic' },
      ],
    },
    {
      id: 'artifact_types',
      label: 'Artifact Types',
      type: 'multiselect',
      required: true,
      defaultValue: ['merchant_profile', 'invoice'],
      options: [
        { value: 'merchant_profile', label: 'Merchant Profile' },
        { value: 'invoice', label: 'Invoice' },
        { value: 'merchant_behavior', label: 'Transaction Behavior' },
      ],
    },
    {
      id: 'merchant_count',
      label: 'Number of Merchants',
      type: 'slider',
      required: true,
      defaultValue: 5,
      min: 1,
      max: 50,
      step: 1,
    },
    {
      id: 'invoices_per_merchant',
      label: 'Invoices per Merchant',
      type: 'slider',
      required: true,
      defaultValue: 10,
      min: 1,
      max: 100,
      step: 5,
    },
    {
      id: 'severity',
      label: 'Attack Severity',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        { value: 'low', label: 'Low — Minor inconsistencies' },
        { value: 'medium', label: 'Medium — Moderate fraud signals' },
        { value: 'high', label: 'High — Obvious fraud patterns' },
        { value: 'critical', label: 'Critical — Sophisticated evasion' },
      ],
    },
    {
      id: 'balanced_dataset',
      label: 'Balanced mixed dataset (recommended)',
      type: 'checkbox',
      required: false,
      defaultValue: true,
      helpText: 'Combine fraudulent merchant samples with legitimate businesses to test real-world false positives.',
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
  generationEndpoint: '/attacks/fake_merchant/generate',
  detectionEndpoint: '/attacks/fake_merchant/detect',
  limits: {
    max_merchants: 50,
    max_invoices_per_merchant: 100,
  },
};
