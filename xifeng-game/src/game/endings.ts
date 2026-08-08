import type { Ending, GameState } from './types';

const indicatorKeys = ['finance', 'livelihood', 'defense', 'courtSupport', 'execution'] as const;

export function evaluateEnding(state: GameState): Ending {
  const collapsed = indicatorKeys.find((key) => state.indicators[key] <= 0);

  if (state.resources.treasury <= 0) {
    return {
      id: 'collapse',
      title: '国用断绝',
      description: '诏令虽已施行，国库却在本期结算后告罄，朝廷无力维系新政。',
      score: 0,
    };
  }

  if (state.resources.politicalCapital <= 0) {
    return {
      id: 'collapse',
      title: '朝议尽失',
      description: '诏令虽已施行，朝廷的协调与议政余地却在本期耗尽，新政失去政治支撑。',
      score: 0,
    };
  }

  if (state.resources.administration <= 0) {
    return {
      id: 'collapse',
      title: '政令停摆',
      description: '诏令虽已施行，官僚体系的承办能力却在本期耗尽，后续政令已无法正常运转。',
      score: 0,
    };
  }

  if (collapsed) {
    return {
      id: 'collapse',
      title: '新政中断',
      description: '朝廷已经失去继续推动改革的基本条件，熙宁新政被迫中断。',
      score: 0,
    };
  }

  const score = Math.round(
    indicatorKeys.reduce((total, key) => total + state.indicators[key], 0) / indicatorKeys.length,
  );
  const completed = state.objectives.filter((objective) => objective.completed).length;

  if (completed >= Math.max(1, state.objectives.length - 1) && score >= 50) {
    return {
      id: 'balanced-reform',
      title: '新法有基',
      description: '新政在财用、民生与行政之间取得了脆弱但真实的平衡。',
      score,
    };
  }

  if (state.indicators.finance >= 65 && state.indicators.livelihood < 35) {
    return {
      id: 'wealth-at-a-cost',
      title: '富国伤民',
      description: '国用渐丰，但州县以催科和抑配承担了改革代价。',
      score,
    };
  }

  if (state.indicators.courtSupport < 25) {
    return {
      id: 'factional-rift',
      title: '党争裂国',
      description: '政策尚在，朝廷却已失去共同议政的可能。',
      score,
    };
  }

  return {
    id: 'unfinished-history',
    title: '未竟之史',
    description: '若干新制已经落地，但它们能否经受之后的政局仍无定论。',
    score,
  };
}
