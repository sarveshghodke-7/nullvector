/**
 * Module: src/services/modelService.ts
 *
 * Purpose:
 * Service layer for ML model info and feedback/learning state.
 *
 * Layer: SERVICE
 *
 * Backend contract:
 * - GET /api/v1/models
 */

import { MOCK_MODE } from '@/src/utils/config';
import { fetchApi } from './apiClient';
import { ENDPOINTS } from './endpoints';
import { mockModelService } from '@/src/mock/mockService';
import type { ModelInfo } from '@/src/types/models';

export const modelService = {
  /** List all models */
  async listModels(): Promise<ModelInfo[]> {
    if (MOCK_MODE) return mockModelService.listModels();
    return fetchApi<ModelInfo[]>(ENDPOINTS.models());
  },

  /** Retrain a model using collected hard examples */
  async retrainModel(attackId: string, minImprovement = 0): Promise<{ attack_id: string; version: string; promoted: boolean; metrics: Record<string, number>; hard_examples_count: number }> {
    if (MOCK_MODE) {
      return { attack_id: attackId, version: 'v2.0', promoted: true, metrics: { precision: 1, recall: 1, f1: 1, roc_auc: 1 }, hard_examples_count: 0 };
    }
    return fetchApi<{ attack_id: string; version: string; promoted: boolean; metrics: Record<string, number>; hard_examples_count: number }>(ENDPOINTS.retrain(attackId), {
      method: 'POST',
      body: JSON.stringify({ attack_id: attackId, min_improvement: minImprovement }),
    });
  },
};
