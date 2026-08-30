/**
 * Module: src/services/runService.ts
 *
 * Purpose:
 * Service layer for run history and result retrieval.
 *
 * Layer: SERVICE
 *
 * Backend contract:
 * - GET /api/v1/runs
 * - GET /api/v1/runs/{run_id}
 * - GET /api/v1/runs/{run_id}/results
 */

import { MOCK_MODE } from '@/src/utils/config';
import { fetchApi } from './apiClient';
import { ENDPOINTS } from './endpoints';
import { mockRunService } from '@/src/mock/mockService';
import type { Run, RunFilter } from '@/src/types/runs';
import type { AttackBenchmark, AttackResult } from '@/src/types/results';

export const runService = {
  /** List all runs, optionally filtered */
  async listRuns(filter?: RunFilter): Promise<Run[]> {
    if (MOCK_MODE) return mockRunService.listRuns(filter);
    const params = filter ? `?${new URLSearchParams(filter as Record<string, string>)}` : '';
    return fetchApi<Run[]>(`${ENDPOINTS.runs()}${params}`);
  },

  /** Get a specific run by ID */
  async getRun(runId: string): Promise<Run> {
    if (MOCK_MODE) return mockRunService.getRun(runId);
    return fetchApi<Run>(ENDPOINTS.run(runId));
  },

  /** Get detection results for a run */
  async getRunResult(runId: string): Promise<AttackResult> {
    if (MOCK_MODE) return mockRunService.getRunResult(runId);
    return fetchApi<AttackResult>(ENDPOINTS.runResults(runId));
  },

  /** Get the cross-attack benchmark leaderboard */
  async getBenchmark(): Promise<AttackBenchmark[]> {
    if (MOCK_MODE) return [];
    return fetchApi<AttackBenchmark[]>(ENDPOINTS.benchmark());
  },
};
