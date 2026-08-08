import { getHistoricalEvent } from '../data/events';
import type { DilemmaProgress, GameState } from './types';

const clampSeverity = (value: number) => Math.max(1, Math.min(100, Math.round(value)));

export function evaluateDilemmas(state: GameState): DilemmaProgress[] {
  const event = getHistoricalEvent(state.turn);
  const enacted = new Set(state.history.flatMap((record) => record.policyIds));
  for (const active of state.activePolicies) enacted.add(active.policyId);

  const dilemmas: DilemmaProgress[] = [
    {
      id: 'fiscal-imbalance', title: '国用匮乏', category: 'structural',
      description: '冗官、冗兵与边费日重，三司财计难以支应国家长期用度。',
      severity: clampSeverity(100 - state.indicators.finance),
      reformDirection: '开源节流并整顿财计，但须避免把财政压力转嫁州县。',
    },
    {
      id: 'weak-administration', title: '政令壅于州县', category: 'structural',
      description: '中央号令经过监司、州县与胥吏层层执行，容易延宕或变形。',
      severity: clampSeverity(100 - state.indicators.execution),
      reformDirection: '整顿吏治、建立簿籍与考课，同时给地方保留必要裁量。',
    },
    {
      id: 'border-pressure', title: '西北边备空虚', category: 'structural',
      description: '陕西军储、寨堡与将兵体系承受长期边防压力。',
      severity: clampSeverity(100 - state.indicators.defense),
      reformDirection: '补足军储并整顿将兵，避免以仓促开边消耗国力。',
    },
    {
      id: 'livelihood-strain', title: '民力困敝', category: 'structural',
      description: '差役、兼并、灾伤与地方加派叠加，民户抵御风险的能力不足。',
      severity: clampSeverity(100 - state.indicators.livelihood),
      reformDirection: '均平役法、赈济灾伤并抑制额外摊派。',
    },
    {
      id: `urgent-${state.turn}`, title: event.title, category: 'urgent',
      description: event.description,
      severity: clampSeverity(35 + Object.values(event.effects).reduce((sum, value) => sum + Math.abs(value ?? 0), 0) * 5),
      reformDirection: '本期奏报将直接影响半年结算，应在诏书中作出回应。',
    },
  ];

  if (enacted.has('green-sprouts-trial') && state.indicators.execution < 50) {
    dilemmas.push({
      id: 'forced-loans', title: '青苗抑配蔓延', category: 'reform',
      description: '部分州县为完成钱额，以户等定数强令民户借贷，新法开始背离本意。',
      severity: clampSeverity(50 - state.indicators.execution + 35),
      reformDirection: '查禁定额抑配、强化监司核验，并允许灾伤户免借。',
    });
  }

  const reformCount = [...enacted].filter((id) => ['green-sprouts-trial', 'service-reform-preparation', 'water-conservancy'].includes(id)).length;
  if (reformCount >= 2 && state.indicators.courtSupport < 55) {
    dilemmas.push({
      id: 'factional-politics', title: '新旧党议渐成', category: 'reform',
      description: '制度争议开始转为对主事者的攻讦，朝廷共同议政的空间正在缩小。',
      severity: clampSeverity(75 - state.indicators.courtSupport),
      reformDirection: '公开核验成效、容纳异议，并避免以立场代替制度讨论。',
    });
  }

  if (state.turn >= 3 && !enacted.has('cross-check-ledgers')) {
    dilemmas.push({
      id: 'concealed-corruption', title: '官署簿籍真伪难明', category: 'reform',
      description: '弹章、官署自报与百姓申诉彼此冲突，朝廷尚不能分辨执行偏差、营私舞弊与党争构陷。',
      severity: clampSeverity(42 + state.turn * 3 - state.indicators.execution / 4),
      reformDirection: '先复核弹章，再对勘账簿与证词；未经查实便罢黜，可能使整饬吏治沦为党争。',
    });
  }

  if (state.flags.includes('verified-misconduct') && !state.flags.includes('disciplined-corruption')) {
    dilemmas.push({
      id: 'verified-misconduct', title: '奸蠹有据，尚待裁断', category: 'urgent',
      description: '部分官署账目与证词已经相互印证，但涉案者仍掌钱粮、刑名或地方考课。',
      severity: 64,
      reformDirection: '按证据和情节分别追赃、罢免、贬调或留任察看，避免一概株连。',
    });
  }

  const overload = state.history.at(-1)?.administrativeOverload ?? 0;
  if (overload > 0) {
    dilemmas.push({
      id: 'administrative-overload', title: '诏令并下，有司壅滞', category: 'reform',
      description: '半年内承办政务超过官僚体系能力，部分命令延误、敷衍或彼此冲突。',
      severity: clampSeverity(25 + overload * 3),
      reformDirection: '补充行政能力、厘清机构权责，或用后续诏令纠正执行变形。',
    });
  }

  const politicalOverdraft = state.history.at(-1)?.politicalOverdraft ?? 0;
  if (politicalOverdraft > 0) {
    dilemmas.push({
      id: 'political-overdraft', title: '朝议未合，诏令强推', category: 'reform',
      description: '朝廷缺少足够的政治余地仍强行颁诏，台谏与有司疑虑加深，政令执行也更易受到抵牾。',
      severity: clampSeverity(30 + politicalOverdraft * 5),
      reformDirection: '减少同回合政务、改用政治成本较低的承办官，并以改善士论恢复政略。',
    });
  }

  return dilemmas.sort((a, b) => b.severity - a.severity);
}
