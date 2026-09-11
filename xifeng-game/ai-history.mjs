const PROVIDERS = {
  deepseek: { apiType: 'openai', baseUrl: 'https://api.deepseek.com', model: 'deepseek-flash' },
  openai: { apiType: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  anthropic: { apiType: 'anthropic', baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-latest' },
  qwen: { apiType: 'openai', baseUrl: 'https://ws-esx5vi3vpbs2mg95.cn-beijing.maas.aliyuncs.com/compatible-mode/v1', model: 'qwen3.7-plus' },
  kimi: { apiType: 'openai', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-32k' },
  zhipu: { apiType: 'openai', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-plus' },
  custom: { apiType: 'openai', baseUrl: '', model: '' },
};

const allowedPolicies = [
  ['green-sprouts-trial', '青苗法试行'],
  ['service-reform-preparation', '募役法准备'],
  ['water-conservancy', '兴修农田水利'],
  ['curb-local-exactions', '整顿州县摊派'],
  ['reduce-redundant-spending', '裁减冗费'],
  ['northwest-defense', '加强西北边备'],
  ['review-impeachments', '复核台谏弹章'],
  ['cross-check-ledgers', '对勘官署账簿'],
  ['discipline-corrupt-officials', '依法黜陟奸蠹'],
  ['open-ended-directive', '御前专项政务'],
];

const allowedOfficers = [
  ['wang-anshi', '王安石'], ['sima-guang', '司马光'], ['han-qi', '韩琦'], ['lv-huiqing', '吕惠卿'],
  ['zeng-bu', '曾布'], ['zhang-dun', '章惇'], ['han-jiang', '韩绛'], ['cai-que', '蔡确'],
  ['wen-yanbo', '文彦博'], ['fu-bi', '富弼'], ['lv-gongzhu', '吕公著'], ['fan-chunren', '范纯仁'],
  ['su-shi', '苏轼'], ['su-zhe', '苏辙'], ['cheng-hao', '程颢'], ['zheng-xia', '郑侠'],
  ['shen-kuo', '沈括'], ['wang-shao', '王韶'], ['guo-kui', '郭逵'], ['wang-gui', '王珪'],
  ['feng-jing', '冯京'], ['deng-wan', '邓绾'], ['li-ding', '李定'], ['shu-dan', '舒亶'],
  ['lv-jiawen', '吕嘉问'], ['cheng-fang', '程昉'],
];

const internalTermLabels = [
  ['politicalCostModifier', '政略消耗修正'],
  ['politicalOverdraft', '政略透支'],
  ['administrativeOverload', '行政超载'],
  ['politicalCapital', '政略'],
  ['executionBonus', '执行修正'],
  ['courtSupport', '士论'],
  ['livelihood', '民生'],
  ['administration', '行政'],
  ['treasury', '国库'],
  ['execution', '执行'],
  ['severity', '严重度'],
  ['finance', '财用'],
  ['defense', '边备'],
  ['censorial-dossier', '台谏弹章复核'],
  ['verified-misconduct', '账证核实'],
  ['disciplined-corruption', '奸蠹处置'],
  ['fiscal-imbalance', '国用匮乏'],
  ['weak-administration', '政令壅滞'],
  ['border-pressure', '西北边备空虚'],
  ['livelihood-strain', '民力困敝'],
  ['forced-loans', '青苗抑配'],
  ['factional-politics', '新旧党议'],
  ['concealed-corruption', '簿籍真伪难明'],
  ['administrative-overload', '有司壅滞'],
  ...allowedPolicies,
  ...allowedOfficers,
].sort(([left], [right]) => right.length - left.length);

function localizeInternalTerms(value) {
  let text = String(value ?? '');
  for (const [internal, label] of internalTermLabels) {
    text = text.replace(new RegExp(internal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), label);
  }
  return text.trim();
}

const plainReactionLeads = new Map([
  ['朝议', '朝臣最关心新法会不会失控。'],
  ['三司', '三司先看钱从哪里来、够不够花。'],
  ['台谏', '台谏最怕政令扰民又无人担责。'],
  ['州县', '州县在意人手和期限能否撑住。'],
  ['豪强', '地方豪强先算自己损失多少。'],
  ['百姓', '百姓只看负担是否真的减轻。'],
]);

function addPlainReactionLead(label, value) {
  const text = localizeInternalTerms(value).replace(/^(?:直白说|简单说|说白了)[，,:：]?\s*/, '');
  const lead = plainReactionLeads.get(label) || `${label}先看这道政令如何影响自身。`;
  if (text.startsWith(lead)) return text;
  return `${lead}${text}`;
}

const advisorDimensions = [
  {
    name: '财政', scope: '国库与岁入', policyId: 'cross-check-ledgers', indicator: 'finance',
    allowed: ['green-sprouts-trial', 'service-reform-preparation', 'reduce-redundant-spending', 'cross-check-ledgers'],
  },
  {
    name: '民生', scope: '百姓负担', policyId: 'curb-local-exactions', indicator: 'livelihood',
    allowed: ['green-sprouts-trial', 'service-reform-preparation', 'water-conservancy', 'curb-local-exactions'],
  },
  {
    name: '军事', scope: '边备与军储', policyId: 'northwest-defense', indicator: 'defense',
    allowed: ['northwest-defense'],
  },
  {
    name: '吏治', scope: '诏令能否落到州县', policyId: 'curb-local-exactions', indicator: 'execution',
    allowed: ['curb-local-exactions', 'review-impeachments', 'cross-check-ledgers', 'discipline-corrupt-officials'],
  },
];

function modernizeAdvisorText(value) {
  return localizeInternalTerms(value)
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
    .replace(/诸路/g, '各地')
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

function conciseSentence(value, fallback, maxLength = 72) {
  const cleaned = modernizeAdvisorText(value)
    .replace(/[\r\n|]+/g, '，')
    .replace(/【(?:主|辅|暂缓)】/g, '')
    .replace(/^(?:财政|民生|军事|吏治)[：:]?/, '')
    .replace(/(?:宜稳妥推进|酌情办理|视情况而定|统筹兼顾)/g, '')
    .trim() || fallback;
  const firstSentence = cleaned.split(/(?<=[。！？])/u)[0] || cleaned;
  const clipped = firstSentence.length > maxLength ? `${firstSentence.slice(0, maxLength - 1).replace(/[，、；：]$/, '')}。` : firstSentence;
  return /[。！？]$/.test(clipped) ? clipped : `${clipped}。`;
}

function qualitative(value) {
  const number = Number(value);
  if (number < 30) return '危急';
  if (number < 45) return '偏低';
  if (number < 60) return '尚可';
  return '稳固';
}

const advisorIndicatorLabels = { finance: '财用', livelihood: '民生', defense: '边备', courtSupport: '士论', execution: '执行' };
const advisorPersonnelTargets = {
  '财政': { officeKey: 'finance', officerIds: ['zeng-bu', 'su-zhe', 'lv-huiqing'] },
  '民生': { officeKey: 'transport', officerIds: ['fan-chunren', 'su-shi', 'cheng-hao'] },
  '军事': { officeKey: 'military', officerIds: ['wang-shao', 'shen-kuo', 'guo-kui'] },
  '吏治': { officeKey: 'censorate', officerIds: ['sima-guang', 'han-jiang', 'lv-gongzhu'] },
};

function fallbackSituation(state, mainName, supportName, event) {
  const dilemmas = [...(state?.dilemmas || [])].sort((left, right) => Number(right?.severity || 0) - Number(left?.severity || 0)).slice(0, 3);
  const dilemmaText = dilemmas.length ? dilemmas.map((item) => `${item.title}（严重度${item.severity}）`).join('、') : '当前没有显著困境';
  const turn = Math.max(1, Number(state?.turn || 1));
  const maxTurns = Math.max(turn, Number(state?.maxTurns || 8));
  const eventText = event?.title && dilemmas.some((item) => item?.title === event.title) ? `本回新增困境是“${event.title}”。` : '';
  return `现处第${turn}/${maxTurns}回的${stageForTurn(turn, maxTurns)}。当前困境按严重度排序为${dilemmaText}。${eventText}施政只能围绕这些困境展开。可用资源为国库${state?.resources?.treasury ?? '未知'}万贯、政略${state?.resources?.politicalCapital ?? '未知'}、行政${state?.resources?.administration ?? '未知'}/50；本期主项：${mainName || '无'}；辅项：${supportName || '无'}。`;
}

function normalizeSituation(value, state, mainName, supportName, event) {
  void value;
  return fallbackSituation(state, mainName, supportName, event).slice(0, 320);
}

function decisionFor(name, role, value) {
  if (role === '暂缓') return '';
  const fallbacks = {
    '财政': '需要决定：先冻结有争议的账目，还是先让三司自行核查再追责。',
    '民生': '需要决定：先给已经查清的重灾户减免，还是等全部名单完成后统一处理。',
    '军事': '需要决定：本期优先补军粮，还是优先修寨堡，只能先选一项。',
    '吏治': '需要决定：先让州县自行纠正，还是直接追究负责官员。',
  };
  const decision = conciseSentence(value, fallbacks[name], 76).replace(/^须裁定[：:]?/, '需要决定：');
  return /^需要决定[：:]/.test(decision) ? decision : `需要决定：${decision}`;
}

function recommendCourtPersonnel(state, mainName) {
  const target = advisorPersonnelTargets[mainName];
  const office = state?.polity?.offices?.find((item) => item?.key === target?.officeKey);
  if (!target || !office) return null;
  const appointed = new Set((state?.polity?.offices || []).flatMap((item) => (item?.posts || []).map((post) => post?.appointeeId).filter(Boolean)));
  const officerId = target.officerIds.find((id) => !appointed.has(id));
  // Routine advice only fills vacancies; replacing an incumbent requires the player.
  const post = office.posts?.find((item) => !item?.appointeeId);
  const officerName = allowedOfficers.find(([id]) => id === officerId)?.[1];
  if (!officerId || !officerName || !post) return null;
  return {
    officeKey: office.key,
    postKey: post.key,
    officeName: office.name,
    postTitle: post.title,
    officerId,
    officerName,
    reason: `${officerName}履历与${office.name}职掌相合，可使${mainName}政务少耗行政、更易落实。`,
    risk: '改授会改变官署立场，须同时留意士论与新任主官的施政偏好。',
  };
}

function stageForTurn(turn, maxTurns) {
  const ratio = turn / Math.max(1, maxTurns);
  return ratio <= 0.3 ? '前期' : ratio <= 0.7 ? '中期' : '后期';
}

function normalizeAdvisorOutline(parsed, current, capacity, state = {}, event = {}) {
  const source = Array.isArray(parsed.dimensions) ? parsed.dimensions : [];
  const byName = new Map(source.map((item) => [localizeInternalTerms(item?.name), item]));
  const mainName = advisorDimensions.filter(({ name }) => byName.get(name)?.role === '主').map(({ name }) => name).join('、');
  const supportName = advisorDimensions.filter(({ name }) => byName.get(name)?.role === '辅').map(({ name }) => name).join('、');
  const dimensions = advisorDimensions.map((definition) => {
    const item = byName.get(definition.name) || {};
    const requestedRole = localizeInternalTerms(item?.role).replace(/[【】]/g, '').trim();
    const role = ['主', '辅', '暂缓'].includes(requestedRole) ? requestedRole : '暂缓';
    const requestedPolicyId = String(item?.policyId || '');
    const policyId = definition.allowed.includes(requestedPolicyId) ? requestedPolicyId : definition.policyId;
    // Preserve the model's reasoning, including repeated advice and multi-sentence evidence.
    const advice = modernizeAdvisorText(item?.advice).trim() || '模型未提供本项建议或理由，请重新参详。';
    return {
      name: definition.name,
      scope: definition.scope,
      role,
      advice,
      decision: decisionFor(definition.name, role, item?.decision),
      policyId,
    };
  });
  const situation = normalizeSituation(parsed.situation, state, mainName, supportName, event);
  const personnelRecommendation = mainName ? recommendCourtPersonnel(state, mainName.split('、')[0]) : undefined;
  const personnel = personnelRecommendation ? `${personnelRecommendation.officeName}${personnelRecommendation.postTitle}，荐${personnelRecommendation.officerName}。` : conciseSentence(parsed.personnel, '本期无合适的未任候选人。', 72);
  const render = (items) => [
    '局势研判:',
    situation,
    '',
    `行政余量:${current}/${capacity}`,
    '',
    ...items.flatMap((item) => [`${item.name}|(${item.scope})【${item.role}】${item.advice}`, ...(item.decision ? [`  ${item.decision}`] : [])]),
    '',
    ...(personnelRecommendation ? ['铨选建议:', `岗位:${personnelRecommendation.officeName}·${personnelRecommendation.postTitle}`, `推荐:${personnelRecommendation.officerName}`, `理由:${personnelRecommendation.reason}`, `风险:${personnelRecommendation.risk}`] : [`铨选建议:${personnel}`]),
  ].join('\n');
  const outline = render(dimensions).slice(0, 900);
  return {
    outline,
    situation,
    dimensions,
    personnel,
    personnelRecommendation,
    policyIds: dimensions.filter((item) => item.role !== '暂缓').map((item) => item.policyId),
  };
}

const outputLanguageRule = `输入中的英文键名和连字符ID都是程序内部标识，只供你理解，绝不能原样写进面向玩家的文字。
必须使用中文称呼：treasury=国库，politicalCapital=政略，administration=行政，finance=财用，livelihood=民生，defense=边备，courtSupport=士论，execution=执行，severity=严重度。不要输出类似 courtSupport-3、severity66、executionBonus+2 的调试式表达。`;

export async function interpretEdictWithAI({ edict, context = {}, config = {}, fetchImpl = fetch } = {}) {
  const sourceEdict = String(edict || '').trim();
  const prompt = `你是北宋熙宁变法策略游戏的中书舍人。将玩家自由诏书映射为全部相关的游戏规则政务，不设置人为数量上限；一份诏书可以同时涉及财政、民生、军事、任免、制度和地方治理。不得创造ID，不得修改数值，执行能力不足由程序结算为行政超载。

允许的政务：
${allowedPolicies.map(([id, name]) => `- ${id}: ${name}`).join('\n')}

允许的执行官：
${allowedOfficers.map(([id, name]) => `- ${id}: ${name}`).join('\n')}

当前背景：${JSON.stringify(context)}
玩家诏书：${sourceEdict}

只返回JSON：{"policyIds":["id"],"officerId":"id或null","summary":"中书如何理解诏意","warnings":["需要玩家注意之处"]}`;
  const output = await callModel(config, `你只做受史实与规则约束的政令解析，并严格返回JSON。\n${outputLanguageRule}`, prompt, fetchImpl);
  const parsed = parseJsonOutput(output);
  const policyIds = Array.isArray(parsed.policyIds)
    ? [...new Set(parsed.policyIds.filter((id) => allowedPolicies.some(([allowed]) => allowed === id)))]
    : [];
  if (!policyIds.length && sourceEdict) policyIds.push('open-ended-directive');
  const officerId = allowedOfficers.some(([id]) => id === parsed.officerId) ? parsed.officerId : null;
  return {
    ok: true,
    interpretation: {
      sourceText: sourceEdict,
      policyIds,
      officerId,
      summary: localizeInternalTerms(parsed.summary),
      warnings: parseStringList(parsed.warnings, 4),
    },
  };
}

export async function adviseWithAI({ question, currentEdict = '', state = {}, event = {}, officer = {}, policies = [], config = {}, fetchImpl = fetch } = {}) {
  const administrativeRemaining = Math.max(0, Math.round(Number(state?.resources?.administration) || 0));
  const administrativeCapacity = 50;
  const policyBudget = policies.map((policy) => ({
    id: policy?.id,
    name: policy?.name,
    tags: policy?.tags,
    politicalCapital: policy?.cost?.politicalCapital ?? 0,
    administration: policy?.cost?.administration ?? 0,
    treasury: policy?.cost?.treasury ?? 0,
  }));
  const currentTurn = Math.max(1, Number(state?.turn || 1));
  const maxTurns = Math.max(currentTurn, Number(state?.maxTurns || 8));
  const remainingTurns = Math.max(0, maxTurns - currentTurn + 1);
  const stage = stageForTurn(currentTurn, maxTurns);
  const completedObjectives = (state?.objectives || []).filter((item) => item?.completed).map((item) => item.title);
  const activeItems = (state?.activePolicies || []).map((item) => ({
    政务: allowedPolicies.find(([id]) => id === item?.policyId)?.[1] || item?.policyId,
    承办: allowedOfficers.find(([id]) => id === item?.officerId)?.[1] || item?.officerId,
    尚余回合: item?.remainingTurns,
  }));
  const rankedDilemmas = [...(state?.dilemmas || [])]
    .sort((left, right) => Number(right?.severity || 0) - Number(left?.severity || 0))
    .map((item) => ({ 名称: item.title, 类型: item.category, 严重度: item.severity, 改革方向: item.reformDirection }));
  const prompt = `你在宋神宗熙宁朝担任御前辅政官。玩家尚未颁诏，你只负责提供分维度施政提纲，绝不能代写完整诏书，也不能替玩家作最终决定。

当前时间：${formatDate(state?.date)}
当前回合：第${currentTurn}/${maxTurns}回；距终局尚余${remainingTurns}回；阶段：${stage}
当前困境优先序（施政排序首先依据严重度）：${JSON.stringify(rankedDilemmas)}
当前余量：行政${administrativeRemaining}/${administrativeCapacity}，政略${state?.resources?.politicalCapital ?? '未知'}，国库${state?.resources?.treasury ?? '未知'}万贯
当前国策成果（已完成）：${completedObjectives.length ? completedObjectives.join('、') : '暂无'}
进行中事项：${activeItems.length ? JSON.stringify(activeItems) : '暂无'}
本回合困境事件：${event?.title || '未载'}——${event?.description || '未载'}；即时影响${JSON.stringify(event?.effects || {})}
当前其他困境：${JSON.stringify(state?.dilemmas || [])}
当前固定官署与任职（铨选建议只可填补空缺；不得建议替换已有任官，也不得改设机构）：${JSON.stringify(state?.polity || {})}
当前准备任用的执行官：${JSON.stringify(officer)}
可执行政务及其本回合成本：${JSON.stringify(policyBudget)}
此前各回施政档案（这是判断下一步的主要依据，不得忽略）：
${formatHistory(state?.history || [])}
此前辅政官已提方向（结合执行结果判断是否续办）：${(state?.advisorHistory || []).slice(-6).join('\n') || '无。'}
玩家案前已有文字：${String(currentEdict || '').trim() || '尚未落笔'}
玩家向辅政官询问：${String(question || '').trim() || '请分析当前格局并提出几条可行路线'}

最终显示文本必须严格等价于以下格式，行政余量使用当前实数 ${administrativeRemaining}/${administrativeCapacity}：
局势研判:
只说明当前困境、严重度、困境之间的先后关系、本期事件和资源能承担什么。禁止分析、比较或提及财用、民生、边备、士论、执行五项国势数值。

行政余量:${administrativeRemaining}/${administrativeCapacity}

维度名|(维度说明)【主或辅或暂缓】基于实际困境和数值的建议或暂缓理由
  需要决定：仅在主辅项写需要玩家裁定的执行尺度或先后顺序
以上为字段说明，不预设任何维度的优先级。

铨选建议:
岗位:现有官署·当前空缺官职
推荐:未在其他核心岗位任职的官员
理由:其履历如何改善本期主务
风险:改授可能带来的士论或施政偏好风险

四个维度必须全部列出，顺序固定为财政、民生、军事、吏治。主辅数量不固定：允许多个主项、零个或多个辅项，也允许资源不足时全部暂缓。按困境严重度、趋势与预算决定优先级，不预设财政优先。每个维度最多一条施政建议，严禁面面俱到。局势研判、四维建议、暂缓理由和须裁定内容都必须使用现代白话，像向没有古代官制知识的玩家解释一样直白；维度名、括号说明与【主】【辅】【暂缓】标记保持不变。主辅项必须同时写明“问题在哪里”“谁去做什么”“多久回报”和“玩家需裁定什么”；不得使用“具报、复奏、奉行、文移、案牍、实负、催科”等需要玩家自行翻译的公文词。不得只写“抽验三路”“调查实况”等无从下手的缩写，也不得写“宜稳妥推进”“酌情办理”“视情况而定”等空话。铨选建议只能指向已有官署和官职，不得新建、撤并或改造政治架构；任免仅是建议，由玩家在铨选界面亲自操作。显示文本总长度控制在九百字以内，不写骈句。

先阅读施政档案中的“执行状态、已见结果、阻力、遗留与下一步”，再决定本回建议。已经顺利推进的措施不得原样再提；部分落实或执行受阻的事项如需继续，必须以“续办”开头，直接处理档案中的遗留或阻力，并明确本期新增着力点。此方向上期已提时，请给出新着力点或明确标为续办；问题未解决可以重复建议并说明原因，不得为求不同而编造措施或把换同义词当作新建议。建议还须结合本期数值短板与困境；士论偏低时须考虑缓和朝议或收窄推行力度。${stage === '前期' ? '当前为前期，重在核清底数与小范围试办。' : stage === '中期' ? '当前为中期，重在推行、核验与纠偏。' : '当前为后期，重在巩固成果、结清遗留与善后。'}【暂缓】项只准说明“为何本期不做”，严禁写任何动作、对象或期限。

你须在内部核算政略、行政与国库成本：总政略成本还要加上执行官一次性的政略消耗修正；结算后须至少保留 12 点政略、10 点行政和 800 万贯国库。资源不足时，将高成本方向列为【暂缓】，不得堆叠政务伪装周全。只提出脚手架，不得输出诏书正文、制曰、奉诏、钦此等成稿措辞。

只返回JSON：
{
  "dimensions":[
    {"name":"财政","role":"主或辅或暂缓","advice":"一条具体建议或暂缓理由","decision":"主辅项的二选一裁定，暂缓项留空","policyId":"对应的一项政务ID"},
    {"name":"民生","role":"主或辅或暂缓","advice":"一条具体建议或暂缓理由","decision":"主辅项的二选一裁定，暂缓项留空","policyId":"对应的一项政务ID"},
    {"name":"军事","role":"主或辅或暂缓","advice":"一条具体建议或暂缓理由","decision":"主辅项的二选一裁定，暂缓项留空","policyId":"对应的一项政务ID"},
    {"name":"吏治","role":"主或辅或暂缓","advice":"一条具体建议或暂缓理由","decision":"主辅项的二选一裁定，暂缓项留空","policyId":"对应的一项政务ID"}
  ],
  "situation":"三至四句白话局势研判",
  "personnel":"对现有官署和岗位的一条铨选建议"
}`;
  const system = `你是历史策略游戏《熙宁抉择》的辅政官，不是推演史官。
1. 你只能在颁诏前提供提纲，严禁生成可直接颁行的完整诏书，不能声称政策已经实施。
2. 分析对象只能是当前困境列表；必须按困境严重度决定施政先后。禁止分析、比较、引用或输出财用、民生、边备、士论、执行五项国势。资源只用于判断能否执行。主辅数量不固定，允许多个主项、没有辅项或全部暂缓。
3. 尊重熙宁、元丰时期的机构、资源和政治语言。
4. 固定列出财政、民生、军事、吏治四项且顺序不可改变，不新增制度、任免、外交等维度。
5. 可引用人物立场，但不得把人物简单判为忠臣或奸臣。
6. 必须优先保证所有主辅项在当前政略、行政与国库预算内可持续执行。
7. 每项只有一句具体可执行建议；暂缓项只写暂缓理由，不得夹带措施。
8. 局势分析和全部提纲文字都必须使用现代白话，主辅项各给一个需要玩家裁定的二选一问题；总显示文本不得超过九百字。
9. 铨选建议仅能填补现有空缺岗位，不得替换现任、改革官制架构或自动任免；没有合适空缺时明确不调整人事。
10. 输出必须为JSON。
11. ${outputLanguageRule}`;
  const output = await callModel(config, system, prompt, fetchImpl);
  const parsed = parseJsonOutput(output);
  return {
    ok: true,
    advice: normalizeAdvisorOutline(parsed, administrativeRemaining, administrativeCapacity, state, event),
  };
}

export async function narrateSettlementWithAI({ edict, stateBefore, stateAfter, event, officer, policies, record, history = [], config = {}, fetchImpl = fetch } = {}) {
  const prompt = `请基于以下完整局势，推演这道诏书在未来半年中的真实执行过程。

当前时间：${formatDate(stateBefore?.date)}
玩家原诏：${String(edict || '').trim()}
本期急务：${JSON.stringify(event)}
执行官完整人设：${JSON.stringify(officer)}
中书识别的政务：${JSON.stringify(policies)}
改革前困境：${JSON.stringify(stateBefore?.dilemmas || [])}
改革后困境：${JSON.stringify(stateAfter?.dilemmas || [])}
改革前国势：${JSON.stringify({ indicators: stateBefore?.indicators, resources: stateBefore?.resources, polity: stateBefore?.polity })}
程序已经裁定的改革后国势：${JSON.stringify({ indicators: stateAfter?.indicators, resources: stateAfter?.resources, polity: stateAfter?.polity })}
程序确认的全部变化：${JSON.stringify(record)}
此前六回合档案：${formatHistory(history)}

你的任务不是再次计算输赢，而是解释这些既定变化如何在北宋国家机器中发生。“程序确认的全部变化”内每项政务的执行状态、直接影响和阻力都是不可推翻的事实；report 与 implementation 必须逐项告知玩家该政务办成了什么、为何受阻、还留下什么，不得把【部分落实】或【执行受阻】写成圆满完成。必须体现诏令由御前发出后，经过中书门下、三司或枢密院、监司、州县和胥吏的传递与变形；结合执行官的性格、行事方式、政治底线和语言风格。官员之间存在制度判断与利益冲突，不得写成忠臣与奸臣的简单对立。

每条各方回奏的 text 第一行必须先用一句不超过二十二字的现代白话直接说清“这对该方意味着什么”，再接制度细节；不得使用“直白说”“简单说”“说白了”等引导词，也不要一上来就写公文腔。

只返回JSON，不得附加Markdown：
{
  "report":"四至六段连贯的史官奏报，具体描述政策怎样实施",
  "situationUpdate":"一段话概括财政、边防、吏治、民生和党争中哪些困境发生变化",
  "implementation":[{"stage":"中书覆奏/部司承办/监司督察/州县落实","text":"该层级实际做了什么以及如何变形"}],
  "reactions":[{"label":"朝议/三司/台谏/州县/豪强/百姓等","text":"具体而互不重复的反应"}],
  "nominations":[{"name":"当时真实存在的官员姓名","role":"可承担的身份职责","stance":"政治立场","assessment":"能力与任用风险"}],
  "institutionalChanges":["只有诏书确实涉及机构权责或任免时才填写，否则为空数组"],
  "nextWarnings":["下一回合值得警惕的具体隐患"],
  "historicalNote":"史实依据与反事实边界"
}`;
  const system = `你是历史策略游戏《熙宁抉择》的实时推演史官。

历史底线：
1. 尊重北宋熙宁、元丰时期语境，不写现代制度、超时代技术或玄幻内容。
2. 不替玩家决策，不修改程序已经结算的任何数值，也不输出新的数值奖惩。
3. 必须围绕玩家原诏、本期执行官、当前困境与此前回合连续推演，不能把输入当成孤立聊天。
4. 具体体现中书门下、三司、枢密院、台谏、监司、州县、胥吏、豪强与百姓的不同反应。
5. 如产生用人需求，只能举荐一至两名当时真实存在且与政务相关的人物；没有合适人选时返回空数组。
6. 少作空泛褒贬，多写政令传递、资源调度、地方变通、受益者、受损者与长期隐患。
7. AI只有叙事解释权；规则引擎是数值、困境与分项执行状态的唯一裁判。
8. ${outputLanguageRule}`;
  const output = await callModel(config, system, prompt, fetchImpl);
  const parsed = parseJsonOutput(output);
  return {
    ok: true,
    narrative: {
      report: localizeInternalTerms(parsed.report),
      situationUpdate: localizeInternalTerms(parsed.situationUpdate),
      implementation: parsePairs(parsed.implementation, 'stage'),
      reactions: Array.isArray(parsed.reactions)
        ? parsed.reactions.map((item) => {
          const label = localizeInternalTerms(item?.label);
          return { label, text: addPlainReactionLead(label, item?.text) };
        }).filter((item) => item.label && item.text).slice(0, 8)
        : [],
      nominations: Array.isArray(parsed.nominations)
        ? parsed.nominations.map((item) => ({ name: localizeInternalTerms(item?.name), role: localizeInternalTerms(item?.role), stance: localizeInternalTerms(item?.stance), assessment: localizeInternalTerms(item?.assessment) })).filter((item) => item.name && item.role && item.assessment).slice(0, 2)
        : [],
      institutionalChanges: parseStringList(parsed.institutionalChanges, 6),
      nextWarnings: parseStringList(parsed.nextWarnings, 5),
      historicalNote: localizeInternalTerms(parsed.historicalNote),
    },
  };
}

export async function testAIConnection({ config = {}, fetchImpl = fetch } = {}) {
  const output = await callModel(config, '你是接口连通性测试助手，只返回JSON。', '只返回JSON：{"message":"千问史官已就绪"}', fetchImpl);
  const parsed = parseJsonOutput(output);
  return { ok: true, message: String(parsed.message || '千问史官已就绪') };
}

async function callModel(config, system, user, fetchImpl) {
  const runtime = normalizeConfig(config);
  if (!runtime.apiKey) throw new Error('尚未填写完整的 DeepSeek API Key。');
  if (/[＊*…]/.test(runtime.apiKey)) throw new Error('当前填写的是脱敏 Key（含星号或省略号），请从 DeepSeek 开放平台创建或复制完整 API Key。');
  if (!/^[\x21-\x7e]+$/.test(runtime.apiKey)) throw new Error('API Key 含有中文或其他非法字符，请重新复制完整 Key。');
  if (!runtime.baseUrl || !runtime.model) throw new Error('AI Base URL或模型名称为空。');

  if (runtime.provider === 'qwen' && runtime.apiKey.startsWith('sk-sp-')) {
    throw new Error('当前填写的是百炼 Coding Plan Key（sk-sp-）；该套餐不允许用于自定义应用后端，请改用百炼按量付费 API Key。');
  }
  if (/\{?workspaceid\}?/i.test(runtime.baseUrl)) {
    throw new Error('百炼 Base URL 中的 WorkspaceId 仍是占位符，请替换为真实业务空间 ID。');
  }

  const baseUrl = normalizeBaseUrl(runtime.baseUrl, runtime.apiType);
  const url = runtime.apiType === 'anthropic' ? `${baseUrl}/messages` : `${baseUrl}/chat/completions`;
  const options = runtime.apiType === 'anthropic'
    ? {
      method: 'POST', headers: { 'x-api-key': runtime.apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: runtime.model, max_tokens: 3000, system, messages: [{ role: 'user', content: user }] }),
    }
    : {
      method: 'POST', headers: {
        Authorization: `Bearer ${runtime.apiKey}`,
        'Content-Type': 'application/json',
        ...(runtime.provider === 'qwen' ? { 'X-DashScope-Wait-Timeout': '30' } : {}),
      },
      body: JSON.stringify(runtime.provider === 'qwen'
        ? { model: runtime.model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], response_format: { type: 'json_object' }, enable_thinking: false, temperature: 0.65, max_completion_tokens: 3500 }
        : runtime.provider === 'deepseek'
          ? { model: runtime.model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], response_format: { type: 'json_object' }, thinking: { type: 'disabled' }, temperature: 0.65, max_tokens: 3500 }
        : { model: runtime.model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], response_format: { type: 'json_object' }, temperature: 0.65, max_tokens: 3500 }),
    };
  let response;
  let data;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetchImpl(url, options);
    data = await readResponseBody(response);
    if (response.ok) break;
    if (!isRetryableRateLimit(response.status, data) || attempt === 3) {
      throw new Error(formatProviderError(data, response.status, runtime, baseUrl));
    }
    await waitForRetry(response, attempt);
  }
  const output = runtime.apiType === 'anthropic'
    ? data?.content?.map((part) => part?.text || '').join('\n')
    : data?.choices?.[0]?.message?.content;
  if (!output) throw new Error('AI没有返回可用文本。');
  return output;
}

function normalizeConfig(config) {
  const provider = PROVIDERS[config.provider] || PROVIDERS.deepseek;
  return {
    provider: PROVIDERS[config.provider] ? config.provider : 'deepseek',
    apiType: provider.apiType,
    apiKey: String(config.apiKey || '').replace(/\s+/g, ''),
    baseUrl: String(config.baseUrl || provider.baseUrl).trim(),
    model: String(config.model || provider.model).trim(),
  };
}

function normalizeBaseUrl(value, apiType) {
  const baseUrl = String(value).trim().replace(/\/+$/, '');
  const endpoint = apiType === 'anthropic' ? '/messages' : '/chat/completions';
  return baseUrl.toLowerCase().endsWith(endpoint) ? baseUrl.slice(0, -endpoint.length) : baseUrl;
}

async function readResponseBody(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function formatProviderError(data, status, runtime, baseUrl) {
  const message = data?.error?.message || data?.message || data?.error?.code || data?.code || `AI请求失败：HTTP ${status}`;
  const requestId = data?.request_id || data?.requestId;
  const suffix = requestId ? `（Request ID: ${requestId}）` : '';
  if (runtime?.provider === 'qwen' && /model access denied/i.test(String(message))) {
    return `百炼拒绝访问模型“${runtime.model}”。当前地址：${baseUrl}。请确认 API Key 与该地址属于同一地域和业务空间，并在百炼控制台确认该空间可调用此模型${suffix}`;
  }
  if (runtime?.provider === 'qwen' && isRateLimitMessage(message)) {
    return `百炼当前繁忙或触发瞬时限流，系统已自动重试 3 次；请等待约一分钟后再试${suffix}`;
  }
  return `${String(message)}${suffix}`;
}

function isRetryableRateLimit(status, data) {
  const message = data?.error?.message || data?.message || data?.error?.code || data?.code || '';
  return status === 429 || isRateLimitMessage(message);
}

function isRateLimitMessage(message) {
  return /rate limit|too many requests|throttl|request rate|quota exceeded/i.test(String(message));
}

function waitForRetry(response, attempt) {
  const retryAfterSeconds = Number(response?.headers?.get?.('retry-after'));
  const fallbackDelays = [1000, 2500, 5000];
  const delay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0
    ? retryAfterSeconds * 1000
    : fallbackDelays[attempt];
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function parseJsonOutput(text) {
  const clean = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('AI返回内容不是有效JSON。');
  return JSON.parse(clean.slice(start, end + 1));
}

function formatDate(date) {
  if (!date) return '熙宁初年';
  return `熙宁${date.reignYear}年${date.half === 1 ? '上半年' : '下半年'}`;
}

function formatHistory(history) {
  if (!Array.isArray(history) || !history.length) return '无。';
  return history.slice(-6).map((turn) => {
    const policies = (turn.policyIds || []).map((id) => allowedPolicies.find(([allowed]) => allowed === id)?.[1] || id).join('、') || '未识别';
    const indicatorChanges = localizeInternalTerms(JSON.stringify(turn.indicatorChanges || {}));
    const resourceChanges = localizeInternalTerms(JSON.stringify(turn.resourceChanges || {}));
    const outcomes = Array.isArray(turn.policyOutcomes) && turn.policyOutcomes.length
      ? turn.policyOutcomes.map((outcome) => `${outcome.policyName || outcome.policyId}【${outcome.status || '未判'}】：已见结果“${outcome.result || '未录'}”；阻力“${(outcome.blockers || []).join('；') || '无显著阻力'}”；遗留“${outcome.unresolved || '未录'}”；后续“${outcome.nextStep || '未录'}”`).join('；')
      : '旧档案未分项记录执行结果';
    const narrative = turn.narrative
      ? `史官详报“${turn.narrative.report || ''}”；各级施行“${(turn.narrative.implementation || []).map((item) => `${item.stage}:${item.text}`).join('；')}”；后续警讯“${(turn.narrative.nextWarnings || []).join('；') || '无'}”`
      : `结算摘要“${turn.aiSummary || turn.eventTitle || '未录'}”`;
    return `第${turn.turn}回：核心诏令“${turn.edictText || '未录原文'}”；施行政务“${policies}”；分项执行档案：${outcomes}；国势变化${indicatorChanges}；余量变化${resourceChanges}；行政超载${turn.administrativeOverload || 0}、政略透支${turn.politicalOverdraft || 0}；${narrative}`;
  }).join('\n');
}

function parsePairs(value, labelKey) {
  return Array.isArray(value)
    ? value.map((item) => ({ stage: localizeInternalTerms(item?.[labelKey]), text: localizeInternalTerms(item?.text) })).filter((item) => item.stage && item.text).slice(0, 6)
    : [];
}

function parseStringList(value, limit) {
  return Array.isArray(value) ? value.map(localizeInternalTerms).filter(Boolean).slice(0, limit) : [];
}
