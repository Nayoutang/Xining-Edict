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

  it('辅政官只给局势、路线和可修改草诏，不替玩家颁行', async () => {
    const fetchImpl = vi.fn(async () => mockResponse({
      situation: '财用与抑配相互牵连。', priorities: ['先查执行', '保留赈济'],
      options: [{ title: '先察后改', benefit: '查清账目', risk: '见效较慢' }],
      draftEdict: '诏遣使对勘青苗账簿，限一月复奏。', cautions: ['防止御史借案攻讦'],
    }));
    const result = await adviseWithAI({ question: '该如何处置？', config, fetchImpl });
    expect(result.advice.situation).toContain('财用');
    expect(result.advice.options[0].risk).toContain('较慢');
    expect(result.advice.draftEdict).toContain('复奏');
    expect(result.advice.policyIds).toEqual(['open-ended-directive']);
  });

  it('辅政官收到政务成本并被要求保持一主一辅的可持续预算', async () => {
    let requestBody;
    const fetchImpl = vi.fn(async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return mockResponse({
        situation: '政略有限，应先核账。', priorities: ['先核账'],
        options: [{ title: '先察后改', benefit: '控制成本', risk: '见效较慢' }],
        policyIds: ['cross-check-ledgers'], draftEdict: '诏遣使对勘账簿，限期复奏。', cautions: ['保留政略'],
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
    expect(prompt).toContain('一项主政务与至多一项配套政务');
    expect(prompt).toContain('至少保留 12 点政略、10 点行政和 800 万贯国库');
    expect(prompt).toContain('当前国策成果');
    expect(prompt).toContain('对勘官署账簿');
    expect(prompt).toContain('"politicalCapital":4');
    expect((await adviseWithAI({
      state: { resources: { politicalCapital: 24, administration: 30, treasury: 4000 } },
      policies: [{ id: 'cross-check-ledgers', name: '对勘官署账簿', cost: {} }], config, fetchImpl,
    })).advice.policyIds).toEqual(['cross-check-ledgers']);
  });

  it('辅政官输出中的内部字段和ID统一转换为中文', async () => {
    const fetchImpl = vi.fn(async () => mockResponse({
      situation: 'politicalCapital 12，courtSupport 44，forced-loans 的 severity66。',
      priorities: ['提高execution', '控制administrativeOverload'],
      options: [{ title: '核账', benefit: 'finance+2', risk: 'politicalCostModifier+3' }],
      draftEdict: '命wang-anshi查cross-check-ledgers。',
      cautions: ['executionBonus不足'],
    }));
    const result = await adviseWithAI({ question: '该如何处置？', config, fetchImpl });
    const rendered = JSON.stringify(result.advice);

    expect(rendered).toContain('政略 12');
    expect(rendered).toContain('士论 44');
    expect(rendered).toContain('王安石');
    expect(rendered).not.toMatch(/politicalCapital|courtSupport|forced-loans|severity|executionBonus|politicalCostModifier|cross-check-ledgers|wang-anshi/);
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
