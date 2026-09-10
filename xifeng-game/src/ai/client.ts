import type { EdictInterpretation } from './edict-parser';
import type { GameState, HistoricalEvent, Officer, Policy, TurnRecord } from '../game/types';

export interface AIConfig {
  provider: 'deepseek' | 'openai' | 'anthropic' | 'qwen' | 'kimi' | 'zhipu' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface HistoricalNarrative {
  report: string;
  situationUpdate: string;
  implementation: Array<{ stage: string; text: string }>;
  reactions: Array<{ label: string; text: string }>;
  nominations: Array<{ name: string; role: string; stance: string; assessment: string }>;
  institutionalChanges: string[];
  nextWarnings: string[];
  historicalNote: string;
}

export interface AdvisorAdvice {
  outline: string;
  dimensions: Array<{
    name: '财政' | '民生' | '军事' | '吏治';
    scope: string;
    role: '主' | '辅' | '暂缓';
    advice: string;
    policyId: string;
  }>;
  personnel: string;
  policyIds: string[];
}

interface LegacyAdvisorAdvice {
  policyIds?: unknown;
}

const advisorDimensionDefaults = [
  { name: '财政', scope: '国库与岁入', policyId: 'cross-check-ledgers', indicator: 'finance', actions: ['核清三司岁入底数，旬末具报。', '按路核验实收差额，月内结案。', '比较新法钱谷实收，剔除虚数。', '追查账实不符款项，责主司说明。', '据中期账案收窄支用，保留赈备。', '清理积欠与虚冒，分路销账。', '复核历年财计成效，补足缺口。', '结清未决钱谷，封存终局账册。'], paused: ['国库尚可支应，本期急务在别处。', '财计波动有限，本期主辅另有短板。', '主辅成本已定，本期财力不宜分散。', '国库尚须留备，本期不宜另开财务。', '现有岁入可承，本期财政并非急项。', '本期主务耗资较多，财计余地有限。', '历年财计趋稳，本期更急者在他项。', '终局财力尚足，本期无需另占余量。'] },
  { name: '民生', scope: '百姓负担', policyId: 'curb-local-exactions', indicator: 'livelihood', actions: ['核定灾伤户实负，分等造册。', '抽查青苗抑配，退还强敛钱物。', '比较诸路役钱轻重，先纠偏重县。', '核验水利受益户，减免无益之费。', '追查加派名目，责监司逐项销除。', '复核贫户减负实数，纠正漏免。', '清理遗留役债，禁止重复催科。', '汇总民户实负，办结未清申诉。'], paused: ['民户负担尚稳，本期急务不在民生。', '前令成效未定，本期不宜再扰民户。', '州县承载已紧，本期民务不宜并举。', '民生波动有限，本期尚非最急短板。', '当前实负未恶化，本期可让位主务。', '主辅已有更急方向，本期民务宜缓。', '既有减负尚在显效，本期无需叠加。', '终局民情可持，本期余量宜顾他项。'] },
  { name: '军事', scope: '边备与军储', policyId: 'northwest-defense', indicator: 'defense', actions: ['盘点陕西军储缺口，十日具报。', '核对寨堡见粮，先补紧要处。', '查明转运迟滞路段，限期疏通。', '按边警轻重调剂军粮，不另增额。', '核验军需实到数，追查途中亏耗。', '补足关键寨堡月粮，暂停虚领。', '复查边备薄弱处，集中现有兵力。', '结清军储缺额，留足善后之用。'], paused: ['边警未至急迫，本期财力宜顾主务。', '军储尚可支应，本期边务并非短板。', '边情未见骤变，本期无需占用余量。', '现有寨堡可守，本期急务另有所属。', '军需压力可控，本期主辅不在边备。', '本期内政更急，边务暂无迫切之势。', '边备已稍稳，本期不宜分散国力。', '终局边情可持，本期无需另列实务。'] },
  { name: '吏治', scope: '诏令能否落到州县', policyId: 'curb-local-exactions', indicator: 'execution', actions: ['梳理州县文移，列明承办官。', '抽验三路奉行实况，月内复奏。', '对照诏令与案牍，查出擅改条目。', '追究积压公文，责监司定期销案。', '按执行偏差分责，不作泛察。', '复核已劾官吏证据，依法结案。', '清理州县未结事项，逐件回奏。', '汇总奉行成效，处分失职官吏。'], paused: ['地方承载尚可，本期不宜叠加事务。', '有司余力已紧，本期应留主务。', '前令尚在消化，本期吏治并非首急。', '地方未见新壅，本期无需另占余量。', '现有承办尚稳，本期急务在别项。', '州县压力可控，本期不宜再添事务。', '执行已见改善，本期可让位更弱国势。', '终局承载尚足，本期无需另列吏务。'] },
] as const;

const policyDimension: Record<string, AdvisorAdvice['dimensions'][number]['name']> = {
  'green-sprouts-trial': '财政',
  'service-reform-preparation': '民生',
  'water-conservancy': '民生',
  'curb-local-exactions': '吏治',
  'reduce-redundant-spending': '财政',
  'northwest-defense': '军事',
  'review-impeachments': '吏治',
  'cross-check-ledgers': '财政',
  'discipline-corrupt-officials': '吏治',
};

export function adaptAdvisorAdvice(value: unknown, stateOrAdministration: GameState | number): AdvisorAdvice {
  const advice = value as Partial<AdvisorAdvice> & LegacyAdvisorAdvice;
  if (typeof advice?.outline === 'string' && Array.isArray(advice.dimensions)) return advice as AdvisorAdvice;

  const state = typeof stateOrAdministration === 'number' ? null : stateOrAdministration;
  const administration = typeof stateOrAdministration === 'number' ? stateOrAdministration : stateOrAdministration.resources.administration;
  const turn = Math.max(1, Math.min(8, Math.round(state?.turn ?? 1)));
  const previousPolicyIds = new Set(state?.history.flatMap((record) => record.policyIds) ?? []);

  const legacyPolicyIds = Array.isArray(advice?.policyIds) ? advice.policyIds.filter((item): item is string => typeof item === 'string') : [];
  const weaknessNames = state ? advisorDimensionDefaults
    .map((item) => ({ name: item.name, value: item.name === '吏治' ? Math.min(state.indicators.execution, state.indicators.courtSupport + 5) : state.indicators[item.indicator] }))
    .sort((left, right) => left.value - right.value)
    .map((item) => item.name) : [];
  const selectedNames = (state ? weaknessNames : legacyPolicyIds.map((id) => policyDimension[id]))
    .filter((name, index, names) => Boolean(name) && names.indexOf(name) === index).slice(0, 2);
  if (!selectedNames.length) selectedNames.push('财政');
  if (selectedNames.length < 2) selectedNames.push(advisorDimensionDefaults.find((item) => !selectedNames.includes(item.name))?.name ?? '民生');
  const dimensions: AdvisorAdvice['dimensions'] = advisorDimensionDefaults.map((item) => {
    const role = item.name === selectedNames[0] ? '主' : item.name === selectedNames[1] ? '辅' : '暂缓';
    const action = item.actions[turn - 1] ?? item.actions.at(-1)!;
    return {
      name: item.name,
      scope: item.scope,
      policyId: item.policyId,
      role,
      advice: role === '暂缓' ? item.paused[turn - 1] ?? item.paused.at(-1)! : previousPolicyIds.has(item.policyId) ? `续办，${action}` : action,
    };
  });
  const personnel = '暂无调任建议。';
  const outline = [
    `行政余量:${Math.max(0, Math.round(administration || 0))}/50`,
    '',
    ...dimensions.map((item) => `${item.name}|(${item.scope})【${item.role}】${item.advice}`),
    '',
    `人事:${personnel}`,
  ].join('\n');
  return {
    outline,
    dimensions,
    personnel,
    policyIds: dimensions.filter((item) => item.role !== '暂缓').map((item) => item.policyId),
  };
}

const hostedApiBase = 'https://xining-api.nayoutang3.workers.dev';
const apiPort = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('apiPort');
const apiBase = import.meta.env.PROD
  ? hostedApiBase
  : typeof window !== 'undefined' && window.location.protocol === 'file:' && apiPort
    ? `http://127.0.0.1:${apiPort}`
    : '';
const apiUrl = (path: string) => `${apiBase}${path}`;

export const providerDefaults: Record<AIConfig['provider'], Omit<AIConfig, 'provider' | 'apiKey'>> = {
  deepseek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-v4-flash' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-latest' },
  qwen: { baseUrl: 'https://ws-esx5vi3vpbs2mg95.cn-beijing.maas.aliyuncs.com/compatible-mode/v1', model: 'qwen3.7-plus' },
  kimi: { baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-32k' },
  zhipu: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-plus' },
  custom: { baseUrl: '', model: '' },
};

export async function interpretEdictRemote(edict: string, context: unknown, config: AIConfig): Promise<EdictInterpretation> {
  const response = await fetch(apiUrl('/api/interpret'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ edict, context, config }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || '诏书解析失败');
  return data.interpretation;
}

export async function narrateSettlementRemote(input: {
  edict: string;
  stateBefore: GameState;
  stateAfter: GameState;
  event: HistoricalEvent;
  officer: Officer;
  policies: Policy[];
  record: TurnRecord;
  history: TurnRecord[];
  config: AIConfig;
}): Promise<HistoricalNarrative> {
  const response = await fetch(apiUrl('/api/narrate'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || '史实推演失败');
  return data.narrative;
}

export async function consultAdvisorRemote(input: {
  question: string;
  currentEdict: string;
  state: GameState;
  event: HistoricalEvent;
  officer: Officer;
  policies: Policy[];
  config: AIConfig;
}): Promise<AdvisorAdvice> {
  const response = await fetch(apiUrl('/api/advise'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || '辅政官未能完成参详');
  return adaptAdvisorAdvice(data.advice, input.state);
}

export async function testAIConnectionRemote(config: AIConfig): Promise<string> {
  const response = await fetch(apiUrl('/api/test'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || '推演连接测试失败');
  return String(data.message || '连接成功');
}
