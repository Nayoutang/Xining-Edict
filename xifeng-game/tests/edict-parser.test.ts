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

  it('把提纲中的吏治与地方执行措辞解析为州县执行政务', () => {
    const result = parseEdict('核对三司账簿，限期一月；整顿吏治，逐级核验诏令能否落到州县。');

    expect(result.policyIds).toEqual(['curb-local-exactions', 'cross-check-ledgers']);
  });

  it('允许直接粘贴辅政官提纲并解析其中的政务', () => {
    const outline = `行政余量:37/50

财政|(国库与岁入)【主】核查三司账目，十天内报上实际岁入。
民生|(百姓负担)【辅】抽查州县是否额外加收费用，把多收的钱退回百姓。
军事|(边备与军储)【暂缓】边警未至急迫，本期不做。
吏治|(诏令能否落到州县)【暂缓】有司正承前令，本期不做。

人事:暂无调任建议。`;

    const result = parseEdict(outline);
    expect(result.policyIds).toContain('cross-check-ledgers');
    expect(result.policyIds).toContain('curb-local-exactions');
    expect(result.policyIds).toContain('northwest-defense');
  });

  it('整段文本不再因提纲格式跳过其中的执行官人名', () => {
    const outline = `局势研判:\n执行偏低，本期先查州县。\n\n行政余量:37/50\n\n财政|(国库与岁入)【主】核清三司账簿。\n民生|(百姓负担)【辅】核定灾伤户实负。\n军事|(边备与军储)【暂缓】边警尚缓。\n吏治|(诏令能否落到州县)【暂缓】有司方忙。\n\n铨选建议:\n岗位:三司·三司使\n推荐:曾布`;
    const result = parseEdict(outline);
    expect(result.officerId).toBe('zeng-bu');
  });

  it('正常据提纲改写的诏书仍可提交并匹配财政与吏治', () => {
    const result = parseEdict('命曾布于一月内对勘三司账簿，并令监司抽验京东州县奉行实况，逐件复奏。');
    expect(result.policyIds).toContain('cross-check-ledgers');
    expect(result.policyIds).toContain('curb-local-exactions');
    expect(result.officerId).toBe('zeng-bu');
  });

  it('能识别采纳按钮追加的现代白话建议', () => {
    const result = parseEdict('财政：核查三司账目，一个月内报上实际收入。\n吏治：抽查三个地区执行诏令的情况，报告积压和擅改的问题。');
    expect(result.policyIds).toContain('cross-check-ledgers');
    expect(result.policyIds).toContain('curb-local-exactions');
  });
});
