import { describe, expect, it } from 'vitest';
import { localizeDisplayText } from '../src/ui/text-localization';

describe('玩家界面文本中文化', () => {
  it('清理 AI 文本中的内部字段和值表达', () => {
    const localized = localizeDisplayText(
      '西北边备空虚（defense=40），courtSupport=36，finance=66，treasury=4920，administration=9。',
    );

    expect(localized).toBe('西北边备空虚（边备 40），士论 36，财用 66，国库 4920，行政 9。');
    expect(localized).not.toMatch(/defense|courtSupport|finance|treasury|administration/);
  });
});
