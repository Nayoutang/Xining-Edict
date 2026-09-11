import { describe, expect, it, vi } from 'vitest';
import { adviseWithAI, interpretEdictWithAI, narrateSettlementWithAI, testAIConnection } from '../ai-history.mjs';

const config = { provider: 'openai', apiKey: 'sk-test', baseUrl: 'https://example.test/v1', model: 'test-model' };

function mockResponse(content) {
  return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] }) };
}

describe('AI史实推理边界', () => {
  it('自动清理 API Key 中意外夹带的空白字符', async () => {
    let authorization;
    let requestBody;
    const fetchImpl = vi.fn(async (_url, options) => {
      authorization = options.headers.Authorization;
      requestBody = JSON.parse(options.body);
      return mockResponse({ message: '已就绪' });
    });
    await testAIConnection({ config: { provider: 'deepseek', apiKey: ' sk-test\r\n', model: 'deepseek-flash' }, fetchImpl });
    expect(authorization).toBe('Bearer sk-test');
    expect(requestBody.thinking).toEqual({ type: 'disabled' });
  });

  it('明确提示脱敏 Key 不能用于鉴权', async () => {
    await expect(testAIConnection({ config: { provider: 'deepseek', apiKey: 'sk-****6707' }, fetchImpl: vi.fn() }))
      .rejects.toThrow('脱敏 Key');
  });

  it('过滤模型虚构的政策和官员ID', async () => {
    const fetchImpl = vi.fn(async () => mockResponse({
      policyIds: ['green-sprouts-trial', 'invent-nuclear-power'],
      officerId: 'fictional-officer', summary: '试行青苗法', warnings: [],
    }));
    const result = await interpretEdictWithAI({ edict: '试行青苗法', config, fetchImpl });
    expect(result.interpretation.policyIds).toEqual(['green-sprouts-trial']);
    expect(result.interpretation.officerId).toBeNull();
  });

  it('史官接口只返回叙事，不接受模型生成的数值变化', async () => {
    const fetchImpl = vi.fn(async () => mockResponse({
      report: '州县奉诏施行。', reactions: [{ label: '州县', text: '监司开始核验。' }],
      situationUpdate: '地方执行有所改善。',
      implementation: [{ stage: '中书覆奏', text: '检核诏意。' }],
      nominations: [{ name: '曾布', role: '检正中书五房公事', stance: '新法派', assessment: '熟悉法令，但进取过急。' }],
      institutionalChanges: ['三司增设核验簿籍'], nextWarnings: ['防止州县虚报'],
      historicalNote: '此为反事实推演。', treasuryDelta: 999999,
    }));
    const result = await narrateSettlementWithAI({ edict: '查禁摊派', config, fetchImpl });
    expect(result.narrative.report).toContain('州县');
    expect(result.narrative.implementation[0].stage).toBe('中书覆奏');
    expect(result.narrative.nominations[0].name).toBe('曾布');
    expect(result).not.toHaveProperty('treasuryDelta');
  });

  it('辅政官只给分维度提纲，不再代写诏书', async () => {
    const fetchImpl = vi.fn(async () => mockResponse({
      dimensions: [
        { name: '财政', role: '主', advice: '核对三司账簿，限一月具报', policyId: 'cross-check-ledgers' },
        { name: '民生', role: '辅', advice: '核查民户实负，灾伤户缓征', policyId: 'curb-local-exactions' },
        { name: '军事', role: '暂缓', advice: '军储底数未清，暂不增兵', policyId: 'northwest-defense' },
        { name: '吏治', role: '暂缓', advice: '监司方在核验，候复奏再议', policyId: 'review-impeachments' },
      ],
      personnel: '命曾布专核三司账案',
    }));
    const result = await adviseWithAI({ question: '该如何处置？', state: { resources: { administration: 32 } }, config, fetchImpl });
    expect(result.advice.outline).toContain('局势研判:');
    expect(result.advice.outline).toMatch(/行政余量:32\/50\n\n财政\|\(国库与岁入\)【主】/);
    expect(result.advice.outline).toContain('\n铨选建议:让曾布专核三司账案。');
    expect(result.advice.outline).toContain('需要决定：');
    expect(result.advice.outline).not.toMatch(/具报|复奏|奉行|文移|案牍|实负|催科/);
    expect(result.advice.outline).not.toMatch(/制曰|奉诏|钦此|辅政草诏/);
    expect(result.advice.policyIds).toEqual(['cross-check-ledgers', 'curb-local-exactions']);
  });

  it('提交任何文本都走统一解析，不再对参详提纲做特殊截取', async () => {
    let requestBody;
    const fetchImpl = vi.fn(async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return mockResponse({ policyIds: ['cross-check-ledgers', 'curb-local-exactions'], officerId: null, summary: '主辅并行', warnings: [] });
    });
    const result = await interpretEdictWithAI({
      edict: '行政余量:40/50\n财政|(国库与岁入)【主】核清账簿。\n民生|(百姓负担)【辅】核定实负。\n军事|(边备与军储)【暂缓】边警尚缓。\n吏治|(诏令能否落到州县)【暂缓】有司方忙。',
      config, fetchImpl,
    });
    const prompt = requestBody.messages.map((message) => message.content).join('\n');
    expect(prompt).toContain('军事|(边备与军储)【暂缓】');
    expect(prompt).toContain('吏治|(诏令能否落到州县)【暂缓】');
    expect(prompt).not.toContain('只解析【主】与【辅】');
    expect(result.interpretation.policyIds).toEqual(['cross-check-ledgers', 'curb-local-exactions']);
  });

  it('辅政官收到政务成本并按困境动态分配优先级', async () => {
    let requestBody;
    const fetchImpl = vi.fn(async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return mockResponse({
        dimensions: [
          { name: '财政', role: '主', advice: '核对三司账簿，限一月', policyId: 'cross-check-ledgers' },
          { name: '民生', role: '辅', advice: '查核抑配，灾伤户缓征', policyId: 'curb-local-exactions' },
          { name: '军事', role: '暂缓', advice: '财用未定，暂缓增兵', policyId: 'northwest-defense' },
          { name: '吏治', role: '暂缓', advice: '先候账案复奏', policyId: 'review-impeachments' },
        ], personnel: '',
      });
    });
    await adviseWithAI({
      question: '如何避免政略耗尽？',
      state: { resources: { politicalCapital: 24, administration: 30, treasury: 4000 } },
      officer: { politicalCostModifier: 2 },
      policies: [{ name: '对勘官署账簿', tags: ['finance'], cost: { politicalCapital: 4, administration: 8, treasury: 140 } }],
      config,
      fetchImpl,
    });
    const prompt = requestBody.messages.map((message) => message.content).join('\n');
    expect(prompt).toContain('四个维度必须全部列出，顺序固定为财政、民生、军事、吏治');
    expect(prompt).toContain('主辅数量不固定');
    expect(prompt).not.toContain('恰好一项');
    expect(prompt).toContain('每个维度最多一条施政建议，严禁面面俱到');
    expect(prompt).toContain('当前固定官署与任职');
    expect(prompt).toContain('玩家需裁定什么');
    expect(prompt).toContain('不得改设机构');
    expect(prompt).toContain('至少保留 12 点政略、10 点行政和 800 万贯国库');
    expect(prompt).toContain('当前国策成果');
    expect(prompt).toContain('对勘官署账簿');
    expect(prompt).toContain('"politicalCapital":4');
    expect(prompt).toContain('行政余量:30/50');
    expect(prompt).toContain('不得输出诏书正文');
    expect((await adviseWithAI({
      state: { resources: { politicalCapital: 24, administration: 30, treasury: 4000 } },
      policies: [{ id: 'cross-check-ledgers', name: '对勘官署账簿', cost: {} }], config, fetchImpl,
    })).advice.policyIds).toEqual(['cross-check-ledgers', 'curb-local-exactions']);
  });

  it('辅政官保留多个主项并按四维顺序输出', async () => {
    const fetchImpl = vi.fn(async () => mockResponse({
      dimensions: [
        { name: '吏治', role: '主', advice: '宜稳妥推进', policyId: 'northwest-defense' },
        { name: '军事', role: '主', advice: '核验陕西军粮，限十日', policyId: 'northwest-defense' },
        { name: '财政', role: '辅', advice: '核对三司账簿，限一月', policyId: 'cross-check-ledgers' },
      ],
      personnel: '视情况而定',
    }));
    const result = await adviseWithAI({
      state: { resources: { politicalCapital: 24, administration: 27, treasury: 4000 } },
      policies: [{ id: 'cross-check-ledgers', name: '对勘官署账簿', cost: {} }],
      config,
      fetchImpl,
    });

    const dimensionLines = result.advice.outline.split('\n').filter((line) => /^(?:财政|民生|军事|吏治)\|/.test(line));
    expect(dimensionLines.map((line) => line.split('|')[0])).toEqual(['财政', '民生', '军事', '吏治']);
    expect(result.advice.outline).toContain('局势研判:');
    expect(result.advice.outline).toContain('铨选建议:');
    expect(result.advice.outline.match(/【主】/g)).toHaveLength(2);
    expect(result.advice.outline.match(/【辅】/g)).toHaveLength(1);
    expect(result.advice.outline.match(/【暂缓】/g)).toHaveLength(1);
    expect(result.advice.dimensions.find((item) => item.name === '吏治').advice).toBe('宜稳妥推进');
    expect(result.advice.outline.length).toBeLessThanOrEqual(900);
  });

  it('保留多个主项、无辅项及全部暂缓的模型判断', async () => {
    let call = 0;
    const roles = [
      ['主', '辅', '暂缓', '暂缓'],
      ['辅', '主', '暂缓', '暂缓'],
      ['主', '主', '辅', '暂缓'],
      ['暂缓', '辅', '主', '主'],
      ['暂缓', '暂缓', '暂缓', '暂缓'],
    ];
    const fetchImpl = vi.fn(async () => {
      const currentRoles = roles[call++];
      return mockResponse({
        dimensions: ['财政', '民生', '军事', '吏治'].map((name, index) => ({
          name,
          role: currentRoles[index],
          advice: `${name}核验案牍，限一月复奏`,
          policyId: ['cross-check-ledgers', 'curb-local-exactions', 'northwest-defense', 'review-impeachments'][index],
        })),
        personnel: '命现任承办官按月复奏',
      });
    });

    for (let index = 0; index < 5; index += 1) {
      const { advice } = await adviseWithAI({ state: { resources: { administration: 40 - index } }, config, fetchImpl });
      expect(advice.dimensions.map((item) => item.name)).toEqual(['财政', '民生', '军事', '吏治']);
      expect(advice.dimensions.map((item) => item.role)).toEqual(roles[index]);
      expect(advice.outline).toContain(`行政余量:${40 - index}/50`);
      expect(advice.outline.length).toBeLessThanOrEqual(900);
    }
  });

  it('连续八回合注入实时局势但不以模板替换重复建议及暂缓理由', async () => {
    let lastPrompt = '';
    const fetchImpl = vi.fn(async (_url, options) => {
      lastPrompt = JSON.parse(options.body).messages.map((message) => message.content).join('\n');
      return mockResponse({
        dimensions: [
          { name: '财政', role: '主', advice: '核对三司账簿，限一月具报', policyId: 'cross-check-ledgers' },
          { name: '民生', role: '辅', advice: '核查民户实负，灾伤户缓征', policyId: 'curb-local-exactions' },
          { name: '军事', role: '暂缓', advice: '边备仅20，严重度80。国库仅600万贯，无力新增军费，因此暂缓。', policyId: 'northwest-defense' },
          { name: '吏治', role: '暂缓', advice: '行政余量不足，现有任务未完成，因此暂缓。', policyId: 'review-impeachments' },
        ],
        personnel: '暂无调任建议',
      });
    });
    const activeAdvice = [];
    const adviceByDimension = new Map(['财政', '民生', '军事', '吏治'].map((name) => [name, new Set()]));
    for (let turn = 1; turn <= 8; turn += 1) {
      const history = Array.from({ length: turn - 1 }, (_, index) => ({
        turn: index + 1,
        edictText: `第${index + 1}回核账恤民诏`,
        policyIds: ['cross-check-ledgers', 'curb-local-exactions'],
        indicatorChanges: { finance: 2, livelihood: 1 },
        resourceChanges: { administration: -4 },
        administrativeOverload: 0,
        politicalOverdraft: 0,
        aiSummary: `第${index + 1}回账案已有进展`,
      }));
      const { advice } = await adviseWithAI({
        state: {
          turn, maxTurns: 8, date: { reignYear: 1 + Math.floor((turn - 1) / 2), half: turn % 2 ? 1 : 2 },
          indicators: { finance: 40 + turn, livelihood: 38 + turn, defense: 50, courtSupport: 34, execution: 43 },
          resources: { administration: 41 - turn, politicalCapital: 44 - turn, treasury: 5600 - turn * 100 },
          objectives: [{ title: '财计有序', completed: turn >= 4 }],
          activePolicies: turn > 1 ? [{ policyId: 'cross-check-ledgers', officerId: 'zeng-bu', remainingTurns: 1 }] : [],
          dilemmas: [{ title: '朝议纷争', severity: 60, description: '士论偏低' }], history,
          advisorHistory: ['核对三司账簿，限一月报告结果。'],
        },
        event: { title: `第${turn}回急务`, description: `本期事件${turn}`, effects: { courtSupport: -2 } },
        config, fetchImpl,
      });
      activeAdvice.push(advice.dimensions.filter((item) => item.role !== '暂缓').map((item) => item.advice).join('|'));
      for (const item of advice.dimensions) adviceByDimension.get(item.name).add(item.advice);
      expect(advice.dimensions.find((item) => item.name === '军事').advice).toBe('边备仅20，严重度80。国库仅600万贯，无力新增军费，因此暂缓。');
    }
    expect(new Set(activeAdvice).size).toBe(1);
    for (const suggestions of adviceByDimension.values()) expect(suggestions.size).toBe(1);
    expect(lastPrompt).toContain('当前回合：第8/8回；距终局尚余1回；阶段：后期');
    expect(lastPrompt).toContain('五项国势：财用48，民生46，边备50，士论34，执行43');
    expect(lastPrompt).toContain('进行中事项');
    expect(lastPrompt).toContain('第7回核账恤民诏');
    expect(lastPrompt).toContain('国势变化');
    expect(lastPrompt).toContain('本回合困境事件：第8回急务');
    expect(lastPrompt).toContain('【暂缓】项只准说明“为何本期不做”');
  });

  it('辅政官优先收到上一回的分项执行档案与完整后续警讯', async () => {
    let prompt = '';
    const fetchImpl = vi.fn(async (_url, options) => {
      prompt = JSON.parse(options.body).messages.map((message) => message.content).join('\n');
      return mockResponse({
        dimensions: [
          { name: '财政', role: '暂缓', advice: '财计尚可支应。', policyId: 'cross-check-ledgers' },
          { name: '民生', role: '辅', advice: '续办，退还已查实的强敛钱物。', decision: '须裁定：先退重户还是先退灾户。', policyId: 'curb-local-exactions' },
          { name: '军事', role: '暂缓', advice: '边情未见骤变。', policyId: 'northwest-defense' },
          { name: '吏治', role: '主', advice: '续办，追究包庇属官的监司责任。', decision: '须裁定：先许自纠还是立即追责。', policyId: 'discipline-corrupt-officials' },
        ],
        situation: '上期抽验已经完成，本期应处理查明的阻力。', personnel: '',
      });
    });
    await adviseWithAI({
      state: {
        turn: 2, maxTurns: 8,
        indicators: { finance: 50, livelihood: 42, defense: 51, courtSupport: 40, execution: 38 },
        resources: { treasury: 5600, politicalCapital: 45, administration: 40 },
        history: [{
          turn: 1, policyIds: ['curb-local-exactions'], indicatorChanges: { execution: 3 }, resourceChanges: { administration: -6 },
          policyOutcomes: [{ policyId: 'curb-local-exactions', policyName: '整顿州县摊派', status: '部分落实', result: '三路抽验已经完成。', blockers: ['监司包庇属官'], unresolved: '责任官员尚未确定。', nextStep: '下回应依据案卷追究监司责任。' }],
          narrative: { report: '查得两县擅改诏令。', implementation: [{ stage: '监司督察', text: '已经调取案卷。' }], nextWarnings: ['防止监司销毁案牍'] },
        }],
      },
      config, fetchImpl,
    });
    expect(prompt).toContain('此前各回施政档案');
    expect(prompt).toContain('整顿州县摊派【部分落实】');
    expect(prompt).toContain('监司包庇属官');
    expect(prompt).toContain('责任官员尚未确定');
    expect(prompt).toContain('防止监司销毁案牍');
    expect(prompt).toContain('下回应依据案卷追究监司责任');
    expect(prompt).toContain('不得原样再提');
  });

  it('各方回奏的第一句使用白话概括', async () => {
    const fetchImpl = vi.fn(async () => mockResponse({
      report: '州县奉诏施行。', situationUpdate: '财计稍定。', implementation: [],
      reactions: [
        { label: '三司', text: '具析岁入支用之数以闻。' },
        { label: '百姓', text: '民户观望新令。' },
      ],
      nominations: [], institutionalChanges: [], nextWarnings: [], historicalNote: '',
    }));
    const result = await narrateSettlementWithAI({ edict: '核查财计', config, fetchImpl });

    expect(result.narrative.reactions[0].text).toMatch(/^三司先看钱从哪里来、够不够花。/);
    expect(result.narrative.reactions[1].text).toMatch(/^百姓只看负担是否真的减轻。/);
    expect(result.narrative.reactions.map((item) => item.text).join('')).not.toMatch(/直白说|简单说|说白了/);
  });

  it('辅政官输出中的内部字段和ID统一转换为中文', async () => {
    const fetchImpl = vi.fn(async () => mockResponse({
      dimensions: [
        { name: '财政', role: '主', advice: '核对cross-check-ledgers，限一月', policyId: 'cross-check-ledgers' },
        { name: '民生', role: '辅', advice: '核查forced-loans的severity66', policyId: 'curb-local-exactions' },
        { name: '军事', role: '暂缓', advice: 'finance不足，暂缓增兵', policyId: 'northwest-defense' },
        { name: '吏治', role: '暂缓', advice: 'execution不足，候复奏', policyId: 'review-impeachments' },
      ],
      personnel: '命wang-anshi领办',
    }));
    const result = await adviseWithAI({ question: '该如何处置？', config, fetchImpl });
    const rendered = `${result.advice.outline}${result.advice.personnel}`;

    expect(rendered).toContain('王安石');
    expect(rendered).toContain('青苗抑配');
    expect(rendered).not.toMatch(/forced-loans|severity|execution|cross-check-ledgers|wang-anshi/);
  });

  it('千问连接测试使用兼容接口并返回就绪信息', async () => {
    let request;
    const fetchImpl = vi.fn(async (url, options) => {
      request = { url, headers: options.headers, body: JSON.parse(options.body) };
      return mockResponse({ message: '千问史官已就绪' });
    });
    const result = await testAIConnection({ config: { provider: 'qwen', apiKey: 'sk-test' }, fetchImpl });
    expect(request.url).toBe('https://ws-esx5vi3vpbs2mg95.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/chat/completions');
    expect(request.body.model).toBe('qwen3.7-plus');
    expect(request.body.response_format).toEqual({ type: 'json_object' });
    expect(request.body.enable_thinking).toBe(false);
    expect(request.body.max_completion_tokens).toBe(3500);
    expect(request.body).not.toHaveProperty('max_tokens');
    expect(request.headers['X-DashScope-Wait-Timeout']).toBe('30');
    expect(result.message).toContain('千问');
  });

  it('不会重复拼接用户粘贴的完整百炼请求地址', async () => {
    let requestUrl;
    const fetchImpl = vi.fn(async (url) => {
      requestUrl = url;
      return mockResponse({ message: '已就绪' });
    });
    await testAIConnection({ config: { provider: 'qwen', apiKey: 'sk-test', baseUrl: 'https://example.test/compatible-mode/v1/chat/completions/' }, fetchImpl });
    expect(requestUrl).toBe('https://example.test/compatible-mode/v1/chat/completions');
  });

  it('展示百炼错误码和 Request ID', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ code: 'InvalidParameter', message: 'Json mode response is not supported', request_id: 'req-123' }),
    }));
    await expect(testAIConnection({ config: { provider: 'qwen', apiKey: 'sk-test' }, fetchImpl }))
      .rejects.toThrow('Json mode response is not supported（Request ID: req-123）');
  });

  it('阻止把 Coding Plan Key 误接到通用模型端点', async () => {
    await expect(testAIConnection({ config: { provider: 'qwen', apiKey: 'sk-sp-test' }, fetchImpl: vi.fn() }))
      .rejects.toThrow('Coding Plan Key');
  });

  it('把百炼模型权限错误翻译成可操作的诊断', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Model access denied', request_id: 'req-denied' }),
    }));
    await expect(testAIConnection({ config: { provider: 'qwen', apiKey: 'sk-test', model: 'qwen-plus' }, fetchImpl }))
      .rejects.toThrow('百炼拒绝访问模型“qwen-plus”');
  });

  it('百炼瞬时限流时按 Retry-After 自动重试', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: { get: () => '0' },
        json: async () => ({ message: 'Rate limit reached. Please slow down and retry.' }),
      })
      .mockResolvedValueOnce(mockResponse({ message: '重试成功' }));
    const result = await testAIConnection({ config: { provider: 'qwen', apiKey: 'sk-test' }, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.message).toBe('重试成功');
  });
});
