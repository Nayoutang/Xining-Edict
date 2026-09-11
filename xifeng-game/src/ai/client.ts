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
  { name: '财政', scope: '国库与岁入', policyId: 'cross-check-ledgers', indicator: 'finance', actions: ['核查三司账目，十天内报上实际岁入和未收款项。', '分地区核对账面收入与实际入库数，一个月内查清差额。', '比较新法预计收入与首轮实收，删掉虚报数字。', '查清账目与库存不符的钱款，让经办官说明去向。', '根据中期账目压缩次要开支，留下足够的赈灾储备。', '清查拖欠和冒领款项，按地区逐笔结清。', '复核历年财政措施的实际效果，优先补上最大缺口。', '结清仍有争议的钱款，整理并保存最终账册。'], paused: ['国库目前还能支撑，本期有更急的问题。', '财政变化不大，本期应先处理另外两项短板。', '主项和辅项已经占用本期资源，不能再分散财力。', '国库需要保留应急储备，本期不增加财政任务。', '现有收入还能支撑，本期财政不是最紧迫的问题。', '本期主要任务花费较多，没有余力再处理财政事务。', '财政已经逐步稳定，本期应先处理更弱的一项。', '终局前财力仍然够用，本期不再占用行政余量。'] },
  { name: '民生', scope: '百姓负担', policyId: 'curb-local-exactions', indicator: 'livelihood', actions: ['核实受灾家庭的实际负担，按受灾程度登记成册。', '抽查是否强迫百姓借青苗钱，把多收的钱物退回去。', '比较各地役钱负担，先纠正收费最重的州县。', '核实哪些家庭真正从水利工程受益，免掉没有受益者的费用。', '查清州县额外加收的名目，让监司逐项取消。', '复核贫困家庭实际少交了多少，补上遗漏的减免。', '清理过去留下的役钱欠账，禁止对同一笔钱重复催收。', '汇总百姓最终承担的钱役，办完尚未处理的申诉。'], paused: ['百姓负担目前稳定，本期有更急的问题。', '上一道诏令的效果还没看清，本期不再增加百姓负担。', '州县人手已经紧张，本期不能同时增加民生任务。', '民生变化不大，目前还不是最急的短板。', '百姓实际负担没有恶化，本期先让位于主要任务。', '主项和辅项已有更急方向，本期暂不处理民生。', '已有减负措施正在生效，本期不重复增加政策。', '终局前民情还能维持，本期资源先用在其他问题上。'] },
  { name: '军事', scope: '边备与军储', policyId: 'northwest-defense', indicator: 'defense', actions: ['盘点陕西各处军粮，十天内报出缺口最大的寨堡。', '核对各寨堡现存军粮，先补给最紧急的据点。', '查清军粮运输在哪些路段耽搁，规定期限恢复通行。', '按边境警情调配现有军粮，本期不额外增加总量。', '核对军需实际送达数量，查清运输途中的损耗。', '补足关键寨堡一个月的军粮，暂停没有依据的冒领。', '复查边防最薄弱的地区，把现有兵力集中到那里。', '补齐最后的军粮缺口，并留下足够储备用于善后。'], paused: ['边境警情还不紧急，本期财力先用于主要任务。', '现有军粮还能支撑，本期边防不是最弱的一项。', '边境形势没有突然恶化，本期不占用行政余量。', '现有寨堡还能守住，本期有更紧急的问题。', '军需压力仍可控制，本期主项和辅项不放在边防。', '本期内政问题更急，边防暂时没有迫切风险。', '边防已经有所稳定，本期不再分散国力。', '终局前边境还能维持，本期不新增军事任务。'] },
  { name: '吏治', scope: '诏令能否落到州县', policyId: 'curb-local-exactions', indicator: 'execution', actions: ['整理州县收到却未办完的公文，标出每件事的负责人。', '抽查三个地区执行诏令的情况，一个月内报告积压和擅改的问题。', '逐条比较朝廷诏令与州县办案记录，查出被私自改动的内容。', '清查积压公文，让监司按期限逐件处理完毕。', '按执行偏差划分责任，只查有具体问题的官员。', '复核被弹劾官员的证据，证据充分的按规定结案。', '清理州县尚未办完的事项，逐件报告处理结果。', '汇总各地执行成效，对确实失职的官员作出处分。'], paused: ['地方目前还能承受，本期不再增加执行任务。', '官署人手已经紧张，本期资源要留给主要任务。', '上一道诏令仍在执行，本期吏治不是最紧急的问题。', '地方没有出现新的积压，本期不占用行政余量。', '现有承办情况稳定，本期有更急的问题。', '州县压力仍可控制，本期不再增加事务。', '执行情况已经改善，本期先处理更弱的一项。', '终局前地方还能承受，本期不新增吏治任务。'] },
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

function clarifyAdvice(item: AdvisorAdvice['dimensions'][number], state: GameState | null): string {
  const plainAdvice = modernizeAdvisorText(item.advice);
  if (item.role === '暂缓' || plainAdvice.length >= 48) return plainAdvice;
  const value = state ? item.name === '财政' ? state.indicators.finance : item.name === '民生' ? state.indicators.livelihood : item.name === '军事' ? state.indicators.defense : state.indicators.execution : null;
  const context = value === null ? '' : `${item.name === '吏治' ? '执行' : item.name}${value}（${qualitative(value)}）。`;
  const administrationExplanation = /追责|处分|黜陟|责任/.test(plainAdvice)
    ? '具体是依据上期已经查明的案卷锁定责任官员，区分失察、包庇与擅改，再决定罢免、贬调或留任察看。'
    : /积压|销案|未结/.test(plainAdvice)
      ? '具体是把尚未办结的州县事项逐件列册，标明承办人和逾期原因，优先清理已经查实的积压。'
      : /复核|结案|成效/.test(plainAdvice)
        ? '具体是对照上期整改清单复查结果，只复核仍有疑点的州县，并将已经办妥的事项正式结案。'
        : '具体是让监司把诏令逐条对照州县收文、办理与结案记录，一月内查明哪一环积压或擅改。';
  const explanation = {
    '财政': '具体是让三司把账面数、实际入库数和未收数逐项对上，一月内列出差额与责任人。',
    '民生': '具体是让监司按户籍核对实际负担，查明哪些民户被加派、多收什么，一月内回报。',
    '军事': '具体是让陕西帅司分寨堡核对现有军粮与可支应日数，十日内报出最紧缺之处。',
    '吏治': administrationExplanation,
  }[item.name];
  return plainAdvice.startsWith('续办') ? `${plainAdvice}${context}${explanation}` : `${context}${plainAdvice}${explanation}`;
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
    const dimensions = advice.dimensions.map((item) => ({ ...item, advice: clarifyAdvice(item, state), decision: item.decision ? normalizeDecisionText(item.decision) : decisionFor(item.name, item.role) }));
    const mainName = dimensions.find((item) => item.role === '主')?.name ?? '财政';
    const supportName = dimensions.find((item) => item.role === '辅')?.name ?? '民生';
    const situation = typeof advice.situation === 'string' && advice.situation.trim() ? modernizeAdvisorText(advice.situation.trim()) : fallbackSituation(state, mainName, supportName, event);
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
