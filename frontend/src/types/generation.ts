/**
 * Module: src/types/generation.ts
 *
 * Purpose:
 * TypeScript interfaces for the attack generation lifecycle.
 * Matches the backend JSON envelope for the GENERATE stage.
 *
 * Layer: TYPES
 *
 * Consumed by:
 * - src/services/attackService.ts
 * - src/hooks/useGeneration.ts
 * - Attack artifact view components
 *
 * Backend contract: POST /api/v1/attacks/{attack_id}/generate
 */

import type { AttackConfig, ArtifactType } from './attacks';

/** Pipeline stage statuses for the generation progress UI */
export type GenerationStage =
  | 'idle'
  | 'validating'
  | 'queued'
  | 'generating'
  | 'post_processing'
  | 'complete'
  | 'error';

/** Request body sent to the generation endpoint */
export interface GenerationRequest {
  attack_id: string;
  config: AttackConfig;
}

/** Describes one generated artifact file/dataset */
export interface GeneratedArtifact {
  artifact_id: string;
  type: ArtifactType;
  format: string;         // e.g. "csv", "png", "wav", "json"
  count: number;
  filename?: string;
  data_location?: string;
  preview?: Record<string, unknown>;
}

/** Response from the generation endpoint */
export interface GenerationResponse {
  schema_version: string;
  run_id: string;
  attack_id: string;
  stage: 'generate';
  timestamp: string;
  payload: {
    dataset_id: string;
    sample_count: number;
    artifacts: GeneratedArtifact[];
    generation_time_ms: number;
    status: GenerationStage;
    error?: string;
  };
}

/** Local state for tracking generation progress in the UI */
export interface GenerationState {
  stage: GenerationStage;
  runId: string | null;
  progress: number;           // 0-100
  currentStep: string;
  artifacts: GeneratedArtifact[];
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}
