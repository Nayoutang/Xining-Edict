import { isAdvisorOutline, parseEdict, type EdictInterpretation } from './edict-parser';
import { officers } from '../data/officers';
import type { CourtOfficeKey, GameState, HistoricalEvent, Officer, Policy, PolicyTag, TurnRecord } from '../game/types';

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
  situation: string;
  dimensions: Array<{
    name: '财政' | '民生' | '军事' | '吏治';
    scope: string;
    role: '主' | '辅' | '暂缓';
    advice: string;
    decision?: string | undefined;
    policyId: string;
  }>;
  personnel: string;
  personnelRecommendation?: {
    officeKey: string;
    postKey: string;
    officeName: string;
    postTitle: string;
    officerId: string;
    officerName: string;
    reason: string;
    risk: string;
  } | undefined;
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

const dimensionLabels = { finance: '财用', livelihood: '民生', defense: '边备', courtSupport: '士论', execution: '执行' } as const;
const dimensionPersonnel: Record<AdvisorAdvice['dimensions'][number]['name'], { officeKey: CourtOfficeKey; tags: readonly PolicyTag[] }> = {
  '财政': { officeKey: 'finance', tags: ['finance'] },
  '民生': { officeKey: 'transport', tags: ['relief', 'administration'] },
  '军事': { officeKey: 'military', tags: ['military'] },
  '吏治': { officeKey: 'censorate', tags: ['administration'] },
} as const;

function qualitative(value: number): string {
  if (value < 30) return '危急';
  if (value < 45) return '偏低';
  if (value < 60) return '尚可';
  return '稳固';
}

function fallbackSituation(state: GameState | null, mainName: string, supportName: string, event?: HistoricalEvent): string {
  if (!state) return `当前应先处置${mainName}，再以${supportName}托底；其余二项暂不占用行政余量。`;
  const ranked = Object.entries(state.indicators)
    .map(([key, value]) => ({ key: key as keyof typeof dimensionLabels, value }))
    .sort((left, right) => left.value - right.value);
  const weakest = ranked.slice(0, 2).map((item) => `${dimensionLabels[item.key]}${item.value}（${qualitative(item.value)}）`).join('、');
  const previous = state.history.at(-1);
  const trend = previous
    ? ranked.slice(0, 2).map((item) => {
      const delta = previous.indicatorChanges[item.key] ?? 0;
      return `${dimensionLabels[item.key]}${delta > 0 ? '回升' : delta < 0 ? '下滑' : '持平'}${delta ? Math.abs(delta) : ''}`;
    }).join('、')
    : '尚无上期结算可供比较';
  const stage = state.turn <= 2 ? '前期摸底' : state.turn <= 5 ? '中期推行与纠偏' : '后期巩固与善后';
  const eventText = event ? `本回急务是“${event.title}”：${event.description}` : '本回急务尚待结合御案事件判断';
  return `现处第${state.turn}/${state.maxTurns}回的${stage}阶段。国势最薄之处是${weakest}；${trend}。${eventText}。国库${state.resources.treasury}万贯、政略${state.resources.politicalCapital}、行政${state.resources.administration}/50，本期可承受一主一辅，但不宜同时铺开四项。因此先攻${mainName}，以${supportName}托底。`;
}

function recommendPersonnel(state: GameState | null, mainName: AdvisorAdvice['dimensions'][number]['name']): AdvisorAdvice['personnelRecommendation'] | undefined {
  if (!state) return undefined;
  const target = dimensionPersonnel[mainName];
  const office = state.polity.offices.find((item) => item.key === target.officeKey);
  if (!office) return undefined;
  const appointed = new Set(state.polity.offices.flatMap((item) => item.posts.map((post) => post.appointeeId).filter(Boolean)));
  const candidates = officers
    .filter((item) => !appointed.has(item.id) && item.specialtyTags.some((tag) => target.tags.includes(tag)))
    .sort((left, right) => (right.executionBonus - right.politicalCostModifier * .4) - (left.executionBonus - left.politicalCostModifier * .4));
  const candidate = candidates[0];
  const post = office.posts.find((item) => !item.appointeeId) ?? office.posts[0];
  if (!candidate || !post) return undefined;
  return {
    officeKey: office.key,
    postKey: post.key,
    officeName: office.name,
    postTitle: post.title,
    officerId: candidate.id,
    officerName: candidate.name,
    reason: `${candidate.name}所长与${office.name}职掌相合，可使${mainName}政务少耗行政、更易落实。`,
    risk: candidate.politicalCostModifier >= 2 ? `${candidate.stance}，改授可能增加朝议阻力。` : `${candidate.stance}，仍须留意其施政主张与御前取舍的差异。`,
  };
}

function decisionFor(name: AdvisorAdvice['dimensions'][number]['name'], role: string): string | undefined {
  if (role === '暂缓') return undefined;
  const decisions = {
    '财政': '须裁定：先封存争议账目，还是允许三司自查后再追责。',
    '民生': '须裁定：先减免已查实重户，还是等全路造册后一并处置。',
    '军事': '须裁定：优先补军粮还是修寨堡，本期只能先保一项。',
    '吏治': '须裁定：先准州县自纠，还是直接追责承办主官。',
  } as const;
  return decisions[name];
}

function clarifyAdvice(item: AdvisorAdvice['dimensions'][number], state: GameState | null): string {
  if (item.role === '暂缓' || item.advice.length >= 48) return item.advice;
  const value = state ? item.name === '财政' ? state.indicators.finance : item.name === '民生' ? state.indicators.livelihood : item.name === '军事' ? state.indicators.defense : state.indicators.execution : null;
  const context = value === null ? '' : `${item.name === '吏治' ? '执行' : item.name}${value}（${qualitative(value)}）。`;
  const explanation = {
    '财政': '具体是让三司把账面数、实际入库数和未收数逐项对上，一月内列出差额与责任人。',
    '民生': '具体是让监司按户籍核对实际负担，查明哪些民户被加派、多收什么，一月内回报。',
    '军事': '具体是让陕西帅司分寨堡核对现有军粮与可支应日数，十日内报出最紧缺之处。',
    '吏治': '具体是让监司把诏令逐条对照州县收文、办理与结案记录，一月内查明哪一环积压或擅改。',
  }[item.name];
  return item.advice.startsWith('续办') ? `${item.advice}${context}${explanation}` : `${context}${item.advice}${explanation}`;
}

function renderAdvisorOutline(administration: number, dimensions: AdvisorAdvice['dimensions'], situation: string, recommendation?: AdvisorAdvice['personnelRecommendation']): string {
  const personnelLines = recommendation ? [
    '铨选建议:',
    `岗位:${recommendation.officeName}·${recommendation.postTitle}`,
    `推荐:${recommendation.officerName}`,
    `理由:${recommendation.reason}`,
    `风险:${recommendation.risk}`,
  ] : ['铨选建议:本期无合适的未任候选人。'];
  return [
    '局势研判:', situation, '', `行政余量:${Math.max(0, Math.round(administration || 0))}/50`, '',
    ...dimensions.flatMap((item) => [`${item.name}|(${item.scope})【${item.role}】${item.advice}`, ...(item.decision ? [`  ${item.decision}`] : [])]),
    '', ...personnelLines,
  ].join('\n');
}

export function adaptAdvisorAdvice(value: unknown, stateOrAdministration: GameState | number, event?: HistoricalEvent): AdvisorAdvice {
  const advice = value as Partial<AdvisorAdvice> & LegacyAdvisorAdvice;
  const state = typeof stateOrAdministration === 'number' ? null : stateOrAdministration;
  const administration = typeof stateOrAdministration === 'number' ? stateOrAdministration : stateOrAdministration.resources.administration;
  if (Array.isArray(advice.dimensions) && advice.dimensions.length) {
    const dimensions = advice.dimensions.map((item) => ({ ...item, advice: clarifyAdvice(item, state), decision: item.decision || decisionFor(item.name, item.role) }));
    const mainName = dimensions.find((item) => item.role === '主')?.name ?? '财政';
    const supportName = dimensions.find((item) => item.role === '辅')?.name ?? '民生';
    const situation = typeof advice.situation === 'string' && advice.situation.trim() ? advice.situation.trim() : fallbackSituation(state, mainName, supportName, event);
    const personnelRecommendation = recommendPersonnel(state, mainName);
    const personnel = personnelRecommendation ? `${personnelRecommendation.officeName}${personnelRecommendation.postTitle}，荐${personnelRecommendation.officerName}。` : '本期无合适的未任候选人。';
    return { outline: renderAdvisorOutline(administration, dimensions, situation, personnelRecommendation), situation, dimensions, personnel, personnelRecommendation, policyIds: dimensions.filter((item) => item.role !== '暂缓').map((item) => item.policyId) };
  }
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
      decision: decisionFor(item.name, role),
    };
  });
  for (const item of dimensions) {
    item.advice = clarifyAdvice(item, state);
  }
  const situation = fallbackSituation(state, selectedNames[0]!, selectedNames[1]!, event);
  const personnelRecommendation = recommendPersonnel(state, selectedNames[0]!);
  const personnel = personnelRecommendation ? `${personnelRecommendation.officeName}${personnelRecommendation.postTitle}，荐${personnelRecommendation.officerName}。` : '本期无合适的未任候选人。';
  const outline = renderAdvisorOutline(administration, dimensions, situation, personnelRecommendation);
  return {
    outline,
    situation,
    dimensions,
    personnel,
    personnelRecommendation,
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
  if (isAdvisorOutline(edict)) return parseEdict(edict);
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
  return adaptAdvisorAdvice(data.advice, input.state, input.event);
}

export async function testAIConnectionRemote(config: AIConfig): Promise<string> {
  const response = await fetch(apiUrl('/api/test'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || '推演连接测试失败');
  return String(data.message || '连接成功');
}
