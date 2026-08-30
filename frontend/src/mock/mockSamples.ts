/**
 * Module: src/mock/mockSamples.ts
 *
 * Purpose: Mock individual sample explanations for the result detail view.
 * Layer: MOCK
 *
 * IMPORTANT: All data is SYNTHETIC / DEMONSTRATION DATA.
 */

import type { SamplePrediction } from '@/src/types/detection';

export const MOCK_SAMPLE_EXPLANATIONS: Record<string, SamplePrediction[]> = {
  RUN_001: [
    {
      sample_id: 'RUN_001_S001',
      ground_truth: 'fraud',
      prediction: 'fraud',
      risk_score: 0.94,
      confidence: 0.91,
      decision: 'flagged',
      explanation: [
        { feature: 'account_age', description: 'Account created only 3 days ago', impact: 'high', value: '3 days', threshold: '30 days' },
        { feature: 'device_reuse', description: 'Device ID shared with 4 other accounts', impact: 'high', value: '4 accounts', threshold: '1 account' },
        { feature: 'kyc_consistency', description: 'Address mismatch between KYC document and IP geolocation', impact: 'medium' },
        { feature: 'transaction_velocity', description: 'Transaction frequency 3.2× above normal for account age', impact: 'medium', value: '12.3/hr', threshold: '3.8/hr' },
      ],
    },
    {
      sample_id: 'RUN_001_S002',
      ground_truth: 'fraud',
      prediction: 'legitimate',
      risk_score: 0.32,
      confidence: 0.58,
      decision: 'passed',
      explanation: [
        { feature: 'credit_history', description: 'Credit-building pattern appears consistent', impact: 'low' },
        { feature: 'transaction_amount', description: 'Transaction amounts within normal distribution', impact: 'low', value: '₹2,450', threshold: '₹50,000' },
        { feature: 'location_consistency', description: 'All transactions from same geographic region', impact: 'low' },
      ],
    },
    {
      sample_id: 'RUN_001_S003',
      ground_truth: 'fraud',
      prediction: 'fraud',
      risk_score: 0.87,
      confidence: 0.84,
      decision: 'flagged',
      explanation: [
        { feature: 'behavioral_pattern', description: 'Spending pattern matches known synthetic identity lifecycle', impact: 'high' },
        { feature: 'merchant_diversity', description: 'Unusually low merchant diversity for transaction volume', impact: 'medium', value: '3 merchants', threshold: '8+ merchants' },
      ],
    },
  ],
  RUN_004: [
    {
      sample_id: 'RUN_004_S001',
      ground_truth: 'fraud',
      prediction: 'fraud',
      risk_score: 0.96,
      confidence: 0.93,
      decision: 'flagged',
      explanation: [
        { feature: 'domain_age', description: 'Domain registered only 12 days ago', impact: 'high', value: '12 days', threshold: '180 days' },
        { feature: 'bank_business_mismatch', description: 'Bank account holder name differs from business registration', impact: 'high' },
        { feature: 'transaction_velocity', description: 'Transaction velocity elevated for business age', impact: 'medium', value: '45/day', threshold: '10/day' },
        { feature: 'invoice_amount', description: 'Average invoice amount 3.2× historical average', impact: 'medium', value: '₹85,000', threshold: '₹26,500' },
      ],
    },
    {
      sample_id: 'RUN_004_S002',
      ground_truth: 'fraud',
      prediction: 'legitimate',
      risk_score: 0.28,
      confidence: 0.62,
      decision: 'passed',
      explanation: [
        { feature: 'business_registration', description: 'Valid GST registration with matching address', impact: 'low' },
        { feature: 'refund_ratio', description: 'Refund ratio within industry normal range', impact: 'low', value: '2.1%', threshold: '5%' },
      ],
    },
  ],
};
