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
  const policyBudget = policies.map((policy) => ({
    id: policy?.id,
    name: policy?.name,
    tags: policy?.tags,
    politicalCapital: policy?.cost?.politicalCapital ?? 0,
    administration: policy?.cost?.administration ?? 0,
    treasury: policy?.cost?.treasury ?? 0,
  }));
  const prompt = `你在宋神宗熙宁朝担任御前辅政官。玩家尚未颁诏，你只负责帮助他理解格局、发现取舍并起草一份可继续修改的诏书，绝不能替他作最终决定。

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

一份诏书可以包含目标、措施、执行官、推行力度和取舍底线，但默认只安排一项主政务与至多一项配套政务。除非玩家明确要求全面强推且资源充足，不得在草诏中同时触发三项以上政务。起草前须在内部核算政略、行政与国库成本：总政略成本还要加上执行官一次性的政略消耗修正；结算后须至少保留 12 点政略、10 点行政和 800 万贯国库。资源不足时应缩小范围、改为试点或先核查复奏，不得把所有困境一次塞进诏书。还要结合剩余回合与未完成国策，形成能逐步取得成果的节奏，而不是只追逐本期数值。不要把建议压成固定选项，也不要假装存在唯一正确答案。诏书草案应具体到对象、措施、监督、例外与复奏期限，符合北宋制度语境，且避免顺带写入会触发无关政务的措施。

只返回JSON：
{
  "situation":"用一段自然语言解释眼前最关键的矛盾以及它们如何互相牵连",
  "priorities":["当前最值得先处理的两至四项事项"],
  "options":[{"title":"路线名称","benefit":"可能获得什么","risk":"要付出什么或可能怎样变形"}],
  "policyIds":["草诏明确采用的一至两个政务ID"],
  "draftEdict":"一份可直接放入御案、但仍由玩家修改定稿的完整诏书草案",
  "cautions":["取证不足、执行变形、财用、民生或党争方面的具体提醒"]
}`;
  const system = `你是历史策略游戏《熙宁抉择》的辅政官，不是推演史官。
1. 你只能在颁诏前提供分析和草稿，不能声称政策已经实施。
2. 不替玩家选择路线，不使用“正确答案”“最佳选择”等措辞。
3. 尊重熙宁、元丰时期的机构、资源和政治语言。
4. 把财政、民生、边防、吏治、士论、官员能力和执行风险联系起来。
5. 可引用人物立场，但不得把人物简单判为忠臣或奸臣。
6. 必须优先保证草诏在当前政略与行政预算内可持续执行；默认一主一辅，不得用堆叠政务伪装周全。
7. 输出必须为JSON。
8. ${outputLanguageRule}`;
  const output = await callModel(config, system, prompt, fetchImpl);
  const parsed = parseJsonOutput(output);
  const policyIds = Array.isArray(parsed.policyIds)
    ? [...new Set(parsed.policyIds.filter((id) => allowedPolicies.some(([allowed]) => allowed === id)))].slice(0, 2)
    : [];
  if (!policyIds.length && String(parsed.draftEdict || '').trim()) policyIds.push('open-ended-directive');
  return {
    ok: true,
    advice: {
      situation: localizeInternalTerms(parsed.situation),
      priorities: parseStringList(parsed.priorities, 4),
      options: Array.isArray(parsed.options)
        ? parsed.options.map((item) => ({ title: localizeInternalTerms(item?.title), benefit: localizeInternalTerms(item?.benefit), risk: localizeInternalTerms(item?.risk) })).filter((item) => item.title && item.benefit && item.risk).slice(0, 3)
        : [],
      policyIds,
      draftEdict: localizeInternalTerms(parsed.draftEdict),
      cautions: parseStringList(parsed.cautions, 5),
    },
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
        ? parsed.reactions.map((item) => ({ label: localizeInternalTerms(item?.label), text: localizeInternalTerms(item?.text) })).filter((item) => item.label && item.text).slice(0, 8)
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
