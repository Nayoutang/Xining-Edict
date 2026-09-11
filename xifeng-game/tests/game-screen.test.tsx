import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/game/initial-state';
import { GameScreen } from '../src/ui/GameScreen';
import type { DilemmaProgress, GameState } from '../src/game/types';

const noop = () => undefined;

function renderGameScreen(state: GameState) {
  return renderToStaticMarkup(<GameScreen
    state={state}
    selectedCrisisId={null}
    onSelectCrisis={noop}
    onOpenDilemmas={noop}
    onOpenEdict={noop}
    onOpenCourt={noop}
    onOpenArchive={noop}
    onOpenRecords={noop}
    onOpenSaves={noop}
  />);
}

describe('GameScreen dynamic DOM', () => {
  it('renders turn and resources only from state', () => {
    const state = createInitialState();
    const initial = renderGameScreen(state);
    expect(initial).toContain('第 1 / 8 回合');
    expect(initial).toContain('6,000万贯');
    expect(initial).toContain('aria-label="政略 50。推动诏令、协调朝议所需的政治余地。"');
    expect(initial).toContain('aria-expanded="false"');
    expect(initial).toContain('所在的困境总览');
    expect(initial).not.toContain('详细奏札');
    expect(initial).toContain('铨选');
    expect(initial).not.toContain('法度');
    expect(initial).not.toContain('selected-officer');

    const changed: GameState = {
      ...state,
      turn: 3,
      date: { reignYear: 3, half: 1 },
      resources: { ...state.resources, treasury: 7777, politicalCapital: 63 },
      indicators: { ...state.indicators, livelihood: 72 },
    };
    const updated = renderGameScreen(changed);
    expect(updated).toContain('第 3 / 8 回合');
    expect(updated).toContain('熙宁三年上半年');
    expect(updated).toContain('7,777万贯');
    expect(updated).toContain('63');
    expect(updated).toContain('72');
  });

  it('adds and removes crisis DOM from the dilemma array', () => {
    const state = createInitialState();
    const testCrisis: DilemmaProgress = {
      id: 'test-crisis',
      title: '测试困境',
      description: '地图应自动显示。',
      category: 'urgent',
      severity: 81,
      reformDirection: '完成测试后移除。',
    };
    const added = renderGameScreen({ ...state, dilemmas: [...state.dilemmas, testCrisis] });
    expect(added).toContain('data-crisis-id="test-crisis"');
    expect(added).toContain('测试困境');

    const removed = renderGameScreen(state);
    expect(removed).not.toContain('data-crisis-id="test-crisis"');
  });
});
