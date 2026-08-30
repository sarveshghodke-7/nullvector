/**
 * Module: src/registry/attackRegistry.ts
 *
 * Purpose:
 * Central registry of all attack modules. The frontend uses this registry
 * to dynamically discover available attacks, render config panels, and
 * route API calls. Adding a new attack = importing and registering a new
 * AttackDefinition here. No other frontend changes required.
 *
 * Layer: REGISTRY
 *
 * Consumed by:
 * - All pages that need to enumerate or look up attacks
 * - src/attacks/AttackConfigPanel.tsx
 * - src/services/attackService.ts
 *
 * This module must not: contain UI components or API logic.
 */

import type { AttackDefinition } from '@/src/types/attacks';

import { syntheticIdentityAttack } from './definitions/syntheticIdentity';
import { deepfakeVoiceAttack } from './definitions/deepfakeVoice';
import { adversarialPerturbationAttack } from './definitions/adversarialPerturbation';
import { fakeMerchantAttack } from './definitions/fakeMerchant';
import { accountTakeoverAttack } from './definitions/accountTakeover';
import { socialEngineeringAttack } from './definitions/socialEngineering';

/** Internal registry map */
const registry = new Map<string, AttackDefinition>();

/** Register an attack definition */
export function registerAttack(definition: AttackDefinition): void {
  registry.set(definition.id, definition);
}

/** Get a single attack by ID */
export function getAttack(id: string): AttackDefinition | undefined {
  return registry.get(id);
}

/** Get all registered attacks */
export function getAllAttacks(): AttackDefinition[] {
  return Array.from(registry.values());
}

/** Get attack IDs only */
export function getAttackIds(): string[] {
  return Array.from(registry.keys());
}

/* ------------------------------------------------------------------ */
/*  Self-register all known attacks                                    */
/* ------------------------------------------------------------------ */

registerAttack(syntheticIdentityAttack);
registerAttack(deepfakeVoiceAttack);
registerAttack(adversarialPerturbationAttack);
registerAttack(fakeMerchantAttack);
registerAttack(accountTakeoverAttack);
registerAttack(socialEngineeringAttack);
