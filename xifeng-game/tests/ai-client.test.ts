import { describe, expect, it } from 'vitest';
import { adaptAdvisorAdvice } from '../src/ai/client';
import { createInitialState } from '../src';

describe('辅政官响应协议兼容', () => {
  it('把线上旧版草诏响应安全转换为四维提纲', () => {
    const advice = adaptAdvisorAdvice({
      situation: '旧版格局判断',
      policyIds: ['cross-check-ledgers', 'curb-local-exactions'],
      draftEdict: '制曰：此为旧版完整草诏。',
    }, 37);

    expect(advice.outline).toContain('行政余量:37/50');
    expect(advice.dimensions.map((item) => item.name)).toEqual(['财政', '民生', '军事', '吏治']);
    expect(advice.dimensions.filter((item) => item.role === '主')).toHaveLength(1);
    expect(advice.dimensions.filter((item) => item.role === '辅')).toHaveLength(1);
    expect(advice.dimensions.filter((item) => item.role === '暂缓')).toHaveLength(2);
    expect(advice.outline).not.toContain('制曰');
    expect(advice.outline.length).toBeLessThanOrEqual(200);
  });

  it('旧版线上响应也会按回合改换着力点并标明续办', () => {
    const state = createInitialState();
    state.turn = 6;
    state.resources.administration = 29;
    state.indicators = { finance: 61, livelihood: 57, defense: 22, courtSupport: 48, execution: 52 };
    state.history = [{
      turn: 5, date: { reignYear: 3, half: 1 }, eventTitle: '前回急务',
      policyIds: ['cross-check-ledgers', 'curb-local-exactions'], officerId: 'zeng-bu',
      indicatorChanges: {}, resourceChanges: {}, administrativeOverload: 0, politicalOverdraft: 0,
    }];
    const advice = adaptAdvisorAdvice({ policyIds: ['cross-check-ledgers', 'curb-local-exactions'] }, state);

    expect(advice.outline).toContain('行政余量:29/50');
    expect(advice.dimensions.find((item) => item.role === '主')?.name).toBe('军事');
    expect(advice.dimensions.find((item) => item.name === '吏治')?.advice.startsWith('续办')).toBe(true);
    expect(advice.dimensions.find((item) => item.name === '军事')?.advice).toContain('寨堡');
    expect(advice.dimensions.filter((item) => item.role === '暂缓').map((item) => item.advice).join('')).not.toMatch(/限期|核查|逐级核验|增兵/);
  });
});
