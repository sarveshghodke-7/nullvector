/**
 * Module: src/types/attacks.ts
 *
 * Purpose:
 * Defines TypeScript interfaces for the attack-agnostic plugin system.
 * Every attack module in the system is described by an AttackDefinition,
 * which the frontend uses to dynamically render configuration panels,
 * route API calls, and display attack-specific artifacts.
 *
 * Layer: TYPES
 *
 * Consumed by:
 * - src/registry/attackRegistry.ts
 * - src/attacks/* (config panels)
 * - src/services/attackService.ts
 *
 * Backend contract: GET /api/v1/attacks
 */

/* ------------------------------------------------------------------ */
/*  Attack Definition — the "plugin descriptor" for each attack       */
/* ------------------------------------------------------------------ */

/** Supported artifact categories across all attack types */
export type ArtifactType =
  | 'kyc_document'
  | 'transaction_history'
  | 'credit_history'
  | 'behavioral_profile'
  | 'audio_sample'
  | 'voice_analysis'
  | 'tabular_transaction'
  | 'adversarial_variant'
  | 'merchant_profile'
  | 'invoice'
  | 'merchant_behavior'
  | 'login_event'
  | 'session_anomaly'
  | 'device_fingerprint'
  | 'message'
  | 'risk_context'
  | 'impersonation_intent';

/** Visual category used for grouping and theming */
export type AttackCategory = 'identity' | 'media' | 'model' | 'merchant';

/** A single scenario option within an attack */
export interface AttackScenario {
  id: string;
  name: string;
  description: string;
}

/** Field types supported by the dynamic config form */
export type ConfigFieldType =
  | 'select'
  | 'multiselect'
  | 'number'
  | 'slider'
  | 'checkbox'
  | 'text'
  | 'file'
  | 'textarea';

/** Describes one configurable parameter for an attack */
export interface ConfigField {
  id: string;
  label: string;
  type: ConfigFieldType;
  required: boolean;
  defaultValue?: string | number | boolean | string[];
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  helpText?: string;
  /** If provided, this field is only shown when the given condition is met */
  visibleWhen?: { field: string; value: string | string[] };
}

/**
 * AttackDefinition — the core plugin descriptor.
 *
 * Each attack module registers one of these. The frontend uses it to:
 * - Render the attack card on the selection page
 * - Build the dynamic config form
 * - Route API calls to the correct endpoints
 * - Know what artifacts and scenarios are available
 *
 * Adding a new attack = adding a new AttackDefinition. No other
 * frontend changes should be required.
 */
export interface AttackDefinition {
  /** Unique machine-readable identifier, e.g. "synthetic_identity" */
  id: string;
  /** Human-readable name, e.g. "Synthetic Identity Fraud" */
  name: string;
  /** One-line description for the attack card */
  description: string;
  /** Extended description for the config page */
  longDescription: string;
  /** Lucide icon name */
  icon: string;
  /** Visual grouping category */
  category: AttackCategory;
  /** What this attack targets */
  target: string;
  /** Types of artifacts this attack can produce */
  artifacts: ArtifactType[];
  /** Available attack scenarios */
  scenarios: AttackScenario[];
  /** Dynamic configuration fields */
  configFields: ConfigField[];
  /** Backend generation endpoint path (relative) */
  generationEndpoint: string;
  /** Backend detection endpoint path (relative) */
  detectionEndpoint: string;
  /** Generation limits (e.g. max_instances: 100) */
  limits: Record<string, number>;
  /** Color accent for this attack type (hex) */
  accentColor: string;
}

/* ------------------------------------------------------------------ */
/*  Attack Configuration — user-provided values                       */
/* ------------------------------------------------------------------ */

/** The runtime configuration created by the user before generation */
export interface AttackConfig {
  attackId: string;
  scenario: string;
  artifacts: ArtifactType[];
  parameters: Record<string, string | number | boolean | string[]>;
  seed?: number;
  balanced?: boolean;
  mixed_dataset?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}
