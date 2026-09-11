import type { EdictInterpretation } from './edict-parser';
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
  routes?: Array<{
    title: string;
    dilemmaTitle: string;
    advice: string;
    tradeoff: string;
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
  if (!state) return `本期主项：${mainName}；辅项：${supportName}。`;
  const dilemmas = [...state.dilemmas].sort((left, right) => right.severity - left.severity).slice(0, 3);
  const dilemmaText = dilemmas.length
    ? dilemmas.map((item) => `${item.title}（严重度${item.severity}）`).join('、')
    : '当前没有显著困境';
  const stage = state.turn <= 2 ? '前期摸底' : state.turn <= 5 ? '中期推行与纠偏' : '后期巩固与善后';
  const eventText = event && dilemmas.some((item) => item.title === event.title) ? `本回新增困境是“${event.title}”。` : '';
  return `现处第${state.turn}/${state.maxTurns}回的${stage}阶段。当前困境按严重度排序为${dilemmaText}。${eventText}施政只能围绕这些困境展开。可用资源为国库${state.resources.treasury}万贯、政略${state.resources.politicalCapital}、行政${state.resources.administration}/50；本期主项：${mainName}；辅项：${supportName}。`;
}

function groundSituationInDilemmas(value: string, state: GameState | null): string {
  const cleaned = modernizeAdvisorText(value).replace(/[\r\n|]+/g, '，').trim();
  if (!state?.dilemmas.length) return cleaned;
  const priorities = [...state.dilemmas].sort((left, right) => right.severity - left.severity).slice(0, 3);
  const fullyGrounded = priorities.slice(0, 2).every((item) => cleaned.includes(item.title) && cleaned.includes(String(item.severity)));
  if (fullyGrounded) return cleaned;
  return `当前困境按严重度排序为${priorities.map((item) => `${item.title}${item.severity}`).join('、')}；施政先后以此为准，国势数值只判断能否承受。${cleaned}`;
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
  // Routine advice may fill a vacancy, but must not casually replace an incumbent.
  const post = office.posts.find((item) => !item.appointeeId);
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
    '财政': '需要决定：先冻结有争议的账目，还是先让三司自行核查再追责。',
    '民生': '需要决定：先给已经查清的重灾户减免，还是等全部名单完成后统一处理。',
    '军事': '需要决定：本期优先补军粮，还是优先修寨堡，只能先选一项。',
    '吏治': '需要决定：先让州县自行纠正，还是直接追究负责官员。',
  } as const;
  return decisions[name];
}

function modernizeAdvisorText(value: string): string {
  return value
    .replace(/具报|复奏/g, '报告结果')
    .replace(/奉行/g, '执行')
    .replace(/文移/g, '公文')
    .replace(/案牍/g, '办案记录')
    .replace(/实负/g, '实际负担')
    .replace(/催科/g, '催收')
    .replace(/诸路/g, '各地')
    .replace(/旬末/g, '十天内')
    .replace(/核清/g, '核查清楚')
    .replace(/有司/g, '负责官署')
    .replace(/主司/g, '负责官署')
    .replace(/^差/g, '安排')
    .replace(/^命/g, '让')
    .replace(/差([^，。]+?)专领/g, '安排$1负责')
    .replace(/专领/g, '负责')
    .replace(/选三路/g, '选择三个地区')
    .replace(/上供定额/g, '规定上交朝廷的数额')
    .replace(/支移折变/g, '临时调拨和折算')
    .replace(/对勘/g, '核对')
    .replace(/实额/g, '实际数额')
    .replace(/督责/g, '督促并追责')
    .replace(/具册/g, '整理成册')
    .replace(/正赋/g, '规定税额')
    .replace(/私行摊派/g, '私自额外收费')
    .replace(/先择/g, '先选择')
    .replace(/限一季/g, '三个月内')
    .replace(/查禁/g, '检查并禁止')
    .replace(/厘清/g, '查清')
    .replace(/冗费/g, '不必要的开支')
    .replace(/隐漏/g, '隐瞒和遗漏')
    .replace(/岁入不敷/g, '收入不够支出')
    .replace(/灾伤州军/g, '受灾地区')
    .replace(/赋重州军/g, '税负较重的地区')
    .replace(/州军/g, '地区')
    .replace(/盐铁、度支、户部三案账簿/g, '盐铁、财政支出和户籍税收三类账目')
    .replace(/可缓支项/g, '可以延后支出的项目')
    .replace(/浮支/g, '不必要的开支')
    .replace(/簿籍未立/g, '基础账册还没建立')
    .replace(/只宜/g, '只能')
    .replace(/，然/g, '，但')
    .replace(/故本期/g, '所以本期')
    .replace(/若/g, '如果')
    .replace(/亦/g, '也')
    .replace(/稍纾民力/g, '稍微减轻百姓负担')
    .replace(/加派之权/g, '额外收费的权力')
    .replace(/须待/g, '要等')
    .replace(/底数既明/g, '底数查清')
    .replace(/执行稍复/g, '执行能力有所恢复')
    .replace(/再议/g, '再决定')
    .replace(/岁入岁支实数/g, '实际收入和支出')
    .replace(/隐没羡余/g, '隐瞒或多出的款项')
    .replace(/径行加赋/g, '直接加税')
    .replace(/登记造册/g, '登记成册')
    .replace(/限期裁撤/g, '在规定期限内取消')
    .replace(/专责/g, '专门负责')
    .replace(/一季内/g, '三个月内')
    .replace(/报中书/g, '向中书省报告')
    .replace(/开查/g, '开始检查')
    .replace(/富庶/g, '富裕')
    .replace(/核出/g, '查出')
    .replace(/督核/g, '监督核查')
    .replace(/不得/g, '不能')
    .replace(/号令反易壅滞/g, '命令反而更容易被耽搁')
    .replace(/民力困敝/g, '百姓负担沉重')
    .replace(/政令壅滞/g, '政令执行受阻')
    .replace(/实支/g, '实际支出')
    .replace(/虚估/g, '虚报估算')
    .replace(/之数/g, '的数额')
    .replace(/上供/g, '上交朝廷')
    .replace(/^令/g, '让')
    .replace(/逐项开列榜示/g, '逐项列出并公开')
    .replace(/由监司抽验两路/g, '由监司抽查两个地区')
    .replace(/凡无朝廷明文者即行停征/g, '没有朝廷正式文件依据的项目立即停止征收')
    .replace(/一律/g, '全部')
    .replace(/开列后择重处置/g, '列出后优先处理问题最严重的地区')
    .replace(/正额/g, '规定数额')
    .replace(/停罢无度者/g, '停止没有合理依据的项目')
    .replace(/边警未至急迫/g, '边境警情还不紧急')
    .replace(/宜顾主务/g, '应先保障主要任务')
    .replace(/地方承载尚可/g, '地方目前还能承受')
    .replace(/本期不宜叠加事务/g, '本期不再增加任务')
    .replace(/不宜叠加事务/g, '不再增加任务')
    .replace(/故以/g, '所以把');
}

function normalizeDecisionText(value: string): string {
  const decision = modernizeAdvisorText(value).replace(/^须裁定[：:]?/, '需要决定：');
  return /^需要决定[：:]/.test(decision) ? decision : `需要决定：${decision}`;
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
  if (!value || typeof value !== 'object') throw new Error('辅政官响应无效，请重新参详。');
  const advice = value as Partial<AdvisorAdvice>;
  const state = typeof stateOrAdministration === 'number' ? null : stateOrAdministration;
  const administration = typeof stateOrAdministration === 'number' ? stateOrAdministration : stateOrAdministration.resources.administration;
  if (Array.isArray(advice.dimensions) && advice.dimensions.length) {
    const dimensions = advice.dimensions.map((item) => ({ ...item, advice: modernizeAdvisorText(item.advice), decision: item.decision ? normalizeDecisionText(item.decision) : decisionFor(item.name, item.role) }));
    const parsedRoutes = Array.isArray(advice.routes) ? advice.routes.map((route) => ({
      ...route,
      title: modernizeAdvisorText(route.title),
      dilemmaTitle: modernizeAdvisorText(route.dilemmaTitle),
      advice: modernizeAdvisorText(route.advice),
      tradeoff: modernizeAdvisorText(route.tradeoff),
    })) : [];
    const routes = state ? state.dilemmas.flatMap((dilemma) => {
      const matched = parsedRoutes.filter((route) => route.dilemmaTitle === dilemma.title).slice(0, 3);
      return matched.length ? matched : [{
        title: '直接处置',
        dilemmaTitle: dilemma.title,
        advice: dilemma.reformDirection,
        tradeoff: '这条路线仍会占用国库、政略或行政，具体成本须在拟旨后确认。',
        policyId: 'open-ended-directive',
      }];
    }) : parsedRoutes;
    const mainName = dimensions.find((item) => item.role === '主')?.name;
    const rawSituation = typeof advice.situation === 'string' && advice.situation.trim() ? advice.situation.trim() : fallbackSituation(state, dimensions.filter((item) => item.role === '主').map((item) => item.name).join('、') || '无', dimensions.filter((item) => item.role === '辅').map((item) => item.name).join('、') || '无', event);
    const situation = (state
      ? fallbackSituation(state, dimensions.filter((item) => item.role === '主').map((item) => item.name).join('、') || '无', dimensions.filter((item) => item.role === '辅').map((item) => item.name).join('、') || '无', event)
      : groundSituationInDilemmas(rawSituation, state)).slice(0, 320);
    const personnelRecommendation = mainName ? recommendPersonnel(state, mainName) : undefined;
    const personnel = personnelRecommendation ? `${personnelRecommendation.officeName}${personnelRecommendation.postTitle}，荐${personnelRecommendation.officerName}。` : '本期无合适的未任候选人。';
    return { outline: renderAdvisorOutline(administration, dimensions, situation, personnelRecommendation), situation, dimensions, routes, personnel, personnelRecommendation, policyIds: [...new Set((routes.length ? routes.map((item) => item.policyId) : dimensions.filter((item) => item.role !== '暂缓').map((item) => item.policyId)))] };
  }
  throw new Error('辅政官响应缺少分维度建议，请更新 AI 服务后重新参详。');
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
  deepseek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-flash' },
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
