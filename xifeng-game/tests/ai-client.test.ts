import { describe, expect, it } from 'vitest';
import { adaptAdvisorAdvice } from '../src/ai/client';
import { createInitialState } from '../src';

describe('辅政官响应协议兼容', () => {
  it('旧版响应缺少分维度建议时明确报错，不凭空生成模板', () => {
    expect(() => adaptAdvisorAdvice({ policyIds: ['cross-check-ledgers'] }, createInitialState())).toThrow('缺少分维度建议');
  });

  it('短建议不补写措施，保留多主项和数值暂缓理由', () => {
    const dimensions = [
      { name: '财政', scope: '国库', role: '主', advice: '暂停非必要支出。', policyId: 'reduce-redundant-spending' },
      { name: '军事', scope: '边备', role: '主', advice: '优先补给受围寨堡。', policyId: 'northwest-defense' },
      { name: '民生', scope: '百姓', role: '暂缓', advice: '民生30，但行政仅5，无力新增任务。', policyId: 'curb-local-exactions' },
    ];
    const result = adaptAdvisorAdvice({ dimensions }, createInitialState());
    expect(result.dimensions.map((item) => item.advice)).toEqual(dimensions.map((item) => item.advice));
    expect(result.dimensions.map((item) => item.role)).toEqual(['主', '主', '暂缓']);
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

  it('主务官署没有空缺时不建议反复替换现任', () => {
    const state = createInitialState();
    const finance = state.polity.offices.find((office) => office.key === 'finance')!;
    finance.posts[0]!.appointeeId = 'zeng-bu';
    finance.posts[1]!.appointeeId = 'lv-huiqing';
    const result = adaptAdvisorAdvice({
      dimensions: [
        { name: '财政', scope: '国库', role: '主', advice: '核对账簿。', policyId: 'cross-check-ledgers' },
        { name: '民生', scope: '百姓', role: '暂缓', advice: '本期暂缓。', policyId: 'curb-local-exactions' },
      ],
    }, state);

    expect(result.personnelRecommendation).toBeUndefined();
    expect(result.personnel).toBe('本期无合适的未任候选人。');
  });
});
