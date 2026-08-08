import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/game/initial-state';
import { appointCourtOfficer, dismissCourtOfficer } from '../src/game/polity';

describe('朝廷官制任免', () => {
  it('可以更换核心官职且不修改原状态', () => {
    const initial = createInitialState();
    const next = appointCourtOfficer(initial, 'finance', 'finance-commissioner', 'sima-guang');

    expect(initial.polity.offices.find((office) => office.key === 'finance')?.posts[0]?.appointeeId).toBe('zeng-bu');
    expect(next.polity.offices.find((office) => office.key === 'finance')?.posts[0]?.appointeeId).toBe('sima-guang');
  });

  it('可以罢免核心官职并保留机构与其他席位', () => {
    const initial = createInitialState();
    const next = dismissCourtOfficer(initial, 'military', 'military-commissioner');

    expect(next.polity.offices.find((office) => office.key === 'military')?.posts[0]?.appointeeId).toBeNull();
    expect(next.polity.offices.find((office) => office.key === 'military')?.posts).toHaveLength(2);
    expect(next.polity.offices).toHaveLength(5);
  });

  it('已有职任的官员不能直接列入改授人选', () => {
    const initial = createInitialState();
    expect(() => appointCourtOfficer(initial, 'finance', 'finance-deputy', 'wang-anshi')).toThrow('已有职任');
  });

  it('罢免后的官员可以再次改授', () => {
    const initial = createInitialState();
    const dismissed = dismissCourtOfficer(initial, 'secretariat', 'secretariat-councillor');
    const next = appointCourtOfficer(dismissed, 'finance', 'finance-deputy', 'wang-anshi');

    expect(next.polity.offices.find((office) => office.key === 'finance')?.posts.find((post) => post.key === 'finance-deputy')?.appointeeId).toBe('wang-anshi');
  });

  it('拒绝不存在的官员、机构或核心官职', () => {
    const initial = createInitialState();
    expect(() => appointCourtOfficer(initial, 'finance', 'finance-commissioner', 'not-an-officer')).toThrow('待任官员不存在');
    expect(() => dismissCourtOfficer(initial, 'not-an-office' as never, 'finance-commissioner')).toThrow('朝廷机构不存在');
    expect(() => dismissCourtOfficer(initial, 'finance', 'not-a-post' as never)).toThrow('核心官职不存在');
  });
});
