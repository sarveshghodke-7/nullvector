/**
 * Module: src/services/endpoints.ts
 *
 * Purpose:
 * Centralized endpoint definitions for all backend API routes.
 * If endpoints change during integration, only this file needs updating.
 *
 * Layer: SERVICE
 *
 * Backend contract: All API endpoints defined here
 */

import { API_PREFIX } from '@/src/utils/config';

export const ENDPOINTS = {
  /** List all available attacks */
  attacks: () => `${API_PREFIX}/attacks`,

  /** Generate attack artifacts */
  generate: (attackId: string) => `${API_PREFIX}/attacks/${attackId}/generate`,

  /** Run detection on generated artifacts */
  detect: (attackId: string) => `${API_PREFIX}/attacks/${attackId}/detect`,

  /** Get a specific run */
  run: (runId: string) => `${API_PREFIX}/runs/${runId}`,

  /** Get results for a run */
  runResults: (runId: string) => `${API_PREFIX}/runs/${runId}/results`,

  /** List all runs */
  runs: () => `${API_PREFIX}/runs`,

  /** Aggregated attack benchmark summary */
  benchmark: () => `${API_PREFIX}/benchmark`,

  /** List available models */
  models: () => `${API_PREFIX}/models`,

  /** Get a specific model */
  model: (modelId: string) => `${API_PREFIX}/models/${modelId}`,

  /** Retrain a model using hard examples */
  retrain: (attackId: string) => `${API_PREFIX}/models/retrain`,
} as const;
