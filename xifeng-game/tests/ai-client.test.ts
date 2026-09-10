import { describe, expect, it } from 'vitest';
import { adaptAdvisorAdvice } from '../src/ai/client';

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
});
