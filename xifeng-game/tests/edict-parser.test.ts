import { describe, expect, it } from 'vitest';
import { parseEdict } from '../src';

describe('自由诏书解析', () => {
  it('从自然语言中识别多项政务和执行官', () => {
    const result = parseEdict('命司马光查京东州县青苗钱强制抑配，灾伤之地缓征，并裁减宫观营造补其岁入。');

    expect(result.policyIds).toContain('green-sprouts-trial');
    expect(result.policyIds).toContain('curb-local-exactions');
    expect(result.policyIds).toContain('reduce-redundant-spending');
    expect(result.officerId).toBe('sima-guang');
    expect(result.summary).toContain('中书拟将诏意落实为');
  });

  it('未命中词表时降级为开放政务而不是阻断玩家', () => {
    const result = parseEdict('务必使天下太平。');
    expect(result.policyIds).toEqual(['open-ended-directive']);
    expect(result.warnings[0]).toContain('御前专项政务');
  });

  it('一份诏书可以同时覆盖六类政务', () => {
    const result = parseEdict('试行青苗法，清查差役，兴修水利，查禁州县摊派，裁减宫观冗费，并补陕西边备军粮。');
    expect(result.policyIds).toHaveLength(6);
  });

  it('能识别从复核弹章到依法黜陟的吏治诏令', () => {
    const result = parseEdict('命曾布复核台谏弹章，对勘市易务账簿；证据确凿者依法黜免并追赃。');
    expect(result.policyIds).toContain('review-impeachments');
    expect(result.policyIds).toContain('cross-check-ledgers');
    expect(result.policyIds).toContain('discipline-corrupt-officials');
    expect(result.officerId).toBe('zeng-bu');
  });
});
