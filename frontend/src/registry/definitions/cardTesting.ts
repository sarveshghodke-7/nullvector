import { AttackDefinition, AttackCategory, ChannelType } from '@/src/types/attacks';

export const cardTestingAttack: AttackDefinition = {
  id: 'card_testing',
  name: 'LLM-Orchestrated Adaptive Card Testing (BIN Attack)',
  category: AttackCategory.FINANCIAL,
  channel: ChannelType.CARD_NOT_PRESENT,
  description: 'An advanced BIN attack where an LLM orchestrates low-value probing across varying merchant category codes to discover active cards without tripping velocity rules, adapting its strategy based on block rates.',
  severity: 'CRITICAL',
  status: 'implemented',
  tags: ['LLM', 'BIN Probing', 'Adaptive', 'Velocity Evasion'],
  overview: {
    concept: 'Card testing (or BIN probing) occurs when attackers use automated scripts to test stolen credit card numbers for validity by making small purchases. In this advanced variant, an LLM dynamically controls the pacing and merchant selection to evade traditional static velocity rules.',
    impact: 'High authorization decline rates, increased processor fees, merchant account suspension, and reputational damage.',
    mitigation: 'Implement dynamic temporal velocity tracking, cross-merchant feature engineering, and robust ML models like XGBoost trained on class-imbalanced data.',
  },
  parameters: [
    {
      id: 'probe_count',
      name: 'Probe Count',
      type: 'number',
      description: 'Number of fraudulent probes to generate per round.',
      defaultValue: 100,
      validation: {
        min: 10,
        max: 500,
      },
    },
    {
      id: 'merchant_category_pool',
      name: 'Target Merchant Categories (MCCs)',
      type: 'enum',
      description: 'The pool of MCCs the LLM will select from to blend the attack.',
      defaultValue: ['5411', '5812', '5941', '4899'],
      options: [
        { label: 'Grocery & Dining (5411, 5812)', value: ['5411', '5812'] },
        { label: 'Sporting & Subscriptions (5941, 4899)', value: ['5941', '4899'] },
        { label: 'All Targets', value: ['5411', '5812', '5941', '4899'] },
      ],
    },
    {
      id: 'round',
      name: 'Current Round',
      type: 'number',
      description: 'The simulation round for Red vs Blue feedback looping.',
      defaultValue: 1,
    }
  ],
};
