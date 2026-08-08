import type { GameState } from './types';
import { evaluateObjectives } from './objectives';
import { evaluateDilemmas } from './dilemmas';

export function createInitialState(): GameState {
  const state: GameState = {
    turn: 1,
    maxTurns: 8,
    date: { reignYear: 2, half: 1 },
    indicators: {
      finance: 45,
      livelihood: 55,
      defense: 40,
      courtSupport: 45,
      execution: 35,
    },
    resources: {
      treasury: 6000,
      politicalCapital: 50,
      administration: 40,
    },
    flags: [],
    activePolicies: [],
    objectives: [],
    dilemmas: [],
    polity: {
      offices: [
        {
          key: 'secretariat',
          name: '中书门下',
          scope: '草诏、议政、统领百官政令',
          posts: [
            { key: 'secretariat-chancellor', title: '同中书门下平章事', appointeeId: 'fu-bi' },
            { key: 'secretariat-councillor', title: '参知政事', appointeeId: 'wang-anshi' },
          ],
          reform: '御前直达',
        },
        {
          key: 'military',
          name: '枢密院',
          scope: '军政、边防、将兵调度',
          posts: [
            { key: 'military-commissioner', title: '枢密使', appointeeId: 'han-qi' },
            { key: 'military-deputy', title: '枢密副使', appointeeId: null },
          ],
          reform: '旧制未改',
        },
        {
          key: 'finance',
          name: '三司',
          scope: '盐铁、度支、户部财赋',
          posts: [
            { key: 'finance-commissioner', title: '三司使', appointeeId: 'zeng-bu' },
            { key: 'finance-deputy', title: '三司副使', appointeeId: null },
          ],
          reform: '考课审计',
        },
        {
          key: 'censorate',
          name: '台谏',
          scope: '弹劾、言事、监察朝政',
          posts: [
            { key: 'censor-in-chief', title: '御史中丞', appointeeId: 'lv-gongzhu' },
            { key: 'remonstrance-chief', title: '知谏院', appointeeId: 'fan-chunren' },
          ],
          reform: '旧制未改',
        },
        {
          key: 'transport',
          name: '诸路转运司',
          scope: '地方财赋、输纳、州县执行',
          posts: [
            { key: 'transport-commissioner', title: '转运使', appointeeId: 'wen-yanbo' },
            { key: 'transport-deputy', title: '转运副使', appointeeId: null },
          ],
          reform: '中枢复核',
        },
      ],
    },
    history: [],
    ended: false,
    ending: null,
  };

  state.objectives = evaluateObjectives(state);
  state.dilemmas = evaluateDilemmas(state);
  return state;
}
