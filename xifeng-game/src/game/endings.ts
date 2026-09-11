import type { Ending, GameState } from './types';

const indicatorKeys = ['finance', 'livelihood', 'defense', 'courtSupport', 'execution'] as const;

const dilemmaWeights = { structural: 1, urgent: .8, reform: 1.3 } as const;

export function getDilemmaScore(state: GameState): number {
  if (!state.dilemmas.length) return 100;
  const weightedSeverity = state.dilemmas.reduce(
    (total, dilemma) => total + dilemma.severity * dilemmaWeights[dilemma.category], 0,
  );
  const totalWeight = state.dilemmas.reduce((total, dilemma) => total + dilemmaWeights[dilemma.category], 0);
  const overloadPenalty = state.history.reduce(
    (total, record) => total + record.administrativeOverload * .5 + record.politicalOverdraft * .75, 0,
  );
  return Math.max(0, Math.min(100, Math.round(100 - weightedSeverity / totalWeight - overloadPenalty)));
}

export function evaluateEnding(state: GameState): Ending {
  const collapsed = indicatorKeys.find((key) => state.indicators[key] <= 0);
  const score = getDilemmaScore(state);
  const survivingStrength = `困境治理评分仍为 ${score} 分，但`;

  if (state.resources.treasury <= 0) {
    return {
      id: 'collapse',
      title: '国用断绝',
      description: `${survivingStrength}国库在本期结算后告罄；已有成效失去钱粮支撑，新政因此中断。`,
      score,
    };
  }

  if (state.resources.politicalCapital <= 0) {
    return {
      id: 'collapse',
      title: '朝议尽失',
      description: `${survivingStrength}政略在本期耗尽；已有成效失去朝议与协调支撑，新政因此中断。`,
      score,
    };
  }

  if (state.resources.administration <= 0) {
    return {
      id: 'collapse',
      title: '政令停摆',
      description: `${survivingStrength}行政余量在本期耗尽；已有成效无人承办，后续政令已无法正常运转。`,
      score,
    };
  }

  if (collapsed) {
    return {
      id: 'collapse',
      title: '新政中断',
      description: `${survivingStrength}${collapsed ? '至少一项国势已经跌至零点' : '朝廷已失去继续改革的基本条件'}，熙宁新政被迫中断。`,
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

  if (state.indicators.execution < 30) {
    return {
      id: 'government-stalled',
      title: '政令不出中枢',
      description: '若干政令虽已颁行，地方执行却跌破承载底线，治理成果难以维持。',
      score,
    };
  }

  if (score >= 80) {
    return {
      id: 'stable-realm',
      title: '天下粗安',
      description: '主要困境已经降至低位，改革后遗也得到控制；各项国势守住了承载底线。',
      score,
    };
  }

  if (score >= 65) {
    return {
      id: 'balanced-reform',
      title: '新法有基',
      description: '多数结构性困境已有缓解，虽有遗留，新政仍建立了可以延续的基础。',
      score,
    };
  }

  if (score >= 50) {
    return {
      id: 'mixed-results',
      title: '得失相半',
      description: '部分困境得到缓解，但朝廷仍留下一个或多个需要后续处置的重难问题。',
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
