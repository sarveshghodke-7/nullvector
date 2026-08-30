/**
 * Module: src/registry/definitions/socialEngineering.ts
 *
 * Purpose:
 * AttackDefinition for Social Engineering / Impersonation Scam.
 */

import type { AttackDefinition } from '@/src/types/attacks';

export const socialEngineeringAttack: AttackDefinition = {
  id: 'social_engineering',
  name: 'Social Engineering / Impersonation Scam',
  description: 'Simulate scam messages and impersonation attempts across support channels.',
  longDescription:
    'Creates scam-style messages impersonating banks, vendors, support teams, or refund desks. Tests whether message-risk scoring and support controls can catch urgency, impersonation, and social-engineering intent before the user is compromised.',
  icon: 'MessageSquareWarning',
  category: 'media',
  target: 'Customer support / messaging channels',
  accentColor: '#22c55e',
  artifacts: ['message', 'risk_context', 'impersonation_intent'],
  scenarios: [
    { id: 'bank_impersonation', name: 'Bank Impersonation', description: 'Fraudulent SMS or chat pretending to be a financial institution' },
    { id: 'vendor_impersonation', name: 'Vendor Impersonation', description: 'Fake supplier or vendor request with urgent payment changes' },
    { id: 'tech_support', name: 'Tech Support Scam', description: 'Urgent support message requesting credentials or remote access' },
    { id: 'refund_scam', name: 'Refund Scam', description: 'Claimed refund or reimbursement request using social pressure' },
  ],
  configFields: [
    {
      id: 'scenario',
      label: 'Attack Scenario',
      type: 'select',
      required: true,
      defaultValue: 'bank_impersonation',
      options: [
        { value: 'bank_impersonation', label: 'Bank Impersonation' },
        { value: 'vendor_impersonation', label: 'Vendor Impersonation' },
        { value: 'tech_support', label: 'Tech Support Scam' },
        { value: 'refund_scam', label: 'Refund Scam' },
      ],
    },
    {
      id: 'message_count',
      label: 'Number of Messages',
      type: 'slider',
      required: true,
      defaultValue: 10,
      min: 1,
      max: 100,
      step: 1,
      helpText: 'How many scam messages or impersonation attempts to generate',
    },
    {
      id: 'channel',
      label: 'Channel',
      type: 'select',
      required: false,
      defaultValue: 'sms',
      options: [
        { value: 'sms', label: 'SMS' },
        { value: 'email', label: 'Email' },
        { value: 'chat', label: 'Chat' },
        { value: 'voice', label: 'Voice/Callback' },
      ],
    },
    {
      id: 'severity',
      label: 'Attack Severity',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        { value: 'low', label: 'Low — Low pressure' },
        { value: 'medium', label: 'Medium — Coherent scam narrative' },
        { value: 'high', label: 'High — Strong urgency and impersonation' },
        { value: 'critical', label: 'Critical — Sophisticated coercion' },
      ],
    },
    {
      id: 'balanced_dataset',
      label: 'Balanced mixed dataset (recommended)',
      type: 'checkbox',
      required: false,
      defaultValue: true,
      helpText: 'Compare scam messages with legitimate customer communications to measure realistic false positives.',
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
  generationEndpoint: '/attacks/social_engineering/generate',
  detectionEndpoint: '/attacks/social_engineering/detect',
  limits: {
    max_messages: 100,
    max_message_length: 500,
  },
};
