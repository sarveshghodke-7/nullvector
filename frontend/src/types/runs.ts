/**
 * Module: src/types/runs.ts
 *
 * Purpose:
 * TypeScript interfaces for pipeline run tracking and history.
 *
 * Layer: TYPES
 *
 * Consumed by:
 * - src/services/runService.ts
 * - History page
 * - Dashboard recent runs
 *
 * Backend contract: GET /api/v1/runs, GET /api/v1/runs/{run_id}
 */

/** Status of a pipeline run */
export type RunStatus =
  | 'pending'
  | 'generating'
  | 'generated'
  | 'detecting'
  | 'completed'
  | 'failed';

/** A single pipeline run record */
export interface Run {
  run_id: string;
  attack_id: string;
  attack_name: string;
  scenario: string;
  timestamp: string;
  requested_count: number;
  generated_count: number;
  detected_count: number;
  missed_count: number;
  detection_rate: number | null;
  model_version: string;
  status: RunStatus;
  generation_time_ms: number | null;
  detection_time_ms: number | null;
  config: Record<string, unknown>;
}

/** Filters for querying run history */
export interface RunFilter {
  attack_id?: string;
  status?: RunStatus;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}
