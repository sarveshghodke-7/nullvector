/**
 * Module: src/registry/definitions/accountTakeover.ts
 *
 * Purpose:
 * AttackDefinition for Account Takeover / Credential Abuse.
 */

import type { AttackDefinition } from '@/src/types/attacks';

export const accountTakeoverAttack: AttackDefinition = {
  id: 'account_takeover',
  name: 'Account Takeover / Credential Abuse',
  description: 'Simulate compromised accounts using impossible-travel, device, and session anomalies.',
  longDescription:
    'Generates credential-abuse scenarios such as impossible-travel logins, session hijack attempts, and risky new-device sign-ins. Tests whether account protection policies can separate legitimate user activity from credential-driven takeover behavior.',
  icon: 'ShieldAlert',
  category: 'identity',
  target: 'Customer account security / authentication',
  accentColor: '#f59e0b',
  artifacts: ['login_event', 'session_anomaly', 'device_fingerprint'],
  scenarios: [
    { id: 'impossible_travel', name: 'Impossible Travel', description: 'Login attempts from geographically impossible locations in a short window' },
    { id: 'credential_stuffing', name: 'Credential Stuffing', description: 'Rapid automated login attempts using leaked credentials' },
    { id: 'session_hijack', name: 'Session Hijack', description: 'Suspicious session reuse or token replay behavior' },
    { id: 'new_device_velocity', name: 'New Device Velocity', description: 'Multiple risky new devices activated in a compressed time frame' },
  ],
  configFields: [
    {
      id: 'scenario',
      label: 'Attack Scenario',
      type: 'select',
      required: true,
      defaultValue: 'impossible_travel',
      options: [
        { value: 'impossible_travel', label: 'Impossible Travel' },
        { value: 'credential_stuffing', label: 'Credential Stuffing' },
        { value: 'session_hijack', label: 'Session Hijack' },
        { value: 'new_device_velocity', label: 'New Device Velocity' },
      ],
    },
    {
      id: 'login_attempts',
      label: 'Number of Login Attempts',
      type: 'slider',
      required: true,
      defaultValue: 10,
      min: 1,
      max: 100,
      step: 1,
      helpText: 'Number of account takeover events to simulate',
    },
    {
      id: 'severity',
      label: 'Attack Severity',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        { value: 'low', label: 'Low — Mild anomaly' },
        { value: 'medium', label: 'Medium — Attack pattern emerging' },
        { value: 'high', label: 'High — Strong takeover signals' },
        { value: 'critical', label: 'Critical — Coordinated compromise' },
      ],
    },
    {
      id: 'balanced_dataset',
      label: 'Balanced mixed dataset (recommended)',
      type: 'checkbox',
      required: false,
      defaultValue: true,
      helpText: 'Include legitimate logins alongside risky takeover attempts for realistic evaluation.',
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
  generationEndpoint: '/attacks/account_takeover/generate',
  detectionEndpoint: '/attacks/account_takeover/detect',
  limits: {
    max_login_attempts: 100,
    max_session_velocity: 100,
  },
};
