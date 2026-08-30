/**
 * Module: src/types/detection.ts
 *
 * Purpose:
 * TypeScript interfaces for the detection/defense lifecycle.
 * Matches the backend JSON envelope for the DETECT stage.
 *
 * Layer: TYPES
 *
 * Consumed by:
 * - src/services/attackService.ts
 * - src/hooks/useDetection.ts
 * - Results page components
 *
 * Backend contract: POST /api/v1/attacks/{attack_id}/detect
 */

/** Detection pipeline stage */
export type DetectionStage =
  | 'idle'
  | 'preprocessing'
  | 'feature_extraction'
  | 'model_inference'
  | 'post_processing'
  | 'complete'
  | 'error';

/** Request body sent to the detection endpoint */
export interface DetectionRequest {
  run_id: string;
  attack_id: string;
  model_version?: string;
}

/** A single detection prediction for one sample */
export interface SamplePrediction {
  sample_id: string;
  ground_truth: 'fraud' | 'legitimate';
  prediction: 'fraud' | 'legitimate';
  risk_score: number;         // 0.0 – 1.0
  confidence: number;         // 0.0 – 1.0
  decision: 'flagged' | 'passed';
  explanation: ExplanationFactor[];
}

/** One reason contributing to the detection decision */
export interface ExplanationFactor {
  feature: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  value?: string | number;
  threshold?: string | number;
}

/** Response from the detection endpoint */
export interface DetectionResponse {
  schema_version: string;
  run_id: string;
  attack_id: string;
  stage: 'detect';
  timestamp: string;
  payload: {
    model_id: string;
    model_version: string;
    samples_evaluated: number;
    predictions: SamplePrediction[];
    status: DetectionStage;
    detection_time_ms: number;
    error?: string;
  };
}

/** Local state for tracking detection progress in the UI */
export interface DetectionState {
  stage: DetectionStage;
  runId: string | null;
  progress: number;
  currentStep: string;
  predictions: SamplePrediction[];
  error: string | null;
}
