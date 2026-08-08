import { describe, expect, it } from 'vitest';
import { createInitialState, getPoliticalCapitalRecovery, settleTurn } from '../src';
import { evaluateEnding } from '../src/game/endings';

describe('半年回合结算', () => {
  it('结算政策、官员和历史事件并推进半年', () => {
    const initial = createInitialState();
    const result = settleTurn(initial, {
      policyIds: ['green-sprouts-trial'],
      officerId: 'wang-anshi',
      edictNote: '诏试行青苗法。',
    });

    expect(result.record.eventTitle).toBe('三司财政告急');
    expect(result.state.turn).toBe(2);
    expect(result.state.date).toEqual({ reignYear: 2, half: 2 });
    expect(result.state.resources.treasury).toBe(5500);
    expect(result.state.flags).toContain('green-sprouts-enacted');
    expect(result.state.activePolicies).toHaveLength(1);
    expect(result.record.edictText).toBe('诏试行青苗法。');
    expect(initial.turn).toBe(1);
  });

  it('拒绝重复政务或不存在的执行官', () => {
    const state = createInitialState();
    expect(() => settleTurn(state, {
      policyIds: ['green-sprouts-trial', 'green-sprouts-trial'],
      officerId: 'wang-anshi',
    })).toThrow('不能在一回合内重复');
    expect(() => settleTurn(state, {
      policyIds: ['green-sprouts-trial'],
      officerId: 'not-an-officer',
    })).toThrow('执行官不存在');
  });

  it('不限制政务数量，但把超过行政能力的部分结算为超载后果', () => {
    const state = createInitialState();
    state.resources.administration = 10;
    const result = settleTurn(state, {
      policyIds: ['green-sprouts-trial', 'water-conservancy', 'northwest-defense', 'reduce-redundant-spending', 'service-reform-preparation', 'curb-local-exactions'],
      officerId: 'wang-anshi',
    });
    expect(result.record.administrativeOverload).toBeGreaterThan(0);
    expect(result.state.history).toHaveLength(1);
    expect(result.state.dilemmas.some((item) => item.id === 'administrative-overload')).toBe(true);
  });

  it('改革失当会产生新的困境，条件改善后严重度随之下降', () => {
    const state = createInitialState();
    const result = settleTurn(state, { policyIds: ['green-sprouts-trial'], officerId: 'wang-anshi' });
    const forcedLoans = result.state.dilemmas.find((item) => item.id === 'forced-loans');

    expect(forcedLoans).toBeDefined();
    expect(forcedLoans?.category).toBe('reform');
    expect(result.state.dilemmas.some((item) => item.category === 'urgent')).toBe(true);
  });

  it('政略不足时仍执行诏令，并在政略归零后失败', () => {
    const state = createInitialState();
    state.resources.politicalCapital = 1;

    const result = settleTurn(state, {
      policyIds: ['green-sprouts-trial', 'service-reform-preparation'],
      officerId: 'wang-anshi',
    });

    expect(result.record.politicalOverdraft).toBe(12);
    expect(result.state.resources.politicalCapital).toBe(0);
    expect(result.state.dilemmas.some((item) => item.id === 'political-overdraft')).toBe(true);
    expect(result.state.history).toHaveLength(1);
    expect(result.state.ended).toBe(true);
    expect(result.state.ending).toMatchObject({ id: 'collapse', title: '朝议尽失' });
  });

  it('行政不足时仍执行政务，并在行政归零后失败', () => {
    const state = createInitialState();
    state.resources.administration = 1;

    const result = settleTurn(state, {
      policyIds: ['green-sprouts-trial', 'water-conservancy', 'northwest-defense'],
      officerId: 'wang-anshi',
    });

    expect(result.record.administrativeOverload).toBeGreaterThan(0);
    expect(result.state.resources.administration).toBe(0);
    expect(result.state.history).toHaveLength(1);
    expect(result.state.ended).toBe(true);
    expect(result.state.ending).toMatchObject({ id: 'collapse', title: '政令停摆' });
  });

  it('承办官政略修正按整道诏令收取一次，士论提供基础恢复', () => {
    expect(getPoliticalCapitalRecovery(45)).toBe(7);
    const state = createInitialState();
    const result = settleTurn(state, {
      policyIds: ['green-sprouts-trial', 'service-reform-preparation'],
      officerId: 'wang-anshi',
    });
    expect(result.record.politicalOverdraft).toBe(0);
    expect(result.state.resources.politicalCapital).toBe(43);
  });

  it('辅政官式的一主一辅节奏不会在三回合内耗尽政略', () => {
    let state = createInitialState();
    const decisions = [
      ['green-sprouts-trial', 'curb-local-exactions'],
      ['service-reform-preparation', 'review-impeachments'],
      ['water-conservancy', 'curb-local-exactions'],
      ['cross-check-ledgers', 'review-impeachments'],
    ];

    for (const policyIds of decisions) {
      state = settleTurn(state, { policyIds, officerId: 'wang-anshi' }).state;
      expect(state.resources.politicalCapital).toBeGreaterThan(0);
      expect(state.ending?.id).not.toBe('collapse');
    }
  });

  it('国库不足时仍执行政务，并在结算至零后失败', () => {
    const state = createInitialState();
    state.resources.treasury = 100;

    const result = settleTurn(state, {
      policyIds: ['green-sprouts-trial'],
      officerId: 'wang-anshi',
    });

    expect(result.state.resources.treasury).toBe(0);
    expect(result.state.history).toHaveLength(1);
    expect(result.state.activePolicies.some((policy) => policy.policyId === 'green-sprouts-trial')).toBe(true);
    expect(result.state.ended).toBe(true);
    expect(result.state.ending).toMatchObject({ id: 'collapse', title: '国用断绝' });
  });

  it('连续八回合后生成结局与完整档案', () => {
    let state = createInitialState();
    const decisions = [
      ['curb-local-exactions'],
      ['reduce-redundant-spending'],
      ['service-reform-preparation'],
      ['water-conservancy'],
      ['curb-local-exactions'],
      ['northwest-defense'],
      ['reduce-redundant-spending'],
      ['water-conservancy'],
    ];

    for (const policyIds of decisions) {
      state = settleTurn(state, { policyIds, officerId: 'han-qi' }).state;
    }

    expect(state.ended).toBe(true);
    expect(state.ending).not.toBeNull();
    expect(state.history).toHaveLength(8);
    expect(state.date).toEqual({ reignYear: 5, half: 2 });
    expect(state.objectives.find((item) => item.id === 'reform-foundation')?.completed).toBe(true);
  });

  it('完成四项国策且平均国势达到五十即可形成成果结局', () => {
    const state = createInitialState();
    for (const key of Object.keys(state.indicators) as Array<keyof typeof state.indicators>) state.indicators[key] = 50;
    state.objectives = state.objectives.map((objective, index) => ({ ...objective, completed: index < 4 }));

    expect(evaluateEnding(state)).toMatchObject({ id: 'balanced-reform', title: '新法有基', score: 50 });
  });

  it('整饬吏治政务无需硬前置即可直接执行', () => {
    const ledgerState = settleTurn(createInitialState(), {
      policyIds: ['cross-check-ledgers'], officerId: 'zeng-bu',
    }).state;
    expect(ledgerState.flags).toContain('verified-misconduct');
    expect(ledgerState.dilemmas.some((item) => item.id === 'verified-misconduct')).toBe(true);

    const disciplineState = settleTurn(createInitialState(), {
      policyIds: ['discipline-corrupt-officials'], officerId: 'fan-chunren',
    }).state;
    expect(disciplineState.flags).toContain('disciplined-corruption');
  });
});
