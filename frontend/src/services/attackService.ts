/**
 * Module: src/services/attackService.ts
 *
 * Purpose:
 * Service layer for attack generation and detection operations.
 * Routes to mock or real backend based on MOCK_MODE config.
 * No UI component should call API endpoints directly.
 *
 * Layer: SERVICE
 *
 * Consumed by:
 * - Attack Lab pages
 * - useGeneration / useDetection hooks
 *
 * Backend contract:
 * - POST /api/v1/attacks/{attack_id}/generate
 * - POST /api/v1/attacks/{attack_id}/detect
 * - GET /api/v1/attacks
 */

import { MOCK_MODE } from '@/src/utils/config';
import { fetchApi } from './apiClient';
import { ENDPOINTS } from './endpoints';
import { mockAttackService } from '@/src/mock/mockService';
import type { AttackConfig } from '@/src/types/attacks';
import type { GenerationResponse } from '@/src/types/generation';
import type { DetectionResponse } from '@/src/types/detection';

export const attackService = {
  /** Trigger attack generation with the given configuration */
  async generateAttack(attackId: string, config: AttackConfig): Promise<GenerationResponse> {
    if (MOCK_MODE) return mockAttackService.generateAttack(attackId, config);
    return fetchApi<GenerationResponse>(ENDPOINTS.generate(), {
      method: 'POST',
      body: JSON.stringify({ attack_id: attackId, ...config }),
    });
  },

  /** Trigger detection/defense on a generated run */
  async detectAttack(attackId: string, runId: string): Promise<DetectionResponse> {
    if (MOCK_MODE) return mockAttackService.detectAttack(attackId, runId);
    return fetchApi<DetectionResponse>(ENDPOINTS.detect(), {
      method: 'POST',
      body: JSON.stringify({ run_id: runId, attack_id: attackId }),
    });
  },
};
