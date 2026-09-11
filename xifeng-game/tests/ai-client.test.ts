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
    expect(advice.outline).toContain('局势研判:');
    expect(advice.outline).toContain('需要决定：');
    expect(advice.outline).not.toMatch(/具报|复奏|奉行|文移|案牍|实负|催科/);
    expect(advice.outline.length).toBeLessThanOrEqual(900);
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
    expect(advice.personnelRecommendation?.officeName).toBe('枢密院');
    expect(advice.outline).toContain('铨选建议:');
    expect(advice.dimensions.filter((item) => item.role === '暂缓').map((item) => item.advice).join('')).not.toMatch(/限期|核查|逐级核验|增兵/);
  });

  it('把模型偶尔返回的公文词转换成玩家易懂的白话', () => {
    const advice = adaptAdvisorAdvice({
      situation: '民力困敝与政令壅滞并存，故本期只宜先核底数。',
      dimensions: [
        { name: '财政', scope: '国库与岁入', role: '主', advice: '差三司使核出岁入岁支实数与隐没羡余，不得径行加赋。', decision: '先核三司账簿，还是先核诸路上供账目？', policyId: 'cross-check-ledgers' },
        { name: '民生', scope: '百姓负担', role: '辅', advice: '令州县逐项开列榜示，凡无朝廷明文者即行停征。', decision: '先在灾伤州军开查，还是在赋重州军开查？', policyId: 'curb-local-exactions' },
        { name: '军事', scope: '边备与军储', role: '暂缓', advice: '边警未至急迫，本期财力宜顾主务。', policyId: 'northwest-defense' },
        { name: '吏治', scope: '诏令能否落到州县', role: '暂缓', advice: '地方承载尚可，本期不宜叠加事务。', policyId: 'curb-local-exactions' },
      ],
    }, 40);

    const text = `${advice.situation}\n${advice.dimensions.map((item) => `${item.advice}${item.decision ?? ''}`).join('\n')}`;
    expect(text).toContain('百姓负担沉重与政令执行受阻并存，所以本期只能先核底数。');
    expect(text).toContain('安排三司使查出实际收入和支出与隐瞒或多出的款项，不能直接加税。');
    expect(text).toContain('让州县逐项列出并公开，没有朝廷正式文件依据的项目立即停止征收。');
    expect(text).not.toMatch(/民力困敝|政令壅滞|故本期|只宜|岁入岁支|隐没羡余|径行加赋|州军|边警未至急迫|宜顾主务/);
  });
});
