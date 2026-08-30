/**
 * Module: src/registry/definitions/deepfakeVoice.ts
 *
 * Purpose:
 * AttackDefinition for the Deepfake Voice Social Engineering attack module.
 *
 * Layer: REGISTRY / DEFINITION
 * Attack association: deepfake_voice
 */

import type { AttackDefinition } from '@/src/types/attacks';

export const deepfakeVoiceAttack: AttackDefinition = {
  id: 'deepfake_voice',
  name: 'Deepfake Voice Social Engineering',
  description: 'Test defenses against AI-generated voice artifacts used in social engineering.',
  longDescription:
    'Simulates AI-generated voice artifacts that could be used to impersonate bank employees, conduct OTP social-engineering calls, or attempt voice-cloning attacks against voice-based authentication systems.',
  icon: 'Mic',
  category: 'media',
  target: 'Voice authentication / Social engineering',
  accentColor: '#8b5cf6',
  artifacts: ['audio_sample', 'voice_analysis'],
  scenarios: [
    { id: 'bank_impersonation', name: 'Bank Employee Impersonation', description: 'AI voice mimicking a bank representative during customer calls' },
    { id: 'otp_social_engineering', name: 'OTP/Social Engineering Call', description: 'Deepfake voice used to trick users into revealing OTPs' },
    { id: 'voice_cloning', name: 'Voice Cloning Attempt', description: 'Cloned voice attempting to pass voice-based authentication' },
  ],
  configFields: [
    {
      id: 'scenario',
      label: 'Voice Scenario',
      type: 'select',
      required: true,
      defaultValue: 'bank_impersonation',
      options: [
        { value: 'bank_impersonation', label: 'Bank Employee Impersonation' },
        { value: 'otp_social_engineering', label: 'OTP/Social Engineering Call' },
        { value: 'voice_cloning', label: 'Voice Cloning Attempt' },
      ],
    },
    {
      id: 'sample_count',
      label: 'Number of Voice Samples',
      type: 'slider',
      required: true,
      defaultValue: 5,
      min: 1,
      max: 50,
      step: 1,
      helpText: 'Number of synthetic voice samples to generate or analyze',
    },
    {
      id: 'voice_type',
      label: 'Voice Type',
      type: 'select',
      required: false,
      defaultValue: 'male_adult',
      options: [
        { value: 'male_adult', label: 'Male Adult' },
        { value: 'female_adult', label: 'Female Adult' },
        { value: 'mixed', label: 'Mixed' },
      ],
    },
    {
      id: 'audio_upload',
      label: 'Upload Audio Sample (Optional)',
      type: 'file',
      required: false,
      helpText: 'Upload a reference audio file for voice cloning scenario',
      placeholder: 'WAV, MP3, or OGG',
    },
    {
      id: 'severity',
      label: 'Attack Severity',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        { value: 'low', label: 'Low — Obvious synthesis artifacts' },
        { value: 'medium', label: 'Medium — Moderate quality' },
        { value: 'high', label: 'High — High-fidelity deepfake' },
        { value: 'critical', label: 'Critical — State-of-the-art' },
      ],
    },
    {
      id: 'balanced_dataset',
      label: 'Balanced mixed dataset (recommended)',
      type: 'checkbox',
      required: false,
      defaultValue: true,
      helpText: 'Include genuine audio samples alongside deepfake attempts to measure realistic evasion and false alarms.',
    },
  ],
  generationEndpoint: '/attacks/deepfake_voice/generate',
  detectionEndpoint: '/attacks/deepfake_voice/detect',
  limits: {
    max_samples: 50,
    max_duration_seconds: 300,
  },
};
