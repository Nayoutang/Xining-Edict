const PROVIDERS = {
  deepseek: { apiType: 'openai', baseUrl: 'https://api.deepseek.com', model: 'deepseek-v4-flash' },
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
  { name: '财政', scope: '国库与岁入', fallback: '核对三司账簿，限一月具报岁入实数。', policyId: 'cross-check-ledgers', allowed: ['green-sprouts-trial', 'service-reform-preparation', 'reduce-redundant-spending', 'cross-check-ledgers'] },
  { name: '民生', scope: '百姓负担', fallback: '核查民户实负，灾伤户暂缓催征。', policyId: 'curb-local-exactions', allowed: ['green-sprouts-trial', 'service-reform-preparation', 'water-conservancy', 'curb-local-exactions'] },
  { name: '军事', scope: '边备与军储', fallback: '军储未清，先核陕西见粮再议增兵。', policyId: 'northwest-defense', allowed: ['northwest-defense'] },
  { name: '吏治', scope: '诏令能否落到州县', fallback: '逐级核验州县执行，限一月复奏。', policyId: 'curb-local-exactions', allowed: ['curb-local-exactions', 'review-impeachments', 'cross-check-ledgers', 'discipline-corrupt-officials'] },
];

function conciseSentence(value, fallback, maxLength = 24) {
  const cleaned = localizeInternalTerms(value)
    .replace(/[\r\n|]+/g, '，')
    .replace(/【(?:主|辅|暂缓)】/g, '')
    .replace(/^(?:财政|民生|军事|吏治)[：:]?/, '')
    .replace(/(?:宜稳妥推进|酌情办理|视情况而定|统筹兼顾)/g, '')
    .trim() || fallback;
  const firstSentence = cleaned.split(/(?<=[。！？])/u)[0] || cleaned;
  const clipped = firstSentence.length > maxLength ? `${firstSentence.slice(0, maxLength - 1).replace(/[，、；：]$/, '')}。` : firstSentence;
  return /[。！？]$/.test(clipped) ? clipped : `${clipped}。`;
}

function normalizeAdvisorOutline(parsed, current, capacity) {
  const source = Array.isArray(parsed.dimensions) ? parsed.dimensions : [];
  const byName = new Map(source.map((item) => [localizeInternalTerms(item?.name), item]));
  let mainName = advisorDimensions.find(({ name }) => localizeInternalTerms(byName.get(name)?.role).replace(/[【】]/g, '') === '主')?.name;
  if (!mainName) mainName = advisorDimensions[0].name;
  let supportName = advisorDimensions.find(({ name }) => name !== mainName && localizeInternalTerms(byName.get(name)?.role).replace(/[【】]/g, '') === '辅')?.name;
  if (!supportName) supportName = advisorDimensions.find(({ name }) => name !== mainName)?.name;

  const dimensions = advisorDimensions.map((definition) => {
    const item = byName.get(definition.name) || {};
    const role = definition.name === mainName ? '主' : definition.name === supportName ? '辅' : '暂缓';
    const requestedPolicyId = String(item?.policyId || '');
    const policyId = definition.allowed.includes(requestedPolicyId) ? requestedPolicyId : definition.policyId;
    return {
      name: definition.name,
      scope: definition.scope,
      role,
      advice: conciseSentence(item?.advice, definition.fallback),
      policyId,
    };
  });
  const personnel = conciseSentence(parsed.personnel, '暂无调任建议。', 20);
  const render = (items, personnelText) => [
    `行政余量:${current}/${capacity}`,
    '',
    ...items.map((item) => `${item.name}|(${item.scope})【${item.role}】${item.advice}`),
    '',
    `人事:${personnelText}`,
  ].join('\n');
  let outline = render(dimensions, personnel);
  if (outline.length > 200) {
    for (const item of dimensions) item.advice = conciseSentence(item.advice, item.advice, 18);
    outline = render(dimensions, conciseSentence(personnel, '暂无调任建议。', 14));
  }
  return {
    outline,
    dimensions,
    personnel,
    policyIds: dimensions.filter((item) => item.role !== '暂缓').map((item) => item.policyId),
  };
}

const outputLanguageRule = `输入中的英文键名和连字符ID都是程序内部标识，只供你理解，绝不能原样写进面向玩家的文字。
必须使用中文称呼：treasury=国库，politicalCapital=政略，administration=行政，finance=财用，livelihood=民生，defense=边备，courtSupport=士论，execution=执行，severity=严重度。不要输出类似 courtSupport-3、severity66、executionBonus+2 的调试式表达。`;

export async function interpretEdictWithAI({ edict, context = {}, config = {}, fetchImpl = fetch } = {}) {
  const prompt = `你是北宋熙宁变法策略游戏的中书舍人。将玩家自由诏书映射为全部相关的游戏规则政务，不设置人为数量上限；一份诏书可以同时涉及财政、民生、军事、任免、制度和地方治理。不得创造ID，不得修改数值，执行能力不足由程序结算为行政超载。

允许的政务：
${allowedPolicies.map(([id, name]) => `- ${id}: ${name}`).join('\n')}

允许的执行官：
${allowedOfficers.map(([id, name]) => `- ${id}: ${name}`).join('\n')}

当前背景：${JSON.stringify(context)}
玩家诏书：${String(edict || '').trim()}

只返回JSON：{"policyIds":["id"],"officerId":"id或null","summary":"中书如何理解诏意","warnings":["需要玩家注意之处"]}`;
  const output = await callModel(config, `你只做受史实与规则约束的政令解析，并严格返回JSON。\n${outputLanguageRule}`, prompt, fetchImpl);
  const parsed = parseJsonOutput(output);
  const policyIds = Array.isArray(parsed.policyIds)
    ? [...new Set(parsed.policyIds.filter((id) => allowedPolicies.some(([allowed]) => allowed === id)))]
    : [];
  if (!policyIds.length && String(edict || '').trim()) policyIds.push('open-ended-directive');
  const officerId = allowedOfficers.some(([id]) => id === parsed.officerId) ? parsed.officerId : null;
  return {
    ok: true,
    interpretation: {
      sourceText: String(edict || '').trim(),
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
  const prompt = `你在宋神宗熙宁朝担任御前辅政官。玩家尚未颁诏，你只负责提供分维度施政提纲，绝不能代写完整诏书，也不能替玩家作最终决定。

当前时间：${formatDate(state?.date)}
当前急务：${JSON.stringify(event)}
当前国势：${JSON.stringify({ indicators: state?.indicators, resources: state?.resources, dilemmas: state?.dilemmas, polity: state?.polity })}
当前国策成果：${JSON.stringify(state?.objectives || [])}
剩余回合：${Math.max(0, Number(state?.maxTurns || 8) - Number(state?.turn || 1) + 1)}
当前准备任用的执行官：${JSON.stringify(officer)}
可执行政务及其本回合成本：${JSON.stringify(policyBudget)}
此前政令：${formatHistory(state?.history || [])}
玩家案前已有文字：${String(currentEdict || '').trim() || '尚未落笔'}
玩家向辅政官询问：${String(question || '').trim() || '请分析当前格局并提出几条可行路线'}

最终显示文本必须严格等价于以下格式，行政余量使用当前实数 ${administrativeRemaining}/${administrativeCapacity}：
行政余量:${administrativeRemaining}/${administrativeCapacity}

财政|(国库与岁入)【主】具体建议，一句话
民生|(百姓负担)【辅】具体建议，一句话
军事|(边备与军储)【暂缓】暂缓理由，一句话
吏治|(诏令能否落到州县)【暂缓】暂缓理由，一句话

人事:一句话人事建议

四个维度必须全部列出，顺序固定为财政、民生、军事、吏治。【主】和【辅】各且仅出现一次，其余两项必须标【暂缓】。每个维度最多一条建议，严禁面面俱到。建议必须具体到动作、对象或期限，例如“核对三司账簿，限期一月”，不得写“宜稳妥推进”“酌情办理”“视情况而定”等空话。人事建议单独一行，不占维度名额；无须调整人事时写“暂无调任建议”。显示文本总长度不得超过二百字。保留克制的文言语感，但提纲以简洁为先，不写骈句。

你须在内部核算政略、行政与国库成本：总政略成本还要加上执行官一次性的政略消耗修正；结算后须至少保留 12 点政略、10 点行政和 800 万贯国库。资源不足时，将高成本方向列为【暂缓】，不得堆叠政务伪装周全。只提出脚手架，不得输出诏书正文、制曰、奉诏、钦此等成稿措辞。

只返回JSON：
{
  "dimensions":[
    {"name":"财政","role":"主或辅或暂缓","advice":"一条具体建议或暂缓理由","policyId":"对应的一项政务ID"},
    {"name":"民生","role":"主或辅或暂缓","advice":"一条具体建议或暂缓理由","policyId":"对应的一项政务ID"},
    {"name":"军事","role":"主或辅或暂缓","advice":"一条具体建议或暂缓理由","policyId":"对应的一项政务ID"},
    {"name":"吏治","role":"主或辅或暂缓","advice":"一条具体建议或暂缓理由","policyId":"对应的一项政务ID"}
  ],
  "personnel":"一句可选人事建议；没有则写暂无调任建议"
}`;
  const system = `你是历史策略游戏《熙宁抉择》的辅政官，不是推演史官。
1. 你只能在颁诏前提供提纲，严禁生成可直接颁行的完整诏书，不能声称政策已经实施。
2. 必须作出取舍：恰好一项【主】、一项【辅】、两项【暂缓】。
3. 尊重熙宁、元丰时期的机构、资源和政治语言。
4. 固定列出财政、民生、军事、吏治四项且顺序不可改变，不新增制度、任免、外交等维度。
5. 可引用人物立场，但不得把人物简单判为忠臣或奸臣。
6. 必须优先保证主辅两项在当前政略、行政与国库预算内可持续执行。
7. 每项只有一句具体可执行建议；暂缓项只写暂缓理由，不得夹带措施。
8. 人事建议独立，不计入四维主辅名额；总显示文本不得超过二百字。
9. 输出必须为JSON。
10. ${outputLanguageRule}`;
  const output = await callModel(config, system, prompt, fetchImpl);
  const parsed = parseJsonOutput(output);
  return {
    ok: true,
    advice: normalizeAdvisorOutline(parsed, administrativeRemaining, administrativeCapacity),
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

你的任务不是再次计算输赢，而是解释这些既定变化如何在北宋国家机器中发生。必须体现诏令由御前发出后，经过中书门下、三司或枢密院、监司、州县和胥吏的传递与变形；结合执行官的性格、行事方式、政治底线和语言风格。官员之间存在制度判断与利益冲突，不得写成忠臣与奸臣的简单对立。

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
7. AI只有叙事解释权；规则引擎是数值和困境状态的唯一裁判。
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
  return history.slice(-6).map((turn) => `第${turn.turn}回：诏书“${turn.edictText || '未录原文'}”；既有结果“${turn.aiSummary || turn.eventTitle || '未录'}”`).join('\n');
}

function parsePairs(value, labelKey) {
  return Array.isArray(value)
    ? value.map((item) => ({ stage: localizeInternalTerms(item?.[labelKey]), text: localizeInternalTerms(item?.text) })).filter((item) => item.stage && item.text).slice(0, 6)
    : [];
}

function parseStringList(value, limit) {
  return Array.isArray(value) ? value.map(localizeInternalTerms).filter(Boolean).slice(0, limit) : [];
}
