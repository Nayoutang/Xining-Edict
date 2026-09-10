import { describe, expect, it } from 'vitest';
import { addPlainReactionLead, localizeDisplayText } from '../src/ui/text-localization';

describe('玩家界面文本中文化', () => {
  it('清理 AI 文本中的内部字段和值表达', () => {
    const localized = localizeDisplayText(
      '西北边备空虚（defense=40），courtSupport=36，finance=66，treasury=4920，administration=9。',
    );

    expect(localized).toBe('西北边备空虚（边备 40），士论 36，财用 66，国库 4920，行政 9。');
    expect(localized).not.toMatch(/defense|courtSupport|finance|treasury|administration/);
  });

  it('各方回奏直接给判断句并清除重复引导词', () => {
    expect(addPlainReactionLead('台谏', '直白说，政令若扰民，台谏必将追责。'))
      .toBe('台谏最怕政令扰民又无人担责。政令若扰民，台谏必将追责。');
    expect(addPlainReactionLead('州县', '州县在意人手和期限能否撑住。须宽定期限。'))
      .toBe('州县在意人手和期限能否撑住。须宽定期限。');
  });
});
