import { getHistoricalEvent } from '../data/events';
import { getOfficer } from '../data/officers';
import { getPolicy } from '../data/policies';
import { evaluateEnding } from './endings';
import { evaluateObjectives } from './objectives';
import { evaluateDilemmas } from './dilemmas';
import type {
  GameState,
  IndicatorKey,
  NumericChanges,
  ResourceKey,
  TurnDecision,
  TurnResult,
} from './types';

const indicatorKeys: IndicatorKey[] = ['finance', 'livelihood', 'defense', 'courtSupport', 'execution'];
const resourceKeys: ResourceKey[] = ['treasury', 'politicalCapital', 'administration'];

function addChanges<T extends string>(target: Record<T, number>, changes: NumericChanges<T>): void {
  for (const [key, amount] of Object.entries(changes) as [T, number][]) {
    target[key] += amount;
  }
}

function difference<T extends string>(before: Record<T, number>, after: Record<T, number>): NumericChanges<T> {
  const result: NumericChanges<T> = {};
  for (const key of Object.keys(before) as T[]) {
    const change = after[key] - before[key];
    if (change !== 0) result[key] = change;
  }
  return result;
}

function advanceDate(state: GameState): void {
  if (state.date.half === 1) {
    state.date.half = 2;
  } else {
    state.date.half = 1;
    state.date.reignYear += 1;
  }
}

export function getPoliticalCapitalRecovery(courtSupport: number): number {
  return 5 + Math.max(1, Math.round((courtSupport - 30) / 10));
}

function validateDecision(state: GameState, decision: TurnDecision): void {
  if (state.ended) throw new Error('本局已经结束。');
  if (decision.policyIds.length < 1) {
    throw new Error('诏书尚未形成可执行政务。');
  }
  if (new Set(decision.policyIds).size !== decision.policyIds.length) {
    throw new Error('同一项政务不能在一回合内重复选择。');
  }

  if (!getOfficer(decision.officerId)) throw new Error('执行官不存在。');

  for (const policyId of decision.policyIds) {
    const policy = getPolicy(policyId);
    if (!policy) throw new Error(`政务 ${policyId} 不存在。`);
    const missing = policy.requirements.find((flag) => !state.flags.includes(flag));
    if (missing) throw new Error(`${policy.name} 尚未满足前置条件：${missing}。`);
  }
}

function clampState(state: GameState): void {
  for (const key of indicatorKeys) {
    state.indicators[key] = Math.max(0, Math.min(100, Math.round(state.indicators[key])));
  }
  state.resources.treasury = Math.max(0, Math.round(state.resources.treasury));
  state.resources.politicalCapital = Math.max(0, Math.min(100, Math.round(state.resources.politicalCapital)));
  state.resources.administration = Math.max(0, Math.min(50, Math.round(state.resources.administration)));
}

function applyRoutineRecovery(state: GameState): void {
  // Administrative capacity represents officials available in a half-year, not a consumable stockpile.
  state.resources.administration += 8;
  state.resources.politicalCapital += getPoliticalCapitalRecovery(state.indicators.courtSupport);
}

export function settleTurn(currentState: GameState, decision: TurnDecision): TurnResult {
  validateDecision(currentState, decision);
  const state = structuredClone(currentState);
  const beforeIndicators = { ...state.indicators };
  const beforeResources = { ...state.resources };
  const officer = getOfficer(decision.officerId)!;
  const event = getHistoricalEvent(state.turn);
  const administrationRequired = decision.policyIds.reduce(
    (total, policyId) => total + (getPolicy(policyId)?.cost.administration ?? 0), 0,
  );
  const politicalCapitalRequired = decision.policyIds.reduce(
    (total, policyId) => total + (getPolicy(policyId)?.cost.politicalCapital ?? 0), officer.politicalCostModifier,
  );
  const administrativeOverload = Math.max(0, administrationRequired - state.resources.administration);
  const politicalOverdraft = Math.max(0, politicalCapitalRequired - state.resources.politicalCapital);

  addChanges(state.indicators, event.effects);
  if (event.resourceEffects) addChanges(state.resources, event.resourceEffects);

  for (const policyId of decision.policyIds) {
    const policy = getPolicy(policyId)!;
    const adjustedCost = { ...policy.cost };
    for (const key of resourceKeys) state.resources[key] -= adjustedCost[key] ?? 0;

    addChanges(state.indicators, policy.immediateEffects);
    if (policy.tags.some((tag) => officer.specialtyTags.includes(tag))) {
      state.indicators.execution += officer.executionBonus;
    }

    for (const risk of policy.risks) {
      const triggered = Object.entries(risk.whenIndicatorBelow ?? {}).every(
        ([key, threshold]) => state.indicators[key as IndicatorKey] < threshold,
      );
      if (triggered) addChanges(state.indicators, risk.effects);
    }

    for (const flag of policy.grants) {
      if (!state.flags.includes(flag)) state.flags.push(flag);
    }
    state.activePolicies.push({ policyId, officerId: officer.id, remainingTurns: policy.duration });
  }
  state.resources.politicalCapital -= officer.politicalCostModifier;

  for (const active of state.activePolicies) {
    const policy = getPolicy(active.policyId)!;
    addChanges(state.indicators, policy.perTurnEffects);
    active.remainingTurns -= 1;
  }
  state.activePolicies = state.activePolicies.filter((policy) => policy.remainingTurns > 0);

  if (administrativeOverload > 0) {
    state.indicators.execution -= Math.ceil(administrativeOverload / 2);
    state.indicators.livelihood -= Math.ceil(administrativeOverload / 5);
    state.indicators.courtSupport -= Math.ceil(administrativeOverload / 6);
  }
  if (politicalOverdraft > 0) {
    state.indicators.courtSupport -= Math.ceil(politicalOverdraft / 2);
    state.indicators.execution -= Math.ceil(politicalOverdraft / 3);
  }

  applyRoutineRecovery(state);
  clampState(state);
  const record = {
    turn: state.turn,
    date: { ...state.date },
    eventTitle: event.title,
    policyIds: [...decision.policyIds],
    officerId: officer.id,
    indicatorChanges: difference(beforeIndicators, state.indicators),
    resourceChanges: difference(beforeResources, state.resources),
    administrativeOverload,
    politicalOverdraft,
    ...(decision.edictNote ? { edictText: decision.edictNote } : {}),
  };
  state.history.push(record);
  state.objectives = evaluateObjectives(state);

  const collapsed = indicatorKeys.some((key) => state.indicators[key] <= 0)
    || resourceKeys.some((key) => state.resources[key] <= 0);
  if (collapsed || state.turn >= state.maxTurns) {
    state.ended = true;
    state.ending = evaluateEnding(state);
  } else {
    state.turn += 1;
    advanceDate(state);
  }
  state.dilemmas = evaluateDilemmas(state);

  return { state, event, record };
}
