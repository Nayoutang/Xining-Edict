import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/game/initial-state';
import { buildCrisisMarkers } from '../src/ui/crisis-map';
import type { DilemmaProgress } from '../src/game/types';

describe('crisis map view model', () => {
  it('uses percentage coordinates and preserves dilemma meaning', () => {
    const state = createInitialState();
    const markers = buildCrisisMarkers(state.dilemmas);
    expect(markers).toHaveLength(state.dilemmas.length);
    for (const marker of markers) {
      expect(marker.x).toBeGreaterThanOrEqual(0);
      expect(marker.x).toBeLessThanOrEqual(100);
      expect(marker.y).toBeGreaterThanOrEqual(0);
      expect(marker.y).toBeLessThanOrEqual(100);
      expect(marker.title).toBe(state.dilemmas.find((item) => item.id === marker.id)?.title);
    }
  });

  it('supports adding, updating, hiding and removing a crisis', () => {
    const state = createInitialState();
    const testCrisis: DilemmaProgress = {
      id: 'test-crisis',
      title: '测试困境',
      description: '用于验证地图数据驱动渲染。',
      category: 'urgent',
      severity: 88,
      reformDirection: '完成验证后移除。',
    };
    const added = buildCrisisMarkers([...state.dilemmas, testCrisis]);
    expect(added.find((item) => item.id === 'test-crisis')).toMatchObject({ title: '测试困境', severity: 88, status: 'critical' });

    const updated = buildCrisisMarkers([...state.dilemmas, { ...testCrisis, severity: 32 }]);
    expect(updated.find((item) => item.id === 'test-crisis')?.severity).toBe(32);

    const hidden = buildCrisisMarkers([...state.dilemmas, testCrisis], new Set(['test-crisis']));
    expect(hidden.find((item) => item.id === 'test-crisis')?.status).toBe('hidden');

    const removed = buildCrisisMarkers(state.dilemmas);
    expect(removed.some((item) => item.id === 'test-crisis')).toBe(false);
  });
});
