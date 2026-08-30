/**
 * Module: src/mock/mockService.ts
 *
 * Purpose:
 * Mock implementations of all service interfaces. Returns realistic
 * demo data with simulated async delays. Clearly isolated from
 * production service code — when MOCK_MODE is false, this module
 * is never executed.
 *
 * Layer: MOCK
 *
 * Consumed by: src/services/* (when MOCK_MODE is true)
 *
 * IMPORTANT: All data in this module is SYNTHETIC / DEMONSTRATION DATA.
 */

import type { AttackConfig } from '@/src/types/attacks';
import type { GenerationResponse } from '@/src/types/generation';
import type { DetectionResponse, ExplanationFactor } from '@/src/types/detection';
import type { Run, RunFilter } from '@/src/types/runs';
import type { AttackResult } from '@/src/types/results';
import type { ModelInfo } from '@/src/types/models';
import { MOCK_RUNS } from './mockRuns';
import { MOCK_RESULTS } from './mockResults';
import { MOCK_MODELS } from './mockModels';
import { MOCK_SAMPLE_EXPLANATIONS } from './mockSamples';

/** Simulate network latency */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Generate a unique run ID */
function generateRunId(): string {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `RUN_${n}`;
}

/* ------------------------------------------------------------------ */
/*  Mock Attack Service                                                */
/* ------------------------------------------------------------------ */

export const mockAttackService = {
  async generateAttack(attackId: string, config: AttackConfig): Promise<GenerationResponse> {
    await delay(1500);
    const runId = generateRunId();
    const count = (config.parameters.instance_count as number)
      || (config.parameters.sample_count as number)
      || (config.parameters.max_variants as number)
      || (config.parameters.merchant_count as number)
      || 10;
    return {
      schema_version: '1.0',
      run_id: runId,
      attack_id: attackId,
      stage: 'generate',
      timestamp: new Date().toISOString(),
      payload: {
        dataset_id: `DS_${runId}`,
        sample_count: count,
        artifacts: [
          { artifact_id: `ART_${runId}_001`, type: config.artifacts[0] || 'tabular_transaction', format: 'csv', count },
        ],
        generation_time_ms: 1200 + Math.floor(Math.random() * 800),
        status: 'complete',
      },
    };
  },

  async detectAttack(attackId: string, runId: string): Promise<DetectionResponse> {
    await delay(2000);
    const total = 10 + Math.floor(Math.random() * 40);
    const detected = Math.floor(total * (0.7 + Math.random() * 0.25));
    const predictions = Array.from({ length: total }, (_, i) => {
      const wasDetected = i < detected;
      const riskScore = wasDetected ? 0.6 + Math.random() * 0.4 : 0.1 + Math.random() * 0.3;
      const explanations: ExplanationFactor[] = wasDetected
        ? [
            { feature: 'transaction_velocity', description: 'Transaction velocity elevated', impact: 'high', value: '12.3/hr', threshold: '5/hr' },
            { feature: 'account_age', description: 'Account unusually new', impact: 'medium', value: '3 days', threshold: '30 days' },
          ]
        : [
            { feature: 'amount', description: 'Transaction amount within normal range', impact: 'low', value: '₹2,450', threshold: '₹50,000' },
          ];
      return {
        sample_id: `${runId}_S${String(i + 1).padStart(3, '0')}`,
        ground_truth: 'fraud' as const,
        prediction: wasDetected ? 'fraud' as const : 'legitimate' as const,
        risk_score: riskScore,
        confidence: 0.5 + Math.random() * 0.5,
        decision: wasDetected ? 'flagged' as const : 'passed' as const,
        explanation: explanations,
      };
    });
    return {
      schema_version: '1.0',
      run_id: runId,
      attack_id: attackId,
      stage: 'detect',
      timestamp: new Date().toISOString(),
      payload: {
        model_id: `model_${attackId}_v1`,
        model_version: 'v1.0',
        samples_evaluated: total,
        predictions,
        status: 'complete',
        detection_time_ms: 1800 + Math.floor(Math.random() * 600),
      },
    };
  },
};

/* ------------------------------------------------------------------ */
/*  Mock Run Service                                                   */
/* ------------------------------------------------------------------ */

export const mockRunService = {
  async listRuns(filter?: RunFilter): Promise<Run[]> {
    await delay(500);
    let runs = [...MOCK_RUNS];
    if (filter?.attack_id) runs = runs.filter(r => r.attack_id === filter.attack_id);
    if (filter?.status) runs = runs.filter(r => r.status === filter.status);
    if (filter?.limit) runs = runs.slice(0, filter.limit);
    return runs;
  },

  async getRun(runId: string): Promise<Run> {
    await delay(300);
    const run = MOCK_RUNS.find(r => r.run_id === runId);
    if (!run) throw new Error(`Run ${runId} not found`);
    return run;
  },

  async getRunResult(runId: string): Promise<AttackResult> {
    await delay(500);
    const result = MOCK_RESULTS[runId];
    if (!result) throw new Error(`Results for ${runId} not found`);
    return result;
  },
};

/* ------------------------------------------------------------------ */
/*  Mock Model Service                                                 */
/* ------------------------------------------------------------------ */

export const mockModelService = {
  async listModels(): Promise<ModelInfo[]> {
    await delay(400);
    return MOCK_MODELS;
  },
};

export { MOCK_SAMPLE_EXPLANATIONS };
