import { describe, expect, it } from 'vitest';
import { appendAdoptedAdvice } from '../src/ui/advisor-adopt';

describe('辅政官建议采纳', () => {
  it('首次采纳会预填编辑区，之后采纳按新行追加而不覆盖', () => {
    const first = appendAdoptedAdvice('', '财政：核查三司账目，一个月内报上实际收入。');
    const second = appendAdoptedAdvice(first, '民生：抽查州县是否额外收费，把多收的钱退回百姓。');

    expect(first).toBe('财政：核查三司账目，一个月内报上实际收入。');
    expect(second).toBe('财政：核查三司账目，一个月内报上实际收入。\n民生：抽查州县是否额外收费，把多收的钱退回百姓。');
  });

  it('保留玩家已经编辑的正文，只清理末尾空行', () => {
    expect(appendAdoptedAdvice('先行小范围试办。\n\n', '吏治：抽查三个地区的执行情况。'))
      .toBe('先行小范围试办。\n吏治：抽查三个地区的执行情况。');
  });
});
