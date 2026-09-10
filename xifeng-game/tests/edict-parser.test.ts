import { describe, expect, it } from 'vitest';
import { isAdvisorOutline, parseEdict } from '../src';

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

  it('把提纲中的吏治与地方执行措辞解析为州县执行政务', () => {
    const result = parseEdict('核对三司账簿，限期一月；整顿吏治，逐级核验诏令能否落到州县。');

    expect(result.policyIds).toEqual(['curb-local-exactions', 'cross-check-ledgers']);
  });

  it('拦截直接粘贴的辅政官提纲', () => {
    const outline = `行政余量:37/50

财政|(国库与岁入)【主】核清三司岁入底数，旬末具报。
民生|(百姓负担)【辅】核定灾伤户实负，分等造册。
军事|(边备与军储)【暂缓】边警未至急迫，本期不做。
吏治|(诏令能否落到州县)【暂缓】有司正承前令，本期不做。

人事:暂无调任建议。`;

    expect(isAdvisorOutline(outline)).toBe(true);
    expect(parseEdict(outline)).toMatchObject({ policyIds: [], officerId: null, summary: '' });
    expect(parseEdict(outline).warnings[0]).toContain('不能直接作为诏书');
  });

  it('正常据提纲改写的诏书仍可提交并匹配财政与吏治', () => {
    const result = parseEdict('命曾布于一月内对勘三司账簿，并令监司抽验京东州县奉行实况，逐件复奏。');
    expect(isAdvisorOutline(result.sourceText)).toBe(false);
    expect(result.policyIds).toContain('cross-check-ledgers');
    expect(result.policyIds).toContain('curb-local-exactions');
    expect(result.officerId).toBe('zeng-bu');
  });
});
