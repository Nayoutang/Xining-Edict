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
    await testAIConnection({ config: { provider: 'deepseek', apiKey: ' sk-test\r\n', model: 'deepseek-v4-flash' }, fetchImpl });
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
    expect(result.advice.outline).toMatch(/^行政余量:32\/50\n\n财政\|\(国库与岁入\)【主】/);
    expect(result.advice.outline).toContain('\n人事:命曾布专核三司账案。');
    expect(result.advice.outline).not.toMatch(/制曰|奉诏|钦此|辅政草诏/);
    expect(result.advice.policyIds).toEqual(['cross-check-ledgers', 'curb-local-exactions']);
  });

  it('辅政官收到政务成本并被要求保持一主一辅的可持续预算', async () => {
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
    expect(prompt).toContain('【主】和【辅】各且仅出现一次');
    expect(prompt).toContain('每个维度最多一条建议，严禁面面俱到');
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

  it('辅政官会修正重复主辅、乱序和空话，稳定输出固定提纲', async () => {
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

    const lines = result.advice.outline.split('\n').filter(Boolean);
    expect(lines.map((line) => line.split('|')[0])).toEqual(['行政余量:27/50', '财政', '民生', '军事', '吏治', '人事:暂无调任建议。']);
    expect(result.advice.outline.match(/【主】/g)).toHaveLength(1);
    expect(result.advice.outline.match(/【辅】/g)).toHaveLength(1);
    expect(result.advice.outline.match(/【暂缓】/g)).toHaveLength(2);
    expect(result.advice.outline).not.toMatch(/宜稳妥推进|视情况而定/);
    expect(result.advice.outline.length).toBeLessThanOrEqual(200);
  });

  it('连续五次参详都保持四维、一主一辅与二百字上限', async () => {
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
      expect(advice.dimensions.filter((item) => item.role === '主')).toHaveLength(1);
      expect(advice.dimensions.filter((item) => item.role === '辅')).toHaveLength(1);
      expect(advice.dimensions.filter((item) => item.role === '暂缓')).toHaveLength(2);
      expect(advice.outline).toContain(`行政余量:${40 - index}/50`);
      expect(advice.outline.length).toBeLessThanOrEqual(200);
    }
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
